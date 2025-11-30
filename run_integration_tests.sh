#!/bin/bash

# Integration test runner for DeckBot
# These tests make real API calls and are NOT part of the normal test suite

echo "=================================="
echo "DeckBot Integration Tests"
echo "=================================="
echo ""
echo "REQUIREMENTS:"
echo "  - GOOGLE_API_KEY environment variable must be set"
echo "  - Internet connection required"
echo "  - May consume API quota"
echo ""

# Load .env file if it exists
if [ -f .env ]; then
    echo "Loading .env file..."
    export $(cat .env | grep -v '^#' | xargs)
fi

# Check for API key
if [ -z "$GOOGLE_API_KEY" ]; then
    echo "ERROR: GOOGLE_API_KEY not set"
    echo "Set it with: export GOOGLE_API_KEY=your_key_here"
    echo "Or add it to a .env file in the project root"
    exit 1
fi

echo "API Key found: ${GOOGLE_API_KEY:0:10}..."
echo ""
echo "Running integration tests..."
echo ""

# Run only integration tests with full output
behave \
    --tags=integration \
    --no-capture \
    --format=pretty \
    features/image_generation_integration.feature

echo ""
echo "=================================="
echo "Integration Tests Complete"
echo "=================================="

