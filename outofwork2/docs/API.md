# API Documentation

## Authentication

All API routes require authentication via Supabase Auth. Include the session token in the request headers.

### Headers
```
Authorization: Bearer <session_token>
Content-Type: application/json
```

### Error Responses
- `401 Unauthorized` - Missing or invalid authentication
- `400 Bad Request` - Invalid request body or parameters
- `500 Internal Server Error` - Server-side error

---

## Cases API

### List Cases
```
GET /api/cases
```

Returns all cases where the user is the creator or assigned advocate.

**Response:**
```json
[
  {
    "id": "uuid",
    "case_number": "CASE-2024-001",
    "title": "Case Title",
    "description": "Case description",
    "status": "active",
    "case_type": "civil",
    "court": "District Court",
    "client": { "id": "uuid", "full_name": "Client Name" },
    "assigned": { "full_name": "Advocate Name", "email": "email@example.com" },
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

### Create Case
```
POST /api/cases
```

**Request Body:**
```json
{
  "title": "Case Title",
  "description": "Case description",
  "case_type": "civil",
  "court": "District Court",
  "client_id": "uuid",
  "assigned_to": "uuid",
  "total_fee": 50000
}
```

### Get Case by ID
```
GET /api/cases/[id]
```

### Update Case
```
PUT /api/cases/[id]
```

### Delete Case (Soft Delete)
```
DELETE /api/cases/[id]
```

---

## Clients API

### List Clients
```
GET /api/clients
```

Returns all clients created by the authenticated user.

**Response:**
```json
[
  {
    "id": "uuid",
    "full_name": "Client Name",
    "email": "client@example.com",
    "phone": "+91-9876543210",
    "address": "Client Address",
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

### Create Client
```
POST /api/clients
```

**Request Body:**
```json
{
  "full_name": "Client Name",
  "email": "client@example.com",
  "phone": "+91-9876543210",
  "address": "Client Address"
}
```

### Get Client by ID
```
GET /api/clients/[id]
```

### Update Client
```
PUT /api/clients/[id]
```

### Delete Client (Soft Delete)
```
DELETE /api/clients/[id]
```

---

## Invoices API

### List Invoices
```
GET /api/invoices
```

**Response:**
```json
[
  {
    "id": "uuid",
    "invoice_number": "INV-2024-001",
    "amount": 10000,
    "tax_amount": 1800,
    "gst_rate": 18,
    "status": "pending",
    "description": "Legal consultation",
    "due_date": "2024-02-01",
    "client": { "full_name": "Client Name" },
    "case": { "title": "Case Title", "case_number": "CASE-2024-001" },
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

### Create Invoice
```
POST /api/invoices
```

**Request Body:**
```json
{
  "client_id": "uuid",
  "case_id": "uuid",
  "amount": 10000,
  "gst_rate": 18,
  "description": "Legal consultation",
  "due_date": "2024-02-01"
}
```

### Get Invoice by ID
```
GET /api/invoices/[id]
```

### Update Invoice
```
PUT /api/invoices/[id]
```

### Delete Invoice
```
DELETE /api/invoices/[id]
```

---

## Payments API

### List Payments
```
GET /api/payments
```

**Response:**
```json
[
  {
    "id": "uuid",
    "amount": 10000,
    "payment_method": "online",
    "payment_date": "2024-01-15",
    "razorpay_payment_id": "pay_xxx",
    "client": { "full_name": "Client Name" },
    "case": { "title": "Case Title" },
    "status": "completed"
  }
]
```

### Create Payment
```
POST /api/payments
```

**Request Body:**
```json
{
  "client_id": "uuid",
  "case_id": "uuid",
  "amount": 10000,
  "payment_method": "online",
  "razorpay_payment_id": "pay_xxx",
  "razorpay_order_id": "order_xxx"
}
```

### Razorpay Webhook
```
POST /api/payments/razorpay
```

Handles Razorpay payment verification and updates.

---

## Documents API

### List Documents
```
GET /api/documents?case_id=uuid
```

Optional query parameter: `case_id` to filter by case.

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Document Name",
    "file_url": "https://storage.example.com/file.pdf",
    "file_type": "application/pdf",
    "file_size": 1024,
    "case": { "id": "uuid", "case_number": "CASE-2024-001", "title": "Case Title" },
    "uploader": { "full_name": "User Name" },
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

### Upload Document
```
POST /api/documents
```

**Request Body:**
```json
{
  "name": "Document Name",
  "file_url": "https://storage.example.com/file.pdf",
  "file_type": "application/pdf",
  "file_size": 1024,
  "case_id": "uuid"
}
```

### Get Document by ID
```
GET /api/documents/[id]
```

### Delete Document
```
DELETE /api/documents/[id]
```

---

## AI API

### Case Analysis
```
POST /api/ai/analyze
```

**Request Body:**
```json
{
  "caseId": "uuid",
  "title": "Case Title",
  "description": "Case description",
  "caseType": "civil",
  "court": "District Court"
}
```

**Response:**
```json
{
  "analysis": "AI-generated analysis...",
  "relevant_sections": [...],
  "precedents": [...],
  "recommendations": [...]
}
```

### Legal Research
```
POST /api/ai/research
```

**Request Body:**
```json
{
  "query": "Search query",
  "act": "Indian Contract Act",
  "section": "Section 73"
}
```

**Response:**
```json
{
  "results": [
    {
      "title": "Result Title",
      "content": "Result content...",
      "relevance": 0.95
    }
  ]
}
```

---

## Other APIs

### Hearings
```
GET /api/hearings
POST /api/hearings
```

### Reminders
```
GET /api/reminders
POST /api/reminders
```

### Tags
```
GET /api/tags
POST /api/tags
```

### Time Entries
```
GET /api/time-entries
POST /api/time-entries
```

### Reports
```
GET /api/reports
```

### Audit Log
```
GET /api/audit
```

---

## Database Schema

See `supabase/complete-schema.sql` for the complete database schema.

### Key Tables
- `profiles` - User profiles
- `clients` - Client information
- `cases` - Legal cases
- `invoices` - Billing invoices
- `payments` - Payment records
- `documents` - File attachments
- `hearings` - Court hearings
- `reminders` - Scheduled reminders
- `audit_logs` - Audit trail
