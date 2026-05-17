#!/bin/bash

# Kaggle Data Import Helper Script
# Automates setup and seeding of Kaggle fitness datasets

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ML_SERVICE_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_ROOT="$(dirname "$ML_SERVICE_DIR")"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Kaggle Fitness Data Integration${NC}"
echo -e "${BLUE}========================================${NC}"

# Function to print colored messages
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check if Python is installed
check_python() {
    if ! command -v python3 &> /dev/null; then
        print_error "Python 3 is not installed"
        exit 1
    fi
    print_status "Python 3 found"
}

# Install dependencies
install_dependencies() {
    print_info "Installing Python dependencies..."
    cd "$ML_SERVICE_DIR"
    pip install -r requirements.txt
    print_status "Dependencies installed"
}

# Check Kaggle credentials
check_kaggle_credentials() {
    print_info "Checking Kaggle API credentials..."
    
    if [ -f ~/.kaggle/kaggle.json ]; then
        print_status "Kaggle credentials found at ~/.kaggle/kaggle.json"
        return 0
    fi
    
    if [ -n "$KAGGLE_USERNAME" ] && [ -n "$KAGGLE_KEY" ]; then
        print_status "Kaggle credentials set via environment variables"
        return 0
    fi
    
    print_error "Kaggle credentials not found"
    print_info "To set up credentials:"
    echo "  1. Go to https://www.kaggle.com/account"
    echo "  2. Scroll down to 'API' section"
    echo "  3. Click 'Create New API Token'"
    echo "  4. Save the kaggle.json file:"
    echo "     mkdir -p ~/.kaggle"
    echo "     mv ~/Downloads/kaggle.json ~/.kaggle/"
    echo "     chmod 600 ~/.kaggle/kaggle.json"
    echo ""
    echo "  OR set environment variables in .env:"
    echo "     KAGGLE_USERNAME=your-username"
    echo "     KAGGLE_KEY=your-api-key"
    return 1
}

# Check database connection
check_database() {
    print_info "Checking database connection..."
    
    if [ -z "$DATABASE_URL" ]; then
        print_error "DATABASE_URL not set"
        print_info "Add DATABASE_URL to your .env file"
        return 1
    fi
    
    # Try a simple connection test with psql if available
    if command -v psql &> /dev/null; then
        if psql "$DATABASE_URL" -c "SELECT 1" > /dev/null 2>&1; then
            print_status "Database connection successful"
            return 0
        else
            print_error "Cannot connect to database"
            return 1
        fi
    else
        print_warning "psql not installed, skipping database connection test"
        return 0
    fi
}

# Download datasets
download_datasets() {
    print_info "Downloading Kaggle datasets..."
    cd "$PROJECT_ROOT"
    python3 -m ml_service.data_import.kaggle_import
    
    if [ $? -eq 0 ]; then
        print_status "Datasets downloaded and transformed"
    else
        print_error "Failed to download/transform datasets"
        return 1
    fi
}

# Validate data
validate_data() {
    print_info "Validating transformed data..."
    
    cat > /tmp/validate.py << 'EOF'
import sys
sys.path.insert(0, '.')

from ml_service.data_import.data_validation import DataValidator
import pandas as pd
from pathlib import Path

data_dir = Path("ml-service/data_import/downloads")
exercise_files = list(data_dir.glob("transformed_exercises.csv"))
food_files = list(data_dir.glob("transformed_nutrition.csv"))

all_valid = True

if exercise_files:
    for f in exercise_files:
        df = pd.read_csv(f)
        valid, errors = DataValidator.validate_exercises(df)
        if not valid:
            all_valid = False

if food_files:
    for f in food_files:
        df = pd.read_csv(f)
        valid, errors = DataValidator.validate_foods(df)
        if not valid:
            all_valid = False

sys.exit(0 if all_valid else 1)
EOF

    python3 /tmp/validate.py
    
    if [ $? -eq 0 ]; then
        print_status "Data validation passed"
        return 0
    else
        print_error "Data validation failed"
        return 1
    fi
}

# Seed database
seed_database() {
    print_info "Seeding database..."
    cd "$PROJECT_ROOT"
    python3 -m ml_service.data_import.seed_database
    
    if [ $? -eq 0 ]; then
        print_status "Database seeding completed"
    else
        print_error "Database seeding failed"
        return 1
    fi
}

# Show database stats
show_stats() {
    print_info "Database statistics:"
    
    cat > /tmp/stats.py << 'EOF'
import os
import sys
sys.path.insert(0, '.')

from ml_service.data_import.seed_database import DatabaseSeeder

try:
    seeder = DatabaseSeeder()
    if seeder.connect():
        stats = seeder.get_seeding_stats()
        print(f"  Exercises: {stats.get('total_exercises', 0)}")
        print(f"  Exercise Categories: {stats.get('total_exercise_categories', 0)}")
        print(f"  Foods: {stats.get('total_foods', 0)}")
        seeder.disconnect()
except Exception as e:
    print(f"Error getting stats: {e}")
EOF

    python3 /tmp/stats.py
}

# Main setup flow
main() {
    case "${1:-setup}" in
        setup)
            print_info "Running full setup..."
            check_python || exit 1
            install_dependencies || exit 1
            check_kaggle_credentials || exit 1
            check_database || exit 1
            print_status "Setup complete!"
            ;;
        
        download)
            check_python || exit 1
            download_datasets || exit 1
            ;;
        
        validate)
            check_python || exit 1
            validate_data || exit 1
            ;;
        
        seed)
            check_python || exit 1
            check_database || exit 1
            seed_database || exit 1
            show_stats
            ;;
        
        full)
            print_info "Running complete setup, download, and seeding..."
            check_python || exit 1
            install_dependencies || exit 1
            check_kaggle_credentials || exit 1
            check_database || exit 1
            download_datasets || exit 1
            validate_data || exit 1
            seed_database || exit 1
            show_stats
            print_status "Complete! Kaggle data has been integrated."
            ;;
        
        stats)
            check_python || exit 1
            show_stats
            ;;
        
        *)
            echo "Usage: $0 {setup|download|validate|seed|full|stats}"
            echo ""
            echo "Commands:"
            echo "  setup    - Check prerequisites and install dependencies"
            echo "  download - Download and transform Kaggle datasets"
            echo "  validate - Validate transformed data quality"
            echo "  seed     - Seed database with validated data"
            echo "  full     - Complete workflow: setup → download → validate → seed"
            echo "  stats    - Show database statistics"
            echo ""
            echo "Examples:"
            echo "  $0 setup    # First time setup"
            echo "  $0 full     # Complete integration"
            echo "  $0 seed     # Seed database with existing data"
            exit 1
            ;;
    esac
}

# Run main
main "$@"

echo ""
echo -e "${BLUE}========================================${NC}"
print_status "Done!"
echo -e "${BLUE}========================================${NC}"
