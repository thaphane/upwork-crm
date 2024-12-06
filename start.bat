@echo off
echo Setting up CRM Application...

REM Check for Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Node.js is not installed! Please install Node.js first.
    exit /b 1
)

REM Check for npm
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo npm is not installed! Please install npm first.
    exit /b 1
)

REM Check and install required global packages
echo Checking for required global packages...

REM Check for typescript
call npx tsc --version >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Installing TypeScript globally...
    call npm install -g typescript
)

REM Check for nodemon
call nodemon --version >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Installing nodemon globally...
    call npm install -g nodemon
)

REM Check for ts-node
call ts-node --version >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Installing ts-node globally...
    call npm install -g ts-node
)

REM Install or update backend dependencies
echo Checking backend dependencies...
if not exist node_modules (
    echo Installing backend dependencies...
    call npm install
) else (
    echo Updating backend dependencies...
    call npm update
)
if %ERRORLEVEL% NEQ 0 (
    echo Failed to install/update backend dependencies!
    exit /b 1
)

REM Install or update frontend dependencies
echo Checking frontend dependencies...
cd frontend
if not exist node_modules (
    echo Installing frontend dependencies...
    call npm install
) else (
    echo Updating frontend dependencies...
    call npm update
)
if %ERRORLEVEL% NEQ 0 (
    echo Failed to install/update frontend dependencies!
    exit /b 1
)
cd ..

REM Check for MongoDB
echo Checking MongoDB connection...
where mongod >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo WARNING: MongoDB is not installed!
    echo Please ensure MongoDB is running before proceeding.
    echo You can download MongoDB from: https://www.mongodb.com/try/download/community
    pause
)

REM Check for required backend packages
echo Checking for required backend packages...
call npm list typescript || call npm install typescript
call npm list @types/node || call npm install @types/node
call npm list express || call npm install express
call npm list mongoose || call npm install mongoose
call npm list cors || call npm install cors
call npm list dotenv || call npm install dotenv
call npm list bcryptjs || call npm install bcryptjs
call npm list jsonwebtoken || call npm install jsonwebtoken
call npm list qrcode || call npm install qrcode

REM Check for required frontend packages
echo Checking for required frontend packages...
cd frontend
call npm list @mui/material || call npm install @mui/material @emotion/react @emotion/styled
call npm list @mui/icons-material || call npm install @mui/icons-material
call npm list @tanstack/react-query || call npm install @tanstack/react-query
call npm list axios || call npm install axios
call npm list react-router-dom || call npm install react-router-dom
call npm list recharts || call npm install recharts
call npm list react-beautiful-dnd || call npm install react-beautiful-dnd
call npm list @types/react-beautiful-dnd || call npm install @types/react-beautiful-dnd
cd ..

REM Create .env if it doesn't exist
if not exist .env (
    echo Creating .env file...
    (
        echo PORT=5000
        echo MONGODB_URI=mongodb://localhost:27017/crm_db
        echo JWT_SECRET=your_jwt_secret_key_here
        echo NODE_ENV=development
    ) > .env
)

REM Create frontend .env if it doesn't exist
if not exist frontend\.env (
    echo Creating frontend .env file...
    (
        echo PORT=3000
        echo REACT_APP_API_URL=http://localhost:5000
    ) > frontend\.env
)

echo Environment setup complete!
echo Starting servers...

REM Start Backend Server
start "Backend Server" cmd /k "npm run dev"

REM Start Frontend Server
cd frontend
start "Frontend Server" cmd /k "set PORT=3000 && npm start"
cd ..

echo Servers are starting...
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000

echo Press Ctrl+C in the respective windows to stop the servers
pause