# Assignment 5 — Admission Lead Management
## Approach & Architecture

### 1. Objective
Build a centralized CRM-style workflow for admission enquiries arriving from multiple channels. The system captures the first contact, records course preference and source, assigns a counsellor, schedules follow-ups, tracks ageing, and reports funnel performance.

### 2. User roles
- Admin: system-wide access and lead administration.
- Manager: visibility across counsellors and admission funnel.
- Counsellor: manage assigned leads and follow-ups.

### 3. Architecture
React/Vite frontend → REST API (Express) → Mongoose data layer → MongoDB.

The frontend keeps presentation and interaction logic separate from API calls. The backend owns validation, authentication, lifecycle rules and aggregation. MongoDB stores flexible lead and follow-up records.

### 4. Core entities
User:
- name, email, password hash, role, active

Lead:
- identity/contact information
- source
- course and intake preference
- qualification
- status and priority
- counsellor
- notes
- last contact / next follow-up
- conversion value
- follow-up history
- timestamps

### 5. Lifecycle
New → Contacted → Qualified → Counselling Scheduled → Application Started → Application Submitted → Converted.

Terminal alternatives: Not Interested, Lost, Deferred.

### 6. Key business logic
- Counsellor assignment is stored against each lead.
- Counsellors only access their assigned leads.
- Ageing is derived from `createdAt`, avoiding stale stored values.
- Follow-up records are appendable history; completion is explicit.
- Dashboard counts are computed from the current database.
- Converted leads store `convertedAt` and optional conversion value.

### 7. API design
REST endpoints are grouped by resource:
- `/api/auth`
- `/api/leads`
- `/api/users`
- `/api/dashboard`

Errors use HTTP status codes with a consistent JSON message.

### 8. Validation
Required lead fields: name, phone, course, source.
Follow-ups require a scheduled date and valid contact mode.
Status/source values are constrained using Mongoose enums.

### 9. Trade-offs
MongoDB was selected because admission lead records can evolve with institution-specific fields and follow-up structures. A relational database would provide stronger joins and reporting guarantees, but MongoDB keeps the assignment compact and flexible.

JWT keeps the API stateless and simple for an assignment. A production implementation should add refresh-token rotation, stronger session controls, rate limiting and audit logs.

### 10. Reporting
Dashboard provides:
- total leads
- converted leads
- conversion rate
- follow-ups due today
- overdue follow-ups
- conversion value
- status distribution
- source distribution

### 11. Edge cases
- Missing lead or follow-up returns 404.
- Duplicate-looking enquiries are not silently merged; production systems should add duplicate detection based on phone/email.
- Counsellor users cannot view another counsellor's leads.
- Counsellors cannot delete leads.
- Converted status automatically gets a conversion timestamp.

### 12. AI/tool usage
AI assistance may be used for code scaffolding, test-case brainstorming, documentation structure and debugging explanations. Business rules and final implementation should be reviewed and validated by the developer.
