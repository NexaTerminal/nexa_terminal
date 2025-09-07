#!/bin/bash

# ⏺ Kill Bash(Kill shell: bd7afa)
#   ⎿  Shell bd7afa killed

# ⏺ Kill Bash(Kill shell: 8b75f8)
#   ⎿  Shell 8b75f8 killed

# ⏺ Bash(kill -9 72423 72422 72392 72391 72369 71983 71981 71951 71950 71928)

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