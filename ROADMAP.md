# 🗺️ SortifyAI Platform — Strategic Roadmap & Engineering Milestones

> **Vision:** Turning complex data and requirements into intelligent, optimized allocations.  
> **Core Concept:** Allocation + Optimization as a Platform & API.

---

## 🏛️ System Architecture

```
                    SORTIFYAI
                        │
                ┌───────┴────────┐
                │ SortifyAI Core │
                │                │
                │ AI Parser      │
                │ Rules Engine   │
                │ Optimizer      │
                │ Validator      │
                └───────┬────────┘
                        │
                  SortifyAI API
                        │
        ┌───────────────┼────────────────┐
        │               │                │
        ▼               ▼                ▼
   Web App        Chrome Extension    Developers
   (Studio)                              │
        │                         ┌──────┴──────┐
        ▼                         ▼             ▼
   End Users                  Websites       Mobile Apps
                                     
                        │
                        ▼
                 Future Integrations
                 ├── ChatGPT
                 ├── Google Sheets
                 ├── Excel
                 ├── School Systems
                 ├── HR Systems
                 └── SaaS Platforms
```

---

## 🧭 The 7 Strategic Phases

### Phase 1 — Fix and Strengthen Current SortifyAI *(Status: Completed / In Hardening)*
* **Objective:** Make the core grouping product genuinely reliable before expanding it.
* **Key Deliverables:**
  * ✅ Multi-format file support (`.xlsx`, `.xls`, `.csv`, `.pdf`) with smart header auto-detection.
  * ✅ Instant upload preview and dataset health scan (missing values, types, column detection).
  * ✅ Natural-language instruction interpretation with pre-confirmation modal.
  * ✅ Multi-factor grouping engine with inline distribution analytics (averages, parity, mix).
  * ✅ Manual student drag-and-drop adjustments with instant local recalculation and undo.
  * ✅ Multi-format export: Combined CSV, individual CSVs, and printer-friendly roster layout.
  * ✅ Server pre-warming on client load + GitHub Actions 14-min keep-alive cron.

### Phase 2 — Separate the "Brain" from the Website *(Status: Underway)*
* **Objective:** Decouple the SortifyAI Engine from presentation layers so any application can consume it.
* **The Engine Contract:**
  * **Input:** `DATA + USER INSTRUCTIONS + CONSTRAINTS + NUMBER OF GROUPS`
  * **Output:** `GROUPS + STATISTICS + VALIDATION + EXPLANATION`
* The official web app becomes one consumer client of its own engine.

### Phase 3 — Build the SortifyAI Developer API (`api.sortifyai.com`) *(Status: Architecture Defined)*
* **Objective:** Allow external developers to integrate allocation & optimization directly into their software.
* **Key Deliverables:**
  * API Key generation and management (`X-API-Key`).
  * Granular rate limiting and usage tracking.
  * Interactive OpenAPI / Swagger / Redoc documentation.
  * Structured error codes (`DATASET_INVALID`, `CONSTRAINTS_CONFLICT`, `CAPACITY_OVERFLOW`).
  * API versioning (`/v2/group`, `/v2/interpret`, `/v2/validate`).

### Phase 4 — Rebuild the SortifyAI Website Around the API *(Status: Implemented / Integrating)*
* **Objective:** Use the official website to prove that third-party developers can build complete, high-volume products on top of the SortifyAI API.
* **Workflow:** Dashboard → Upload data → Create grouping request → Review requirements → Generate → Analyze → Regroup → Export → Save project.

### Phase 5 — Build the First Integration: Chrome/Edge Extension *(Status: Planned)*
* **Objective:** Prove that SortifyAI works outside its own domain and website.
* **Workflow:** Select any HTML table on a web page → Right-click "SortifyAI → Create Groups" → Send payload to API → Return balanced groups overlay.

### Phase 6 — Developer Ecosystem & SDKs *(Status: Explorer Launched)*
* **Objective:** Provide developer tools and first-party client libraries.
* **Key Deliverables:**
  * First-party SDKs: TypeScript/JavaScript (`npm install @sortifyai/sdk`) and Python (`pip install sortifyai`).
  * Developer portal with quickstarts, authentication guides, and webhook events.

### Phase 7 — ChatGPT & Workspace Integrations *(Status: Planned)*
* **Objective:** Connect SortifyAI to conversational AI assistants and enterprise tools.
* **Distinction:** ChatGPT understands natural language intent → SortifyAI handles deterministic, mathematical grouping & optimization → returns structured results.
* Expansion to Google Sheets, Microsoft Excel Add-ins, and Notion databases.

---

## 🎯 Immediate Milestone: SortifyAI V2 — Core Engine + API

Before building extensions, integrations, or billing, all focus is placed on establishing a rock-solid **Core Engine & API**.

| Step | Milestone Task | Status | Focus / Description |
|---|---|---|---|
| **1** | **Audit current application** | ✅ Complete | Audit file loaders, heuristic rules, database models, and error handling. |
| **2** | **Define grouping/optimization engine** | 🟡 In Progress | Add deterministic optimization algorithms (snake-sort, stratified round-robin, multi-constraint solvers) alongside AI rule parsing. |
| **3** | **Define the API contract** | 🟡 In Progress | Standardize JSON input/output schema: `DATA + INSTRUCTIONS + CONSTRAINTS` → `GROUPS + STATISTICS + VALIDATION + EXPLANATION`. |
| **4** | **Build the API** | 🟡 In Progress | Implement `/v2/` endpoints, API key authentication, and rate limiting middleware. |
| **5** | **Connect website to the API** | ✅ Complete | Ensure React Studio communicates strictly via standard API contracts with zero UI-layer logic locks. |
| **6** | **Add robust validation/constraints** | 🟡 In Progress | Validate impossible constraints (e.g. min group size * groups > total students), detect conflicts, and report violations. |
| **7** | **Test with large datasets** | ⚪ Pending | Benchmark engine performance against 500, 1,000, and 5,000 row datasets. |
| **8** | **Build developer documentation** | ✅ Complete | Interactive Swagger UI (`/docs`), Redoc (`/redoc`), and Developer API Modal with cURL, Python, and TypeScript samples. |
| **9** | **Release API beta** | ⚪ Pending | Invite pilot developers and school IT administrators to test API keys. |
| **10** | **Build first external integration** | ⚪ Pending | Build lightweight Chrome extension for web table selection. |

---

## 🌐 The Bigger Opportunity: Beyond Student Grouping

SortifyAI is an **Allocation & Optimization Engine** across multiple industries:

* **Education:** Balanced student cohorts, exam hall seating, house/hostel room allocations, lab benches.
* **HR & Business:** Cross-functional squad creation, shift duty rosters, staff scheduling balancing experience and seniority.
* **Events & Conferences:** Networking dinner tables, workshop breakout tracks, attendee roundtables.
* **Organizations & Non-Profits:** Volunteer team deployment, committee selection, regional field pods.

---

*Last updated: September 2026 • SortifyAI Platform Architecture*
