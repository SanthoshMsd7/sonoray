# Sonoray ERP - Project Status & Memory

**Project Name:** Sonoray ERP (formerly UltaServe)
**Branding:** Dark Blue & Slate Premium Theme
**Hosting:** Render (Frontend & Backend)
**Database:** PostgreSQL (Render Managed)

## 🚀 Recent Accomplishments
- **Medical Inventory Expansion:** Added `make`, `modelNumber`, `serialNumber`, and `technicalSpecs` to the `machine_stock` database and UI.
- **Mobile Optimization:** Implemented a responsive sidebar (hamburger menu) and converted the inventory table into **Mobile Cards** for easy viewing on phones.
- **Data Features:** Added **CSV Export** for inventory and a **Smart Fill** logic in the backend to auto-populate missing medical brands and serial numbers.
- **TablePlus Ready:** Database is configured for easy management via TablePlus.

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
3. **Database URL:** Always refer to the `.env` file in the `backend` folder for Render connection strings.
4. **Prisma:** If new fields are added, run `npx prisma generate` in the backend folder.

---
*Created by Antigravity AI on May 16, 2026*
