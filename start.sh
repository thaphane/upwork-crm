#!/bin/bash
set -e  # Exit on error

# Store the root directory
ROOT_DIR=$(pwd)

echo "Setting up CRM Application..."

# Function to check if a package is installed via npm
check_npm_package() {
    if ! npm list -g "$1" > /dev/null 2>&1; then
        echo "Installing $1 globally..."
        npm install -g "$1" || {
            echo "Failed to install $1!"
            exit 1
        }
    fi
}

# Function to check if a local package is installed
check_local_package() {
    local dir=$1
    local package=$2
    
    if [ -n "$dir" ]; then
        if [ ! -d "$dir" ]; then
            echo "Directory $dir does not exist!"
            return 1
        fi
        cd "$dir" || {
            echo "Failed to change to directory: $dir"
            return 1
        }
    fi
    
    if ! npm list "$package" > /dev/null 2>&1; then
        echo "Installing $package..."
        npm install "$package" || {
            echo "Failed to install $package!"
            if [ -n "$dir" ]; then
                cd "$ROOT_DIR"
            fi
            return 1
        }
    fi
    
    if [ -n "$dir" ]; then
        cd "$ROOT_DIR"
    fi
}

# Function to safely change directory
safe_cd() {
    cd "$1" || {
        echo "Failed to change to directory: $1"
        exit 1
    }
}

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed! Please install Node.js first."
    echo "Visit https://nodejs.org to download and install Node.js"
    exit 1
fi

# Check for npm
if ! command -v npm &> /dev/null; then
    echo "npm is not installed! Please install npm first."
    exit 1
fi

# Create project structure if it doesn't exist
echo "Setting up project structure..."
if [ ! -d "frontend" ]; then
    echo "Creating frontend directory..."
    mkdir -p frontend || {
        echo "Failed to create frontend directory!"
        exit 1
    }
    safe_cd frontend
    echo "Initializing frontend project..."
    npm init -y
    safe_cd "$ROOT_DIR"
fi

# Check and install required global packages
echo "Checking for required global packages..."

# Check for typescript
check_npm_package "typescript"

# Check for nodemon
check_npm_package "nodemon"

# Check for ts-node
check_npm_package "ts-node"

# Install or update backend dependencies
echo "Checking backend dependencies..."
if [ ! -f "package.json" ]; then
    echo "Initializing backend project..."
    npm init -y
fi

if [ ! -d "node_modules" ]; then
    echo "Installing backend dependencies..."
    npm install || {
        echo "Failed to install backend dependencies!"
        exit 1
    }
else
    echo "Updating backend dependencies..."
    npm update || {
        echo "Failed to update backend dependencies!"
        exit 1
    }
fi

# Check for required backend packages
echo "Checking for required backend packages..."
check_local_package "" "typescript"
check_local_package "" "@types/node"
check_local_package "" "express"
check_local_package "" "mongoose"
check_local_package "" "cors"
check_local_package "" "dotenv"
check_local_package "" "bcryptjs"
check_local_package "" "jsonwebtoken"
check_local_package "" "qrcode"

# Install or update frontend dependencies
echo "Checking frontend dependencies..."
if [ ! -d "frontend" ]; then
    echo "Frontend directory is missing!"
    exit 1
fi

safe_cd frontend

if [ ! -f "package.json" ]; then
    echo "Initializing frontend project with Create React App..."
    npx create-react-app . --template typescript || {
        echo "Failed to create React app!"
        safe_cd "$ROOT_DIR"
        exit 1
    }
fi

if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install || {
        echo "Failed to install frontend dependencies!"
        safe_cd "$ROOT_DIR"
        exit 1
    }
else
    echo "Updating frontend dependencies..."
    npm update || {
        echo "Failed to update frontend dependencies!"
        safe_cd "$ROOT_DIR"
        exit 1
    }
fi

# Check for required frontend packages
echo "Checking for required frontend packages..."
for package in "@mui/material" "@emotion/react" "@emotion/styled" "@mui/icons-material" \
              "@tanstack/react-query" "axios" "react-router-dom" "recharts" \
              "react-beautiful-dnd" "@types/react-beautiful-dnd"; do
    echo "Installing $package..."
    npm install "$package" || {
        echo "Failed to install $package"
        safe_cd "$ROOT_DIR"
        exit 1
    }
done

safe_cd "$ROOT_DIR"

# Check for MongoDB
echo "Checking MongoDB connection..."
if ! command -v mongod &> /dev/null; then
    echo "WARNING: MongoDB is not installed!"
    echo "Please ensure MongoDB is running before proceeding."
    echo "You can install MongoDB using your package manager:"
    echo "Ubuntu/Debian: sudo apt install mongodb"
    echo "CentOS/RHEL: sudo yum install mongodb"
    echo "Or visit: https://www.mongodb.com/try/download/community"
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

# Create frontend .env if it doesn't exist
if [ ! -f frontend/.env ]; then
    echo "Creating frontend .env file..."
    cat > frontend/.env << EOL
PORT=3000
REACT_APP_API_URL=http://localhost:5000
EOL
fi

echo "Environment setup complete!"
echo "Starting servers..."

# Function to check if a port is in use
check_port() {
    if command -v lsof >/dev/null 2>&1; then
        if lsof -Pi :"$1" -sTCP:LISTEN -t &> /dev/null ; then
            echo "Port $1 is already in use. Please free up the port and try again."
            exit 1
        fi
    fi
}

# Check if ports are available
check_port 5000
check_port 3000

# Start Backend Server
if command -v gnome-terminal &> /dev/null; then
    gnome-terminal -- bash -c "npm run dev; exec bash" &
elif command -v konsole &> /dev/null; then
    konsole --new-tab -e "npm run dev" &
elif command -v xterm &> /dev/null; then
    xterm -e "npm run dev" &
else
    echo "No suitable terminal emulator found. Starting in background..."
    npm run dev &
fi

# Start Frontend Server
safe_cd frontend
if command -v gnome-terminal &> /dev/null; then
    gnome-terminal -- bash -c "PORT=3000 npm start; exec bash" &
elif command -v konsole &> /dev/null; then
    konsole --new-tab -e "PORT=3000 npm start" &
elif command -v xterm &> /dev/null; then
    xterm -e "PORT=3000 npm start" &
else
    echo "No suitable terminal emulator found. Starting in background..."
    PORT=3000 npm start &
fi
safe_cd "$ROOT_DIR"

echo "Servers are starting..."
echo "Backend: http://localhost:5000"
echo "Frontend: http://localhost:3000"

echo "Press Ctrl+C to stop all servers"
trap "pkill -f 'node|react-scripts'" SIGINT
wait 