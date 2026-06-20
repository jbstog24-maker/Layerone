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

## Document Repository Module
- [x] Add documentTemplates table (id, name, category, description, fileKey, fileUrl, mimeType, version, createdBy, createdAt)
- [x] Add clientDocuments table (id, clientId, templateId, status, sentAt, signedAt, signedByName, signedByEmail, notes, fileKey, fileUrl)
- [x] Run Drizzle migration and apply SQL
- [x] Build documents tRPC router (template CRUD, send to client, update status, list by client)
- [x] Build admin Document Library page (/documents) with template upload, categories, and send-to-client flow
- [x] Build send document dialog: select client, add message, track via email notification
- [x] Build client Documents tab on ClientDetail page showing all linked docs with status badges
- [x] Add Documents nav item to admin sidebar
- [x] Add document status badge colors (draft/sent/viewed/signed/approved/rejected)
- [x] Write vitest tests for documents router

## Document Automation (Auto-Draft & Send)
- [x] Build documents tRPC router (template CRUD, getPresignedUploadUrl, send to client, update status, list by client)
- [x] Auto-draft MSA when client is assigned a package (server-side trigger in clients router)
- [x] Auto-send drafted document to client email via owner notification system
- [x] Pre-seed 5 MSA document templates (one per package tier) with add-on clause placeholders
- [x] Build admin Document Library page (/documents): template list, upload, categories, send dialog
- [x] Build SendDocumentDialog: select client, select template, add message, preview, send
- [x] Build client Documents tab on ClientDetail page: status timeline, download, approve/reject actions
- [x] Add Documents nav item to admin/staff sidebar
- [x] Add document status badge colors (draft/sent/viewed/signed/approved/rejected/expired)
- [x] Wire /documents route in App.tsx
- [x] Write vitest tests for documents router

## Onboarding / Setup Period
- [x] Add goLiveDate field to clients table (timestamp, nullable, set when contract is signed)
- [x] When document status changes to 'signed', auto-calculate goLiveDate = signedAt + 14 days
- [x] Show onboarding countdown / go-live date on client profile page
- [x] Include go-live date in auto-sent confirmation notification to client
- [x] Show "Onboarding in Progress" status badge on client card when goLiveDate is in the future
- [x] Add goLiveDate column to clients table migration

## Stripe Payment + Full Onboarding Flow
- [x] Add Stripe feature via webdev_add_feature
- [x] Add contractSignedAt, goLiveDate, onboardingNotes, stripeCustomerId, stripeSubscriptionId, paymentStatus fields to clients table
- [x] Run schema migration for new client fields
- [x] Create Stripe products/prices for each package tier (basic $499, standard $750/mo, professional $1500/mo, enterprise $3500/mo)
- [x] Build Stripe checkout session endpoint (POST /api/stripe/checkout) per package tier
- [x] Handle Stripe webhook: payment confirmed → set paymentStatus=paid, start onboarding clock (goLiveDate = now + 14 days)
- [x] Build documents router: template CRUD, auto-draft MSA on package assign, send to client email, update status
- [x] When document signed → auto-trigger Stripe checkout link to client email
- [x] Build admin Document Library page (/documents): template list, upload, categories
- [x] Build SendDocumentDialog: select client, select template, add message, send
- [x] Build client Documents tab on ClientDetail: status timeline, download, approve/reject
- [x] Show onboarding countdown + go-live date on client profile
- [x] Show "Onboarding in Progress" status badge when goLiveDate is in the future
- [x] Add Documents nav item to admin/staff sidebar
- [x] Wire /documents route in App.tsx
- [x] Write vitest tests for documents and Stripe routers

## Logo in Documents
- [x] Embed NSDS logo SVG in all auto-generated MSA documents and printable forms
- [x] Include logo header in document preview/print views
- [x] Add logo to Document Library page header and send dialog

## Warehouse Space Assignment
- [x] Add warehouseUnitNumber, warehouseAddress, warehouseAccessCode, warehouseDimensions, warehouseNotes, assignedTechIds, warehouseAssignedAt fields to clients table
- [x] Build assignWarehouseSpace mutation in clients router
- [x] When warehouse is assigned → auto-send email notification to client with all space details
- [x] Build WarehouseAssignmentForm on ClientDetail page (admin/staff only)
- [x] Show warehouse details card on client profile once assigned
- [x] Show warehouse assignment step in onboarding progress tracker

## Inquiries Inbox
- [x] Add list/get/updateStatus/delete/countNew procedures to inquiry router (admin/staff protected)
- [x] Add DB helpers: listInquiries, getInquiry, updateInquiryStatus, deleteInquiry, countNewInquiries
- [x] Build Inquiries inbox page (/inquiries) with summary cards, search, status/tier filters, table, quick-action buttons, and detail dialog
- [x] Add Inquiries nav item to admin/staff sidebar
- [x] Wire /inquiries route in App.tsx

## Landing Page FAQ
- [x] Add detailed FAQ section to landing page with 15 questions across 5 categories (Services, Pricing & Packages, Onboarding, Security & Facility, Portal & Tracking)
- [x] Add FAQ nav link to landing page navbar

## Document Module Remaining
- [x] Add Documents tab to ClientDetail page with linked documents and status timeline
- [x] Add Warehouse Assignment form to ClientDetail page (admin/staff only)
- [x] Add onboarding timeline card to ClientDetail (contract signed, go-live date, warehouse assigned)
- [x] Embed NSDS logo in all document previews and print views

## Sidebar Mobile Fix
- [x] Fix overlapping group labels and nav items in sidebar on mobile (switched -mt-8 to hidden for collapsed state)

## Client Messaging System
- [x] Add clientMessages table (id, clientId, senderId, senderRole, senderName, body, readAt, createdAt)
- [x] Run Drizzle migration and apply SQL
- [x] Add DB helpers: listClientMessages, sendClientMessage, markClientMessagesRead, countUnreadClientMessages
- [x] Build messages tRPC router with list, send, markRead, countUnread procedures (role-gated)
- [x] Build ClientMessageThread component with bubble UI, auto-scroll, 15s polling, Enter-to-send composer
- [x] Insert Messages section into ClientDetail page (visible to all roles)
- [x] Owner notification when customer sends a message
- [x] Write vitest tests for messages router (4 new tests, 26 total passing)

## Global Messages Inbox
- [x] Add DB helpers: listAllThreads (latest msg per client + unread count), countTotalUnread
- [x] Add messages.threads and messages.totalUnread tRPC procedures
- [x] Build global Messages inbox page (/messages) with thread list, search, unread filter, and inline reply panel
- [x] Add Messages nav item to admin/staff sidebar with live unread count badge
- [x] Wire /messages route in App.tsx
- [x] Unread badge polls every 30s and shows count on Messages sidebar item
- [x] Write vitest tests for threads and totalUnread procedures (4 new tests, 32 total passing)
