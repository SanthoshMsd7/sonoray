# 🚀 ULTSERVE ERP - STABLE STARTUP GUIDE

Use this guide to ensure your ERP is always online, stable, and accessible via the secure Cloudflare link.

---

## 🛠 ONE-CLICK START (RECOMMENDED)
The system is now managed by **PM2** (Process Manager), which prevents crashes.

1. Open **PowerShell** as Administrator.
2. Navigate to the project folder:
   ```powershell
   cd d:\location\location
   ```
3. Run the Master Launcher:
   ```powershell
   pm2 start universal-launcher.js
   ```
4. Start the Secure Tunnel:
   ```powershell
   cloudflared tunnel --url http://localhost:3000
   ```

---

## 📊 MONITORING THE SYSTEM
To see if the Backend and Frontend are running correctly:

- **Check Status**: `pm2 list`
- **View Live Logs**: `pm2 logs universal-launcher`
- **Restart System**: `pm2 restart universal-launcher`
- **Stop System**: `pm2 stop universal-launcher`

---

## 🔒 ACCESS CREDENTIALS
- **Admin Email**: `admin@admin.com`
- **Password**: `admin`

---

## ⚠️ TROUBLESHOOTING
1. **Port 3000 or 5000 is Busy**:
   If the system won't start because a port is taken, run:
   ```powershell
   Stop-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess -Force
   Stop-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess -Force
   ```
2. **500 Internal Server Error**:
   Ensure your MySQL database is running and the connection string in `.env` is correct.
3. **Tunnel Link Not Working**:
   Restart the `cloudflared` command in your terminal to generate a fresh link.

---

## 💡 KEY NOTES
- **24/7 Uptime**: The `universal-launcher.js` will automatically try to restart the backend if it crashes.
- **Multi-Admin**: You can promote any employee to Admin from the **Employees** page.
- **Field Updates**: Engineers can now post live updates that appear instantly on your dashboard.
