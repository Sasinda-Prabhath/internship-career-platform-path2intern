# Postman Testing Guide - Path2Intern Application

## Backend Base URL
```
http://localhost:5000
```

---

## 1️⃣ AUTHENTICATION ENDPOINTS

### Register New Student
**Method:** `POST`  
**URL:** `http://localhost:5000/api/auth/register`

**Headers:**
```
Content-Type: application/json
```

**Body (Raw JSON):**
```json
{
  "name": "John Doe",
  "email": "john@my.sliit.lk",
  "password": "Password123"
}
```

**Expected Response (201):**
```json
{
  "message": "Registered successfully. Please check your email for your verification code.",
  "user": {
    "id": "user_id_here",
    "name": "John Doe",
    "email": "john@my.sliit.lk",
    "globalRole": "STUDENT"
  }
}
```

---

### Verify Email (OTP)
**Method:** `POST`  
**URL:** `http://localhost:5000/api/auth/verify`

**Headers:**
```
Content-Type: application/json
```

**Body (Raw JSON):**
```json
{
  "email": "john@my.sliit.lk",
  "code": "123456"
}
```

**Expected Response (200):**
```json
{
  "message": "Email verified successfully",
  "user": {
    "id": "user_id_here",
    "name": "John Doe",
    "email": "john@my.sliit.lk",
    "globalRole": "STUDENT"
  }
}
```

---

### Login
**Method:** `POST`  
**URL:** `http://localhost:5000/api/auth/login`

**Headers:**
```
Content-Type: application/json
```

**Body (Raw JSON):**
```json
{
  "email": "john@my.sliit.lk",
  "password": "Password123"
}
```

**Expected Response (200):**
```json
{
  "message": "Login successful",
  "user": {
    "id": "user_id_here",
    "name": "John Doe",
    "email": "john@my.sliit.lk",
    "globalRole": "STUDENT",
    "moduleScopedRoles": []
  }
}
```

---

### Forgot Password
**Method:** `POST`  
**URL:** `http://localhost:5000/api/auth/forgot-password`

**Headers:**
```
Content-Type: application/json
```

**Body (Raw JSON):**
```json
{
  "email": "john@my.sliit.lk"
}
```

**Expected Response (200):**
```json
{
  "message": "Password reset code sent to your email. It will expire in 15 minutes."
}
```

---

### Reset Password
**Method:** `POST`  
**URL:** `http://localhost:5000/api/auth/reset-password`

**Headers:**
```
Content-Type: application/json
```

**Body (Raw JSON):**
```json
{
  "email": "john@my.sliit.lk",
  "code": "654321",
  "newPassword": "NewPassword456"
}
```

**Expected Response (200):**
```json
{
  "message": "Password reset successfully",
  "user": {
    "id": "user_id_here",
    "name": "John Doe",
    "email": "john@my.sliit.lk",
    "globalRole": "STUDENT"
  }
}
```

---

## 2️⃣ CONTACT US ENDPOINT

### Submit Contact Form
**Method:** `POST`  
**URL:** `http://localhost:5000/api/contact`

**Headers:**
```
Content-Type: application/json
```

**Body (Raw JSON):**
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "phone": "+94701234567",
  "message": "I have a question about the internship program."
}
```

**Expected Response (201):**
```json
{
  "message": "Contact form submitted successfully"
}
```

---

## 3️⃣ MODULE - SUBMIT QUESTION ENDPOINT

### Submit MCQ Question (Module Operator)
**Method:** `POST`  
**URL:** `http://localhost:5000/api/module/questions`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN_HERE
```

**Body (Raw JSON):**
```json
{
  "module": "DS",
  "questionText": "What is the difference between supervised and unsupervised learning?",
  "options": [
    { "label": "A", "text": "Supervised learning uses labeled data, unsupervised doesn't" },
    { "label": "B", "text": "They are the same thing" },
    { "label": "C", "text": "Supervised learning is faster" },
    { "label": "D", "text": "Unsupervised learning always gives better results" }
  ],
  "correctOption": "A",
  "explanation": "Supervised learning uses labeled data (input-output pairs) for training, while unsupervised learning discovers patterns in unlabeled data."
}
```

**Expected Response (201):**
```json
{
  "message": "Question submitted and is awaiting manager review.",
  "question": {
    "id": "question_id_here",
    "module": "DS",
    "questionText": "What is the difference between supervised and unsupervised learning?",
    "status": "pending",
    "submitterRole": "MODULE_OPERATOR"
  }
}
```

**Notes:**
- ✅ Module Operators' questions have status: `pending` (need manager approval)
- ✅ Module Managers' questions have status: `approved` (published immediately)
- ✅ Options MUST have exactly 4 items with labels A, B, C, D
- ✅ correctOption MUST be one of: A, B, C, D (not a number index)
- ✅ Valid modules: DS, SE, QA, BA, PM

---

### Submit MCQ Question (Module Manager)
**Method:** `POST`  
**URL:** `http://localhost:5000/api/module/questions`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN_HERE
```

**Body (Raw JSON):**
```json
{
  "module": "SE",
  "questionText": "What is the primary goal of the Agile methodology?",
  "options": [
    { "label": "A", "text": "To deliver working software incrementally and respond to change" },
    { "label": "B", "text": "To complete the entire project before testing" },
    { "label": "C", "text": "To minimize team collaboration" },
    { "label": "D", "text": "To reduce software quality for faster delivery" }
  ],
  "correctOption": "A",
  "explanation": "Agile methodology prioritizes incremental delivery of working software and flexibility to respond to changing requirements."
}
```

**Expected Response (201):**
```json
{
  "message": "Question published immediately (manager submission).",
  "question": {
    "id": "question_id_here",
    "module": "SE",
    "questionText": "What is the primary goal of the Agile methodology?",
    "status": "approved",
    "submitterRole": "MODULE_MANAGER"
  }
}
```

**Notes:**
- ✅ Module Manager questions are **published immediately** (status: `approved`)
- ✅ No waiting for review needed
- ✅ Same endpoint as Module Operator (`/api/module/questions`)
- ✅ Same body format with 4 options (A, B, C, D)

---

## 4️⃣ INTERVIEW SIMULATION ENDPOINTS

### Start Simulation (MCQ Quiz)
**Method:** `POST`  
**URL:** `http://localhost:5000/api/simulations/start`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN_HERE
```

**Body (Raw JSON):**
```json
{
  "moduleCode": "DS"
}
```

**Valid module codes:**
- `DS` - Data Science
- `SE` - Software Engineering
- `QA` - Quality Assurance
- `BA` - Business Analysis
- `PM` - Project Management

**Expected Response (201):**
```json
{
  "attemptId": "attempt_id_here",
  "startedAt": "2024-04-26T10:30:00Z",
  "expiresAt": "2024-04-26T10:45:00Z",
  "questions": [
    {
      "id": "q1",
      "difficulty": "EASY",
      "question": "What is machine learning?",
      "options": [
        "Option A",
        "Option B",
        "Option C",
        "Option D"
      ]
    }
  ]
}
```

---

### Submit Simulation Answers
**Method:** `POST`  
**URL:** `http://localhost:5000/api/simulations/{attemptId}/submit`

**Replace `{attemptId}` with the ID from the Start Simulation response**

**Headers:**
```
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN_HERE
```

**Body (Raw JSON):**
```json
{
  "answers": [
    { "id": "q1", "selectedIndex": 0 },
    { "id": "q2", "selectedIndex": 2 },
    { "id": "q3", "selectedIndex": 1 },
    { "id": "q4", "selectedIndex": 3 },
    { "id": "q5", "selectedIndex": 0 },
    { "id": "q6", "selectedIndex": 1 },
    { "id": "q7", "selectedIndex": 2 },
    { "id": "q8", "selectedIndex": 0 },
    { "id": "q9", "selectedIndex": 3 },
    { "id": "q10", "selectedIndex": 1 },
    { "id": "q11", "selectedIndex": 2 },
    { "id": "q12", "selectedIndex": 0 },
    { "id": "q13", "selectedIndex": 1 },
    { "id": "q14", "selectedIndex": 3 },
    { "id": "q15", "selectedIndex": 2 }
  ]
}
```

**Expected Response (200):**
```json
{
  "message": "Simulation submitted successfully",
  "results": {
    "correctCount": 12,
    "totalQuestions": 15,
    "score": 80,
    "timeTaken": 480,
    "breakdown": {
      "EASY": { "correct": 5, "total": 5 },
      "MEDIUM": { "correct": 5, "total": 7 },
      "HARD": { "correct": 2, "total": 3 }
    }
  }
}
```

---

## 5️⃣ HOW TO GET JWT TOKEN

### Step 1: Login
Use the **Login** endpoint above and copy the response.

### Step 2: Get Token from Cookie
The token is stored as an `authToken` cookie automatically. For Postman:
1. After login, go to **Cookies** tab in Postman
2. You'll see `authToken` cookie automatically set
3. OR copy it manually from the response headers

### Step 3: Use in Headers
For any authenticated endpoint, add:
```
Authorization: Bearer YOUR_JWT_TOKEN_HERE
```

---

## WORKFLOW SUMMARY

### For Students:
1. **Register** → Verify Email → **Login**
2. **Browse Home** (http://localhost:5173/)
3. **Submit Contact Form** (Contact Us page)
4. **Start Interview Simulation** (from Student Dashboard → Interview Simulation)
5. **Submit Answers** to complete the quiz

### For Module Operators:
1. **Login** with operator account
2. **Submit MCQ Question** via `/api/module/questions/submit`
3. **Start Interview Simulation** to practice

### For Module Managers:
1. **Login** with manager account
2. **Access Module Dashboard**
3. **Start Interview Simulation** to practice

---

## FRONTEND PAGES

| Page | URL |
|------|-----|
| Home | http://localhost:5173/ |
| Register | http://localhost:5173/register |
| Login | http://localhost:5173/login |
| Forgot Password | http://localhost:5173/forgot-password |
| Reset Password | http://localhost:5173/reset-password |
| Contact Us (Form) | http://localhost:5173/ (scroll down) |
| Submit Question | http://localhost:5173/module/submit-question |
| Start Quiz/Simulation | http://localhost:5173/simulation |
| Student Dashboard | http://localhost:5173/dashboard/student |
| Module Manager Dashboard | http://localhost:5173/dashboard/module-manager |
| Module Operator Dashboard | http://localhost:5173/dashboard/module-operator |

---

## NOTES FOR TESTING

⚠️ **Important:**
- Backend runs on `http://localhost:5000`
- Frontend runs on `http://localhost:5173`
- MCQ Quiz = Interview Simulation (same thing)
- Simulation has 15 questions, 15 minutes time limit
- OTP codes expire in 15 minutes
- Password reset codes expire in 15 minutes
- All module codes are: DS, SE, QA, BA, PM

✅ **Copy-paste ready!** Just replace email/passwords as needed.
