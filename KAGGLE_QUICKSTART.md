# Kaggle Integration - Quick Start Guide

Get up and running with Kaggle fitness datasets in 5 minutes!

## Prerequisites

- Python 3.8+
- PostgreSQL (running and configured)
- Kaggle account (free)

## Step 1: Get Kaggle API Credentials (2 minutes)

1. Visit https://www.kaggle.com/account
2. Scroll down to "API" section
3. Click "Create New API Token"
4. Save the downloaded `kaggle.json`:

```bash
mkdir -p ~/.kaggle
mv ~/Downloads/kaggle.json ~/.kaggle/
chmod 600 ~/.kaggle/kaggle.json
```

## Step 2: Configure Environment (1 minute)

Copy and update your `.env` file:

```bash
cp .env.example .env
```

Update with your database URL (should already be set):

```bash
DATABASE_URL="postgresql://user:password@localhost:5432/fitness_backend?schema=public"
```

## Step 3: Run Complete Setup (2 minutes)

```bash
cd ml-service/data_import
bash setup.sh full
```

This will:
- ✓ Install dependencies
- ✓ Download Kaggle datasets
- ✓ Transform data to match schema
- ✓ Validate data quality
- ✓ Seed your PostgreSQL database

## What You Get

After running the setup, your database will have:

- **14,000+ Gym Exercises** - Comprehensive exercise library with muscle groups
- **Nutritional Data** - Food items with calories and macros
- **Exercise Categories** - Organized exercise types

## Verify It Works

Check your database:

```bash
# Show statistics
cd ml-service/data_import
bash setup.sh stats
```

Or query directly:

```sql
-- Count exercises
SELECT COUNT(*) FROM "Exercise";

-- Count foods
SELECT COUNT(*) FROM "Food";

-- Sample exercises
SELECT name, type FROM "Exercise" LIMIT 10;
```

## What's Next?

### Use the Data

Your API endpoints will now return the seeded data:

```bash
# Get exercises
curl http://localhost:3000/exercises

# Get foods
curl http://localhost:3000/foods
```

### Improve ML Models

Retrain your models with the larger dataset:

```bash
cd ml-service
python train.py  # Uses exercises and foods in training
```

### Add More Datasets

Edit `config/kaggle_datasets.json` to add more datasets, then:

```bash
bash setup.sh download  # Download additional datasets
bash setup.sh seed      # Seed them to database
```

## Troubleshooting

### "Kaggle credentials not found"

Make sure you have either:
- File at `~/.kaggle/kaggle.json`
- OR environment variables set:
  ```bash
  export KAGGLE_USERNAME="your-username"
  export KAGGLE_KEY="your-api-key"
  ```

### "Database connection failed"

Verify PostgreSQL is running:

```bash
psql "$DATABASE_URL" -c "SELECT 1"
```

If that fails:
- Check DATABASE_URL in `.env`
- Verify PostgreSQL credentials
- Ensure database exists

### "Data validation failed"

Run validation separately to see issues:

```bash
bash setup.sh validate
```

Check the error messages and review:
- CSV file format
- Required column names
- Data types and values

## Manual Steps (If Automated Script Fails)

### 1. Install Dependencies

```bash
cd ml-service
pip install -r requirements.txt
```

### 2. Download Data

```bash
python -m data_import.kaggle_import
```

Files will be saved to `data_import/downloads/`

### 3. Validate Data

```python
from data_import.data_validation import DataValidator
import pandas as pd

df = pd.read_csv("data_import/downloads/transformed_exercises.csv")
valid, errors = DataValidator.validate_exercises(df)
print("Valid:", valid)
if errors:
    print("Errors:", errors)
```

### 4. Seed Database

```bash
python -m data_import.seed_database
```

## Performance Tips

### Large Datasets

For datasets with 100K+ records, increase batch size:

Edit `config/kaggle_datasets.json`:

```json
{
  "seed_options": {
    "batch_size": 5000
  }
}
```

### Scheduled Updates

Keep data fresh with cron:

```bash
# Update Kaggle data weekly
0 2 * * 0 cd /path/to/fitness-backend/ml-service/data_import && bash setup.sh full
```

## File Structure

```
ml-service/
├── data_import/
│   ├── __init__.py
│   ├── kaggle_import.py        # Download & transform
│   ├── data_validation.py      # Validate data
│   ├── seed_database.py        # Seed database
│   ├── setup.sh                # Automated setup script
│   ├── README.md               # Module documentation
│   ├── config/
│   │   └── kaggle_datasets.json # Dataset configuration
│   └── downloads/              # Downloaded data (generated)
└── requirements.txt            # Python dependencies
```

## Full Documentation

For complete details, see:

- `KAGGLE_INTEGRATION.md` - Comprehensive integration guide
- `data_import/README.md` - Module documentation
- `data_import/config/kaggle_datasets.json` - Configuration reference

## Support

Having issues? Check:

1. Kaggle credentials: `~/.kaggle/kaggle.json` exists
2. Database: `psql "$DATABASE_URL" -c "SELECT 1"` works
3. Python: `python3 --version` shows 3.8+
4. Dependencies: `pip list | grep kaggle` shows installed

If still stuck, check the error logs for details about what failed.

## Next Steps

1. ✅ Run setup: `bash setup.sh full`
2. ✅ Verify: `bash setup.sh stats`
3. ✅ Use data in your application
4. ✅ Train ML models with new data
5. ✅ Enjoy better recommendations! 🎉

---

**Happy fitness data integrating!** 💪
