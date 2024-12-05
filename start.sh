#!/bin/bash
echo "Setting up CRM Application..."

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed! Please install Node.js first."
    exit 1
fi

# Install backend dependencies
echo "Installing backend dependencies..."
npm install || {
    echo "Failed to install backend dependencies!"
    exit 1
}

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd frontend
npm install || {
    echo "Failed to install frontend dependencies!"
    exit 1
}
cd ..

# Check for MongoDB
echo "Checking MongoDB connection..."
if ! command -v mongod &> /dev/null; then
    echo "WARNING: MongoDB is not installed!"
    echo "Please ensure MongoDB is running before proceeding."
    read -p "Press Enter to continue..."
fi

# Create .env if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cat > .env << EOL
PORT=5000
MONGODB_URI=mongodb://localhost:27017/crm_db
JWT_SECRET=your_jwt_secret_key_here
NODE_ENV=development
EOL
fi

echo "Environment setup complete!"
echo "Starting servers..."

# Start Backend Server
if command -v gnome-terminal &> /dev/null; then
    gnome-terminal -- bash -c "npm run dev; exec bash" &
else
    # Fallback for macOS or other systems
    osascript -e 'tell app "Terminal" to do script "cd \"$PWD\" && npm run dev"' || {
        # Fallback for other Unix systems
        xterm -e "npm run dev" &
    }
fi

# Start Frontend Server
if command -v gnome-terminal &> /dev/null; then
    gnome-terminal -- bash -c "cd frontend && npm start; exec bash" &
else
    # Fallback for macOS or other systems
    osascript -e 'tell app "Terminal" to do script "cd \"$PWD/frontend\" && npm start"' || {
        # Fallback for other Unix systems
        xterm -e "cd frontend && npm start" &
    }
fi

echo "Servers are starting..."
echo "Backend: http://localhost:5000"
echo "Frontend: http://localhost:3000"

echo "Press Ctrl+C to stop all servers"
trap "pkill -f 'node|react-scripts'" SIGINT
wait 