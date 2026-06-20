# StagingOps Portal — TODO

## Phase 1: Design System & Schema
- [x] Configure dark navy/blue theme in index.css (--bg: #07111f, --blue: #39a7ff, --green: #6ee7b7)
- [x] Add Inter font via Google Fonts CDN in index.html
- [x] Extend user roles enum: admin, staff, customer_admin, customer_viewer
- [x] Create clients table (company info, billing, status)
- [x] Create packages table (tier, limits, pricing)
- [x] Create expected_deliveries table
- [x] Create receiving_logs table
- [x] Create pallets table
- [x] Create boxes table
- [x] Create devices table
- [x] Create staging_tasks table
- [x] Create outbound_shipments table
- [x] Create shipment_items table
- [x] Create invoices table
- [x] Create invoice_line_items table
- [x] Create activity_logs table
- [x] Create photos table (polymorphic: delivery, pallet, box, device, staging, shipment)
- [x] Run schema migration and apply SQL
- [x] Fix package tier enum (Basic/Standard/Professional/Enterprise/Custom)

## Phase 2: Backend — DB Helpers & tRPC Routers
- [x] DB helpers: clients CRUD
- [x] DB helpers: packages CRUD
- [x] DB helpers: expected deliveries CRUD
- [x] DB helpers: receiving logs CRUD
- [x] DB helpers: pallets CRUD
- [x] DB helpers: boxes CRUD
- [x] DB helpers: devices CRUD
- [x] DB helpers: staging tasks CRUD
- [x] DB helpers: outbound shipments CRUD
- [x] DB helpers: invoices & line items CRUD
- [x] DB helpers: activity logs (insert + list)
- [x] DB helpers: photos (insert + list by entity)
- [x] DB helpers: usage calculation per client
- [x] DB helpers: dashboard stats (admin + customer)
- [x] tRPC router: clients
- [x] tRPC router: packages
- [x] tRPC router: deliveries
- [x] tRPC router: receiving
- [x] tRPC router: pallets
- [x] tRPC router: boxes
- [x] tRPC router: devices
- [x] tRPC router: staging
- [x] tRPC router: shipments
- [x] tRPC router: billing/invoices (with auto-generate from usage)
- [x] tRPC router: activity logs
- [x] tRPC router: photos (upload endpoint)
- [x] tRPC router: usage/dashboard stats
- [x] tRPC router: users (list + updateRole)
- [x] Role-based middleware (adminProcedure, staffProcedure, customerProcedure)

## Phase 3: Admin/Staff Modules (Frontend)
- [x] App.tsx: set up all routes and DashboardLayout with role-aware sidebar
- [x] Admin: Clients list page (table, search, status badges)
- [x] Admin: Client detail/edit page
- [x] Admin: Create client form
- [x] Admin: Packages list and create/edit page (Basic/Standard/Professional/Enterprise/Custom)
- [x] Staff: Expected deliveries list page
- [x] Staff: Create expected delivery form
- [x] Staff: Receiving log list page (role-gated create button)
- [x] Staff: Create receiving log form (with photo upload)
- [x] Admin/Staff: Pallets list with status badges and QR-ready IDs
- [x] Admin/Staff: Boxes list with status badges
- [x] Admin/Staff: Devices list with status badges and filters (role-gated add button)
- [x] Admin/Staff: Device detail page (serial, MAC, staging status)
- [x] Admin/Staff: Staging tasks list page with status transitions
- [x] Admin/Staff: Create staging task form
- [x] Admin/Staff: Staging task detail page
- [x] Admin/Staff: Outbound shipments list page
- [x] Admin/Staff: Create/edit shipment form
- [x] Admin: Billing — invoice list page
- [x] Admin: Invoice detail/draft page with line items
- [x] Admin: Generate invoice from usage (auto-generate button)
- [x] Admin: Activity logs page
- [x] Admin: Users management page (role + client assignment)

## Phase 4: Customer Portal (Frontend)
- [x] Customer dashboard with usage meter cards and package usage
- [x] Customer: Expected deliveries list and create form
- [x] Customer: Received items view (receiving logs)
- [x] Customer: Inventory view (pallets, boxes, devices — read-only)
- [x] Customer: Staging status view (read-only)
- [x] Customer: Outbound shipments view and request form
- [x] Customer: Invoices list and detail view (read-only)
- [x] Customer: Activity log view

## Phase 5: Polish & Tests
- [x] Responsive mobile layout for all pages
- [x] Status badge components (color-coded per status, tier, and role)
- [x] Empty states for all list pages
- [x] Loading skeletons
- [x] Photo upload component (drag-and-drop with PhotoGallery)
- [x] Activity log auto-insert on key events (server-side)
- [x] Vitest: 18 tests across routers and auth
- [x] TypeScript clean (0 errors)
- [x] Checkpoint and deliver

## Round 2: Bug Fixes & Package Detail Flow

- [x] Fix nav "Go to Dashboard" button routing to / instead of /dashboard
- [x] Fix sidebar text overlap on narrow/mobile viewports
- [x] Build package detail page (/packages/:tier) with full tier info and comparison
- [x] Build inquiry/request form on package detail page (name, company, email, message)
- [x] Wire all landing page "Get Started" package buttons to /packages/:tier
- [x] Add route for /packages/:tier in App.tsx
