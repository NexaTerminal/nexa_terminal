#!/bin/bash
# Nexa Terminal Development Server Manager
# Usage: ./restart.sh [start|stop|restart]

# Function to kill all development servers
stop_servers() {
    echo "🛑 Stopping all development servers..."

    # Kill processes on ports 3000, 5001, and 5002
    lsof -ti:3000 | xargs kill -9 2>/dev/null
    lsof -ti:5001 | xargs kill -9 2>/dev/null
    lsof -ti:5002 | xargs kill -9 2>/dev/null

    # Kill any node processes that might be running the app
    pkill -f "react-scripts start" 2>/dev/null
    pkill -f "nodemon server.js" 2>/dev/null

    echo "✅ All processes stopped"
}

# Function to start development servers
start_servers() {
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

    # Start server in background (use nodemon directly to avoid npm startup overhead)
    echo "📡 Starting server on http://localhost:5002..."
    cd server
    NODE_ENV=development ./node_modules/.bin/nodemon server.js > ../server.log 2>&1 &
    SERVER_PID=$!
    cd ..

    # Poll health endpoint until server responds (up to 60 seconds)
    TIMEOUT=60
    ELAPSED=0
    SERVER_STARTED=0
    while [ $ELAPSED -lt $TIMEOUT ]; do
        if curl -s http://127.0.0.1:5002/health > /dev/null 2>&1; then
            SERVER_STARTED=1
            break
        fi
        sleep 1
        ELAPSED=$((ELAPSED + 1))
    done

    # Check if server started successfully
    if [ $SERVER_STARTED -eq 1 ]; then
        echo "✅ Server running on http://localhost:5002"
    else
        echo "❌ Server failed to start after ${TIMEOUT}s. Check server.log for details."
        kill $SERVER_PID 2>/dev/null
        exit 1
    fi

    # Start client in background
    # PORT and BROWSER=none prevent interactive prompts that crash in non-TTY environments
    echo "⚛️  Starting React app on http://localhost:3000..."
    cd client
    PORT=3000 BROWSER=none npm start > ../client.log 2>&1 &
    CLIENT_PID=$!
    cd ..

    # Wait for client to start
    echo "⏳ Waiting for React app to compile..."
    sleep 10

    echo ""
    echo "🎉 Development environment ready!"
    echo ""
    echo "📱 Frontend: http://localhost:3000"
    echo "🔌 Backend:  http://localhost:5002"
    echo "💾 Database: MongoDB Atlas (production DB)"
    echo ""
    echo "📋 Available endpoints:"
    echo "   • Health check: http://localhost:5002/health"
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
}

# Main script logic
case "$1" in
    "start")
        start_servers
        ;;
    "stop")
        stop_servers
        ;;
    "restart"|"")
        stop_servers
        echo ""
        start_servers
        ;;
    *)
        echo "Usage: $0 [start|stop|restart]"
        echo ""
        echo "Commands:"
        echo "  start   - Start development servers"
        echo "  stop    - Stop all development servers"
        echo "  restart - Stop and start development servers (default)"
        exit 1
        ;;
esac