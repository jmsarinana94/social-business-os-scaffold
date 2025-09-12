# Roadmap

This file tracks planned milestones for **Social Business OS**.  
Timelines are estimates based on aggressive development with AI assistance.  
The roadmap is subject to change as priorities shift.

---

## 🎯 Goal

Reach **v1.0.0 GA** (general availability) by **mid-2026**, with a production-ready SaaS that covers:
- Multi-tenant auth & organizations
- CRM, social scheduling, ads manager
- Billing, roles/seats, analytics
- Extensible integrations

---

## Milestones

### ✅ v0.1.0 – Baseline Scaffold (2025-08-28)
- Initial monorepo scaffold: API, Worker, Web.
- Products CRUD via NestJS + Prisma.
- Shared packages: db, ui, config.
- Smoke tests + CI baseline.

### ✅ v0.1.1 – Hardened Products CRUD (2025-09-12)
- Org-scoped Products with unique, case-insensitive SKUs.
- Redis idempotency interceptor.
- Test guard for e2e auth.
- All e2e suites green.

---

### 🔜 v0.2.0 – Auth & Users (Oct 2025)
- JWT-based user accounts.
- Signup/login with password hashing.
- Org membership model (users belong to orgs).
- Role seeds (Owner, Admin, Member).
- E2E coverage for auth flows.

### v0.3.0 – Billing & Seats (Nov 2025)
- Stripe integration (subscriptions, metered billing).
- Seat-based roles (owner/admin/member).
- Middleware enforcing active subscription.
- Web dashboard for plan management.

### v0.4.0 – CRM & Contacts (Dec 2025)
- Contact model (people, companies).
- CRUD APIs for contacts.
- Org-scoped tagging + notes.
- Basic search & filtering.
- Web UI for contacts table.

### v0.5.0 – Social Media Scheduling (Q1 2026)
- Post model with channels (Facebook, Instagram, LinkedIn, TikTok).
- Queue + worker pipeline for scheduled posts.
- API for drafts, queue, history.
- Web calendar UI.

### v0.6.0 – Ads Manager (Q1 2026)
- Campaign + Ad models.
- Integrations with Meta Ads + Google Ads.
- API for creating and syncing campaigns.
- Dashboard for spend + performance.

### v0.7.0 – Analytics & Dashboards (Q2 2026)
- Aggregated metrics per org.
- Chart endpoints (users, posts, revenue).
- Web dashboards with filters.
- Export to CSV/XLSX.

### v0.8.0 – Integrations Hub (Q2 2026)
- OAuth integration model.
- First-class integrations: Google, Meta, LinkedIn.
- Token refresh flow.
- Web UI for managing integrations.

---

### 🚀 v1.0.0 GA (Mid-2026)
- Fully multi-tenant SaaS.
- Auth, billing, CRM, scheduling, ads, analytics, integrations all stable.
- Production infra (Fly.io/Docker, CI/CD pipelines).
- Documentation + onboarding guides.
- Open beta → GA launch.

---

## Notes
- Minor releases (`v0.x.y`) will continue adding smaller features, bugfixes, and DX improvements.
- Major feature modules align with **minor versions** (`v0.2`, `v0.3`, …).
- `v1.0.0` represents the **first stable release** ready for external users.