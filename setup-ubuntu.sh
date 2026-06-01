#!/usr/bin/env bash

# ==============================================================================
# 🚀 SONORAY ERP - Ubuntu Server Installer & Deployer
# ==============================================================================
# This script automates Stage 1 to Stage 6 for your Ubuntu Server.
# Run it with: chmod +x setup-ubuntu.sh && ./setup-ubuntu.sh
# ==============================================================================

set -e

# Visual colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "======================================================================"
echo "    ⚡ SONORAY ERP AUTOMATED UBUNTU SERVER INSTALLER & DEPLOYER ⚡"
echo "======================================================================"
echo -e "${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}❌ Please run this script with sudo:${NC}"
  echo "sudo ./setup-ubuntu.sh"
  exit 1
fi

# ==============================================================================
# 🛡️ 1. USER CONFIGURATION INPUT
# ==============================================================================
echo -e "${CYAN}--- [Step 1: Configuration Details] ---${NC}"
read -p "Enter a password for the 'sonoray_admin' MySQL database user: " DB_PASS
read -p "Enter your Cloudflare Domain (e.g., yourdomain.com): " CF_DOMAIN

if [ -z "$DB_PASS" ] || [ -z "$CF_DOMAIN" ]; then
  echo -e "${RED}❌ Password and domain cannot be empty!${NC}"
  exit 1
fi

JWT_SECRET=$(head /dev/urandom | tr -dc A-Za-z0-9 | head -c 32)
API_URL="https://api.${CF_DOMAIN}"
UI_URL="https://erp.${CF_DOMAIN}"

echo -e "\n${GREEN}✓ Configuration saved:${NC}"
echo -e "   - Database User: sonoray_admin"
echo -e "   - Database Password: $DB_PASS"
echo -e "   - Frontend Domain: $UI_URL"
echo -e "   - Backend Domain: $API_URL"
echo -e "   - Generated JWT Secret: $JWT_SECRET\n"

# ==============================================================================
# 📦 2. INSTALL SYSTEM PACKAGES
# ==============================================================================
echo -e "${CYAN}--- [Step 2: Installing Node.js, MySQL & Tools] ---${NC}"
apt update && apt upgrade -y
apt install -y curl git build-essential nginx

# Add NodeSource Node.js 20 repo
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install MySQL
apt install -y mysql-server

# Install PM2 Process Manager globally
npm install -g pm2

# ==============================================================================
# 🗄️ 3. CONFIGURE MYSQL DATABASE
# ==============================================================================
echo -e "${CYAN}--- [Step 3: Creating Database and User] ---${NC}"
systemctl enable --now mysql

# Create database and user queries
mysql -u root <<EOF
CREATE DATABASE IF NOT EXISTS sonoray_erp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'sonoray_admin'@'localhost' IDENTIFIED BY '${DB_PASS}';
ALTER USER 'sonoray_admin'@'localhost' IDENTIFIED BY '${DB_PASS}';
GRANT ALL PRIVILEGES ON sonoray_erp.* TO 'sonoray_admin'@'localhost';
FLUSH PRIVILEGES;
EOF
echo -e "${GREEN}✓ Database 'sonoray_erp' and user 'sonoray_admin' created successfully.${NC}\n"

# ==============================================================================
# ⚙️ 4. BUILD BACKEND
# ==============================================================================
echo -e "${CYAN}--- [Step 4: Building Backend Application] ---${NC}"
cd backend

# Create .env file
cat <<EOF > .env
DATABASE_URL="mysql://sonoray_admin:${DB_PASS}@localhost:3306/sonoray_erp"
PORT=5000
JWT_SECRET="${JWT_SECRET}"
ALLOWED_ORIGINS="${UI_URL},http://localhost:3000"
EOF

# Install dependencies and migrate db
npm install
npx prisma generate
npx prisma db push

# Build backend and seed demo database
npm run build
npm run seed:demo
cd ..
echo -e "${GREEN}✓ Backend successfully compiled and seeded.${NC}\n"

# ==============================================================================
# 🌐 5. BUILD FRONTEND
# ==============================================================================
echo -e "${CYAN}--- [Step 5: Building Frontend Application] ---${NC}"
cd frontend

# Create production env variables
cat <<EOF > .env.production
NEXT_PUBLIC_API_URL="${API_URL}"
EOF

# Install and build Next.js site
npm install --legacy-peer-deps
npm run build
cd ..
echo -e "${GREEN}✓ Frontend compiled successfully for production.${NC}\n"

# ==============================================================================
# 🚀 6. LAUNCH & REGISTER SERVICES WITH PM2
# ==============================================================================
echo -e "${CYAN}--- [Step 6: Registering Services with PM2] ---${NC}"

# Re-configure ecosystem.config.js variables to match user values
cat <<EOF > ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'sonoray-backend',
      cwd: './backend',
      script: 'npm',
      args: 'run start',
      shell: true,
      env: {
        DATABASE_URL: 'mysql://sonoray_admin:${DB_PASS}@localhost:3306/sonoray_erp',
        PORT: 5000,
        JWT_SECRET: '${JWT_SECRET}',
        ALLOWED_ORIGINS: '${UI_URL},http://localhost:3000'
      }
    },
    {
      name: 'sonoray-frontend',
      cwd: './frontend',
      script: 'npm',
      args: 'run start',
      shell: true,
      env: {
        PORT: 3000
      }
    }
  ]
};
EOF

pm2 start ecosystem.config.js
pm2 save

# Setup PM2 Startup script automatically
env PATH=$PATH:/usr/bin pm2 startup systemd -u root --hp /root || true

echo -e "\n${GREEN}======================================================================"
echo "    🎉 SONORAY ERP HAS BEEN SUCCESSFULLY CONFIGURED & STARTED! 🎉"
echo "======================================================================"
echo -e "${NC}"
echo -e "Backend running on port: ${YELLOW}5000${NC}"
echo -e "Frontend running on port: ${YELLOW}3000${NC}"
echo -e "Status checking command:  ${CYAN}pm2 status${NC}"
echo -e "Logs checking command:    ${CYAN}pm2 logs${NC}"
echo ""
echo -e "${BLUE}👉 Next Steps:${NC}"
echo -e "1. Run your Cloudflare Tunnel to map ${YELLOW}erp.${CF_DOMAIN}${NC} to ${YELLOW}http://localhost:3000${NC}"
echo -e "2. Map ${YELLOW}api.${CF_DOMAIN}${NC} to ${YELLOW}http://localhost:5000${NC}"
echo -e "3. Follow Stage 7 & 8 in ${CYAN}SERVER_SETUP_GUIDE.md${NC} to secure your tunnel service!"
echo ""
