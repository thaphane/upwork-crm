module.exports = {
  apps: [{
    name: 'crm-backend',
    script: './dist/server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5000,
      MONGODB_URI: 'mongodb://localhost:27017/crm_db',
      JWT_SECRET: 'your_jwt_secret_key_here'
    },
    env_production: {
      NODE_ENV: 'production'
    }
  }]
}; 