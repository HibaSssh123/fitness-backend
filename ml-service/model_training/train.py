"""
ML Model Training Script
Trains regression and classification models on fitness data
"""

import os
import json
import numpy as np
import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from sklearn.metrics import mean_squared_error, accuracy_score, classification_report
import psycopg2
from dotenv import load_dotenv

load_dotenv()

# Database connection
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/fitness_backend')
MODELS_DIR = os.path.join(os.path.dirname(__file__), '..', 'models')

# Create models directory if it doesn't exist
os.makedirs(MODELS_DIR, exist_ok=True)


def connect_to_database():
    """Connect to PostgreSQL database"""
    try:
        conn = psycopg2.connect(DATABASE_URL)
        return conn
    except psycopg2.OperationalError as e:
        print(f"Error connecting to database: {e}")
        print("Using synthetic data for training instead...")
        return None


def load_data_from_database(conn):
    """Load fitness data from database"""
    if conn is None:
        return load_synthetic_data()
    
    try:
        # Query workouts and exercise data
        query = """
        SELECT 
            we.duration,
            we."rpe" as intensity,
            e.type as exercise_type,
            u.weight,
            u.height,
            we."caloriesBurned",
            we.sets,
            we.reps,
            we.weight as weight_lifted,
            w.date
        FROM "WorkoutExercise" we
        JOIN "Exercise" e ON e.id = we."exerciseId"
        JOIN "Workout" w ON w.id = we."workoutId"
        JOIN "User" u ON u.id = w."userId"
        WHERE we."caloriesBurned" > 0
        AND we.duration IS NOT NULL
        LIMIT 5000
        """
        
        df = pd.read_sql(query, conn)
        print(f"Loaded {len(df)} workout records from database")
        
        if len(df) > 0:
            return df
        else:
            print("No workout data found, using synthetic data...")
            return load_synthetic_data()
    
    except Exception as e:
        print(f"Error loading data from database: {e}")
        print("Using synthetic data for training instead...")
        return load_synthetic_data()


def load_synthetic_data():
    """Generate synthetic fitness data for training"""
    print("Generating synthetic training data...")
    
    np.random.seed(42)
    n_samples = 1000
    
    # Generate synthetic features
    durations = np.random.uniform(20, 120, n_samples)  # 20-120 minutes
    intensities = np.random.uniform(1, 10, n_samples)  # 1-10 scale
    exercise_types = np.random.choice([0, 1], n_samples)  # 0=strength, 1=cardio
    weights = np.random.uniform(50, 120, n_samples)  # 50-120 kg
    ages = np.random.uniform(18, 65, n_samples)  # 18-65 years
    
    # Generate target: calories burned (rough formula)
    # More realistic: (weight * 3.5 * MET) / 200
    # MET varies by exercise type and intensity
    met_factors = (exercise_types * 2 + 1) * (intensities / 10)  # 1-4 MET range
    calories_burned = (weights * 3.5 * met_factors * durations) / 200
    calories_burned += np.random.normal(0, 50, n_samples)  # Add noise
    calories_burned = np.maximum(calories_burned, 0)  # No negative calories
    
    df = pd.DataFrame({
        'duration': durations,
        'intensity': intensities,
        'exercise_type': exercise_types,
        'weight': weights,
        'age': ages,
        'calories_burned': calories_burned
    })
    
    return df


def train_calorie_burn_model(df):
    """
    Train a regression model to predict calories burned
    Features: duration, intensity, exercise_type, weight, age
    """
    print("\n=== Training Calorie Burn Prediction Model ===")
    
    if df is None or len(df) < 10:
        print("Insufficient data for training")
        return None
    
    # Prepare features
    if 'calories_burned' in df.columns:
        target_col = 'calories_burned'
    elif 'caloriesBurned' in df.columns:
        target_col = 'caloriesBurned'
    else:
        print("Target column not found")
        return None
    
    feature_cols = ['duration', 'intensity', 'exercise_type', 'weight', 'age']
    
    # Handle missing columns
    for col in feature_cols:
        if col not in df.columns:
            if col == 'exercise_type':
                df[col] = df.get('type', 1).map({'CARDIO': 1, 'STRENGTH': 0}).fillna(1).astype(int)
            elif col == 'intensity':
                df[col] = df.get('rpe', 5).fillna(5).astype(float)
            elif col == 'weight':
                df[col] = 75  # default weight
            elif col == 'age':
                df[col] = 30  # default age
            elif col == 'duration':
                df[col] = df.get('duration', 30).fillna(30).astype(float)
    
    # Check if target column exists
    if target_col not in df.columns:
        print(f"Target column '{target_col}' not found in data")
        return None
    
    X = df[feature_cols].fillna(df[feature_cols].mean())
    y = df[target_col].fillna(df[target_col].mean())
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    
    # Scale features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # Train model
    model = RandomForestRegressor(
        n_estimators=100,
        max_depth=15,
        min_samples_split=5,
        random_state=42
    )
    model.fit(X_train_scaled, y_train)
    
    # Evaluate
    y_pred = model.predict(X_test_scaled)
    mse = mean_squared_error(y_test, y_pred)
    rmse = np.sqrt(mse)
    
    print(f"Model trained successfully!")
    print(f"Training samples: {len(X_train)}")
    print(f"Test samples: {len(X_test)}")
    print(f"RMSE: {rmse:.2f} calories")
    
    # Save model and scaler
    model_path = os.path.join(MODELS_DIR, 'calorie_burn_model.pkl')
    scaler_path = os.path.join(MODELS_DIR, 'calorie_burn_scaler.pkl')
    
    joblib.dump(model, model_path)
    joblib.dump(scaler, scaler_path)
    
    print(f"Model saved to {model_path}")
    print(f"Scaler saved to {scaler_path}")
    
    return model


def train_exercise_recommendation_model(df):
    """
    Train a classification model to recommend exercise type
    Features: goal_type, exercise_history, adherence, days_since_last
    """
    print("\n=== Training Exercise Recommendation Model ===")
    
    # For this, we need different data structure
    # Using synthetic data for demo
    np.random.seed(42)
    n_samples = 500
    
    # Generate synthetic user workout history
    goal_types = np.random.choice([0, 1, 2], n_samples)  # 0=lose weight, 1=maintain, 2=gain weight
    cardio_ratio = np.random.uniform(0, 1, n_samples)  # ratio of cardio in recent workouts
    adherence = np.random.uniform(0.3, 1.0, n_samples)
    days_since_last = np.random.randint(1, 7, n_samples)
    
    # Target: recommend cardio (1) or strength (0)
    # More cardio for weight loss, more strength for weight gain
    y = ((goal_types == 0) | (cardio_ratio < 0.4) & (goal_types != 2)).astype(int)
    
    X = np.column_stack([goal_types, cardio_ratio, adherence, days_since_last])
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    
    # Train model
    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=10,
        random_state=42
    )
    model.fit(X_train, y_train)
    
    # Evaluate
    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    
    print(f"Model trained successfully!")
    print(f"Training samples: {len(X_train)}")
    print(f"Test samples: {len(X_test)}")
    print(f"Accuracy: {accuracy:.2%}")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=['Strength', 'Cardio']))
    
    # Save model
    model_path = os.path.join(MODELS_DIR, 'exercise_recommendation_model.pkl')
    joblib.dump(model, model_path)
    
    print(f"Model saved to {model_path}")
    
    return model


def main():
    """Main training pipeline"""
    print("Starting ML Model Training Pipeline...")
    print(f"Models directory: {MODELS_DIR}")
    
    # Connect to database
    conn = connect_to_database()
    
    # Load data
    df = load_data_from_database(conn)
    
    # Train models
    calorie_model = train_calorie_burn_model(df)
    exercise_model = train_exercise_recommendation_model(df)
    
    # Close database connection
    if conn:
        conn.close()
    
    print("\n=== Training Complete ===")
    print("Models have been trained and saved!")
    print(f"Location: {MODELS_DIR}")
    
    return calorie_model, exercise_model


if __name__ == '__main__':
    main()
