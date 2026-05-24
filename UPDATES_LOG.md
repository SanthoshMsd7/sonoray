# Sonoray ERP - Development Update Log

### 📅 Date: May 24 - 25, 2026
This log summarizes all critical updates, bug fixes, and feature integrations made today to resolve operational issues and enhance the platform across Mobile, Desktop, and Cloud channels.

---

## 🚀 1. Real-Time Forced GPS Fetch & 3-Min Auto-Updates
* **Feature Description**: Admin can now force an immediate GPS lock from active employees, and schedule auto-pulls.
* **Mechanism**:
  1. **Click Trigger**: Clicking an employee's name in `/admin/tracking` sends a real-time `requestLocationRefresh` WebSocket message.
  2. **Device Push**: Backend routes this directly to that employee's specific socket room (`user_${employeeId}`).
  3. **High-Accuracy Capture**: The employee's phone immediately forces a fresh, high-accuracy GPS capture with their exact local time **"now"** and logs it back.
  4. **Auto-Polling**: The admin dashboard schedules a 3-minute background timer to keep pulling coordinates as long as that employee remains clicked, automatically disabling once deselected.

---

## 📍 2. Client-Side Geocoding (No More Stuck "Locating...")
* **Issue Resolved**: Free server-side reverse geocoding limits and cloud hosting IP bans on OSM (OpenStreetMap) were writing `null` to the database, causing markers and logs to display **"Locating..."** indefinitely.
* **Solutions Implemented**:
  1. **Backend Coordinate Fallback**: If server-side reverse geocoding is rate-limited, the system stores `Coordinates: LAT, LNG` in the database instead of `null` so location updates are never missed.
  2. **Client-Side Geocoding**: Admin web browsers and desktop apps (running on standard local connection IPs) bypass all server-side limits. The admin dashboard now silently translates coordinates to clean street/landmark names in the background and renders them instantly.

---

## 🛠️ 3. Full Employee Profile Editing (Admin Panel)
* **Issue Resolved**: Administrators had no way to edit employee files (First Name, Last Name, Phone, and Designation) after creation.
* **Solutions Implemented**:
  1. **Dual-Purpose Form**: Upgraded `AddEmployeeModal.tsx` to handle both **Add** and **Edit** modes. In edit mode, the email is read-only, password input is hidden, and fields pre-populate automatically.
  2. **Action UI Grid**: Placed an **Edit Profile** button (amber pencil icon) directly on each card next to the Delete button inside `/admin/employees` for easy, unified access.
  3. **Server Sync**: Integrated it directly with the backend's `PUT /api/employees/:id` endpoint.

---

## 💻 4. Bulletproof Windows Desktop App (`SonorayERP.exe`)
* **Issue Resolved**: The desktop app stayed stuck on `loading.html` due to a Node.js v17+ localhost DNS resolution bug, resolving to IPv6 `::1` while Next.js listened on IPv4 `127.0.0.1`.
* **Solutions Implemented**:
  1. **Chrome Network Stack**: Migrated the server connection test to Chromium's native browser `fetch` engine inside `loading.html`, which handles IPv6/IPv4 DNS resolving seamlessly.
  2. **Live Server Configurator**: Added a premium, glassmorphic configurator to `loading.html` allowing the admin to easily input a Cloudflare Tunnel or remote Render URL. Connects, tests, and remembers the URL in `localStorage` for automatic cloud-booting next launch!

---

## 🌍 5. Live Tracking Timezone Stability Fix
* **Issue Resolved**: The live map queried active duty personnel by checking an exact server UTC date constraint (`date: today`). Timezone offsets (e.g. IST, UTC+5:30) shifted employee dates, causing on-duty employees to disappear from the live map.
* **Solution Implemented**: Removed strict date constraint filters from live trackers. The dashboard now checks if an employee has *any* active attendance log with a `null` punch-out time, which is **100% timezone-independent** and reliable 24/7!

---

### 💾 Git Repository Sync:
* **Target Repository**: `https://github.com/yugi252179/project_company_demo.git`
* **Target Branch**: `main`
* **Local Executable Path**: `frontend/dist/SonorayERP-win32-x64/SonorayERP.exe`
