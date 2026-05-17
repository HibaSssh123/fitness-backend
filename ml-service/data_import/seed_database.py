"""
Database Seeding Module
Populates PostgreSQL database with transformed Kaggle data
"""

import os
import logging
from typing import List, Dict
from pathlib import Path
import json
import psycopg2
from psycopg2.extras import execute_values
import pandas as pd

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class DatabaseSeeder:
    """Seed PostgreSQL database with fitness data"""

    def __init__(self, database_url: str = None):
        """
        Initialize database connection
        
        Args:
            database_url: PostgreSQL connection URL. If None, uses DATABASE_URL env var
        """
        self.database_url = database_url or os.getenv("DATABASE_URL")
        if not self.database_url:
            raise ValueError("DATABASE_URL not provided and not found in environment")
        
        self.conn = None
        self.cursor = None

    def connect(self) -> bool:
        """Establish database connection"""
        try:
            self.conn = psycopg2.connect(self.database_url)
            self.cursor = self.conn.cursor()
            logger.info("Connected to PostgreSQL database")
            return True
        except Exception as e:
            logger.error(f"Failed to connect to database: {e}")
            return False

    def disconnect(self):
        """Close database connection"""
        if self.cursor:
            self.cursor.close()
        if self.conn:
            self.conn.close()
        logger.info("Disconnected from database")

    def seed_exercises(self, csv_path: str, category_mapping: Dict[str, str] = None) -> bool:
        """
        Seed Exercise and ExerciseCategory tables
        
        Args:
            csv_path: Path to transformed exercises CSV
            category_mapping: Optional mapping of category names to IDs
        
        Returns:
            True if successful, False otherwise
        """
        try:
            if not self.conn:
                logger.error("Database not connected. Call connect() first.")
                return False
            
            df = pd.read_csv(csv_path)
            logger.info(f"Loading {len(df)} exercises from {csv_path}")
            
            # Create categories first
            categories = df["category"].dropna().unique()
            category_ids = {}
            
            for category in categories:
                if pd.isna(category) or category == "":
                    continue
                
                # Check if category already exists
                self.cursor.execute(
                    'SELECT id FROM "ExerciseCategory" WHERE name = %s',
                    (category,)
                )
                result = self.cursor.fetchone()
                
                if result:
                    category_ids[category] = result[0]
                else:
                    # Create new category
                    self.cursor.execute(
                        'INSERT INTO "ExerciseCategory" (id, name, "createdAt", "updatedAt") '
                        'VALUES (gen_random_uuid(), %s, NOW(), NOW()) RETURNING id',
                        (category,)
                    )
                    category_ids[category] = self.cursor.fetchone()[0]
            
            self.conn.commit()
            logger.info(f"Created/updated {len(category_ids)} exercise categories")
            
            # Prepare exercise data for insertion
            exercises_data = []
            for _, row in df.iterrows():
                exercise_id = self._generate_cuid()
                category_id = category_ids.get(row.get("category")) if pd.notna(row.get("category")) else None
                target_muscles = row.get("targetMuscles", [])
                
                # Convert target muscles to PostgreSQL array format
                if isinstance(target_muscles, str):
                    target_muscles = [m.strip() for m in target_muscles.split(",")]
                elif not isinstance(target_muscles, list):
                    target_muscles = []
                
                exercises_data.append((
                    exercise_id,
                    row["name"],
                    row["type"],
                    category_id,
                    row.get("description", ""),
                    target_muscles,
                ))
            
            # Batch insert exercises
            insert_query = '''
                INSERT INTO "Exercise" (id, name, type, "categoryId", description, "targetMuscles", "createdAt", "updatedAt")
                VALUES %s
                ON CONFLICT DO NOTHING
            '''
            
            values = [
                (ex[0], ex[1], ex[2], ex[3], ex[4], ex[5], "NOW()", "NOW()")
                for ex in exercises_data
            ]
            
            if values:
                execute_values(self.cursor, insert_query, values)
                self.conn.commit()
                logger.info(f"Inserted {len(values)} exercises into database")
            
            return True
        
        except Exception as e:
            logger.error(f"Failed to seed exercises: {e}")
            if self.conn:
                self.conn.rollback()
            return False

    def seed_foods(self, csv_path: str) -> bool:
        """
        Seed Food table
        
        Args:
            csv_path: Path to transformed foods CSV
        
        Returns:
            True if successful, False otherwise
        """
        try:
            if not self.conn:
                logger.error("Database not connected. Call connect() first.")
                return False
            
            df = pd.read_csv(csv_path)
            logger.info(f"Loading {len(df)} foods from {csv_path}")
            
            # Prepare food data for insertion
            foods_data = []
            for _, row in df.iterrows():
                food_id = self._generate_cuid()
                
                foods_data.append((
                    food_id,
                    row["name"],
                    int(row["calories"]),
                    float(row.get("protein", 0)),
                    float(row.get("carbs", 0)),
                    float(row.get("fat", 0)),
                    row.get("defaultServingUnit", "SERVING"),
                ))
            
            # Batch insert foods
            insert_query = '''
                INSERT INTO "Food" (id, name, calories, protein, carbs, fat, "defaultServingUnit", "createdAt", "updatedAt")
                VALUES %s
                ON CONFLICT (name) DO NOTHING
            '''
            
            values = [
                (f[0], f[1], f[2], f[3], f[4], f[5], f[6], "NOW()", "NOW()")
                for f in foods_data
            ]
            
            if values:
                execute_values(self.cursor, insert_query, values)
                self.conn.commit()
                logger.info(f"Inserted {len(values)} foods into database")
            
            return True
        
        except Exception as e:
            logger.error(f"Failed to seed foods: {e}")
            if self.conn:
                self.conn.rollback()
            return False

    def get_seeding_stats(self) -> Dict:
        """Get statistics about seeded data"""
        try:
            if not self.conn:
                return {}
            
            stats = {}
            
            # Count exercises
            self.cursor.execute('SELECT COUNT(*) FROM "Exercise"')
            stats["total_exercises"] = self.cursor.fetchone()[0]
            
            # Count exercise categories
            self.cursor.execute('SELECT COUNT(*) FROM "ExerciseCategory"')
            stats["total_exercise_categories"] = self.cursor.fetchone()[0]
            
            # Count foods
            self.cursor.execute('SELECT COUNT(*) FROM "Food"')
            stats["total_foods"] = self.cursor.fetchone()[0]
            
            logger.info(f"Database stats: {stats}")
            return stats
        
        except Exception as e:
            logger.error(f"Failed to get seeding stats: {e}")
            return {}

    @staticmethod
    def _generate_cuid() -> str:
        """Generate a CUID-like ID (simplified version)"""
        import time
        import random
        
        timestamp = str(int(time.time() * 1000))[-12:]
        random_part = "".join(str(random.randint(0, 9)) for _ in range(12))
        return (timestamp + random_part)[:24]


def seed_from_csv_files(exercise_csv: str = None, food_csv: str = None) -> bool:
    """
    Convenience function to seed database from CSV files
    
    Args:
        exercise_csv: Path to exercises CSV
        food_csv: Path to foods CSV
    
    Returns:
        True if all seeding successful, False otherwise
    """
    # Try to find CSV files in data_import directory
    if not exercise_csv:
        data_dir = Path("ml-service/data_import/downloads")
        exercise_files = list(data_dir.glob("transformed_exercises.csv"))
        if exercise_files:
            exercise_csv = str(exercise_files[0])
    
    if not food_csv:
        data_dir = Path("ml-service/data_import/downloads")
        food_files = list(data_dir.glob("transformed_nutrition.csv"))
        if food_files:
            food_csv = str(food_files[0])
    
    seeder = DatabaseSeeder()
    
    if not seeder.connect():
        return False
    
    success = True
    
    try:
        if exercise_csv and Path(exercise_csv).exists():
            logger.info(f"Seeding exercises from {exercise_csv}")
            if not seeder.seed_exercises(exercise_csv):
                success = False
        
        if food_csv and Path(food_csv).exists():
            logger.info(f"Seeding foods from {food_csv}")
            if not seeder.seed_foods(food_csv):
                success = False
        
        # Print stats
        stats = seeder.get_seeding_stats()
        logger.info(f"Seeding completed. Stats: {stats}")
    
    finally:
        seeder.disconnect()
    
    return success


if __name__ == "__main__":
    # Example usage
    import sys
    
    exercise_csv = sys.argv[1] if len(sys.argv) > 1 else None
    food_csv = sys.argv[2] if len(sys.argv) > 2 else None
    
    if seed_from_csv_files(exercise_csv, food_csv):
        logger.info("Database seeding successful!")
    else:
        logger.error("Database seeding failed!")
