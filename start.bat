@echo off
echo Setting up CRM Application...

:: Check for Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Node.js is not installed! Please install Node.js first.
    pause
    exit /b 1
)

:: Install backend dependencies
echo Installing backend dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo Failed to install backend dependencies!
    pause
    exit /b 1
)

:: Install frontend dependencies
echo Installing frontend dependencies...
cd frontend
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo Failed to install frontend dependencies!
    pause
    exit /b 1
)
cd ..

:: Check for MongoDB
echo Checking MongoDB connection...
mongod --version >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo WARNING: MongoDB is not installed or not in PATH!
    echo Please ensure MongoDB is running before proceeding.
    pause
)

:: Create .env if it doesn't exist
if not exist .env (
    echo Creating .env file...
    echo PORT=5000 > .env
    echo MONGODB_URI=mongodb://localhost:27017/crm_db >> .env
    echo JWT_SECRET=your_jwt_secret_key_here >> .env
    echo NODE_ENV=development >> .env
)

echo Environment setup complete!
echo Starting servers...

:: Start Backend Server
start cmd /k "npm run dev"

:: Start Frontend Server
start cmd /k "cd frontend && npm start"

echo Servers are starting...
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000

echo Press any key to close all servers...
pause
taskkill /F /IM node.exe