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

## Customer Portal Unread Message Badge
- [x] Add messages.myUnread tRPC procedure (customer-facing: counts unread staff replies for their own thread)
- [x] Wire unread badge on Clients nav item in customer portal sidebar (polls every 30s)
- [x] Write vitest tests for myUnread procedure (3 new tests, 35 total passing)

## Users Management Page (Admin Console)
- [x] DB helpers: listUsers, updateUser (role/clientId/name/email), deleteUser, getUserById
- [x] tRPC procedures: users.list, users.update, users.delete (admin-only)
- [x] Built Users admin page (/users): role stats cards, search, role filter, user cards with edit/delete, info banner
- [x] Users nav item visible in admin sidebar
- [x] Write vitest tests: users.update (2), users.delete (2) — 43 tests total passing
- [x] Note: users are created via OAuth login (no manual create); page explains this clearly

## Document Repository Mobile Fix
- [x] Make header stack vertically on mobile (title on top, action buttons below)
- [x] Make NSDS branding banner stack vertically on mobile
- [x] Make tabs full-width on mobile
- [x] Replace Client Documents table with mobile-friendly card list on small screens (md:hidden/hidden md:block)

## Welcome Email on First Login
- [x] Superseded by Resend Welcome Email section above — welcome email now fires on inquiry form submit via Resend (branded HTML, NSDS logo, next steps, onboarding timeline, portal link, support contact)

## Document Repository Mobile Fix
- [x] Make header stack vertically on mobile (title on top, action buttons below)
- [x] Make NSDS branding banner stack vertically on mobile
- [x] Make tabs full-width on mobile
- [x] Replace Client Documents table with mobile-friendly card list on small screens (md:hidden/hidden md:block)

## Resend Welcome Email
- [x] Install resend npm package
- [x] Add RESEND_API_KEY and RESEND_FROM_EMAIL secrets
- [x] Build server/email.ts with sendWelcomeEmail helper (branded HTML template)
- [x] Wire sendWelcomeEmail into inquiry.submit mutation
- [x] Welcome email includes: NSDS logo, next steps, onboarding timeline, portal link, support contact
- [x] Write vitest tests for email helper (4 tests)

## Users Page Improvements
- [x] Add "Add New User" button to header — opens create dialog (name, email, role, linked client, phone, notes)
- [x] createUser DB helper inserts pre-provisioned row with placeholder openId (replaced on first OAuth login)
- [x] users.create tRPC procedure (admin-only) with validation
- [x] Remove button always visible for all non-self users (no hidden on mobile)
- [x] Edit dialog expanded: name, email, role, linked client, phone, internal notes
- [x] Info banner updated to explain pre-provision + OAuth activation flow
- [x] 43 tests passing, 0 TypeScript errors

## User Profile Fields (Business Name, Phone, Location)
- [x] Add businessName, phone, location columns to users table in schema.ts
- [x] Run Drizzle migration and apply SQL
- [x] Update createUser and updateUser DB helpers to include new fields
- [x] Update users.create and users.update tRPC procedures with new fields
- [x] Add businessName, phone, location fields to Add New User and Edit User dialogs
- [x] Display businessName, phone, location on user cards
- [x] Added sendPortalInviteEmail (branded HTML, separate from inquiry welcome email)
- [x] Wire sendPortalInviteEmail in users.create — fires when admin adds a new user
- [x] 43 tests passing, 0 TypeScript errors

## Resend Invite Feature
- [x] Add users.resendInvite tRPC procedure (admin-only) — looks up user by ID, sends portal invite email
- [x] Add "Resend Invite" button to each user card in Users.tsx (blue, only shown when user has email)
- [x] Write vitest tests for resendInvite (3 tests: success, FORBIDDEN for staff, NOT_FOUND)
- [x] 51 tests passing, 0 TypeScript errors

## Forwarding Location Feature
- [x] Add forwardingAddress, forwardingContact, forwardingNotes, forwardingStatus, forwardingUpdatedAt columns to devices, boxes, pallets tables
- [x] Run Drizzle migration (0008_light_roland_deschain.sql) and apply SQL
- [x] Add DB helpers: updateDeviceForwarding, updateBoxForwarding, updatePalletForwarding, listStagedDevicesForClient, listStagedBoxesForClient, listStagedPalletsForClient
- [x] Build forwarding tRPC router: myItems (customer + admin), updateDevice, updateBox, updatePallet (role-gated ownership check)
- [x] Register forwardingRouter in main routers.ts
- [x] Build customer-facing My Devices page (/my-devices): summary cards (total/pending/in-transit/delivered), tabs for devices/boxes/pallets, item cards with forwarding badge + address, edit dialog with status/address/contact/notes fields
- [x] Add "My Devices" nav item to customer "My Portal" sidebar group (renamed from "Support")
- [x] Add Forwarding Location card to DeviceDetail page (visible to all roles) with inline edit dialog
- [x] Wire /my-devices route in App.tsx
- [x] Write vitest tests for forwarding router (8 tests: myItems x2, updateDevice x3, updateBox x1, updatePallet x1)
- [x] 58 tests passing, 0 TypeScript errors

## Shipment Document Uploads (Customer + Admin/Staff)
- [x] Add shipmentDocuments table (id, shipmentId, clientId, uploadedById, filename, mimeType, fileKey, fileUrl, label, notes, createdAt)
- [x] Run Drizzle migration and apply SQL
- [x] Add DB helpers: listShipmentDocuments, addShipmentDocument, deleteShipmentDocument
- [x] Add S3 presigned upload URL endpoint (POST /api/shipment-docs/upload)
- [x] Build shipmentDocs tRPC router: list, getUploadUrl, confirmUpload, delete (customer ownership-gated)
- [x] Build ShipmentDocuments component: drag-and-drop upload zone, document list with file type icons, download/delete actions
- [x] Add Documents tab/section to ShipmentDetail page (visible to customer + admin/staff)
- [x] Wire upload URL → S3 PUT → confirm save flow
- [x] Write Vitest tests for shipmentDocs router

## Staging-Complete Notification (Ready to Ship)
- [x] Review device schema staging statuses and email patterns
- [x] Add stagingNotifications table (id, deviceId, clientId, notifiedAt, notifiedByUserId, message, acknowledgedAt)
- [x] Run Drizzle migration and apply SQL
- [x] Add DB helpers: createStagingNotification, listStagingNotifications, acknowledgeStagingNotification
- [x] Add sendStagingCompleteEmail function to email.ts
- [x] Build stagingNotify tRPC router: notifyDevice, notifyBulk, listForClient, acknowledge
- [x] Staff UI: "Mark Ready to Ship" button on Device Detail page
- [x] Staff UI: Bulk "Notify Ready to Ship" action on Devices list (checkbox select)
- [x] Customer UI: "Ready to Ship" badge on My Devices page
- [x] Customer UI: Notification banner on Device Detail page with acknowledge button
- [x] Customer UI: Unread notification count badge in sidebar
- [x] Write Vitest tests for stagingNotify router

## Bulk Mark Ready to Ship (Boxes & Pallets)
- [x] Extend stagingNotify router to support boxes and pallets with itemType field
- [x] Add bulk checkbox selection + Mark Ready to Ship toolbar to Boxes page
- [x] Add bulk checkbox selection + Mark Ready to Ship toolbar to Pallets page
- [x] Write Vitest tests for new bulk procedures

## Google Maps Lead Finder + Email Drip Sequences
- [x] Read maps integration reference and check Google Maps API key
- [x] Add drip_sequences, drip_sequence_steps, and drip_enrollments tables to schema
- [x] Run Drizzle migration and apply SQL
- [x] Add DB helpers for drip sequences and enrollments
- [x] Build leadFinder tRPC router: searchPlaces (Google Places API), importPlace (create lead from place)
- [x] Build drip tRPC router: createSequence, listSequences, enrollLead, listEnrollments, sendNextStep
- [x] Build Lead Finder page: industry + location search, results cards, one-click import to pipeline
- [x] Build Drip Sequences page: create/edit sequences, step editor, enroll leads, view enrollment status
- [x] Wire drip email sending via Resend with step scheduling
- [x] Write Vitest tests for leadFinder and drip routers

## Marketing Content Studio (AI Image & Video Generation)
- [x] Add marketing_assets table to schema + migrate
- [x] Add DB helpers for marketing assets (list, get, create, update, delete)
- [x] Build content tRPC router: generateImage, generateVideo (AI prompt), list, delete
- [x] Build Content Studio page: prompt builder, style/format presets, generate button, loading states
- [x] Build Asset Gallery page: grid view, filter by type/tag, download, delete
- [x] Add Content Studio nav item to Sales group in sidebar
- [x] Write Vitest tests for content router

## Social Media Captions Tab (Content Studio)
- [x] Add content.generateCaptions tRPC procedure (LinkedIn, Instagram, Twitter/X, Facebook)
- [x] Add Captions tab to ContentStudio.tsx with image picker from gallery + platform selector
- [x] Write Vitest tests for generateCaptions procedure

## Content Studio QA & Improvements
- [ ] Image templates: clicking a template should also auto-fill the title field and show a visual selected state
- [ ] Video templates: clicking a template should also auto-fill the title field and show a visual selected state
- [ ] Image tab: add character counter on prompt textarea, clear-form button after generation
- [ ] Video tab: move templates to left column (above generate button) so they're visible without scrolling
- [ ] Captions tab: add caption templates (pre-built image descriptions for common NSDS scenarios)
- [ ] Captions tab: improve platform toggle UX — prevent deselecting all platforms, add select-all button
- [ ] Captions tab: show char count live as user types custom description
- [ ] General: add a "Clear / Start Over" button to each tab
- [ ] General: improve empty state messaging and pro tips for all three tabs

## Lead Finder Improvements & Introduction Email
- [x] Replace generic industry search with NSDS-specific prospect categories (MSPs, IT VARs, cabling contractors, security integrators, AV installers, enterprise IT depts)
- [x] Add DFW sub-region filters (Dallas, Fort Worth, Plano, Irving, Frisco, Arlington, etc.)
- [x] Add relevance scoring/filtering to only show businesses that match NSDS customer profile
- [x] Add category badge on each result card
- [x] Build draftIntroEmail + sendIntroEmail tRPC procedures: AI-drafts a professional intro email, sends via Resend
- [x] Add Send Introduction Email button + preview modal on Lead Finder result cards
- [x] Intro email saved to campaign history and lead marked as contacted on send
- [x] Write Vitest tests for draftIntroEmail and sendIntroEmail procedures (5 new tests)

## Rich Text Email Editor
- [ ] Install Tiptap core + extensions (bold, italic, underline, bullet list, ordered list, link, placeholder)
- [ ] Build RichTextEditor component with toolbar (bold, italic, underline, bullet list, ordered list, link, clear formatting)
- [ ] Upgrade Lead Finder intro email modal to use RichTextEditor instead of plain Textarea
- [ ] Update sendIntroEmail router to accept HTML body and send as HTML via Resend
- [ ] Update sendIntroductionEmail email helper to use provided HTML body directly
- [ ] Ensure AI-drafted plain text is converted to HTML on load into the editor

## All Recommendations — Full Implementation

### Rich Text Editor (finish)
- [x] Mark RichTextEditor todo items complete (Tiptap installed, component built, LeadFinder upgraded)
- [x] Update sendIntroductionEmail email helper to send HTML body directly
- [x] Update sendIntroEmail router to pass HTML body through to email helper

### Content Studio QA
- [x] Image templates: clicking fills title + shows visual selected state
- [x] Video templates: clicking fills title + shows visual selected state
- [x] Image tab: character counter on prompt, clear-form button after generation
- [x] Captions tab: add NSDS scenario caption templates
- [x] Captions tab: prevent deselecting all platforms, add Select All button
- [x] Captions tab: live char count on custom description
- [x] All tabs: Clear / Start Over button

### Automation
- [x] Auto-advance staging task to "completed" when all devices in the task are staged
- [x] Auto-generate monthly invoices via scheduled heartbeat (1st of each month)
- [x] Drip sequence auto-send heartbeat: fire pending drip emails on schedule
- [x] Lead score decay: flag leads with no activity in 30+ days as stale, reduce score by 1

### Customer Experience
- [x] Customer delivery notification email when a receiving log is created for their account
- [x] Shipment request approval flow: staff notification email to NSDS ops inbox
- [ ] Staging progress bar on customer dashboard (X of Y devices staged)
- [ ] In-portal support ticket form (subject, priority, category) replacing freeform message

### Operational Efficiency
- [x] Global Cmd+K search palette: clients + leads (Cmd+K / Ctrl+K keyboard shortcut)
- [ ] Bulk device import via CSV upload on Devices page
- [ ] Receiving log → inventory wizard: one-click "Create inventory from this delivery"
- [ ] Sticky internal notes on Client Detail page (staff/admin only, not client-visible)
- [ ] Dashboard KPI alerts: highlight clients at 90%+ storage/device limit

### Sales Pipeline
- [x] Convert Lead → Client button on Lead Detail page
- [x] Lead follow-up due dates: date picker, overdue badge on Lead Detail
- [x] leads.listOverdue procedure for overdue follow-up queries
- [ ] Content Studio → Lead tagging: tag generated assets to a specific lead/campaign
- [ ] Activity log entries for sales actions (lead imported, email sent, drip enrolled)

### Reliability & Data Integrity
- [ ] Soft delete for clients: archive instead of hard delete, preserve history
- [x] Invoice PDF export: download formatted HTML invoice from Invoice Detail page
- [ ] Rate limiting on public inquiry and package request forms
- [ ] Optimistic UI for key list mutations (status changes, toggles)

## Staging Progress Bar & Support Tickets
- [x] Add stagingProgress field to customer dashboard stats query (total devices, staged count, active tasks)
- [x] Build staging.customerProgress tRPC procedure returning per-task progress data
- [x] Add staging progress bar UI to customer dashboard (animated progress bar, per-task breakdown)
- [x] Add support_tickets and support_ticket_replies tables to schema + migrate
- [x] Add DB helpers: createTicket, listTickets, getTicket, updateTicket, createTicketReply, listTicketReplies
- [x] Build support tRPC router: create, list, get, update status, reply, admin listAll
- [x] Build SupportTickets page: structured ticket form (subject, category, priority, body) + ticket list + reply thread
- [x] Add Support Tickets nav item to My Portal customer sidebar group
- [x] Add sendSupportTicketEmail helper to email.ts (notifies NSDS ops on new ticket)

## Access Control — Client Approval Gate
- [x] Server: customerProcedure middleware verifies clientId is set and client status is "active" or "onboarding" — throws FORBIDDEN otherwise
- [x] Applied customerProcedure to messages, clientUsage, and staging.customerProgress procedures
- [x] Frontend: DashboardLayout shows PendingApproval page for customer roles without an approved clientId
- [x] Frontend: PendingApproval page explains account is under review, shows NSDS contact info, no nav
- [x] Frontend: admin/staff are never gated (always have full access)
- [x] Updated myUnread test to expect FORBIDDEN for unapproved customers (109 tests passing)

## Staff Role Management
- [ ] Add staff-specific fields to users table: jobTitle, department, accessLevel, isActive
- [ ] Run Drizzle migration for new staff fields
- [ ] Update users.create and users.update procedures to include staff fields
- [ ] Improve Users page: dedicated Staff tab showing all staff/admin users with role badges
- [ ] Add "Add Staff Member" dialog with name, email, role (admin/staff), job title, department, phone
- [ ] Add role-specific permission summary card explaining what each role can do
- [ ] Add ability to activate/deactivate staff accounts (isActive toggle)
- [ ] Add staff profile card showing job title, department, access level, last sign-in
- [ ] Send portal invite email when a new staff member is created
- [ ] Write Vitest tests for staff management procedures

## Staff Role Management
- [x] Add jobTitle, department, isActive fields to users schema + migrate
- [x] Update updateUser and createUser DB helpers with new fields
- [x] Add users.setActive procedure (activate/deactivate without deleting)
- [x] Add jobTitle and department to users.create and users.update procedures
- [x] Rewrite Users page with tabbed Staff/Customers view, role stats, activate/deactivate toggle
- [x] Add Role Permissions Reference card showing all 4 roles and their access levels
- [x] Add job title and department fields to Add/Edit User dialog (staff roles only)
- [x] Add internal notes field to Add/Edit User dialog (staff-only, not visible to user)

## Second-Pass Recommendations

### Support Ticket Admin View
- [ ] Build admin/staff support tickets inbox page (/admin/tickets): list all tickets, filter by status/priority/category, search
- [ ] Add ticket detail view for staff: full thread, reply composer, status change (open/in-progress/resolved/closed)
- [ ] Add Staff Tickets nav item to Operations group in sidebar
- [ ] Add unread ticket badge to sidebar nav item
- [ ] Write Vitest tests for admin ticket procedures

### Shipment Tracking Number
- [ ] Add carrier and trackingNumber fields to outbound_shipments table + migrate
- [ ] Update shipments.update procedure to accept carrier and trackingNumber
- [ ] Show tracking number + carrier badge on shipment detail page (staff and customer views)
- [ ] Auto-send tracking notification email to client when tracking number is added

### Bulk Device CSV Import
- [ ] Build CSV import dialog on Devices page: drag-and-drop CSV upload, column mapping preview, validation errors
- [ ] Add devices.importCsv tRPC procedure: parse CSV rows, validate, batch-insert devices
- [ ] Show import results summary (X imported, Y skipped, Z errors)
- [ ] Write Vitest tests for importCsv procedure

### Soft Delete for Clients
- [ ] Add archivedAt field to clients table + migrate
- [ ] Update clients.delete to set archivedAt instead of hard delete
- [ ] Add clients.restore procedure (admin only)
- [ ] Filter archived clients out of all list queries by default
- [ ] Add "Archived Clients" toggle on Clients list page to show/hide archived
- [ ] Write Vitest tests for soft delete and restore

### Sticky Internal Notes on Client Detail
- [ ] Add client_notes table (id, clientId, authorId, authorName, body, createdAt, updatedAt, isPinned)
- [ ] Run Drizzle migration for client_notes
- [ ] Add DB helpers: listClientNotes, createClientNote, updateClientNote, deleteClientNote
- [ ] Build clientNotes tRPC router: list, create, update, delete, pin (admin/staff only)
- [ ] Add Internal Notes panel to ClientDetail page (staff/admin only, not visible to customer)

### Admin Reports Page
- [ ] Build /reports page with monthly throughput chart (devices received, staged, shipped per month)
- [ ] Add revenue by client table (total invoiced, paid, outstanding)
- [ ] Add pipeline conversion funnel (leads → qualified → proposal → won)
- [ ] Add top clients by device volume card
- [ ] Add Reports nav item to admin sidebar
- [ ] Wire /reports route in App.tsx

### Overdue Follow-Up Dashboard Widget
- [ ] Add overdue leads count card to admin dashboard using leads.listOverdue procedure
- [ ] Show top 3 overdue leads with follow-up date and quick-link to lead detail

### Export to CSV
- [ ] Add "Export CSV" button to Clients list page
- [ ] Add "Export CSV" button to Devices list page
- [ ] Add "Export CSV" button to Invoices list page
- [ ] Add "Export CSV" button to Leads list page

### Customer Portal Enhancements
- [ ] Add shipment status timeline to customer shipment detail view (Requested → Approved → Packed → Dispatched → Delivered)
- [ ] Add customer invoice PDF download button (same HTML export as admin)
- [ ] Add device search bar to customer inventory view (filter by serial/model)

### Sales Improvements
- [ ] Add source field to leads table (Lead Finder, Manual, Referral, Inbound Inquiry, LinkedIn) + migrate
- [ ] Add source selector to lead create/edit form
- [ ] Add source badge to lead cards and detail page
- [ ] Add sales activity log entries for: lead imported, intro email sent, drip enrolled, lead converted
- [ ] Tag content assets to leads: add leadId field to marketing_assets table + migrate
- [ ] Add "Tag to Lead" button on Asset Gallery cards

### Reliability
- [ ] Add server-side rate limiting to /api/trpc/inquiry.submit and /api/trpc/packages.request (max 5 per IP per hour)
- [ ] Optimistic UI for device staging status toggle
- [ ] Optimistic UI for lead status change in pipeline

## Client ID / Account Number Scoping (File & Data Isolation)
- [ ] Audit all DB tables that store files or user-generated content: photos, client_documents, marketing_assets, support_tickets, support_ticket_replies, client_messages
- [ ] Enforce clientId scoping on photos router: customers can only fetch photos for their own clientId
- [ ] Enforce clientId scoping on documents router: customers can only fetch documents linked to their clientId
- [ ] Enforce clientId scoping on marketing_assets: add clientId column to marketing_assets table, scope all queries
- [ ] Enforce clientId scoping on support_tickets: already scoped — verify and add test
- [ ] Enforce clientId scoping on client_messages: already scoped — verify and add test
- [ ] Add accountNumber field to clients table (auto-generated, e.g. NSDS-00042) for human-readable reference
- [ ] Display accountNumber on Client Detail page header and customer dashboard
- [ ] Prefix all S3 storage keys with clientId (e.g. clients/{clientId}/photos/...) to ensure physical file isolation
- [ ] Write Vitest tests verifying cross-client data access is blocked (FORBIDDEN)

## Second-Pass Improvements (Session 3)

- [x] Auto-generate accountNumber on client create (NSDS-XXXXX format, padded)
- [x] Register AdminTickets route in App.tsx and add Support Tickets nav item to sidebar
- [x] Audit client ID scoping across all customer-facing router procedures
- [x] Update S3 key prefixing in shipmentDocs to include clientId
- [x] Confirm trackingNumber and carrier fields exist in outbound_shipments (already present)
- [x] Add bulk device CSV import: batchImport tRPC procedure + CSV import dialog on Devices page
- [x] Add archivedAt field to clients table (soft delete) + migration + SQL applied
- [x] Add archive/unarchive tRPC procedures to clients router
- [x] Add showArchived toggle + Archive/Restore buttons to ClientsList page
- [x] Add client_notes table (sticky internal notes, staff/admin only) + migration + SQL applied
- [x] Add listNotes/addNote/updateNote/deleteNote tRPC procedures to clients router
- [x] Build ClientInternalNotes component on ClientDetail page (pinnable, deletable)
- [x] Create AdminReports page (/reports) with device, shipment, and client CSV exports
- [x] Add Reports nav item to Audit section in sidebar (admin/staff only)
- [x] Wire /reports route in App.tsx
- [x] Add KPI alert panel on Reports page (pending shipments, staging tasks, draft invoices)
- [x] Install express-rate-limit and apply apiLimiter (300/min) + authLimiter (30/15min) in production
- [x] Confirm customer portal scoping: messages and support tickets already enforce ctx.user.clientId
- [x] All 109 tests passing, 0 TypeScript errors

## Onboarding Tour & Help Center

- [x] Add hasSeenTour boolean column to users table + migration
- [x] Add users.markTourSeen tRPC procedure
- [x] Build OnboardingTour component (role-aware step overlay, fires once on first login)
- [x] Build HelpCenter page (/help) with searchable feature docs for every nav section
- [x] Add Help nav item to sidebar (all roles)
- [x] Wire /help route in App.tsx
- [x] Add "?" help button to DashboardLayout header (mobile) that navigates to Help Center

## SSR Landing Page (root URL)

- [x] Audit Express/Vite server routing for root URL handling
- [x] Add Express GET / route that returns fully-rendered HTML with real landing page content
- [x] Ensure React SPA hydrates correctly after SSR HTML is served
- [x] Verify crawler-visible HTML with curl, run tests, save checkpoint

## Client Instructions Feature

- [x] Add client_instructions table (id, clientId, textBody, updatedAt, acknowledgedAt, acknowledgedByUserId)
- [x] Add client_instruction_files table (id, clientId, fileName, fileKey, mimeType, fileSize, uploadedAt)
- [x] Generate and apply Drizzle migration
- [x] DB helpers: upsertClientInstructions, getClientInstructions, addInstructionFile, listInstructionFiles, deleteInstructionFile
- [x] tRPC router: instructions.get, instructions.upsert, instructions.uploadFile, instructions.listFiles, instructions.deleteFile, instructions.acknowledge, instructions.getFileUrl
- [x] Customer portal: My Instructions page (/my-instructions) — rich text editor + drag-and-drop file upload area
- [x] Add Staging Instructions nav item to customer My Portal sidebar group
- [x] Admin/staff: ClientInstructionsPanel on Client Detail page — read-only text + file list + Mark Reviewed button
- [x] Acknowledge marks acknowledgedAt/acknowledgedByUserId on the instructions row
- [x] Wire /my-instructions route in App.tsx
- [x] 109 tests passing, 0 TypeScript errors, checkpoint saved
