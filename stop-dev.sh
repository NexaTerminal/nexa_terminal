#!/bin/bash

echo "🛑 Stopping Nexa Development Environment..."

# Kill processes using the ports
echo "📡 Stopping server (port 5001)..."
pkill -f "nodemon server.js" 2>/dev/null
lsof -ti:5001 | xargs kill -9 2>/dev/null

echo "⚛️  Stopping React app (port 3000)..."
pkill -f "react-scripts start" 2>/dev/null  
lsof -ti:3000 | xargs kill -9 2>/dev/null

# Clean up log files
rm -f server.log client.log 2>/dev/null

echo "✅ All development servers stopped!"
echo ""