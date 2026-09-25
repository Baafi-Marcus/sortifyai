# 🚀 SortifyAI — AI-Powered Data Allocation & Grouping Platform

> **"Turning complex data and requirements into intelligent, optimized allocations."**

SortifyAI is an intelligent allocation and optimization platform that transforms messy tabular datasets (Excel, CSV, PDF) into mathematically balanced cohorts based on natural-language instructions and deterministic constraints.

---

## 🌟 The Core Concept

Upload a dataset and simply describe your goal in natural language:

> *"Divide these 500 students into 10 groups, keeping the sizes equal while balancing gender and academic performance."*

SortifyAI:
1. **Understands & Confirms:** Outlines what it understood and displays decision criteria before generating.
2. **Generates & Analyzes:** Produces groups with inline distribution analytics (average score, gender parity, programme mix).
3. **Interactive Refinement:** Allows manual drag-and-drop student moves or iterative natural-language AI regrouping.
4. **School-Ready Export:** Download combined spreadsheets, individual group files, or print-ready rosters.

---

## 🏛️ Architecture & Platform Vision

SortifyAI is built to separate the **Optimization Engine** from the presentation layer, enabling integration into any system via REST API, extensions, and SDKs.

```
                  ┌───────────────────────────────┐
                  │       SortifyAI Engine        │
                  │ (FastAPI + AI Constraint Core)│
                  └───────────────┬───────────────┘
                                  │
                                  ▼
                  ┌───────────────────────────────┐
                  │       SortifyAI REST API      │
                  │   (/upload, /interpret, etc.) │
                  └───────────────┬───────────────┘
                                  │
      ┌──────────────┬────────────┼────────────┬──────────────┐
      ▼              ▼            ▼            ▼              ▼
SortifyAI Web   Third-Party    Browser     ChatGPT &     School / HR
    App          Websites     Extensions   AI Plugins      Systems
```

See [PLATFORM_OVERVIEW.md](./PLATFORM_OVERVIEW.md) for full architectural documentation.

---

## ⚡ Beyond Student Grouping

* **Education:** Classroom pods, exam hall seating, house/hostel room allocations, lab benches.
* **Business:** Cross-functional squad formation, shift duty rosters, staff scheduling.
* **Events:** Networking dinner tables, workshop breakout tracks.
* **Organizations:** Volunteer deployment and committee formation.

---

## 🛠️ Tech Stack

* **Backend:** Python, FastAPI, Pandas, SQLAlchemy, OpenAI/OpenRouter (GPT-4o-mini).
* **Frontend:** React 19, Vite, TailwindCSS, Heroicons.
* **Deployment:** Render (Backend API), Vercel (Frontend Web Studio).

---

## 💻 Developer API Quickstart

### Upload Dataset
```bash
curl -X POST https://sortifyai-backend.onrender.com/upload \
  -F "file=@students.xlsx"
```

### Interpret Natural Language Instructions
```bash
curl -X POST https://sortifyai-backend.onrender.com/interpret \
  -H "Content-Type: application/json" \
  -d '{
    "file_id": "your-file-id",
    "instructions": "Create 10 groups with balanced gender and academic score"
  }'
```

### Generate Optimized Groups
```bash
curl -X POST https://sortifyai-backend.onrender.com/group \
  -H "Content-Type: application/json" \
  -d '{
    "file_id": "your-file-id",
    "instructions": "Create 10 groups with balanced gender and academic score"
  }'
```

---

## 📄 License
Developed by **BAAFI O. MARCUS**.
