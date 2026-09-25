# SortifyAI Platform — Overview

**SortifyAI** is an AI-powered data grouping and optimization platform designed to help individuals, organizations, schools, and software developers intelligently organize large datasets based on natural-language instructions and customizable rules.

Rather than being limited to a standalone website, SortifyAI is envisioned as a **platform and intelligent grouping engine** that can be integrated into other applications, websites, and digital tools through APIs, extensions, plugins, and developer SDKs.

---

## Core Concept

At its core, SortifyAI allows users to provide a dataset—such as an Excel spreadsheet, CSV file, PDF, or structured data—and simply describe what they want to achieve.

For example:

> "Divide these 500 students into 10 groups, keeping the groups approximately equal in size and balancing gender and academic performance."

SortifyAI interprets the request, analyzes the available data, applies the specified constraints, generates optimized groups, and provides statistics and insights about the resulting allocation.

Users can then review the results, make adjustments, or give additional instructions to the AI to refine the grouping.

---

## From Web Application to Platform

The current SortifyAI web application serves as the primary interface for users. However, the long-term vision is to separate the underlying **SortifyAI Engine** from the user interface.

The engine handles:

* Data processing
* AI instruction interpretation
* Grouping and allocation
* Constraint management
* Optimization
* Group-balance analysis
* Validation
* Regrouping and adjustments

Different applications can then connect to this engine through the SortifyAI API.

### Platform Structure

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

This approach allows SortifyAI to become infrastructure that other products can build upon.

---

## SortifyAI API

One of the major components of the platform is a developer-focused API.

Developers can send structured data and grouping instructions to SortifyAI and receive optimized results.

For example, a school management system can send:

* Student information
* Number of groups required
* Group size requirements
* Academic performance
* Programmes
* Gender
* Custom constraints

The SortifyAI API processes the information and returns the generated groups, statistics, and validation results.

This allows developers to integrate SortifyAI without having to build their own AI grouping and optimization system.

---

## Plugins and Extensions

SortifyAI can also be distributed through integrations that make its functionality available where users already work:

### ChatGPT Integration
Users can interact with SortifyAI directly from an AI assistant:
> *"Use SortifyAI to divide this dataset into 8 balanced groups."*

### Browser Extension
A Chrome or Edge extension allows users to process information directly from tables on any website:
> Select table → **SortifyAI → Create Groups**

### Office & Workspace Ecosystems
* Google Sheets Add-on
* Microsoft Excel Add-in
* Notion Integration
* Airtable Block
* School Management Systems (SIS / MIS)
* HR Platforms & CRM Systems

---

## Natural-Language Instructions

One of SortifyAI's key features is allowing users to describe their requirements in ordinary language:
* *"Create 12 groups with roughly the same number of people."*
* *"Balance the groups based on gender and academic performance."*
* *"Make sure students from the same programme are distributed across different groups."*
* *"Keep these two students together but separate these other two."*

SortifyAI converts these instructions into structured constraints that the optimization engine can process deterministically.

---

## Advanced Constraints

For power users, SortifyAI provides a rule-based system alongside natural-language instructions:
* Minimum / Maximum group capacity
* Required attributes and skills
* Pairing rules (*Must stay together*)
* Conflict rules (*Must be separated*)
* Multivariate balancing (Gender, Academic ability, Subject track)
* Priority ranking and custom allocation weights

---

## Beyond Student Grouping: Universal Allocation

Although student grouping is an essential entry point, the engine applies universally across domains:

| Sector | Core Use Cases |
|---|---|
| **Education** | Student grouping, exam hall seating, classroom allocation, sports houses, lab pods. |
| **Business** | Team formation, staff shift scheduling, project assignments, cross-functional squads. |
| **Events** | Table seating arrangements, networking dinner allocation, workshop breakout tracks. |
| **Organizations** | Volunteer deployment, training groups, committee formations. |

---

## Developer Ecosystem

The developer ecosystem empowers builders through:
* **Interactive OpenAPI / Swagger Docs** at `/docs`
* **API Keys & Usage Quotas**
* **SDKs:** TypeScript/JavaScript, Python, PHP, Java, C#
* **Webhooks** for long-running batch allocations

---

## Business Model

| Tier | Target Audience | Features |
|---|---|---|
| **Free** | Individuals & Experimentation | Standard cohort sizes, web interface, baseline exports. |
| **Pro** | Teachers & Group Leaders | Larger datasets, priority AI, custom constraint builder. |
| **Developer** | Engineers & SaaS Platforms | REST API access, usage-based pricing, SDK integration. |
| **Business** | Schools & Organizations | Multi-user accounts, batch processing, custom templates. |
| **Enterprise** | Large Institutions | Dedicated infrastructure, SSO, audit logging, custom SLA. |

---

## Long-Term Vision Statement

> **SortifyAI — Turning complex data and requirements into intelligent, optimized allocations.**
