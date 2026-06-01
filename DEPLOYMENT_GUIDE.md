# 📱 Handbook: Self-Hosting Sonoray ERP & Downloading the APK

This guide explains how to host your backend server and database locally on an **Ubuntu Linux PC**, make it accessible, and build the custom Android APK using **GitHub Actions**.

---

## 🛠️ Step 1: Set Up the Ubuntu Server (PC)
For hosting the server, database, and web panel, we target your local Ubuntu Linux machine.
- Refer to **[SERVER_SETUP_GUIDE.md](file:///C:/Users/santh/.gemini/antigravity-ide/scratch/Uss/SERVER_SETUP_GUIDE.md)** for a complete step-by-step walkthrough on installing Node.js, MySQL, PM2, and Nginx.
- Follow the instructions there to initialize the MySQL database and launch the frontend/backend services.

---

## 🌐 Step 2: Set Your Domain or Local IP Address
Once the server is running, note down the IP address of your Ubuntu machine (e.g., `192.168.1.100`) or configure a **Cloudflare Tunnel** (e.g., `https://your-domain.com`) to make it publicly accessible.

1. **Frontend URL**: This is the address where the admin/employee web panel is hosted (e.g., `http://192.168.1.100:3000` or `https://your-domain.com`).
2. **Backend API URL**: This is the address of the Express API (e.g., `http://192.168.1.100:5000` or `https://api.your-domain.com`).

---

## 📱 Step 3: Configure and Build the Android APK

We have set up an automated build script! To generate your APK:

1. **Update the App URL in Code**:
   - Open **[MainActivity.java](file:///C:/Users/santh/.gemini/antigravity-ide/scratch/Uss/mobile-app/app/src/main/java/com/sonoray/erp/MainActivity.java#L48)**.
   - Set the `APP_URL` variable to your public domain or your local server's IP address (e.g., `http://192.168.1.100:3000/` or `https://your-domain.com/`).
2. **Push updates to GitHub**:
   - Commit and push your code updates to your GitHub repository:
     ```bash
     git add .
     git commit -m "Configure production Ubuntu Server URL"
     git push origin main
     ```
3. **Download the APK File**:
   - Go to your repository on **GitHub.com**.
   - Click the **Actions** tab at the top.
   - Select the workflow named **"📱 Build Sonoray ERP APK"**.
   - Let it compile (takes about 1.5 to 2 minutes). Once completed (green checkmark), click on the run.
   - Scroll down to the **Artifacts** section at the bottom.
   - Click **Sonoray-ERP-Android-App** to download your custom compiled APK file!

---

## 📱 Step 4: Install on your Phone

1. Transfer the downloaded `.apk` file to your Android phone (via USB, Google Drive, email, or direct download).
2. Tap the `.apk` file on your phone to install it.
   - *Note: Android will show a "Blocked by Play Protect" warning because it's a self-compiled developer app. Tap **"Install Anyway"** to proceed.*
3. Open the app! Log in with your admin/employee credentials.
4. When prompted, grant **Location** and **Camera** permissions.
5. You are fully operational! Location tracking, chat, attendance, and camera photo uploads will communicate directly with your self-hosted PC server!
