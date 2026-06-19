"""
Kaggle Dataset Downloader and Transformer
Downloads fitness datasets from Kaggle and transforms them to match the database schema
"""

import os
import json
import logging
from typing import Dict, List, Optional
from pathlib import Path
import pandas as pd

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class KaggleDatasetImporter:
    """Download and transform Kaggle fitness datasets"""

    def __init__(self, output_dir: str = "ml-service/data_import/downloads"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.config_path = Path("ml-service/data_import/config/kaggle_datasets.json")

    def load_dataset_config(self) -> Dict:
        """Load dataset configuration"""
        if not self.config_path.exists():
            logger.warning(f"Config file not found at {self.config_path}")
            return {}

        with open(self.config_path, "r") as f:
            return json.load(f)

    def download_kaggle_dataset(self, dataset_name: str, extract: bool = True) -> bool:
        """
        Download dataset from Kaggle using Kaggle API
        
        Args:
            dataset_name: Kaggle dataset identifier (e.g., 'username/dataset-name')
            extract: Whether to extract the downloaded files
        
        Returns:
            True if successful, False otherwise
        """
        try:
            from kaggle.api.kaggle_api_extended import KaggleApi
        except ImportError:
            logger.error("Kaggle API not installed. Install with: pip install kaggle")
            return False

        try:
            api = KaggleApi()
            api.authenticate()
            
            output_path = self.output_dir / dataset_name.replace("/", "_")
            output_path.mkdir(parents=True, exist_ok=True)
            
            logger.info(f"Downloading dataset: {dataset_name}")
            api.dataset_download_files(dataset_name, path=str(output_path), unzip=extract)
            
            logger.info(f"Dataset downloaded to {output_path}")
            return True
        except Exception as e:
            logger.error(f"Failed to download dataset {dataset_name}: {e}")
            return False

    def transform_gym_exercises(self, csv_path: str) -> pd.DataFrame:
        """
        Transform Gym Exercise Dataset to match Exercise schema
        
        Expected columns: name, type, category, description, muscles, equipment
        """
        try:
            df = pd.read_csv(csv_path)
            
            # Standardize column names
            df.columns = df.columns.str.lower().str.strip()
            
            def get_column(*column_names):
                for column_name in column_names:
                    if column_name in df.columns:
                        return df[column_name]
                return pd.Series([""] * len(df), index=df.index)

            # Create transformed dataframe
            transformed = pd.DataFrame()
            transformed["name"] = get_column("name", "exercise", "exercise_name", "title")
            transformed["type"] = get_column("type", "exercise_type").astype(str).str.upper()
            
            # Map types to STRENGTH or CARDIO
            type_mapping = {
                "strength": "STRENGTH",
                "cardio": "CARDIO",
                "flexibility": "CARDIO",
                "stretching": "CARDIO",
            }
            transformed["type"] = transformed["type"].map(
                lambda x: type_mapping.get(x.lower(), "STRENGTH")
            )
            
            transformed["category"] = get_column("category", "bodypart", "muscle")
            transformed["description"] = get_column("description", "instructions")
            
            # Handle target muscles
            muscle_column = None
            if "muscles" in df.columns:
                muscle_column = "muscles"
            elif "muscle" in df.columns:
                muscle_column = "muscle"
            elif "target" in df.columns:
                muscle_column = "target"

            if muscle_column:
                transformed["targetMuscles"] = df[muscle_column].apply(
                    lambda x: str(x).split(",") if pd.notna(x) else []
                )
            else:
                transformed["targetMuscles"] = pd.Series([[] for _ in range(len(df))], index=df.index)
            
            # Remove duplicates
            transformed = transformed.drop_duplicates(subset=["name"], keep="first")
            
            logger.info(f"Transformed {len(transformed)} gym exercises")
            return transformed
        
        except Exception as e:
            logger.error(f"Failed to transform gym exercises: {e}")
            return pd.DataFrame()

    def transform_nutrition_data(self, csv_path: str) -> pd.DataFrame:
        """
        Transform Nutrition Dataset to match Food schema
        
        Expected columns: name, calories, protein, carbs, fat, serving_unit
        """
        try:
            df = pd.read_csv(csv_path)
            
            # Standardize column names
            df.columns = df.columns.str.lower().str.strip()
            
            # Create transformed dataframe
            transformed = pd.DataFrame()
            transformed["name"] = df.get("name", df.get("food", ""))
            transformed["calories"] = pd.to_numeric(df.get("calories", 0), errors="coerce").fillna(0).astype(int)
            transformed["protein"] = pd.to_numeric(df.get("protein", 0), errors="coerce").fillna(0).astype(float)
            transformed["carbs"] = pd.to_numeric(df.get("carbs", 0), errors="coerce").fillna(0).astype(float)
            transformed["fat"] = pd.to_numeric(df.get("fat", 0), errors="coerce").fillna(0).astype(float)
            
            # Set default serving unit
            transformed["defaultServingUnit"] = df.get("servingunit", "SERVING").fillna("SERVING")
            
            # Map serving units to valid enum values
            serving_unit_mapping = {
                "g": "GRAM",
                "gram": "GRAM",
                "oz": "OUNCE",
                "ounce": "OUNCE",
                "cup": "CUP",
                "piece": "PIECE",
                "pcs": "PIECE",
                "serving": "SERVING",
            }
            transformed["defaultServingUnit"] = transformed["defaultServingUnit"].str.lower().map(
                lambda x: serving_unit_mapping.get(x, "SERVING")
            )
            
            # Remove duplicates and invalid entries
            transformed = transformed[transformed["name"].notna() & (transformed["name"] != "")]
            transformed = transformed.drop_duplicates(subset=["name"], keep="first")
            
            # Filter out items with no nutritional data
            transformed = transformed[(transformed["calories"] > 0) | (transformed["protein"] > 0)]
            
            logger.info(f"Transformed {len(transformed)} nutrition items")
            return transformed
        
        except Exception as e:
            logger.error(f"Failed to transform nutrition data: {e}")
            return pd.DataFrame()

    def save_transformed_data(self, df: pd.DataFrame, output_name: str) -> str:
        """Save transformed data to CSV"""
        try:
            output_path = self.output_dir / f"transformed_{output_name}.csv"
            df.to_csv(output_path, index=False)
            logger.info(f"Saved transformed data to {output_path}")
            return str(output_path)
        except Exception as e:
            logger.error(f"Failed to save transformed data: {e}")
            return ""

    def validate_transformed_data(self, df: pd.DataFrame, data_type: str) -> bool:
        """Validate transformed data integrity"""
        try:
            if df.empty:
                logger.warning(f"No data to validate for {data_type}")
                return False
            
            if data_type == "exercises":
                required_cols = ["name", "type"]
                if not all(col in df.columns for col in required_cols):
                    logger.error(f"Missing required columns for exercises: {required_cols}")
                    return False
                
                if not df["type"].isin(["STRENGTH", "CARDIO"]).all():
                    logger.warning("Some exercise types are not STRENGTH or CARDIO")
            
            elif data_type == "foods":
                required_cols = ["name", "calories"]
                if not all(col in df.columns for col in required_cols):
                    logger.error(f"Missing required columns for foods: {required_cols}")
                    return False
                
                if (df["calories"] < 0).any():
                    logger.warning("Some foods have negative calories")
            
            logger.info(f"Validation passed for {data_type}")
            return True
        
        except Exception as e:
            logger.error(f"Validation failed for {data_type}: {e}")
            return False


def main():
    """Example usage"""
    importer = KaggleDatasetImporter()
    
    # Load configuration
    config = importer.load_dataset_config()
    
    if not config:
        logger.info("No dataset configuration found. Using defaults.")
        return
    
    # Process each configured dataset
    for dataset in config.get("datasets", []):
        dataset_name = dataset.get("name")
        dataset_type = dataset.get("type")
        
        logger.info(f"Processing dataset: {dataset_name}")
        
        # Download dataset
        if importer.download_kaggle_dataset(dataset_name):
            # Transform based on type
            data_dir = importer.output_dir / dataset_name.replace("/", "_")
            
            if dataset_type == "exercises":
                csv_files = list(data_dir.glob("*.csv"))
                for csv_file in csv_files:
                    df = importer.transform_gym_exercises(str(csv_file))
                    if importer.validate_transformed_data(df, "exercises"):
                        importer.save_transformed_data(df, "exercises")
            
            elif dataset_type == "nutrition":
                csv_files = list(data_dir.glob("*.csv"))
                for csv_file in csv_files:
                    df = importer.transform_nutrition_data(str(csv_file))
                    if importer.validate_transformed_data(df, "foods"):
                        importer.save_transformed_data(df, "nutrition")


if __name__ == "__main__":
    main()
