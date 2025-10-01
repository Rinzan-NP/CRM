#!/usr/bin/env bash
echo "Starting build..."

# Install dependencies - try uv first, then pip
if command -v uv &> /dev/null; then
    echo "Using uv to install dependencies..."
    uv pip install -r requirements.txt
elif command -v pip &> /dev/null; then
    echo "Using pip to install dependencies..."
    pip install -r requirements.txt
else
    echo "Neither uv nor pip found, trying python -m pip..."
    python -m pip install -r requirements.txt
fi

# Collect static files
python3 manage.py collectstatic --noinput

# Run migrations
python3 manage.py migrate

echo "Build complete."
