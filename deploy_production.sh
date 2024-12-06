#!/bin/bash

# Check if script is run as root
if [ "$EUID" -ne 0 ]; then
    echo "Please run this script as root (sudo ./deploy_production.sh)"
    exit 1
fi

echo "CRM Production Deployment Script"
echo "=============================="

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to install Node.js and npm
install_nodejs() {
    echo "Installing Node.js and npm..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
    
    # Verify installation
    node --version
    npm --version
}

# Function to install and configure MongoDB
install_mongodb() {
    echo "Installing MongoDB..."
    wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | apt-key add -
    echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-6.0.list
    apt-get update
    apt-get install -y mongodb-org

    # Start MongoDB
    systemctl start mongod
    systemctl enable mongod

    # Wait for MongoDB to be ready
    echo "Waiting for MongoDB to start..."
    sleep 10
}

# Function to install and configure Nginx
install_nginx() {
    echo "Installing and configuring Nginx..."
    apt-get install -y nginx

    # Create web root directory
    mkdir -p /var/www/crm/frontend
    chown -R www-data:www-data /var/www/crm
    chmod -R 755 /var/www/crm

    # Create Nginx configuration
    cat > /etc/nginx/sites-available/crm << 'EOL'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    
    root /var/www/crm/frontend;
    index index.html;

    server_name _;

    # Frontend static files
    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache, must-revalidate";
    }

    # Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:5000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;
        proxy_read_timeout 1800;
        proxy_connect_timeout 1800;
        proxy_send_timeout 1800;
        client_max_body_size 50M;
    }

    # Additional security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
}
EOL

    # Enable the site and remove default
    ln -sf /etc/nginx/sites-available/crm /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default

    # Test and restart Nginx
    nginx -t && systemctl restart nginx
}

# Function to configure production environment
configure_environment() {
    echo "Configuring production environment..."

    # Generate JWT secret
    JWT_SECRET=$(openssl rand -base64 32)

    # Create production .env file
    cat > .env << EOL
PORT=5000
MONGODB_URI=mongodb://localhost:27017/crm_db
JWT_SECRET=$JWT_SECRET
NODE_ENV=production
EOL

    # Create frontend .env file
    cat > frontend/.env << EOL
PORT=3000
REACT_APP_API_URL=/api
EOL

    echo "Environment files created."
}

# Function to build and deploy the application
deploy_application() {
    echo "Building and deploying the application..."

    # Install PM2 globally
    npm install -g pm2

    # Install backend dependencies and build
    npm install
    npm run build

    # Install frontend dependencies and build
    cd frontend
    npm install
    npm run build

    # Copy frontend build to Nginx directory
    echo "Copying frontend build to Nginx directory..."
    cp -r build/* /var/www/crm/frontend/
    chown -R www-data:www-data /var/www/crm
    chmod -R 755 /var/www/crm
    cd ..

    # Create PM2 ecosystem file
    cat > ecosystem.config.js << 'EOL'
module.exports = {
  apps: [{
    name: 'crm-backend',
    script: 'dist/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    max_memory_restart: '1G',
    error_file: 'logs/backend-err.log',
    out_file: 'logs/backend-out.log',
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss'
  }]
};
EOL

    # Create logs directory
    mkdir -p logs

    # Start backend with PM2
    pm2 delete all 2>/dev/null || true
    pm2 start ecosystem.config.js

    # Save PM2 configuration
    pm2 save

    # Setup PM2 to start on boot
    pm2 startup

    echo "Waiting for services to start..."
    sleep 10
}

# Function to configure firewall
configure_firewall() {
    echo "Configuring firewall..."

    # Install UFW if not present
    apt-get install -y ufw

    # Reset UFW
    ufw --force reset
    ufw default deny incoming
    ufw default allow outgoing

    # Allow SSH (port 22)
    ufw allow ssh

    # Allow HTTP and HTTPS
    ufw allow 80/tcp
    ufw allow 443/tcp

    # Allow MongoDB only from localhost
    ufw allow from 127.0.0.1 to any port 27017

    # Enable UFW
    ufw --force enable

    echo "Firewall configured and enabled."
}

# Function to verify deployment
verify_deployment() {
    echo "Verifying deployment..."
    
    # Check if services are running
    echo "Checking services..."
    pm2 list
    
    # Check if Nginx is running
    echo "Checking Nginx status..."
    systemctl status nginx
    
    # Check if MongoDB is running
    echo "Checking MongoDB status..."
    systemctl status mongod
    
    # Test backend API
    echo "Testing backend API..."
    curl -I http://localhost:5000/api/health
    
    # Check Nginx error logs
    echo "Checking Nginx error logs..."
    tail -n 50 /var/log/nginx/error.log
    
    # Check permissions
    echo "Checking web root permissions..."
    ls -la /var/www/crm/frontend
}

# Main deployment process
echo "This script will deploy the CRM application in production mode."
echo "Warning: This will modify system configurations."
read -p "Do you want to continue? (y/n): " continue_setup

if [[ $continue_setup =~ ^[Yy]$ ]]; then
    # Update system
    echo "Updating system packages..."
    apt-get update
    apt-get upgrade -y

    # Install required packages
    echo "Installing required packages..."
    apt-get install -y curl wget git build-essential

    # Install Node.js if not present
    if ! command_exists node; then
        install_nodejs
    fi

    # Install MongoDB if not present
    if ! command_exists mongod; then
        install_mongodb
    fi

    # Install and configure Nginx
    install_nginx

    # Configure environment
    configure_environment

    # Deploy application
    deploy_application

    # Configure firewall
    configure_firewall

    # Verify deployment
    verify_deployment

    echo "Deployment complete!"
    echo "Your CRM application should now be accessible via:"
    echo "Frontend: http://your-server-ip"
    echo "Backend API: http://your-server-ip/api"
    echo ""
    echo "Next steps:"
    echo "1. Set up SSL/HTTPS using Let's Encrypt"
    echo "2. Configure your domain name"
    echo "3. Set up regular backups"
    echo "4. Monitor the application using: pm2 monit"
    echo "5. View logs using: pm2 logs"
    echo "6. Check Nginx logs: tail -f /var/log/nginx/{access,error}.log"
else
    echo "Deployment cancelled."
    exit 0
fi 