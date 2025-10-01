#!/bin/bash

# Vercel build script for Django
echo "Starting Vercel build..."

# Install dependencies using uv (Vercel's package manager)
echo "Installing dependencies..."
if [ -f "requirements-vercel.txt" ]; then
    uv pip install -r requirements-vercel.txt
else
    uv pip install -r requirements.txt
fi

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput

# Run migrations
echo "Running migrations..."
python manage.py migrate

echo "Build completed successfully"
