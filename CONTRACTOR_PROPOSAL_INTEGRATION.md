# Contractor Proposal Submission Integration Guide

## 🔗 How the Flow Works

### 1️⃣ View Available Tenders (ContractorDashboard)

```
User navigates to: /contractor/dashboard

Flow:
  ├─ ContractorDashboard.jsx loads
  ├─ useEffect → calls getTenderById() from tenderApi.js
  ├─ Backend endpoint: GET /api/v1/tenders
  ├─ Filters & displays tenders by category/search
  └─ Each tender has "Submit Bid" button → navigates to /contractor/submit-proposal/:id
```

**Fields Displayed:**

- Tender ID (from database)
- Title
- Location
- Deadline
- Budget
- Days left

---

### 2️⃣ Submit Proposal (SubmitProposal Page)

```
User clicks: "Submit Bid" on a tender

URL: /contractor/submit-proposal/:id
  where :id = tender ID

Flow:
  ├─ SubmitProposal.jsx mounts
  ├─ useParams() extracts :id → tenderId
  ├─ useEffect calls getTenderById(tenderId)
  ├─ Displays tender details at top of page
  ├─ User uploads 4 required files + 1 optional
  ├─ On Submit button click:
  │   ├─ Validates all 4 required files are selected
  │   ├─ Calls submitProposal(tenderId, files)
  │   ├─ Creates FormData with all files
  │   └─ POST to /api/v1/tenders/{tenderId}/submissions
  └─ Backend creates TenderSubmissions + SubmissionFiles records
```

**Required Files:**

1. Technical Proposal (.pdf, .doc, .docx)
2. Financial Proposal (.pdf, .xlsx, .xls)
3. BOQ Pricing Sheet (.xlsx, .xls)
4. Certificates & Licenses (.pdf)

**Optional Files:** 5. Company Documents (.pdf, .doc, .docx)

---

## 🛠️ Testing Steps

### Step 1: Start Both Servers

```bash
# Terminal 1: Backend (port 8000)
cd e:\Iti6month\Graduation Project\Graduation_project
python manage.py runserver

# Terminal 2: Frontend (port 5173)
cd frontend
npm run dev
```

### Step 2: Create Tenders (as Owner)

```bash
1. Sign in as Owner at /signin
2. Go to /owner/dashboard → Create Tender
3. Fill form and click Create
4. Note the tender ID or just check dashboard
```

### Step 3: Sign In as Contractor

```bash
1. Sign out (or open incognito window)
2. Go to /signin → Sign Up as Contractor
3. Create contractor account
```

### Step 4: View Available Tenders

```bash
1. Visit /contractor/dashboard
2. Should see list of all tenders created by owner
3. Each tender shows:
   - Title
   - Location
   - Deadline
   - Days remaining
   - "Submit Bid" button
```

### Step 5: Submit Proposal

```bash
1. Click "Submit Bid" on any tender
   → URL becomes /contractor/submit-proposal/:id
2. Should see tender details at top:
   - Tender Title
   - Deadline (formatted date)
   - Budget ($X,XXX)
   - Location
3. Upload required files:
   - Technical Proposal (any .pdf or .docx)
   - Financial Proposal (any .pdf or .xlsx)
   - BOQ Pricing (any .xlsx)
   - Certificates (any .pdf)
4. Progress bar updates as you upload
5. Click "Submit Proposal" button
6. Success message → redirects to dashboard
```

---

## 📁 Files Modified/Created

### Frontend

- **src/services/proposalApi.js** (NEW)
  - `submitProposal(tenderId, files)` - POST submission with multipart files
  - `getMySubmissions()` - GET user's submissions
  - `getSubmissionDetail(tenderId, submissionId)` - GET submission details

- **src/pages/SubmitProposal.jsx** (MODIFIED)
  - Now accepts URL parameter `:id` (tender ID)
  - Dynamically loads tender details on mount
  - Displays tender info (title, deadline, budget, location)
  - Calls submitProposal() on form submission
  - Handles loading states, errors, and success redirect

### Backend (No changes needed)

- POST /api/v1/tenders/{tender_id}/submissions
  - Already handles multipart file uploads
  - Creates TenderSubmissions + SubmissionFiles records
  - Requires authentication (JWT token)

---

## 🐛 Common Issues & Solutions

### Issue: 401 Unauthorized

**Cause**: Token expired or missing
**Fix**:

- Check localStorage has `accessToken` and `refreshToken`
- Sign in again
- Check that /signin properly stores tokens

### Issue: 404 Tender Not Found

**Cause**: Tender ID doesn't exist
**Fix**:

- Ensure owner created tender at /owner/create-tender
- Try a different tender ID

### Issue: Files not uploading

**Cause**: File type not supported
**Fix**:

- Check file extension matches accepted types
- Technical: .pdf, .doc, .docx
- Financial: .pdf, .xlsx, .xls
- BOQ: .xlsx, .xls
- Certificates: .pdf

### Issue: Submit button disabled

**Cause**: Not all 4 required files uploaded
**Fix**:

- Upload exactly 4 required files
- Optional file is... optional

---

## 📊 Data Flow Diagram

```
ContractorDashboard
    ↓ (click "Submit Bid")
    ↓
/contractor/submit-proposal/:id
    ↓
SubmitProposal.jsx
    ├─ useParams() → extract tenderId
    ├─ getTenderById(tenderId) → display tender info
    ├─ User uploads files
    └─ submitProposal(tenderId, files)
        ↓
        POST /api/v1/tenders/{tenderId}/submissions
        ↓
        Backend: TenderSubmissionsView.post()
        ├─ Create TenderSubmissions record
        ├─ Create SubmissionFiles for each file
        ├─ Fire tender_files_uploaded signal
        └─ AI processing starts
        ↓
    Success → redirect /contractor/dashboard
```

---

## ✅ Verification Checklist

- [ ] Frontend dev server running on port 5173
- [ ] Backend running on port 8000
- [ ] Owner signed in and created at least 1 tender
- [ ] Contractor signed in
- [ ] Can see tenders on /contractor/dashboard
- [ ] Can navigate to /contractor/submit-proposal/:id
- [ ] Can upload all 4 required files
- [ ] Can submit proposal
- [ ] Backend returns 201 success
- [ ] Can see submission in backend database
