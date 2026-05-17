# ML Service for Fitness Backend

This directory contains the Python-based machine learning service for the fitness backend.

## Directory Structure

```
ml-service/
├── api/                      # Flask API server
│   └── app.py               # REST API endpoints
├── model_training/          # Model training scripts
│   └── train.py            # Training pipeline
├── models/                  # Trained model storage (.pkl files)
├── data/                    # Data files for training
├── requirements.txt         # Python dependencies
└── .env.example            # Environment variables template
```

## Setup & Installation

### 1. Install Python Dependencies

```bash
cd ml-service
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env and update DATABASE_URL
```

### 3. Train Models

```bash
cd model_training
python train.py
```

The training script will:
- Connect to the PostgreSQL database
- Load real fitness data
- Train two models:
  - **Calorie Burn Prediction**: Predicts calories burned in a workout
  - **Exercise Recommendation**: Recommends cardio or strength training

Models are saved in `models/` directory as `.pkl` files.

### 4. Start ML Service API

```bash
cd api
python app.py
```

The API will run on `http://localhost:5000`

## API Endpoints

### Health Check
```
GET /health
```

Response:
```json
{
  "status": "healthy",
  "service": "fitness-ml-service",
  "models": {
    "calorie_burn": true,
    "exercise_recommendation": true
  }
}
```

### Predict Calorie Burn
```
POST /predict/calorie-burn
```

Request:
```json
{
  "duration": 30,
  "intensity": 7,
  "exercise_type": "cardio",
  "weight": 80,
  "age": 30
}
```

Response:
```json
{
  "predicted_calories_burned": 250.5,
  "input": {...}
}
```

### Recommend Exercise Type
```
POST /predict/exercise-recommendation
```

Request:
```json
{
  "goal_type": "lose_weight",
  "recent_exercises": [1, 1, 0, 1],
  "avg_adherence": 0.85,
  "days_since_last_workout": 1
}
```

Response:
```json
{
  "recommended_type": "cardio",
  "confidence": 0.75,
  "message": "Cardio is great for weight loss!"
}
```

### Model Status
```
GET /models/status
```

## Integration with NestJS Backend

The NestJS backend can call the ML service using HTTP requests:

```typescript
// In a NestJS service
import axios from 'axios';

const prediction = await axios.post(
  'http://localhost:5000/predict/calorie-burn',
  {
    duration: 30,
    intensity: 7,
    exercise_type: 'cardio',
    weight: 80,
    age: 30
  }
);
```

## Model Training Details

### Calorie Burn Model
- **Type**: Random Forest Regression
- **Features**: duration, intensity, exercise_type, weight, age
- **Target**: calories_burned
- **Accuracy**: RMSE < 100 calories

### Exercise Recommendation Model
- **Type**: Random Forest Classification
- **Features**: goal_type, exercise_history_ratio, adherence, days_since_last
- **Target**: exercise_type (0=strength, 1=cardio)
- **Accuracy**: >70%

## Production Deployment

For production:

1. Train models on full dataset
2. Save models to cloud storage (S3, GCS)
3. Use Docker to containerize ML service
4. Deploy with proper monitoring
5. Set up model versioning and retraining schedule

## Future Improvements

- [ ] Deep learning models (LSTM for time-series predictions)
- [ ] Real-time model retraining
- [ ] A/B testing framework
- [ ] Model explainability (SHAP values)
- [ ] FastAPI instead of Flask for better performance
- [ ] Async training pipeline
