#!/bin/bash

echo "🛑 Killing all running development servers..."

# Kill processes on ports 3000 and 5001
lsof -ti:3000 | xargs kill -9 2>/dev/null
lsof -ti:5001 | xargs kill -9 2>/dev/null

# Kill any node processes that might be running the app
pkill -f "react-scripts start" 2>/dev/null
pkill -f "nodemon server.js" 2>/dev/null

echo "✅ All processes killed"
echo ""
echo "🚀 Starting development environment..."

# Start the start-dev.sh script
exec "./start-dev.sh"