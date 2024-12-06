#!/bin/bash

# Check if script is run as root
if [ "$EUID" -ne 0 ]; then
    echo "Please run this script as root (sudo ./configure_network.sh)"
    exit 1
fi

echo "CRM Application Firewall Configuration Script"
echo "==========================================="

# Function to backup existing UFW rules
backup_ufw_rules() {
    local timestamp=$(date +%Y%m%d_%H%M%S)
    if [ -f "/etc/ufw/user.rules" ]; then
        cp /etc/ufw/user.rules "/etc/ufw/user.rules.backup_$timestamp"
        echo "Backed up UFW rules to /etc/ufw/user.rules.backup_$timestamp"
    fi
}

# Function to configure firewall
configure_firewall() {
    echo "Configuring firewall for CRM application..."

    # Check if UFW is installed
    if ! command -v ufw &> /dev/null; then
        echo "Installing UFW (Uncomplicated Firewall)..."
        apt-get update
        apt-get install -y ufw || {
            echo "Failed to install UFW"
            exit 1
        }
    fi

    # Backup existing rules
    backup_ufw_rules

    # Reset UFW to default settings
    echo "Resetting UFW to default settings..."
    ufw --force reset

    # Set default policies
    echo "Setting default policies..."
    ufw default deny incoming
    ufw default allow outgoing

    # Allow SSH (port 22) to prevent lockout
    echo "Allowing SSH access (port 22)..."
    ufw allow 22/tcp

    # Configure application ports
    echo "Configuring application ports..."

    # Frontend port
    read -p "Allow frontend port 3000? (y/n): " allow_frontend
    if [[ $allow_frontend =~ ^[Yy]$ ]]; then
        ufw allow 3000/tcp
        echo "Frontend port 3000 allowed"
    fi

    # Backend port
    read -p "Allow backend port 5000? (y/n): " allow_backend
    if [[ $allow_backend =~ ^[Yy]$ ]]; then
        ufw allow 5000/tcp
        echo "Backend port 5000 allowed"
    fi

    # HTTP/HTTPS
    read -p "Allow HTTP/HTTPS (ports 80/443)? (y/n): " allow_web
    if [[ $allow_web =~ ^[Yy]$ ]]; then
        ufw allow 80/tcp
        ufw allow 443/tcp
        echo "HTTP/HTTPS ports allowed"
    fi

    # MongoDB
    read -p "Allow MongoDB access from localhost only? (y/n): " allow_mongo
    if [[ $allow_mongo =~ ^[Yy]$ ]]; then
        ufw allow from 127.0.0.1 to any port 27017
        echo "MongoDB access allowed from localhost only"
    fi

    # Custom port
    read -p "Would you like to allow any additional ports? (y/n): " allow_custom
    if [[ $allow_custom =~ ^[Yy]$ ]]; then
        while true; do
            read -p "Enter port number (or 'done' to finish): " custom_port
            if [[ $custom_port == "done" ]]; then
                break
            fi
            if [[ $custom_port =~ ^[0-9]+$ ]] && [ $custom_port -ge 1 ] && [ $custom_port -le 65535 ]; then
                read -p "Allow TCP, UDP, or both? (tcp/udp/both): " protocol
                case $protocol in
                    tcp)
                        ufw allow $custom_port/tcp
                        echo "Port $custom_port/tcp allowed"
                        ;;
                    udp)
                        ufw allow $custom_port/udp
                        echo "Port $custom_port/udp allowed"
                        ;;
                    both)
                        ufw allow $custom_port
                        echo "Port $custom_port (TCP & UDP) allowed"
                        ;;
                    *)
                        echo "Invalid protocol. Skipping port $custom_port"
                        ;;
                esac
            else
                echo "Invalid port number. Please enter a number between 1 and 65535"
            fi
        done
    fi

    # Enable UFW
    echo "Enabling UFW..."
    ufw --force enable

    # Display status
    echo "Current firewall status:"
    ufw status verbose

    echo "Firewall configuration complete!"
}

# Main script
echo "This script will configure the firewall for your CRM application."
echo "Warning: This will reset any existing firewall rules."
read -p "Do you want to continue? (y/n): " continue_setup

if [[ $continue_setup =~ ^[Yy]$ ]]; then
    configure_firewall
else
    echo "Firewall configuration cancelled."
    exit 0
fi

# Test connectivity
echo "Testing connectivity..."
if ping -c 3 8.8.8.8 &> /dev/null; then
    echo "Network connectivity test successful"
else
    echo "Warning: Network connectivity test failed"
    echo "Please check your firewall configuration"
fi

echo "To disable the firewall, run: sudo ufw disable"
echo "To view current rules, run: sudo ufw status verbose"
echo "To delete a rule, run: sudo ufw delete allow <port>" 