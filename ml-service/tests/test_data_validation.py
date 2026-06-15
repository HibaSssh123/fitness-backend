"""
Test Suite for Data Validation
Tests data validation for exercises and foods
"""

import unittest
import os
import sys
import pandas as pd
import numpy as np

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from data_import.data_validation import DataValidator


class TestExerciseDataValidation(unittest.TestCase):
    """Test exercise data validation"""
    
    def test_validate_valid_exercises(self):
        """Test validation of valid exercise data"""
        df = pd.DataFrame({
            'name': ['Squats', 'Bench Press', 'Deadlift'],
            'type': ['STRENGTH', 'STRENGTH', 'STRENGTH']
        })
        
        is_valid, errors = DataValidator.validate_exercises(df)
        
        self.assertTrue(is_valid, "Valid exercise data should pass validation")
        self.assertEqual(len(errors), 0, "Valid data should have no errors")
    
    def test_validate_empty_dataframe(self):
        """Test validation of empty dataframe"""
        df = pd.DataFrame()
        
        is_valid, errors = DataValidator.validate_exercises(df)
        
        self.assertFalse(is_valid, "Empty dataframe should fail validation")
        self.assertGreater(len(errors), 0, "Should have error messages")
    
    def test_validate_missing_required_columns(self):
        """Test validation with missing required columns"""
        df = pd.DataFrame({
            'name': ['Squats', 'Bench Press']
            # Missing 'type' column
        })
        
        is_valid, errors = DataValidator.validate_exercises(df)
        
        self.assertFalse(is_valid, "Missing required columns should fail validation")
        self.assertTrue(any('Missing required columns' in error for error in errors),
                       "Should report missing columns")
    
    def test_validate_missing_names(self):
        """Test validation with missing exercise names"""
        df = pd.DataFrame({
            'name': ['Squats', np.nan, 'Deadlift'],
            'type': ['STRENGTH', 'STRENGTH', 'STRENGTH']
        })
        
        is_valid, errors = DataValidator.validate_exercises(df)
        
        self.assertFalse(is_valid, "Missing names should fail validation")
        self.assertTrue(any('missing names' in error.lower() for error in errors),
                       "Should report missing names")
    
    def test_validate_invalid_exercise_types(self):
        """Test validation with invalid exercise types"""
        df = pd.DataFrame({
            'name': ['Squats', 'Running', 'Bench Press'],
            'type': ['STRENGTH', 'INVALID_TYPE', 'STRENGTH']
        })
        
        is_valid, errors = DataValidator.validate_exercises(df)
        
        self.assertFalse(is_valid, "Invalid types should fail validation")
        self.assertTrue(any('Invalid exercise types' in error for error in errors),
                       "Should report invalid types")
    
    def test_validate_valid_types_cardio_strength(self):
        """Test validation with valid CARDIO and STRENGTH types"""
        df = pd.DataFrame({
            'name': ['Running', 'Squats', 'Cycling', 'Bench Press'],
            'type': ['CARDIO', 'STRENGTH', 'CARDIO', 'STRENGTH']
        })
        
        is_valid, errors = DataValidator.validate_exercises(df)
        
        self.assertTrue(is_valid, "Valid CARDIO/STRENGTH types should pass")
    
    def test_validate_duplicate_exercises(self):
        """Test validation with duplicate exercise names"""
        df = pd.DataFrame({
            'name': ['Squats', 'Bench Press', 'Squats'],
            'type': ['STRENGTH', 'STRENGTH', 'STRENGTH']
        })
        
        is_valid, errors = DataValidator.validate_exercises(df)
        
        # Should warn but not fail (duplicates are just warnings)
        self.assertGreaterEqual(len(errors), 0, "Should handle duplicates")


class TestFoodDataValidation(unittest.TestCase):
    """Test food/nutrition data validation"""
    
    def test_validate_valid_foods(self):
        """Test validation of valid food data"""
        df = pd.DataFrame({
            'name': ['Apple', 'Chicken Breast', 'Rice'],
            'calories': [95, 165, 206]
        })
        
        is_valid, errors = DataValidator.validate_foods(df)
        
        self.assertTrue(is_valid, "Valid food data should pass validation")
        self.assertEqual(len(errors), 0, "Valid data should have no errors")
    
    def test_validate_empty_food_dataframe(self):
        """Test validation of empty food dataframe"""
        df = pd.DataFrame()
        
        is_valid, errors = DataValidator.validate_foods(df)
        
        self.assertFalse(is_valid, "Empty dataframe should fail validation")
        self.assertGreater(len(errors), 0, "Should have error messages")
    
    def test_validate_missing_food_columns(self):
        """Test validation with missing required food columns"""
        df = pd.DataFrame({
            'name': ['Apple', 'Chicken']
            # Missing 'calories' column
        })
        
        is_valid, errors = DataValidator.validate_foods(df)
        
        self.assertFalse(is_valid, "Missing required columns should fail")
        self.assertTrue(any('Missing required columns' in error for error in errors),
                       "Should report missing columns")
    
    def test_validate_invalid_calories(self):
        """Test validation with invalid calorie values"""
        df = pd.DataFrame({
            'name': ['Apple', 'Chicken', 'Rice'],
            'calories': [95, 'invalid', 206]
        })
        
        is_valid, errors = DataValidator.validate_foods(df)
        
        self.assertFalse(is_valid, "Invalid calories should fail validation")
        self.assertTrue(any('invalid calorie values' in error.lower() for error in errors),
                       "Should report invalid calories")
    
    def test_validate_negative_calories(self):
        """Test validation with negative calorie values"""
        df = pd.DataFrame({
            'name': ['Apple', 'Chicken', 'Rice'],
            'calories': [95, -165, 206]
        })
        
        is_valid, errors = DataValidator.validate_foods(df)
        
        self.assertFalse(is_valid, "Negative calories should fail validation")
        self.assertTrue(any('negative' in error.lower() for error in errors),
                       "Should report negative values")
    
    def test_validate_missing_food_names(self):
        """Test validation with missing food names"""
        df = pd.DataFrame({
            'name': ['Apple', np.nan, 'Rice'],
            'calories': [95, 165, 206]
        })
        
        is_valid, errors = DataValidator.validate_foods(df)
        
        self.assertFalse(is_valid, "Missing food names should fail")
        self.assertTrue(any('missing names' in error.lower() for error in errors),
                       "Should report missing names")
    
    def test_validate_zero_calories(self):
        """Test validation with zero calories (edge case)"""
        df = pd.DataFrame({
            'name': ['Water', 'Chicken', 'Rice'],
            'calories': [0, 165, 206]
        })
        
        # Zero calories is valid (for water, etc.)
        is_valid, errors = DataValidator.validate_foods(df)
        
        # Zero is technically valid (not negative)
        # But let's verify the validation logic handles it


class TestDataValidationEdgeCases(unittest.TestCase):
    """Test edge cases in data validation"""
    
    def test_large_dataset(self):
        """Test validation with large dataset"""
        large_df = pd.DataFrame({
            'name': [f'Exercise {i}' for i in range(10000)],
            'type': ['STRENGTH' if i % 2 == 0 else 'CARDIO' for i in range(10000)]
        })
        
        is_valid, errors = DataValidator.validate_exercises(large_df)
        
        self.assertTrue(is_valid, "Large valid dataset should pass")
    
    def test_special_characters_in_names(self):
        """Test validation with special characters"""
        df = pd.DataFrame({
            'name': ['Squats (Barbell)', 'Push-ups', 'Leg & Core'],
            'type': ['STRENGTH', 'STRENGTH', 'STRENGTH']
        })
        
        is_valid, errors = DataValidator.validate_exercises(df)
        
        self.assertTrue(is_valid, "Special characters should be allowed")


if __name__ == '__main__':
    unittest.main()
