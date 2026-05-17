"""
ML Service API for Fitness Backend
Provides predictions for fitness metrics using trained ML models
"""

import os
import json
import joblib
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import numpy as np

load_dotenv()

app = Flask(__name__)
CORS(app)

# Model paths
MODELS_DIR = os.path.join(os.path.dirname(__file__), '..', 'models')
CALORIE_BURN_MODEL_PATH = os.path.join(MODELS_DIR, 'calorie_burn_model.pkl')
EXERCISE_RECOMMENDATION_MODEL_PATH = os.path.join(MODELS_DIR, 'exercise_recommendation_model.pkl')

# Load models (with fallback if not trained yet)
try:
    calorie_burn_model = joblib.load(CALORIE_BURN_MODEL_PATH)
    print("Loaded calorie burn model")
except FileNotFoundError:
    calorie_burn_model = None
    print("Calorie burn model not found - training required")

try:
    exercise_model = joblib.load(EXERCISE_RECOMMENDATION_MODEL_PATH)
    print("Loaded exercise recommendation model")
except FileNotFoundError:
    exercise_model = None
    print("Exercise recommendation model not found - training required")


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'fitness-ml-service',
        'models': {
            'calorie_burn': calorie_burn_model is not None,
            'exercise_recommendation': exercise_model is not None
        }
    })


@app.route('/predict/calorie-burn', methods=['POST'])
def predict_calorie_burn():
    """
    Predict calories burned for a workout
    
    Request body:
    {
        "duration": 30,  # minutes
        "intensity": 7,  # 1-10 scale
        "exercise_type": "cardio",  # or "strength"
        "weight": 80,  # kg
        "age": 30,
        "heart_rate_avg": 150  # optional
    }
    """
    if calorie_burn_model is None:
        return jsonify({
            'error': 'Model not trained yet',
            'message': 'Please train the model first'
        }), 503

    try:
        data = request.get_json()
        
        # Extract features
        duration = float(data.get('duration', 30))
        intensity = float(data.get('intensity', 5))
        exercise_type = data.get('exercise_type', 'cardio')
        weight = float(data.get('weight', 70))
        age = float(data.get('age', 30))
        
        # Encode exercise type
        exercise_type_encoded = 1 if exercise_type.lower() == 'cardio' else 0
        
        # Prepare features for model
        features = np.array([[
            duration,
            intensity,
            exercise_type_encoded,
            weight,
            age
        ]])
        
        # Make prediction
        predicted_calories = calorie_burn_model.predict(features)[0]
        
        return jsonify({
            'predicted_calories_burned': round(float(predicted_calories), 2),
            'input': data
        })
    
    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 400


@app.route('/predict/exercise-recommendation', methods=['POST'])
def predict_exercise_recommendation():
    """
    Recommend next exercise based on user history
    
    Request body:
    {
        "goal_type": "lose_weight",  # or "maintain_weight", "gain_weight"
        "recent_exercises": [1, 1, 0, 1],  # cardio=1, strength=0
        "avg_adherence": 0.85,
        "days_since_last_workout": 1
    }
    """
    if exercise_model is None:
        # Return a simple recommendation without ML
        goal_type = request.get_json().get('goal_type', 'lose_weight')
        if goal_type == 'lose_weight':
            return jsonify({
                'recommended_type': 'cardio',
                'confidence': 0.75,
                'message': 'Cardio is great for weight loss!'
            })
        else:
            return jsonify({
                'recommended_type': 'strength',
                'confidence': 0.80,
                'message': 'Strength training builds muscle!'
            })

    try:
        data = request.get_json()
        
        # Extract features
        goal_type = data.get('goal_type', 'lose_weight')
        recent_exercises = np.array(data.get('recent_exercises', [1, 1, 0, 1]))
        avg_adherence = float(data.get('avg_adherence', 0.8))
        days_since_last = float(data.get('days_since_last_workout', 1))
        
        # Encode goal type
        goal_encoded = {'lose_weight': 0, 'maintain_weight': 1, 'gain_weight': 2}.get(goal_type, 0)
        
        # Prepare features
        features = np.array([[
            goal_encoded,
            recent_exercises.mean(),
            avg_adherence,
            days_since_last
        ]])
        
        # Make prediction
        prediction = exercise_model.predict(features)[0]
        probability = exercise_model.predict_proba(features)[0]
        
        exercise_type = 'cardio' if prediction == 1 else 'strength'
        confidence = float(max(probability))
        
        return jsonify({
            'recommended_type': exercise_type,
            'confidence': round(confidence, 2),
            'message': f'{exercise_type.capitalize()} training is recommended for your goal!'
        })
    
    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 400


@app.route('/models/status', methods=['GET'])
def model_status():
    """Get status of all trained models"""
    return jsonify({
        'models': {
            'calorie_burn': {
                'trained': calorie_burn_model is not None,
                'path': CALORIE_BURN_MODEL_PATH
            },
            'exercise_recommendation': {
                'trained': exercise_model is not None,
                'path': EXERCISE_RECOMMENDATION_MODEL_PATH
            }
        }
    })


@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'error': 'Endpoint not found',
        'message': 'Please check the API documentation'
    }), 404


@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        'error': 'Internal server error',
        'message': str(error)
    }), 500


if __name__ == '__main__':
    port = int(os.getenv('ML_SERVICE_PORT', 5000))
    app.run(debug=True, host='0.0.0.0', port=port)
