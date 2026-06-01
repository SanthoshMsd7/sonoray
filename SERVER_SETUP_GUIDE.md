# 🖥️ Ubuntu Linux Server Deployment Guide (Self-Hosted PC)

This guide walks you through configuring, building, and running **Sonoray ERP** (Next.js frontend, Express/Node.js backend, and MySQL database) on a local PC running **Ubuntu Linux** (Desktop or Server edition).

---

## 🏗️ Deployment Architecture

```mermaid
graph TD
    subgraph LAN [Local Area Network]
        client[Devices on Wi-Fi/LAN]
        proxy[Nginx Reverse Proxy: Port 80/443]
    end

    subgraph PC [Your Ubuntu PC Server]
        frontend[Next.js App: Port 3000]
        backend[Express API: Port 5000]
        db[(MySQL Database: Port 3306)]
    end

    subgraph Cloudflare [Optional Public Access]
        tunnel[Cloudflare Tunnel]
    end

    client -->|HTTP Request| proxy
    proxy -->|Proxy Pass /| frontend
    proxy -->|Proxy Pass /api| backend
    frontend -->|Query API| backend
    backend -->|Query DB| db
    tunnel -->|Bypass Firewalls| proxy
```

---

## 🛠️ Step 1: Install System Dependencies

On your Ubuntu Server, run the following commands to install Node.js, MySQL, Nginx, and Git:

```bash
# Update package index
sudo apt update && sudo apt upgrade -y

# Install Git & curl
sudo apt install git curl build-essential -y

# Install Node.js LTS (v20) via NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install MySQL Server
sudo apt install mysql-server -y

# Install Nginx
sudo apt install nginx -y

# Verify Installations
node -v
npm -v
mysql --version
nginx -v
```

---

## 🗄️ Step 2: Configure the MySQL Database

1. Start and enable the MySQL service:
   ```bash
   sudo systemctl enable --now mysql
   ```
2. Run the secure installation script:
   ```bash
   sudo mysql_secure_installation
   ```
3. Log into MySQL as root:
   ```bash
   sudo mysql
   ```
4. Run the following queries to create the database and a dedicated user:
   ```sql
   -- Create the database
   CREATE DATABASE sonoray_erp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

   -- Create user and grant privileges
   CREATE USER 'sonoray_admin'@'localhost' IDENTIFIED BY 'YourSecurePassword123!';
   GRANT ALL PRIVILEGES ON sonoray_erp.* TO 'sonoray_admin'@'localhost';
   FLUSH PRIVILEGES;
   EXIT;
   ```

---

## ⚙️ Step 3: Configure and Build the Backend

1. Navigate to the project root directory on the server.
2. Create and configure the backend environment file:
   ```bash
   cd backend
   nano .env
   ```
3. Add the following environment variables (make sure to replace the database credentials and set a custom JWT secret):
   ```env
   # Database connection string for MySQL
   DATABASE_URL="mysql://sonoray_admin:YourSecurePassword123!@localhost:3306/sonoray_erp"

   # Server Port
   PORT=5000

   # JWT secret for token authentication
   JWT_SECRET="generate-some-random-long-secret-key-string"

   # Allowed origins (Comma-separated URLs allowed to call the API)
   # Update with your Nginx domain or server IP
   ALLOWED_ORIGINS="http://192.168.1.100:3000,http://localhost:3000"
   ```
4. Install backend dependencies and generate Prisma client:
   ```bash
   npm install
   npx prisma generate
   ```
5. Apply database schema and seed initial data:
   ```bash
   # Push schema to the MySQL database
   npx prisma db push

   # Seed initial admin account
   npm run seed:demo
   ```

---

## 🌐 Step 4: Configure and Build the Frontend

1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Create a production environment configuration file:
   ```bash
   nano .env.production
   ```
3. Point the API URL to your backend (replace `192.168.1.100` with your server's actual local LAN IP or custom domain):
   ```env
   NEXT_PUBLIC_API_URL=http://192.168.1.100:5000
   ```
4. Install frontend dependencies:
   ```bash
   npm install
   ```
5. Compile the Next.js application for production:
   ```bash
   npm run build
   ```

---

## 🚀 Step 5: Keep Apps Running 24/7 with PM2

PM2 is a production process manager that keeps Node.js applications alive forever and restarts them on crash or server reboot.

1. Install PM2 globally:
   ```bash
   sudo npm install -g pm2
   ```
2. In the project root directory, check [ecosystem.config.js](file:///C:/Users/santh/.gemini/antigravity-ide/scratch/Uss/ecosystem.config.js) and make sure it has the correct names. Here is a production-ready configuration:
   ```javascript
   module.exports = {
     apps: [
       {
         name: 'sonoray-backend',
         cwd: './backend',
         script: 'dist/index.js',  // Runs the compiled JS backend
         env: {
           DATABASE_URL: 'mysql://sonoray_admin:YourSecurePassword123!@localhost:3306/sonoray_erp',
           PORT: 5000,
           JWT_SECRET: 'generate-some-random-long-secret-key-string',
           ALLOWED_ORIGINS: 'http://192.168.1.100:3000,http://localhost:3000'
         }
       },
       {
         name: 'sonoray-frontend',
         cwd: './frontend',
         script: 'node_modules/next/dist/bin/next',
         args: 'start -p 3000',
         env: {
           PORT: 3000
         }
       }
     ]
   };
   ```
3. Start the services:
   ```bash
   pm2 start ecosystem.config.js
   ```
4. Save the PM2 list and configure it to boot automatically on server restart:
   ```bash
   pm2 save
   pm2 startup
   ```
   *(Copy and paste the command generated by `pm2 startup` to complete systemd setup).*

---

## 🔒 Step 6: Setup Nginx Reverse Proxy (Optional)

Configure Nginx to serve the frontend on port 80 (standard HTTP) and optionally handle domain name configuration.

1. Create a new Nginx configuration file:
   ```bash
   sudo nano /etc/nginx/sites-available/sonoray-erp
   ```
2. Add the following config block:
   ```nginx
   server {
       listen 80;
       server_name sonoray-erp.local 192.168.1.100; # Replace with server IP or domain

       # Frontend Proxy
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }

       # Backend Proxy
       location /api/ {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```
3. Enable the site and restart Nginx:
   ```bash
   sudo ln -s /etc/nginx/sites-available/sonoray-erp /etc/nginx/sites-enabled/
   sudo rm /etc/nginx/sites-enabled/default
   sudo nginx -t
   sudo systemctl restart nginx
   ```

---

## ☁️ Step 7: Make It Public with Cloudflare Tunnels (Zero Router Config)

Cloudflare Tunnels let you safely expose your local server to the internet without configuring port forwarding on your router.

1. Sign up on [Cloudflare](https://dash.cloudflare.com) and add your custom domain.
2. Go to **Zero Trust** -> **Networks** -> **Tunnels** -> **Create a Tunnel**.
3. Select **cloudflared** and follow the instructions to install the connector on your Ubuntu server.
4. Route your domains:
   - Route `yourdomain.com` (Frontend) to `http://localhost:3000`.
   - Route `api.yourdomain.com` (Backend) to `http://localhost:5000`.
5. Update your `ALLOWED_ORIGINS` in `ecosystem.config.js` and `NEXT_PUBLIC_API_URL` in `.env.production` to use the Cloudflare domain names, then rebuild the frontend (`npm run build`) and restart PM2.
