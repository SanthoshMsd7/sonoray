# Sonoray ERP - Project Status & Memory

**Project Name:** Sonoray ERP (formerly UltaServe)
**Branding:** Dark Blue & Slate Premium Theme
**Hosting:** Self-Hosted (Ubuntu Linux Server PC)
**Database:** MySQL (Local Database)

## 🚀 Recent Accomplishments
- **Medical Inventory Expansion:** Added `make`, `modelNumber`, `serialNumber`, and `technicalSpecs` to the `machine_stock` database and UI.
- **Draggable Leaflet Map Picker & Geolocation:** Integrated interactive map pickers in Add/Edit Machine modals and built silent live background GPS coordinate streaming (`BackgroundTracker.tsx`) upon employee punch-ins.
- **WebRTC Camera Capture:** Enabled direct web camera snap captures and picture uploads inside machine installation modals.
- **Admin Details Drawer Panel:** Designed a slide-over details modal on `admin/machines` displaying map pickers, custom snapshots, addresses, and instant Google Maps routing links.
- **Squeezed Sidebar & Responsive Employee Layout:** Refactored static desktop margins `ml-64` in `employee/layout.tsx` to adaptive `md:ml-64 ml-0` with horizontal overflow protection, enabling all employee pages to auto-scale perfectly to full-screen on mobile phones.
- **Admin Mobile Attendance Calendar Picker:** Fixed date-tap status options menu overlaying within the mobile calendar grid by introducing a position-relative cell container and calendar popover selections.
- **Auto-Scaling Universal Login Page:** Handled responsive padding controls, input heights, and font boundaries to auto-scale glassmorphic cards on small screen sizes.

## 🛠 Tech Stack
- **Frontend:** Next.js 14, Tailwind CSS, Lucide/React Icons.
- **Backend:** Node.js, Express, Prisma ORM.
- **Auth:** JWT-based login (Admin/Employee roles).

## 📊 Database Schema (Stock)
The `machine_stock` table includes:
- `id`: Unique ID (UUID)
- `machineName`: Name of equipment
- `make`: Brand (e.g., GE, Siemens)
- `modelNumber`: Model code
- `serialNumber`: Unique SN
- `category`: MACHINE, SPARE_PART, etc.
- `quantity`: Stock level
- `warehouseLocation`: Physical location
- `technicalSpecs`: Additional medical info

## 📝 Important Instructions for Future AI
1. **Always use Sonoray ERP** branding.
2. **Mobile First:** Ensure all new features work on phone screens (use cards instead of tables on mobile).
3. **Database URL:** Always refer to the `.env` file in the `backend` folder for MySQL connection strings.
4. **Prisma:** If new fields are added, run `npx prisma generate` in the backend folder.

---
*Created by Antigravity AI on May 17, 2026*
