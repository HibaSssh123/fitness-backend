# Kaggle Data Import Module

Python module for downloading, transforming, and seeding fitness datasets from Kaggle.

## Quick Start

```bash
# Install dependencies
pip install -r ../requirements.txt

# Download and seed datasets
python kaggle_import.py
```

## Module Structure

- **`__init__.py`**: Module initialization
- **`kaggle_import.py`**: Download and transform Kaggle datasets
- **`data_validation.py`**: Validate data quality and integrity
- **`seed_database.py`**: Populate PostgreSQL database
- **`config/kaggle_datasets.json`**: Dataset configuration and mappings
- **`downloads/`**: Directory for downloaded raw data (generated)

## Usage Examples

### 1. Download Datasets

```python
from data_import.kaggle_import import KaggleDatasetImporter

importer = KaggleDatasetImporter()

# Download dataset from Kaggle
importer.download_kaggle_dataset("niharika41298/gym-exercise-data")
```

### 2. Transform Data

```python
# Transform exercise data to match schema
df = importer.transform_gym_exercises("path/to/megaGymDataset.csv")

# Transform nutrition data
df = importer.transform_nutrition_data("path/to/food_data.csv")
```

### 3. Validate Data

```python
from data_import.data_validation import DataValidator

# Validate and get detailed report
valid, errors = DataValidator.validate_exercises(df)
if not valid:
    print("Errors:", errors)

# Generate comprehensive report
report = DataValidator.generate_validation_report(exercises_df, foods_df)
```

### 4. Seed Database

```python
from data_import.seed_database import DatabaseSeeder

seeder = DatabaseSeeder()
seeder.connect()

# Seed exercises and foods
seeder.seed_exercises("path/to/transformed_exercises.csv")
seeder.seed_foods("path/to/transformed_foods.csv")

# View stats
stats = seeder.get_seeding_stats()
print(f"Seeded {stats['total_exercises']} exercises")

seeder.disconnect()
```

## Configuration

Edit `config/kaggle_datasets.json` to customize:

- Dataset names and sources
- CSV file locations
- Column mappings for transformation
- Validation rules
- Seeding behavior

## Data Formats

### Exercise CSV

```csv
name,type,category,description,targetMuscles
Bench Press,STRENGTH,Chest,Lie flat and push weight up,Chest|Triceps
Running,CARDIO,Cardio,Run at moderate pace,Legs|Cardio
```

### Food CSV

```csv
name,calories,protein,carbs,fat,defaultServingUnit
Chicken Breast,165,31,0,3.6,GRAM
Apple,52,0.3,14,0.2,PIECE
```

## Environment Variables

```bash
# Kaggle API credentials
KAGGLE_USERNAME="your-username"
KAGGLE_KEY="your-api-key"

# Database connection
DATABASE_URL="postgresql://..."
```

## Requirements

See `../requirements.txt`:
- pandas: Data transformation
- kaggle: Kaggle API client
- psycopg2-binary: PostgreSQL connection
- python-dotenv: Environment variables

## Error Handling

All modules include comprehensive logging and error handling:

```python
import logging

# Logs are printed to stdout with timestamp and level
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
```

## Contributing

To extend with custom datasets:

1. Add transformation method in `kaggle_import.py`
2. Add validation in `data_validation.py`
3. Update configuration in `config/kaggle_datasets.json`
4. Test with sample data
5. Document changes

## Troubleshooting

| Error | Solution |
|-------|----------|
| `Kaggle API not installed` | Run `pip install kaggle` |
| `401 Unauthorized` | Check Kaggle API credentials |
| `Database connection failed` | Verify DATABASE_URL environment variable |
| `File not found` | Check CSV path and ensure download completed |
| `Validation failed` | Check data types and required columns |

## Related Files

- Full documentation: `../../KAGGLE_INTEGRATION.md`
- Database schema: `../../prisma/schema.prisma`
- Requirements: `../requirements.txt`
- Environment template: `../../.env.example`
