#!/bin/bash

# Azure App Service Startup Script
# This script ensures proper initialization of the Node.js application

echo "🚀 Starting What's in the Fridge Backend..."

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm install --production
fi

# Start the application
echo "🎬 Starting server..."
node server.js
