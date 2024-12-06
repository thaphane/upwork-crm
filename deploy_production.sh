#!/bin/bash

# Check if script is run as root
if [ "$EUID" -ne 0 ]; then
    echo "Please run this script as root (sudo ./deploy_production.sh)"
    exit 1
fi

# Get the actual user who ran the script with sudo
ACTUAL_USER=$(logname || echo $SUDO_USER)
if [ -z "$ACTUAL_USER" ]; then
    echo "Could not determine the actual user"
    exit 1
fi

echo "Running as root, actual user is: $ACTUAL_USER"

# Function to fix permissions
fix_permissions() {
    local dir=$1
    echo "Fixing permissions for $dir"
    chown -R $ACTUAL_USER:$ACTUAL_USER "$dir"
    chmod -R 755 "$dir"
}

# Function to build the application
build_application() {
    local project_dir=$1
    echo "Building application in $project_dir"

    # Fix permissions first
    fix_permissions "$project_dir"

    # Build backend
    echo "Building backend..."
    cd "$project_dir"
    sudo -u $ACTUAL_USER npm install
    sudo -u $ACTUAL_USER npm run build

    # Build frontend
    echo "Building frontend..."
    cd "$project_dir/frontend"
    
    # Clean up any failed installations
    rm -rf node_modules build
    
    # Install frontend dependencies with legacy peer deps
    sudo -u $ACTUAL_USER npm install --legacy-peer-deps
    
    # Build frontend with CI=false to ignore warnings
    sudo -u $ACTUAL_USER bash -c 'CI=false npm run build'

    # Verify the builds
    if [ ! -d "$project_dir/dist" ]; then
        echo "Backend build failed!"
        exit 1
    fi

    if [ ! -d "$project_dir/frontend/build" ] || [ ! -f "$project_dir/frontend/build/index.html" ]; then
        echo "Frontend build failed!"
        ls -la "$project_dir/frontend"
        echo "Contents of frontend directory:"
        ls -la "$project_dir/frontend/build" || echo "build directory does not exist"
        exit 1
    fi
}

# Function to deploy the application
deploy_application() {
    local project_dir=$1
    echo "Deploying application from $project_dir"

    # Create web root directory
    mkdir -p /var/www/crm/frontend
    
    # Copy frontend build
    echo "Copying frontend files..."
    rm -rf /var/www/crm/frontend/*
    
    # Check if build directory exists and has files
    if [ ! -d "$project_dir/frontend/build" ] || [ ! "$(ls -A $project_dir/frontend/build)" ]; then
        echo "Error: Frontend build directory is empty or does not exist!"
        ls -la "$project_dir/frontend"
        exit 1
    fi
    
    cp -r "$project_dir/frontend/build/"* /var/www/crm/frontend/

    # Set proper permissions for web root
    chown -R www-data:www-data /var/www/crm
    find /var/www/crm -type d -exec chmod 755 {} \;
    find /var/www/crm -type f -exec chmod 644 {} \;

    # Verify deployment
    if [ ! -f "/var/www/crm/frontend/index.html" ]; then
        echo "Frontend deployment failed!"
        echo "Contents of /var/www/crm/frontend:"
        ls -la /var/www/crm/frontend
        exit 1
    fi

    echo "Deployment successful!"
}

# Main script
echo "CRM Application Deployment Script"
echo "================================"

# Get the project directory
PROJECT_DIR=$(dirname $(readlink -f $0))
echo "Project directory: $PROJECT_DIR"

# Build the application
build_application "$PROJECT_DIR"

# Deploy the application
deploy_application "$PROJECT_DIR"

# Install and configure Nginx
install_nginx

# Configure environment
configure_environment

# Start services
echo "Starting services..."

# Start PM2 processes
sudo -u $ACTUAL_USER pm2 delete all 2>/dev/null || true
sudo -u $ACTUAL_USER pm2 start ecosystem.config.js
sudo -u $ACTUAL_USER pm2 save
sudo -u $ACTUAL_USER pm2 startup

# Restart Nginx
systemctl restart nginx

# Verify deployment
verify_deployment

echo "Deployment complete!"
echo "Your CRM application should now be accessible via:"
echo "Frontend: http://your-server-ip"
echo "Backend API: http://your-server-ip/api" 