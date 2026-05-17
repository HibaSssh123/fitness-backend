# Fitness Backend API Documentation

This is a comprehensive fitness tracking backend with AI/ML capabilities including:
- User authentication & role management
- Workout & exercise tracking
- Nutrition tracking
- Progress monitoring & predictions
- AI chatbot for fitness advice
- Admin dashboard

## Base URL

```
http://localhost:3000
```

## Authentication

All endpoints (except `/auth/register` and `/auth/login`) require JWT authentication.

**Header:**
```
Authorization: Bearer <access_token>
```

---

## Authentication Endpoints

### Register
```
POST /auth/register
```

**Body:**
```json
{
  "email": "user@example.com",
  "password": "secure_password",
  "name": "John Doe",
  "height": 180,
  "weight": 75,
  "calorieTarget": 2000
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "USER"
  }
}
```

### Login
```
POST /auth/login
```

**Body:**
```json
{
  "email": "user@example.com",
  "password": "secure_password"
}
```

**Response:** (Same as register)

---

## Progress Tracking Endpoints

### Record Daily Progress
```
POST /progress/record
```

Records daily progress metrics automatically based on user's workouts and nutrition.

**Response:**
```json
{
  "id": "metric_id",
  "userId": "user_id",
  "metricDate": "2024-01-15",
  "weightKg": 75,
  "calorieConsumed": 1800,
  "calorieAdherence": 90,
  "workoutsCompleted": 1,
  "totalCaloriesBurned": 500
}
```

### Get Progress Summary
```
GET /progress/summary?days=30
```

Get comprehensive progress data for the last N days.

**Query Parameters:**
- `days` (optional): Number of days to include (default: 30)

**Response:**
```json
{
  "period": {
    "startDate": "2024-01-01",
    "endDate": "2024-01-31",
    "days": 30
  },
  "weight": {
    "current": 75,
    "start": 80,
    "trend": -5
  },
  "calories": {
    "avgAdherence": 88.5,
    "totalBurned": 12500
  },
  "activities": {
    "totalWorkouts": 15,
    "avgWorkoutsPerDay": 0.5
  },
  "dailyMetrics": [...]
}
```

### Get Progress Predictions
```
GET /progress/predictions
```

Get AI-predicted metrics for weight loss and goal completion.

**Response:**
```json
{
  "predictions": [
    {
      "type": "weight_loss",
      "currentWeight": 75,
      "targetWeight": 70,
      "avgWeightChangePerDay": -0.5,
      "daysToTarget": 10,
      "estimatedCompletionDate": "2024-02-15"
    },
    {
      "type": "weight_projection",
      "projectedWeightIn7Days": 71.5,
      "projectedWeightIn30Days": 60
    }
  ]
}
```

### Get Weight History
```
GET /progress/weight-history?days=30
```

Get daily weight data for charting.

**Response:**
```json
[
  {
    "date": "2024-01-01",
    "weight": 80
  },
  {
    "date": "2024-01-02",
    "weight": 79.8
  }
]
```

### Get Calorie History
```
GET /progress/calorie-history?days=30
```

Get daily calorie tracking data.

**Response:**
```json
[
  {
    "date": "2024-01-01",
    "target": 2000,
    "consumed": 1800,
    "adherence": 90
  }
]
```

---

## Workout Endpoints

### Create Workout
```
POST /workouts
```

**Body:**
```json
{
  "date": "2024-01-15T10:00:00Z",
  "duration": 60,
  "notes": "Morning cardio session"
}
```

### Get User Workouts
```
GET /workouts?page=1&limit=10&startDate=2024-01-01&endDate=2024-01-31
```

### Get Workout Summary
```
GET /workouts/summary?period=month
```

Query Parameters:
- `period`: "week" or "month"

### Get Workout Details
```
GET /workouts/:id
```

### Update Workout
```
PATCH /workouts/:id
```

### Delete Workout
```
DELETE /workouts/:id
```

---

## Exercise Endpoints

### List Exercises
```
GET /exercises
```

### Create Exercise
```
POST /exercises
```

**Body:**
```json
{
  "name": "Push-ups",
  "type": "STRENGTH",
  "categoryId": "category_id",
  "description": "Bodyweight upper body exercise",
  "targetMuscles": ["chest", "triceps"]
}
```

### Get Exercise Details
```
GET /exercises/:id
```

### Update Exercise
```
PATCH /exercises/:id
```

### Delete Exercise
```
DELETE /exercises/:id
```

---

## Nutrition Endpoints

### Log Food
```
POST /food-logs
```

**Body:**
```json
{
  "foodId": "food_id",
  "serving": 1.5,
  "servingUnit": "SERVING",
  "mealType": "BREAKFAST",
  "date": "2024-01-15T08:00:00Z"
}
```

### Get Food Logs
```
GET /food-logs?startDate=2024-01-01&endDate=2024-01-31&page=1
```

### Get Daily Nutrition Summary
```
GET /food-logs/daily-summary?date=2024-01-15
```

### Delete Food Log
```
DELETE /food-logs/:id
```

---

## Goals Endpoints

### Create Goal
```
POST /goals
```

**Body:**
```json
{
  "type": "LOSE_WEIGHT",
  "startWeightKg": 80,
  "targetWeightKg": 70,
  "targetCalories": 2000,
  "targetProtein": 150,
  "startDate": "2024-01-01",
  "endDate": "2024-06-01"
}
```

### Get Goals
```
GET /goals?isActive=true
```

### Get Goal Details
```
GET /goals/:id
```

### Update Goal
```
PATCH /goals/:id
```

### Get Goal Logs
```
GET /goals/:id/logs?startDate=2024-01-01
```

### Log Goal Progress
```
POST /goals/:id/logs
```

**Body:**
```json
{
  "logDate": "2024-01-15",
  "consumedCalories": 1800,
  "consumedProtein": 140,
  "weightKg": 79.5,
  "note": "Good progress!"
}
```

---

## Chatbot Endpoints

### Send Message to Chatbot
```
POST /chat
```

**Body:**
```json
{
  "message": "Should I eat more protein for muscle gain?"
}
```

**Response:**
```json
{
  "message": {
    "id": "message_id",
    "role": "assistant",
    "content": "Based on your goal and current stats...",
    "createdAt": "2024-01-15T10:00:00Z"
  }
}
```

### Get Conversation History
```
GET /chat/history?limit=50
```

**Response:**
```json
[
  {
    "id": "msg_id",
    "role": "user",
    "content": "How many calories should I eat?",
    "createdAt": "2024-01-15T09:00:00Z"
  },
  {
    "id": "msg_id",
    "role": "assistant",
    "content": "Based on your profile...",
    "createdAt": "2024-01-15T09:05:00Z"
  }
]
```

### Clear Chat History
```
DELETE /chat/history
```

---

## Admin Endpoints

All admin endpoints require `role: ADMIN` in JWT token.

### Get All Users
```
GET /admin/users?page=1&limit=10&role=USER
```

### Get Analytics Dashboard
```
GET /admin/analytics
```

**Response:**
```json
{
  "users": {
    "total": 150,
    "active": 120,
    "admins": 5
  },
  "goals": {
    "total": 280,
    "active": 200
  },
  "activities": {
    "totalWorkouts": 5000,
    "totalFoodLogs": 50000
  },
  "trendingExercises": [
    {
      "exerciseId": "ex_id",
      "exerciseName": "Push-ups",
      "count": 500
    }
  ],
  "userProgress": {
    "avgCalorieAdherence": 85.5,
    "avgGoalProgress": 72.3
  }
}
```

### Ban User
```
PATCH /admin/users/:id/ban
```

### Unban User
```
PATCH /admin/users/:id/unban
```

### Delete User
```
DELETE /admin/users/:id
```

### Promote to Admin
```
PATCH /admin/users/:id/promote
```

### Demote from Admin
```
PATCH /admin/users/:id/demote
```

---

## ML Service Endpoints

The ML service runs on a separate port (default: 5000).

### Health Check
```
GET http://localhost:5000/health
```

### Predict Calorie Burn
```
POST http://localhost:5000/predict/calorie-burn
```

**Body:**
```json
{
  "duration": 30,
  "intensity": 7,
  "exercise_type": "cardio",
  "weight": 80,
  "age": 30
}
```

**Response:**
```json
{
  "predicted_calories_burned": 250.5
}
```

### Recommend Exercise Type
```
POST http://localhost:5000/predict/exercise-recommendation
```

---

## Error Responses

All error responses follow this format:

```json
{
  "message": "Error description",
  "statusCode": 400,
  "error": "BadRequest"
}
```

### Common Error Codes

- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `500` - Internal Server Error

---

## Rate Limiting

No rate limiting is currently enforced. This should be added in production.

## Versioning

API version: `v1` (implicit in base URL)

## Changelog

### v1.0.0 (Current)
- Initial API release
- User authentication with JWT
- Workout & exercise tracking
- Nutrition tracking
- Progress monitoring
- AI chatbot integration
- Admin dashboard
- ML predictions
