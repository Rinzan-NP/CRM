#!/usr/bin/env bash
echo "Starting build..."
python3 manage.py collectstatic --noinput
echo "Build complete."
