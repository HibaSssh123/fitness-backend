"""
Data Validation Module
Validates transformed data before seeding into the database
"""

import logging
from typing import Dict, List, Tuple
import pandas as pd

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class DataValidator:
    """Validate data quality and integrity"""

    @staticmethod
    def validate_exercises(df: pd.DataFrame) -> Tuple[bool, List[str]]:
        """
        Validate exercise data
        
        Returns:
            Tuple of (is_valid, list_of_errors)
        """
        errors = []
        
        if df.empty:
            errors.append("Exercise dataframe is empty")
            return False, errors
        
        # Check required columns
        required_cols = ["name", "type"]
        missing_cols = [col for col in required_cols if col not in df.columns]
        if missing_cols:
            errors.append(f"Missing required columns: {missing_cols}")
            return False, errors
        
        # Validate data types and values
        if not df["name"].dtype == object:
            errors.append("Exercise names should be strings")
        
        if not df["name"].notna().all():
            errors.append(f"{df['name'].isna().sum()} exercises have missing names")
        
        if not df["type"].isin(["STRENGTH", "CARDIO"]).all():
            invalid_types = df[~df["type"].isin(["STRENGTH", "CARDIO"])]["type"].unique()
            errors.append(f"Invalid exercise types found: {invalid_types}")
        
        # Check for duplicates
        duplicates = df[df.duplicated(subset=["name"], keep=False)].shape[0]
        if duplicates > 0:
            logger.warning(f"Found {duplicates} duplicate exercise names")
        
        # Validate optional columns
        if "targetMuscles" in df.columns:
            if not all(isinstance(x, (list, str)) or pd.isna(x) for x in df["targetMuscles"]):
                errors.append("targetMuscles should be lists or strings")
        
        is_valid = len(errors) == 0
        if is_valid:
            logger.info(f"✓ Exercise data validation passed ({len(df)} records)")
        else:
            logger.error(f"✗ Exercise data validation failed: {errors}")
        
        return is_valid, errors

    @staticmethod
    def validate_foods(df: pd.DataFrame) -> Tuple[bool, List[str]]:
        """
        Validate food/nutrition data
        
        Returns:
            Tuple of (is_valid, list_of_errors)
        """
        errors = []
        
        if df.empty:
            errors.append("Food dataframe is empty")
            return False, errors
        
        # Check required columns
        required_cols = ["name", "calories"]
        missing_cols = [col for col in required_cols if col not in df.columns]
        if missing_cols:
            errors.append(f"Missing required columns: {missing_cols}")
            return False, errors
        
        # Validate data types and values
        if not df["name"].dtype == object:
            errors.append("Food names should be strings")
        
        if not df["name"].notna().all():
            errors.append(f"{df['name'].isna().sum()} foods have missing names")
        
        try:
            calories = pd.to_numeric(df["calories"], errors="coerce")
            if calories.isna().any():
                errors.append(f"{calories.isna().sum()} foods have invalid calorie values")
            if (calories < 0).any():
                errors.append("Calories cannot be negative")
        except Exception as e:
            errors.append(f"Error validating calories: {e}")
        
        # Validate nutritional macros if present
        for macro in ["protein", "carbs", "fat"]:
            if macro in df.columns:
                try:
                    values = pd.to_numeric(df[macro], errors="coerce")
                    if (values < 0).any():
                        errors.append(f"{macro} cannot be negative")
                except Exception as e:
                    errors.append(f"Error validating {macro}: {e}")
        
        # Validate serving unit
        if "defaultServingUnit" in df.columns:
            valid_units = ["GRAM", "OUNCE", "CUP", "PIECE", "SERVING"]
            invalid_units = df[~df["defaultServingUnit"].isin(valid_units)]["defaultServingUnit"].unique()
            if len(invalid_units) > 0:
                errors.append(f"Invalid serving units: {invalid_units}")
        
        # Check for duplicates
        duplicates = df[df.duplicated(subset=["name"], keep=False)].shape[0]
        if duplicates > 0:
            logger.warning(f"Found {duplicates} duplicate food names")
        
        is_valid = len(errors) == 0
        if is_valid:
            logger.info(f"✓ Food data validation passed ({len(df)} records)")
        else:
            logger.error(f"✗ Food data validation failed: {errors}")
        
        return is_valid, errors

    @staticmethod
    def generate_validation_report(
        exercise_df: pd.DataFrame = None,
        food_df: pd.DataFrame = None
    ) -> Dict:
        """
        Generate comprehensive validation report
        
        Returns:
            Dictionary with validation results
        """
        report = {
            "exercises": {"valid": False, "count": 0, "errors": []},
            "foods": {"valid": False, "count": 0, "errors": []},
            "summary": {}
        }
        
        if exercise_df is not None:
            valid, errors = DataValidator.validate_exercises(exercise_df)
            report["exercises"]["valid"] = valid
            report["exercises"]["count"] = len(exercise_df)
            report["exercises"]["errors"] = errors
        
        if food_df is not None:
            valid, errors = DataValidator.validate_foods(food_df)
            report["foods"]["valid"] = valid
            report["foods"]["count"] = len(food_df)
            report["foods"]["errors"] = errors
        
        # Summary
        report["summary"]["total_exercises"] = report["exercises"]["count"]
        report["summary"]["total_foods"] = report["foods"]["count"]
        report["summary"]["all_valid"] = (
            report["exercises"]["valid"] and report["foods"]["valid"]
        )
        
        return report


if __name__ == "__main__":
    # Example usage
    print("Data Validation Module loaded")
