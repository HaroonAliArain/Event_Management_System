<div align="center">

# Eventify
### Full-Stack Event Booking & Digital Admission Management System

[![Tests Status](https://img.shields.io/badge/Tests-19%20Passed%20%7C%200%20Failed-emerald?style=for-the-badge&logo=checkmarx&logoColor=white)](./server/tests/e2eTest.js)
[![Stack](https://img.shields.io/badge/Stack-React%2019%20•%20Node%20•%20Express%20•%20MongoDB-amber?style=for-the-badge&logo=mongodb&logoColor=white)](https://nodejs.org/)
[![Styling](https://img.shields.io/badge/UI-Tailwind%20CSS%20v4-zinc?style=for-the-badge&logo=tailwindcss&logoColor=38bdf8)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](https://opensource.org/licenses/MIT)

**A production-grade, responsive event operations platform with automated real-time seat inventory tracking, digital boarding pass generation, and full-spectrum CRUD management.**

[Overview](#-overview) • [Core Modules](#-core-modules--crud-operations) • [System Architecture](#-system-architecture) • [API Reference](#-api-endpoints-reference) • [Local Setup](#-local-quick-start) • [Automated Tests](#-automated-testing-suite-1919-passing) • [Cloud Deployment](#-free-cloud-deployment-guide) • [Academic Rubric](#-academic-alignment-sw417)

---

</div>

## 🌟 Overview

**Eventify** is an enterprise-grade web application built to streamline event lifecycle management, attendee coordination, and ticket reservations. Built from the ground up to solve real-world admission bottlenecks, Eventify enforces **automated real-time seat inventory synchronization**: issuing passes immediately decrements available capacity, preventing overbooking, while cancellations automatically restore seats to the pool.

Designed with a **humanized, architectural visual aesthetic** (warm honey amber `#D97706`, deep slate carbon `#18181B`, and editorial `DM Sans` typography), Eventify completely eliminates generic AI design tells to deliver an experience tailored for university symposiums, tech summits, and cultural gatherings.

```text
┌─────────────────────────────────┐                 ┌─────────────────────────────────┐
│     React 19 Client (SPA)       │   REST / JSON   │      Express.js REST API        │
│   • Vite Bundler                │ ◄─────────────► │   • Node.js Microservice        │
│   • Tailwind CSS v4             │   HTTP / CORS   │   • Helmet, Rate-Limit, CORS    │
│   • Responsive Single-Page UI   │                 │   • Validation & Error Pipeline │
└─────────────────────────────────┘                 └────────────────┬────────────────┘
                                                                     │ Mongoose ODM
                                                                     ▼
                                                    ┌─────────────────────────────────┐
                                                    │      MongoDB Database           │
                                                    │   • Events Collection           │
                                                    │   • Customers Collection        │
                                                    │   • Bookings Collection         │
                                                    └─────────────────────────────────┘
```

---

## 🚀 Core Modules & CRUD Operations

Eventify implements **3 decoupled modules providing 12+ verified CRUD operations** alongside a centralized analytics dashboard:

### 1. 🎟️ Event Management Module
* **Create:** Schedule sessions with venue details, ticket price (in PKR `Rs.`), capacity limits, category classification, and theme-matched event photography.
* **Read:** Browse schedules via interactive cards or structured data tables with search and category filtering.
* **Update:** Modify event dates, venues, capacity, and status (`Upcoming`, `Ongoing`, `Completed`, `Cancelled`).
* **Delete:** Remove events with interactive safety dialogs. Protected against cascading deletion if active bookings exist.

### 2. 👥 Attendee / Customer Registry Module
* **Create:** Register attendees with full name, contact information, city, and institution or corporate affiliation.
* **Read:** Searchable customer directory displaying real-time order history, purchase frequency, and contact records.
* **Update:** Update attendee profile details and phone numbers.
* **Delete:** Safely remove customer profiles once associated reservations have been resolved.

### 3. 📑 Ticket Reservation & Admission Module
* **Create:** Issue ticket passes across multiple tiers (`Standard`, `VIP`, `Student`) with dynamic price computation. **Atomically decrements available event capacity.**
* **Read:** Filterable reservation registry with real-time payment states and printable digital boarding passes featuring verified reference numbers and QR marks.
* **Update:** Toggle reservation status (`Confirmed` vs `Cancelled`).
* **Delete:** Cancel or remove reservations with safety prompts — **automatically restores available seats back to the event inventory.**

---

## 🏛️ System Architecture

### Entity Relationship Model

```text
  ┌───────────────────────────────┐                  ┌───────────────────────────────┐
  │           CUSTOMER            │ 1              * │            BOOKING            │
  ├───────────────────────────────┤                  ├───────────────────────────────┤
  │ _id : ObjectId (PK)           │                  │ _id : ObjectId (PK)           │
  │ fullName : String             │───[ Places ]────►│ customer : ObjectId (FK)      │
  │ email : String (Unique)       │                  │ event : ObjectId (FK)         │
  │ phone : String                │                  │ bookingReference : String (UQ)│
  │ city : String                 │                  │ ticketQuantity : Number       │
  │ organization : String         │                  │ ticketType : String           │
  │ createdAt : Date              │                  │ unitPrice : Number            │
  └───────────────────────────────┘                  │ totalAmount : Number          │
                                                     │ paymentStatus : String        │
  ┌───────────────────────────────┐                  │ bookingStatus : String        │
  │             EVENT             │ 1              * │ bookingDate : Date            │
  ├───────────────────────────────┤                  └───────────────────────────────┘
  │ _id : ObjectId (PK)           │                                  ▲
  │ title : String                │                                  │
  │ description : String          │───[ Reserves Capacity In ]───────┘
  │ category : String             │
  │ venue : String                │
  │ eventDate : Date              │
  │ ticketPrice : Number          │
  │ totalCapacity : Number        │
  │ availableSeats : Number       │
  │ bannerUrl : String            │
  │ status : String               │
  └───────────────────────────────┘
```

#### Relational Integrity Rules
* **Customer to Booking (1 : N):** A registered attendee can hold multiple reservations over time. Deleting a customer is blocked if linked to active bookings.
* **Event to Booking (1 : N):** Each booking reserves seats from one specific event. An event cannot be deleted while active bookings reference it.
* **Unique Constraints:** Customer emails are indexed and strictly unique (`409 Conflict` on duplicate). Booking reference codes (`EVT-XXXXXX`) are unique cryptographic strings.

### Business Logic & Inventory State Engine

```text
  [Event Initialized] ──► Available Seats = Total Capacity
          │
          ▼
  [Reservation Submitted] (Requesting N Tickets)
          │
          ├── If N > Available Seats ────► REJECTED (HTTP 400: Insufficient Seats)
          │
          └── If N <= Available Seats ───► CONFIRMED (HTTP 201: Available = Available - N)
                                                    │
                 ┌──────────────────────────────────┴──────────────────────────────────┐
                 ▼                                                                     ▼
     [Booking Cancelled (PUT)]                                             [Booking Deleted (DELETE)]
                 │                                                                     │
                 └────────────────────────► SEATS RESTORED ◄───────────────────────────┘
                                    (Available = Available + N)
```

---

## 🛠️ Technology Stack

| Layer | Technology | Version | Purpose |
|:---|:---|:---|:---|
| **Frontend Framework** | React | `v19.x` | Declarative, component-driven client architecture |
| **Bundler & Build Tool**| Vite | `v8.x` | Sub-second Hot Module Replacement (HMR) and optimized rollup bundling |
| **Styling** | Tailwind CSS | `v4.x` | Modern utility-first styling with `@tailwindcss/vite` |
| **Typography** | DM Sans | Google Fonts | Humanized, editorial geometric sans-serif typeface |
| **Icons** | Lucide React | `v1.x` | Clean, modern feather-style vector iconography |
| **Backend Framework** | Express.js | `v4.x` | Lightweight RESTful routing and middleware pipeline |
| **Runtime Environment**| Node.js | `v22.x LTS` | High-throughput asynchronous JavaScript runtime |
| **Database & ODM** | MongoDB & Mongoose | `v8.x` | Document persistence with schema validation, hooks, and virtuals |
| **Security & Middleware**| Helmet, CORS, Rate-Limit | Latest | HTTP security headers, origin control, and brute-force throttling |
| **Testing** | Node Native Test Suite | Native | Automated end-to-end integration and business logic verification |

---

## 📂 Project Directory Structure

```text
Project_Web_Engineering/
├── client/                               # Frontend Single Page Application (React + Vite)
│   ├── public/                           # Static assets & local photography
│   │   ├── events/                       # Curated theme-matched event pictures
│   │   ├── banner.png                    # Architectural reception hero photograph
│   │   └── favicon.svg                   # Branded squircle admission ticket favicon
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/                   # Modal, ConfirmModal, Toast notifications
│   │   │   └── layout/                   # Responsive Navbar & mobile drawer
│   │   ├── pages/
│   │   │   ├── DashboardPage.jsx         # Executive overview & KPI metrics
│   │   │   ├── EventsPage.jsx            # Event scheduling & capacity management
│   │   │   ├── CustomersPage.jsx         # Attendee directory & profile modal
│   │   │   └── BookingsPage.jsx          # Ticket pass issuance & printable pass
│   │   ├── services/api.js               # Centralized Axios client with error handling
│   │   ├── App.jsx                       # Master application component & footer
│   │   ├── index.css                     # Global typography & Tailwind v4 theme
│   │   └── main.jsx                      # Vite React root mounting
│   ├── vercel.json                       # Cloud SPA route rewriting rules
│   └── package.json
│
├── server/                               # Backend RESTful API Microservice
│   ├── config/db.js                      # Resilient Mongoose connection handler
│   ├── controllers/                      # Business controllers (Events, Customers, Bookings, Stats)
│   ├── middleware/                       # Global error handling, sanitize, validation
│   ├── models/                           # Mongoose Schemas (Event, Customer, Booking)
│   ├── routes/                           # API Route endpoints (/api/events, etc.)
│   ├── tests/
│   │   └── e2eTest.js                    # Automated 19-point integration test suite
│   ├── seeder.js                         # Database seeder with realistic Pakistani records
│   ├── server.js                         # Express server entrypoint & port binding
│   └── package.json
│
├── docs/                                 # Academic & Architectural Documentation Hub
│   ├── README.md                         # Documentation index
│   ├── PRD.md                            # Comprehensive Product Requirements Document
│   ├── ARCHITECTURE.md                   # Detailed architectural specification & data flow
│   ├── UI_UX_DESIGN.md                   # Anti-AI design philosophy & component guidelines
│   ├── DEVELOPMENT_PLAN.md               # 5-Phase implementation roadmap
│   └── ACADEMIC_REPORT_TEMPLATE.md       # 13-Section university project submission report
│
└── README.md                             # Project overview (This document)
```

---

## 📡 API Endpoints Reference

All endpoints return uniform JSON envelopes: `{ "success": boolean, "message": string, "data": any }`.

### 1. Events (`/api/events`)
* `GET /api/events` — Retrieve all events (supports `?category=`, `?status=`, `?search=`, `?sort=`)
* `GET /api/events/:id` — Retrieve single event document by ObjectId
* `POST /api/events` — Create new event schedule
* `PUT /api/events/:id` — Update event details, price, or capacity
* `DELETE /api/events/:id` — Delete event (blocked if active confirmed bookings exist)

### 2. Attendees / Customers (`/api/customers`)
* `GET /api/customers` — Retrieve attendee directory (supports `?search=`)
* `GET /api/customers/:id` — Retrieve attendee details with full ticket purchase history
* `POST /api/customers` — Register new attendee (enforces unique email)
* `PUT /api/customers/:id` — Update attendee contact and profile details
* `DELETE /api/customers/:id` — Remove attendee record

### 3. Bookings (`/api/bookings`)
* `GET /api/bookings` — Retrieve all reservations with populated customer and event references
* `GET /api/bookings/:id` — Retrieve single reservation details
* `POST /api/bookings` — Issue new ticket reservation (**decrements available seats**)
* `PUT /api/bookings/:id` — Update booking status or notes (**restores seats on cancellation**)
* `DELETE /api/bookings/:id` — Delete booking record (**restores seats to event**)

### 4. Operations & Health (`/api/stats`, `/api/health`)
* `GET /api/stats` — Executive dashboard KPIs, financial totals, and category breakdown
* `GET /api/health` — System uptime and health heartbeat status

---

## ⚙️ Local Quick Start

### 1. Prerequisites
* [Node.js](https://nodejs.org/) (`v18.x` or higher)
* [MongoDB](https://www.mongodb.com/) (Local server on `mongodb://127.0.0.1:27017` or MongoDB Atlas)
* Git

### 2. Clone Repository
```bash
git clone https://github.com/your-username/Project_Web_Engineering.git
cd Project_Web_Engineering
```

### 3. Backend Setup
```bash
cd server
npm install

# Verify server/.env configuration
# PORT=5001
# MONGODB_URI=mongodb://127.0.0.1:27017/eventify_db
# NODE_ENV=development

# Seed database with realistic events and attendees
npm run seed

# Start server in development mode
npm run dev
```
*Backend runs on:* `http://localhost:5001/api`

### 4. Frontend Client Setup
```bash
# In a separate terminal
cd client
npm install

# Start Vite dev server
npm run dev
```
*Frontend runs on:* `http://localhost:5173`

---

## 🧪 Automated Testing Suite (19/19 Passing)

Eventify includes a complete end-to-end integration test runner validating all **12 CRUD operations** and core business logic edge cases against the live REST API:

```bash
cd server
npm test
```

### Test Verification Matrix

| # | Test Scenario | Module | Verified Assertion | Status |
|:---|:---|:---|:---|:---:|
| **1** | Health Check (`GET /api/health`) | System | Operational status `200 OK` | ✅ PASS |
| **2** | Create Event with Seat Capacity (`POST /api/events`) | Events | Initial available seats equal to total capacity | ✅ PASS |
| **3** | Read All Events (`GET /api/events`) | Events | Returns complete array of events | ✅ PASS |
| **4** | Read Single Event by ID (`GET /api/events/:id`) | Events | Accurate document retrieval | ✅ PASS |
| **5** | Update Event Details (`PUT /api/events/:id`) | Events | Modified title and venue persisted | ✅ PASS |
| **6** | Register New Attendee (`POST /api/customers`) | Customers | New attendee record registered with valid email | ✅ PASS |
| **7** | Duplicate Email Prevention (`POST /api/customers`) | Customers | Rejects duplicate email with `409 Conflict` | ✅ PASS |
| **8** | Read All Customers (`GET /api/customers`) | Customers | Returns full attendee directory | ✅ PASS |
| **9** | Update Customer Profile (`PUT /api/customers/:id`) | Customers | Persists phone and location updates | ✅ PASS |
| **10**| Issue Reservation & Seat Decrement (`POST /api/bookings`) | Bookings | Booking created and available seats decremented | ✅ PASS |
| **11**| Prevent Overbooking Beyond Capacity (`POST /api/bookings`) | Bookings | Rejects excess ticket quantity with `400 Bad Request` | ✅ PASS |
| **12**| Read All Bookings (`GET /api/bookings`) | Bookings | Returns all reservations with references | ✅ PASS |
| **13**| Read Single Booking with Populated Refs (`GET /api/bookings/:id`) | Bookings | Populates full Customer and Event documents | ✅ PASS |
| **14**| Status Cancellation Restores Inventory (`PUT /api/bookings/:id`) | Bookings | Changing status to Cancelled restores available seats | ✅ PASS |
| **15**| Protect Event Deletion with Active Bookings (`DELETE /api/events/:id`) | Integrity | Rejects deletion with `400 Bad Request` | ✅ PASS |
| **16**| Delete Booking and Restore Inventory (`DELETE /api/bookings/:id`) | Bookings | Removes reservation and restores seat capacity | ✅ PASS |
| **17**| Delete Event after Bookings Cleared (`DELETE /api/events/:id`) | Events | Event safely removed after bookings are cleared | ✅ PASS |
| **18**| Delete Customer (`DELETE /api/customers/:id`) | Customers | Attendee record cleanly deleted | ✅ PASS |
| **19**| Dashboard Summary Metrics (`GET /api/stats`) | Dashboard | Financial sums and occupancy metrics calculated | ✅ PASS |

---

## ☁️ Free Cloud Deployment Guide

### 1. Database: MongoDB Atlas (Free M0 Cluster)
1. Sign up at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a free **M0 Sandbox** cluster.
3. Under **Database Access**, create a user (e.g., `eventify_user`).
4. Under **Network Access**, add IP `0.0.0.0/0` (Allow Access from Anywhere).
5. Copy your connection string:
   ```text
   mongodb+srv://eventify_user:<password>@cluster0.xxxx.mongodb.net/eventify_db?retryWrites=true&w=majority
   ```

### 2. Backend API: Render
1. Push this repository to GitHub.
2. Sign in to [Render](https://render.com/) and create a **New Web Service**.
3. Select your repository:
   * **Root Directory:** `server`
   * **Build Command:** `npm install`
   * **Start Command:** `node server.js`
   * **Environment Variables:**
     * `NODE_ENV`: `production`
     * `PORT`: `10000`
     * `MONGODB_URI`: `<Your MongoDB Atlas Connection String>`
     * `CLIENT_URL`: `https://your-eventify-app.vercel.app`
4. Deploy the service and note your live API URL (e.g., `https://eventify-api.onrender.com`).

### 3. Frontend Client: Vercel
1. Sign in to [Vercel](https://vercel.com/) and click **Add New Project**.
2. Select your repository:
   * **Framework Preset:** Vite
   * **Root Directory:** `client`
   * **Build Command:** `npm run build`
   * **Output Directory:** `dist`
   * **Environment Variables:**
     * `VITE_API_BASE_URL`: `https://eventify-api.onrender.com/api`
3. Click **Deploy**. Vercel will build and assign an SSL-secured public domain.
4. Update `CLIENT_URL` on Render with your Vercel URL to allow production CORS requests.

---

## 📋 Academic Alignment (SW417)

This project was developed for the **Problem-Based Learning (PBL)** assignment in **SW417: Web Engineering** at **Mehran University of Engineering and Technology (SZAB Campus, Khairpur Mir's)**.

### Course Learning Outcomes (CLOs) Mapping
* **CLO 1 (C3):** Outline fundamentals of web technologies, client-side rendering, and responsive UI design.
* **CLO 2 (C5):** Work with server-side languages (Node.js/Express) to engineer dynamic, secure web services.
* **CLO 3 (P5):** Host web applications and design relational/document databases to store and process data proficiently.
* **PLOs:** 1 (Engineering Knowledge), 3 (Design/Development of Solutions), 5 (Modern Tool Usage), 9 (Individual and Team Work).

---

## 📄 License

This project is licensed under the [MIT License](LICENSE) — see the LICENSE file for details. Built for educational purposes at Mehran UET SZAB Campus.
