# Kaggle Fitness Dataset Integration Guide

This guide explains how to integrate Kaggle fitness datasets into the fitness-backend application to improve ML model accuracy and provide better exercise/nutrition recommendations.

## Overview

The Kaggle integration system provides:

- **Automated Dataset Downloads**: Download datasets directly from Kaggle using the Kaggle API
- **Data Transformation**: Transform raw Kaggle data to match your PostgreSQL schema
- **Data Validation**: Validate data quality before database seeding
- **Database Seeding**: Automatically populate your database with clean, validated data
- **Comprehensive Logging**: Track all operations with detailed logs

## Benefits

- **14K+ Exercises**: Access comprehensive gym exercise database with muscle groups and equipment
- **Nutrition Database**: Real-world food nutritional data with calories, macros, and serving sizes
- **Improved ML Models**: Train models on larger, validated datasets for better predictions
- **Better Recommendations**: More accurate exercise and nutrition recommendations based on real data

## Setup

### 1. Install Dependencies

```bash
# Install Kaggle API and other required Python packages
cd ml-service
pip install -r requirements.txt
```

### 2. Configure Kaggle API

The Kaggle API requires authentication. Follow these steps:

1. Go to https://www.kaggle.com/account
2. Scroll down to "API" section
3. Click "Create New API Token"
4. This downloads a file `kaggle.json` containing your credentials

**Option A: Store credentials in default location (recommended)**
```bash
# Linux/Mac
mkdir -p ~/.kaggle
mv ~/Downloads/kaggle.json ~/.kaggle/
chmod 600 ~/.kaggle/kaggle.json

# Windows
mkdir %USERPROFILE%\.kaggle
move Downloads\kaggle.json %USERPROFILE%\.kaggle\
```

**Option B: Set environment variables**
```bash
# Add to your .env file:
KAGGLE_USERNAME="your-kaggle-username"
KAGGLE_KEY="your-kaggle-api-key"
```

### 3. Update Environment Variables

Update your `.env` file with Kaggle credentials:

```bash
# Required
KAGGLE_USERNAME="your-kaggle-username"
KAGGLE_KEY="your-kaggle-api-key"

# Database connection (should already be set)
DATABASE_URL="postgresql://..."
```

## Usage

### Quick Start: Download and Seed Data

```bash
cd ml-service
python -m data_import.kaggle_import
```

This will:
1. Load dataset configuration
2. Download configured Kaggle datasets
3. Transform data to match schema
4. Validate data quality
5. Seed PostgreSQL database

### Step-by-Step Usage

#### 1. Download Datasets

```python
from data_import.kaggle_import import KaggleDatasetImporter

importer = KaggleDatasetImporter()

# Download specific dataset
importer.download_kaggle_dataset("edqian/gym-exercises")
importer.download_kaggle_dataset("openfoodfacts/food-products-open-database")
```

#### 2. Transform Data

```python
# Transform gym exercises
exercises_df = importer.transform_gym_exercises(
    "ml-service/data_import/downloads/edqian_gym-exercises/exercises.csv"
)

# Transform nutrition data
foods_df = importer.transform_nutrition_data(
    "ml-service/data_import/downloads/openfoodfacts_food-products-open-database/products.csv"
)
```

#### 3. Validate Data

```python
from data_import.data_validation import DataValidator

# Validate exercises
is_valid, errors = DataValidator.validate_exercises(exercises_df)
if not is_valid:
    print("Validation errors:", errors)

# Validate foods
is_valid, errors = DataValidator.validate_foods(foods_df)
if not is_valid:
    print("Validation errors:", errors)

# Generate comprehensive report
report = DataValidator.generate_validation_report(exercises_df, foods_df)
print(report)
```

#### 4. Seed Database

```python
from data_import.seed_database import DatabaseSeeder

seeder = DatabaseSeeder()
seeder.connect()

# Seed exercises
seeder.seed_exercises("path/to/transformed_exercises.csv")

# Seed foods
seeder.seed_foods("path/to/transformed_foods.csv")

# Check stats
stats = seeder.get_seeding_stats()
print(f"Exercises: {stats['total_exercises']}")
print(f"Foods: {stats['total_foods']}")

seeder.disconnect()
```

## Recommended Kaggle Datasets

### 1. Gym Exercise Dataset (Recommended)
- **Name**: `edqian/gym-exercises`
- **Type**: Exercise data
- **Records**: 10,000+ exercises
- **Size**: ~3 MB
- **Columns**: title, type, target, description, equipment
- **License**: CC0 (Public Domain)
- **Use Case**: Exercise recommendations, exercise library

### 2. Food Nutrition Database
- **Name**: `openfoodfacts/food-products-open-database`
- **Type**: Nutrition data
- **Records**: 500,000+ food products
- **Columns**: product_name, energy_kcal_100g, proteins_100g, carbohydrates_100g, fat_100g
- **License**: ODbL (Open Data Commons)
- **Use Case**: Nutrition tracking, calorie predictions, comprehensive food database

### 3. Fitness Tracking Data
- **Type**: User workout metrics
- **Records**: Real user data
- **Columns**: user_id, date, duration, calories_burned, exercise_type
- **Use Case**: Model training, pattern analysis

## Data Schema Mapping

### Exercise Table

| Kaggle Column | Schema Column | Type | Notes |
|---|---|---|---|
| exercise/name | name | String | Required |
| type | type | ENUM (STRENGTH, CARDIO) | Mapped during transform |
| bodypart | category | String | Optional |
| description | description | String | Optional |
| muscles | targetMuscles | String[] | Split on comma |
| equipment | (not stored) | - | Available in raw data |

### Food Table

| Kaggle Column | Schema Column | Type | Notes |
|---|---|---|---|
| name/food | name | String | Required |
| calories | calories | Integer | Required, must be > 0 |
| protein | protein | Float | Optional |
| carbs | carbs | Float | Optional |
| fat | fat | Float | Optional |
| servingunit | defaultServingUnit | ENUM | Maps to GRAM, OUNCE, CUP, PIECE, SERVING |

## Configuration

Edit `ml-service/data_import/config/kaggle_datasets.json` to customize:

- Which datasets to download
- Data transformation rules
- Column mappings
- Validation rules
- Seeding options

Example configuration:
```json
{
  "datasets": [
    {
      "name": "edqian/gym-exercises",
      "type": "exercises",
      "featured": true,
      "csv_file": "exercises.csv"
    },
    {
      "name": "openfoodfacts/food-products-open-database",
      "type": "nutrition",
      "featured": false,
      "csv_file": "products.csv"
    }
  ],
  "seed_options": {
    "batch_size": 1000,
    "on_duplicate": "skip",
    "validate_before_seed": true
  }
}
```

## Troubleshooting

### Kaggle API Authentication Failed

**Error**: `401 - Unauthorized`

**Solution**:
- Verify credentials in `~/.kaggle/kaggle.json`
- Ensure file permissions are correct: `chmod 600 ~/.kaggle/kaggle.json`
- Regenerate API token on Kaggle website

### No such file or directory

**Error**: `FileNotFoundError: kaggle.json`

**Solution**:
- Ensure kaggle.json is in `~/.kaggle/`
- Or set environment variables `KAGGLE_USERNAME` and `KAGGLE_KEY`

### Database Connection Failed

**Error**: `psycopg2.OperationalError: could not connect to server`

**Solution**:
- Verify DATABASE_URL in `.env`
- Ensure PostgreSQL is running
- Check database credentials

### Data Validation Errors

**Error**: `Missing required columns` or `Invalid exercise types`

**Solution**:
- Check source dataset columns match configuration
- Update column mappings in `kaggle_datasets.json`
- Verify data transformation logic in `kaggle_import.py`

## Performance Considerations

### Large Datasets

For datasets with 100K+ records:

```python
# Process in chunks
chunk_size = 10000
for chunk in pd.read_csv(file, chunksize=chunk_size):
    # Transform and validate chunk
    transformed = importer.transform_gym_exercises(chunk)
    # Seed chunk
    seeder.seed_exercises(chunk)
```

### Batch Size

Configure batch size in `kaggle_datasets.json`:
```json
{
  "seed_options": {
    "batch_size": 1000  // Adjust based on memory
  }
}
```

## Data Quality & Validation

The system includes comprehensive validation:

1. **Schema Validation**: Ensure required columns exist
2. **Type Validation**: Verify data types (string, int, float, enum)
3. **Value Validation**: Check ranges (no negative calories)
4. **Duplicate Detection**: Identify and remove duplicates
5. **Null Handling**: Validate required fields are populated

View validation reports:
```python
report = DataValidator.generate_validation_report(exercises_df, foods_df)
print(json.dumps(report, indent=2))
```

## Security & Privacy

### Data Licensing

- Always check dataset licensing before production use
- Respect Creative Commons and other licenses
- Document data sources in your application
- Current datasets use CC0 or CC-BY-SA licenses

### Data Privacy

- Kaggle datasets used are aggregated/anonymized
- No personal user data included
- Complies with GDPR and privacy regulations
- User-created food items remain private and not overwritten

### Secure Credentials

- Never commit `kaggle.json` to version control
- Use `.gitignore` to exclude credentials
- Rotate API keys periodically
- Use environment variables for production

## Next Steps

1. **Download a Sample Dataset**
   ```bash
   python -m data_import.kaggle_import
   ```

2. **Inspect Transformed Data**
   - Check `ml-service/data_import/downloads/transformed_*.csv`
   - Review data quality and coverage

3. **Run Validation**
   - Verify transformed data passes validation
   - Review validation report for issues

4. **Seed Database**
   ```bash
   python -m data_import.seed_database
   ```

5. **Verify Seeding**
   - Check Exercise and Food tables in database
   - Verify exercise recommendations work
   - Test nutrition tracking with seeded foods

6. **Retrain ML Models**
   - Use larger dataset for better accuracy
   - Improve calorie burn predictions
   - Better exercise recommendations

## Advanced Usage

### Custom Data Transformations

Extend the importer for custom datasets:

```python
class CustomImporter(KaggleDatasetImporter):
    def transform_custom_data(self, csv_path):
        df = pd.read_csv(csv_path)
        # Your custom transformation logic
        return transformed_df
```

### Scheduled Data Updates

Set up cron jobs for periodic dataset updates:

```bash
# Update data daily
0 2 * * * cd /path/to/fitness-backend && python -m data_import.kaggle_import >> /var/log/kaggle-import.log 2>&1
```

### Data Verification

Monitor data quality over time:

```python
def verify_data_integrity():
    seeder = DatabaseSeeder()
    seeder.connect()
    stats = seeder.get_seeding_stats()
    
    # Alert if data seems corrupted
    if stats['total_exercises'] < 1000:
        alert("Exercise count dropped!")
    
    seeder.disconnect()
```

## Contributing

To add new datasets:

1. Find dataset on Kaggle
2. Verify license compatibility
3. Add to `kaggle_datasets.json`
4. Create transformation method
5. Add validation rules
6. Test with sample data
7. Document in this guide

## Support & Resources

- [Kaggle API Documentation](https://github.com/Kaggle/kaggle-api)
- [Available Kaggle Fitness Datasets](https://www.kaggle.com/search?q=fitness)
- [Prisma Migration Guide](../../../prisma/README.md)
- [Database Schema](../../../prisma/schema.prisma)

## Frequently Asked Questions

**Q: Can I use multiple datasets simultaneously?**
A: Yes! The system is designed to handle multiple datasets. Configure them all in `kaggle_datasets.json`.

**Q: What if a dataset is missing columns?**
A: The transformation will use defaults. Update `kaggle_datasets.json` column mappings if needed.

**Q: How often should I update datasets?**
A: Recommended quarterly. Configure with cron jobs for automation.

**Q: Will seeding overwrite my user data?**
A: No. Kaggle data is seeded separately. User-created items remain untouched.

**Q: Can I use this in production?**
A: Yes! Ensure datasets are properly licensed and validate before seeding to production database.
