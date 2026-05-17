# Fitness Backend with AI/ML

A comprehensive fitness tracking backend built with **NestJS**, **PostgreSQL**, and **Python ML models**. Features include user authentication, workout tracking, nutrition logging, progress monitoring, ML-powered predictions, and an AI chatbot for fitness advice.

## 🎯 Features

### Core Features
- ✅ User authentication with JWT
- ✅ Workout & exercise tracking
- ✅ Nutrition logging and tracking
- ✅ Goal setting and progress monitoring
- ✅ Admin dashboard & user management
- ✅ Role-based access control

### AI/ML Features
- 🤖 **AI Chatbot**: Context-aware fitness advice using LLM APIs
- 📊 **Progress Visualization**: Charts for weight, calories, and goal progress
- 🎯 **Predictive Analytics**: ML models to predict weight loss and goal completion
- 💪 **Exercise Recommendations**: ML model suggests optimal exercise types
- 🔥 **Calorie Predictions**: Predicts calories burned for workouts

## 📋 System Architecture

```
┌─────────────────────────────────────────────────────┐
│         Frontend (React/Vue/Angular)                │
└────────────────────┬────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
    ┌───▼───┐    ┌───▼────┐  ┌───▼─────┐
    │ NestJS│    │ Python │  │PostgreSQL
    │Backend├───►│  ML    ├──┤Database  
    │       │    │Service │  │          
    └───────┘    └────────┘  └──────────┘
        ▲
        │
   ┌────┴─────────┐
   │ LLM APIs     │
   │(Groq/Gemini) │
   └──────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ & npm
- Python 3.8+
- PostgreSQL 12+
- Git

### 1. Clone Repository
```bash
git clone https://github.com/HibaSssh123/fitness-backend.git
cd fitness-backend
```

### 2. Setup NestJS Backend

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your configuration

# Create database (if needed)
# Make sure PostgreSQL is running

# Run migrations
npx prisma migrate dev

# Start backend server
npm run start:dev
```

The backend will run on `http://localhost:3000`

### 3. Setup Python ML Service

```bash
cd ml-service

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your DATABASE_URL

# Train models
cd model_training
python train.py

# Start ML API server
cd ../api
python app.py
```

The ML service will run on `http://localhost:5000`

## 📚 API Documentation

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for comprehensive API reference.

### Key Endpoints

**Authentication:**
- `POST /auth/register` - Create new account
- `POST /auth/login` - Login user

**Progress Tracking:**
- `POST /progress/record` - Record daily metrics
- `GET /progress/summary` - Get progress summary
- `GET /progress/predictions` - Get AI predictions
- `GET /progress/weight-history` - Weight chart data
- `GET /progress/calorie-history` - Calorie chart data

**AI Chatbot:**
- `POST /chat` - Send message to chatbot
- `GET /chat/history` - Get conversation history
- `DELETE /chat/history` - Clear conversation

**Admin:**
- `GET /admin/users` - List users
- `GET /admin/analytics` - Dashboard analytics
- `PATCH /admin/users/:id/promote` - Promote to admin
- `PATCH /admin/users/:id/ban` - Ban user

**Workouts:**
- `POST /workouts` - Create workout
- `GET /workouts` - List workouts
- `PATCH /workouts/:id` - Update workout
- `DELETE /workouts/:id` - Delete workout

**ML Service:**
- `POST /predict/calorie-burn` - Predict calories for workout
- `POST /predict/exercise-recommendation` - Recommend exercise

## 🛠️ Configuration

### Backend Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/fitness"

# JWT
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN_SECONDS=604800

# Server
PORT=3000

# LLM Configuration
LLM_PROVIDER="groq"  # groq, openai, or gemini
LLM_API_KEY="your-api-key"

# ML Service
ML_SERVICE_URL="http://localhost:5000"
```

### ML Service Environment Variables

```env
DATABASE_URL="postgresql://user:password@localhost:5432/fitness"
ML_SERVICE_PORT=5000
```

## 🔐 LLM Integration

The chatbot supports multiple LLM providers. Choose one:

### Option 1: Groq (Recommended - Fast & Free)
```bash
# Get free API key from https://console.groq.com/
# Set in .env:
LLM_PROVIDER=groq
LLM_API_KEY=your_groq_api_key
```

### Option 2: Google Gemini
```bash
# Get API key from https://makersuite.google.com/app/apikey
# Set in .env:
LLM_PROVIDER=gemini
LLM_API_KEY=your_gemini_api_key
```

### Option 3: OpenAI
```bash
# Get API key from https://platform.openai.com/api-keys
# Set in .env:
LLM_PROVIDER=openai
LLM_API_KEY=your_openai_api_key
```

## 📊 Database Schema

Key models:

- **User**: Core user entity with role-based access
- **Workout**: Exercise sessions with exercises
- **Exercise**: Exercise library
- **Food**: Food database
- **FoodLog**: User's food intake tracking
- **Goal**: User fitness goals
- **GoalLog**: Goal progress tracking
- **ProgressMetric**: Daily progress snapshots
- **ChatMessage**: Conversation history

[Full schema](./prisma/schema.prisma)

## 🤖 ML Models

### Calorie Burn Prediction
- **Type**: Random Forest Regression
- **Features**: Duration, intensity, exercise type, weight, age
- **Accuracy**: RMSE < 100 calories

### Exercise Recommendation
- **Type**: Random Forest Classification  
- **Features**: Goal type, exercise history, adherence, days since last workout
- **Accuracy**: >70%

## 🧪 Testing

```bash
# Run unit tests
npm run test

# Run e2e tests
npm run test:e2e

# Run tests with coverage
npm run test:cov
```

## 🔍 Linting & Formatting

```bash
# Lint code
npm run lint

# Format code
npm run format
```

## 🏗️ Building for Production

```bash
# Build NestJS
npm run build

# Run production build
npm run start:prod
```

## 📈 Project Roadmap

### Phase 1 ✅ - Core Backend
- [x] User authentication
- [x] Workout tracking
- [x] Nutrition tracking
- [x] Admin system
- [x] Progress tracking

### Phase 2 ✅ - AI/ML
- [x] ML service setup
- [x] Model training pipeline
- [x] Prediction endpoints
- [x] AI chatbot integration
- [x] Progress visualization endpoints

### Phase 3 🔄 - Enhancement
- [ ] Advanced ML models (Deep Learning)
- [ ] Real-time recommendations
- [ ] Social features (groups, leaderboards)
- [ ] Mobile app
- [ ] Advanced analytics

### Phase 4 🔄 - Production
- [ ] Kubernetes deployment
- [ ] CI/CD pipeline
- [ ] Monitoring & logging
- [ ] Performance optimization
- [ ] Security hardening

## 🐛 Troubleshooting

### Database Connection Error
```
Error: Can't reach database server
```
**Solution**: Ensure PostgreSQL is running and DATABASE_URL is correct

### Models Not Training
```
Error: Can't reach database server at localhost:5432
```
**Solution**: Models will train on synthetic data if DB is unavailable. Use real data when DB is ready.

### JWT Token Invalid
```
Error: Invalid token
```
**Solution**: Ensure JWT_SECRET matches in .env and token hasn't expired

### ML Service Not Responding
```
Error: Cannot connect to ML service
```
**Solution**: Start ML service: `cd ml-service/api && python app.py`

## 📝 Project Structure

```
fitness-backend/
├── src/                          # NestJS source
│   ├── admin/                    # Admin module
│   ├── auth/                     # Authentication
│   ├── chatbot/                  # AI chatbot
│   ├── exercises/                # Exercise management
│   ├── food-logs/                # Nutrition tracking
│   ├── foods/                    # Food database
│   ├── goals/                    # Goal tracking
│   ├── progress/                 # Progress tracking & predictions
│   ├── workouts/                 # Workout tracking
│   ├── prisma/                   # Prisma service
│   └── app.module.ts             # Main module
├── prisma/
│   ├── schema.prisma             # Database schema
│   └── migrations/               # SQL migrations
├── ml-service/                   # Python ML service
│   ├── api/                      # Flask API
│   ├── model_training/           # Training scripts
│   ├── models/                   # Trained model storage
│   └── requirements.txt          # Python dependencies
├── test/                         # End-to-end tests
├── .env.example                  # Environment template
├── package.json                  # NestJS dependencies
└── README.md                     # This file
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature/my-feature`
5. Submit pull request

## 📄 License

This project is licensed under the UNLICENSED license.

## 👨‍💻 Author

Created for fitness tracking with AI/ML capabilities.

## 🆘 Support

For issues and questions:
- Open an issue on GitHub
- Check existing documentation
- Review API documentation

---

**Happy tracking! 🏋️‍♀️**
