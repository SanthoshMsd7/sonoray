# 🚀 SONORAY ERP - STABLE STARTUP GUIDE

Use this guide to ensure your ERP is always online, stable, and accessible via the local network or a secure Cloudflare Tunnel.

---

## 🛠 STARTING THE APPLICATION WITH PM2
The system processes are managed by **PM2** (Process Manager), which prevents crashes and keeps services alive.

### Option A: On Ubuntu Linux (Recommended Server)
1. Navigate to the project folder:
   ```bash
   cd /path/to/Uss
   ```
2. Start the services using the ecosystem configuration:
   ```bash
   pm2 start ecosystem.config.js
   ```
3. Set PM2 to launch on system boot:
   ```bash
   pm2 save
   pm2 startup
   ```

### Option B: On Windows PC
1. Open **PowerShell** as Administrator.
2. Navigate to the project folder:
   ```powershell
   cd C:\Users\santh\.gemini\antigravity-ide\scratch\Uss
   ```
3. Run the PM2 config:
   ```powershell
   pm2 start ecosystem.config.js
   ```

---

## 📊 MONITORING THE SYSTEM
To see if the Backend and Frontend are running correctly, run these commands in your terminal:

- **Check Process Status**: `pm2 status` or `pm2 list`
- **View Live Logs**: `pm2 logs` (or `pm2 logs sonoray-backend`)
- **Restart Services**: `pm2 restart all`
- **Stop Services**: `pm2 stop all`

---

## 🔒 ACCESS CREDENTIALS
- **Admin Email**: `admin@admin.com`
- **Password**: `admin`

---

## ⚠️ TROUBLESHOOTING

### 1. Port 3000 or 5000 is Busy
If a port is already in use and the server fails to start:

- **On Ubuntu Linux**:
  ```bash
  # Find process using the port
  sudo lsof -i :3000
  sudo lsof -i :5000

  # Kill the process
  sudo kill -9 <PID>
  ```
- **On Windows**:
  ```powershell
  Stop-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess -Force
  Stop-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess -Force
  ```

### 2. 500 Internal Server Error (Database Connection)
Ensure your MySQL database service is running and the connection credentials match your `.env` configuration.
- **On Ubuntu**: Check status with `sudo systemctl status mysql`.
- **On Windows**: Check your MySQL Service in `services.msc`.

### 3. Tunnel Link Not Working
If using Cloudflare Tunnel, check the tunnel status on the [Cloudflare Zero Trust Dashboard](https://one.dash.cloudflare.com/) or restart the tunnel connector service:
- **On Ubuntu**: `sudo systemctl restart cloudflared`
