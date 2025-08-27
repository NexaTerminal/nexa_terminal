#!/bin/bash
#   Start Command: ./start-dev.shYour App: http://localhost:3000Deploy: git push origin main


echo "🚀 Starting Nexa Development Environment..."
echo ""

# Check if required directories exist
if [ ! -d "server" ] || [ ! -d "client" ]; then
    echo "❌ Error: server or client directory not found!"
    echo "Please run this script from the project root directory."
    exit 1
fi

# Function to kill background processes on exit
cleanup() {
    echo ""
    echo "🛑 Stopping development servers..."
    kill $SERVER_PID $CLIENT_PID 2>/dev/null
    exit
}

# Set up cleanup trap
trap cleanup INT TERM

# Start server in background
echo "📡 Starting server on http://localhost:5001..."
cd server
npm run dev > ../server.log 2>&1 &
SERVER_PID=$!
cd ..

# Wait a moment for server to start
sleep 3

# Check if server started successfully
if curl -s http://localhost:5001/health > /dev/null; then
    echo "✅ Server running on http://localhost:5001"
else
    echo "❌ Server failed to start. Check server.log for details."
    kill $SERVER_PID 2>/dev/null
    exit 1
fi

# Start client in background  
echo "⚛️  Starting React app on http://localhost:3000..."
cd client
npm start > ../client.log 2>&1 &
CLIENT_PID=$!
cd ..

# Wait for client to start
echo "⏳ Waiting for React app to compile..."
sleep 10

echo ""
echo "🎉 Development environment ready!"
echo ""
echo "📱 Frontend: http://localhost:3000"
echo "🔌 Backend:  http://localhost:5001" 
echo "💾 Database: MongoDB Atlas (production DB)"
echo ""
echo "📋 Available endpoints:"
echo "   • Health check: http://localhost:5001/health"
echo "   • Employment Agreement: http://localhost:3000/terminal/documents/employment/employment-agreement"
echo "   • All Documents: http://localhost:3000/terminal/documents"
echo ""
echo "📖 View logs:"
echo "   • Server: tail -f server.log"
echo "   • Client: tail -f client.log"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Keep script running and show status
while true; do
    # Check if both processes are still running
    if ! kill -0 $SERVER_PID 2>/dev/null; then
        echo "❌ Server stopped unexpectedly"
        break
    fi
    
    if ! kill -0 $CLIENT_PID 2>/dev/null; then
        echo "❌ Client stopped unexpectedly" 
        break
    fi
    
    sleep 5
done

cleanup