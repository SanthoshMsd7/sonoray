# 🚀 Server Setup Guide: Host Your ERP Anywhere

This guide will help you turn your second laptop into a powerful server for the UltaServe ERP system.

---

## 🛠 Step 1: Prepare the "Server" Laptop
On your second laptop, you need to install the following software:
1.  **Node.js**: [Download here](https://nodejs.org/) (Use the LTS version).
2.  **MySQL**: [Download here](https://dev.mysql.com/downloads/installer/) (Community Server).
3.  **Git**: [Download here](https://git-scm.com/) (Optional, but best for moving code).

### Copy the Code
Transfer the project folder to the second laptop via a USB drive or by cloning your Git repository.

---

## 🏗 Step 2: Configure the Backend
1.  Open a terminal in the `backend` folder.
2.  Run `npm install`.
3.  Ensure MySQL is running and your `.env` file has the correct database password.
4.  Run `npx prisma db push` to set up the database.
5.  Start the backend: `npm run dev`.
    > [!TIP]
    > For production, use `npm install -g pm2` and then `pm2 start src/index.ts --name erp-backend`. This keeps the server running even if the window closes.

---

## 🌐 Step 3: Make it PUBLIC (Recommended)
To access your website from the internet (outside your home), use **Cloudflare Tunnels**. It's free, secure, and doesn't require router settings.

1.  **Create a Cloudflare Account**: [Sign up here](https://dash.cloudflare.com/sign-up).
2.  **Download Cloudflared**: [Download here](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/).
3.  **Create a Tunnel**:
    - Follow the [Cloudflare Dashboard guide](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/tunnel-guide/remote/) to create a tunnel.
    - Point your **Backend** tunnel (e.g., `api-erp.yourname.com`) to `http://localhost:5000`.
    - Point your **Frontend** tunnel (e.g., `erp.yourname.com`) to `http://localhost:3000`.

### Alternate Option: ngrok (Faster for quick tests)
1.  Download [ngrok](https://ngrok.com/).
2.  Open two terminals:
    - Terminal 1: `ngrok http 5000` (This is your Backend URL).
    - Terminal 2: `ngrok http 3000` (This is your Frontend URL).
3.  Copy the URL ngrok gives you for the backend (e.g., `https://random-id.ngrok.app`).

---

## ⚙️ Step 4: Configure the Frontend
Now you must tell the frontend where the backend is located.

1.  Go to the `frontend` folder on the server laptop.
2.  Open `.env.local`.
3.  Change the `NEXT_PUBLIC_API_URL` to your **Public Backend URL**:
    ```env
    # Example for Cloudflare
    NEXT_PUBLIC_API_URL=https://api-erp.yourname.com
    
    # OR Example for ngrok
    NEXT_PUBLIC_API_URL=https://random-id.ngrok.app
    ```
4.  Run `npm install`.
5.  Run `npm run build` (This optimizes the site for public use).
6.  Run `npm start`.

---

## ✅ Step 5: Test it Out!
1.  Open your phone's browser (disconnect from Wi-Fi and use Mobile Data).
2.  Go to your public frontend URL (e.g., `https://erp.yourname.com`).
3.  Login and try tracking. **It should work from anywhere in the world!**

---

## 🛡 Security Best Practices
- **Change Admin Password**: Immediately change the default `admin/admin` password.
- **Firewall**: Ensure your laptop's firewall is not blocking Node.js.
- **Stay Plugged In**: Servers need to be plugged into power and set to "Never Sleep".
