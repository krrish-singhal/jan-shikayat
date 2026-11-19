# JanShikayat (जन शिकायत) 
> **Municipal Citizen Grievance Redressal & Civic Complaint Management System**  
> An open-source, multilingual, full-stack municipal governance platform designed to bridge citizens and local municipal corporations for transparent, SLA-driven civic issue resolution.
---
## Key Features
### Multi-Role Civic Governance Workflow
- **Citizens:**
  - Lodge complaints with geo-tagging (GPS coordinates & landmark address) and image evidence.
  - Track real-time progress via unique ticket IDs (`CMP-YYYY-XXXXXX`).
  - View municipal public notices and emergency announcements.
  - Multi-language portal support with automatic translation of remarks and updates.
- **Department Operators:**
  - Triage incoming ward-level grievances.
  - Forward validated complaints to available Joint Engineers.
  - Cross-department routing or rejection with mandatory remarks.
- **Joint Engineers (Field Staff):**
  - Verification queue for on-ground inspection.
  - Claim/pickup cases with active workload capacity capping (prevents engineer overload).
  - Submit site verification reports, start execution, and upload resolution proof photos.
- **Municipal Administrators:**
  - Comprehensive city-wide dashboard with real-time analytics and charts (by ward, department, status).
  - Manage municipal departments and staff accounts with auto-sequenced IDs (`ADM-XXXX`, `OP-XXXX`, `ENG-XXXX`).
  - Publish public notices and approve staff announcement requests.
  - Immutable audit trail logging for all administrative actions and status overrides.
### AI-Powered Multilingual Redressal (AI4Bharat IndicTrans2)
- Supports **2 Indian Languages + English**:
  - Hindi (`hi`) and English (`en`).
- **Dynamic Translation & Language Detection:** Complaint descriptions, operator notes, field verification remarks, and resolution notes are translated dynamically using an AI4Bharat IndicTrans2 microservice.
- **Smart Translation Caching:** MongoDB-backed cache minimizes compute overhead and latency.
- **Graceful Degradation:** If the microservice is offline, the core application continues uninterrupted using the original text.
### Rigid Complaint Lifecycle State Machine
```
[SUBMITTED] 
    │
    ├── (Operator Rejects) ──────────────────────> [REJECTED]
    │
    └── (Operator Forwards) ───────────────> [VERIFICATION_NEEDED]
                                                          │
    ┌──────────────── (Engineer Pickups) ─────────────────┘
    ▼
[VERIFICATION_IN_PROGRESS]
    │
    ├── (Engineer Denies / Rejects) ─────────────> [REJECTED]
    │
    └── (Engineer Approves & Site Verified) ─────> [APPROVED]
                                                          │
    ┌──────────────── (Engineer Starts Work) ─────────────┘
    ▼
[WORK_IN_PROGRESS]
    │
    └── (Engineer Submits Resolution Photo) ─────> [COMPLETED]
```

### Department Operator (`/api/v1/operator`)
- `GET /operator/complaints` - Queue of incoming complaints in operator's department
- `GET /operator/engineers` - List available Joint Engineers in the department
- `POST /operator/complaints/:id/forward` - Forward complaint to a Joint Engineer
- `POST /operator/complaints/:id/reject` - Reject complaint with remarks
- `GET /operator/stats` - Department statistics and overview
### Joint Engineer (`/api/v1/engineer`)
- `GET /engineer/queue` - Queue of complaints awaiting verification
- `GET /engineer/my-cases` - Active cases assigned to the engineer
- `POST /engineer/complaints/:id/pickup` - Claim a complaint for verification
- `POST /engineer/complaints/:id/verify` - Approve after on-site verification
- `POST /engineer/complaints/:id/deny` - Reject with verification remarks
- `POST /engineer/complaints/:id/start-work` - Move approved case to in-progress
- `POST /engineer/complaints/:id/complete` - Mark case resolved (upload proof)
- `GET /engineer/stats` - Engineer workload and performance stats
### Municipal Administrator (`/api/v1/admin`)
- `GET /admin/stats` - City-wide grievances, resolution times, departmental health
- `GET /admin/complaints` - View all municipal complaints with advanced filtering
- `POST /admin/complaints/:id/override` - Admin override of complaint status
- `POST /admin/complaints/:id/reassign` - Reassign complaint to another engineer/department
- `GET /admin/staff` - List all staff accounts
- `POST /admin/staff` - Create new operator or joint engineer account
- `PATCH /admin/staff/:id` - Update staff account or status
- `GET /admin/departments` - Manage municipal departments
- `POST /admin/departments` - Create new department
- `GET /admin/audit-logs` - Inspect system audit logs
### Public Notices (`/api/v1/notices` & `/api/v1/notice-requests`)
- `GET /notices` - Fetch published public notices
- `POST /notices` - Publish an official notice (Admin only)
- `POST /notice-requests` - Request a notice publication (Staff)
- `PATCH /notice-requests/:id` - Approve or reject notice requests (Admin)
### Translation (`/api/v1`)
- `POST /translate` - Translate dynamic text between supported languages
- `POST /detect-language` - Detect source text language
- `GET /supported-languages` - List all 12 supported Indic languages
### System Health
- `GET /api/v1/health` - Check backend system health status
---
## Running Tests
The test suite covers authentication, role authorization, complaint state machine transitions, and multilingual capabilities.
```bash
cd server
npm test
```
