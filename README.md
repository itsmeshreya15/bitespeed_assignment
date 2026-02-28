# 🚀 Bitespeed Backend Task – Identity Reconciliation

This project is a **Node.js + TypeScript** implementation of the Bitespeed Backend Task for Identity Reconciliation.

It exposes a single endpoint:

```
POST /identify
```

that consolidates customer identities across multiple purchases based on email and phone number matching rules.

---

## 🌐 Live Hosted API

**Base URL**

https://bitespeed-assignment-l8a5.onrender.com

**Endpoint**

```
POST https://bitespeed-assignment-l8a5.onrender.com/identify
```

---

## 🛠 Tech Stack

- Node.js (TypeScript)
- Express
- SQLite (better-sqlite3)
- Render (Cloud Deployment)

---

## 📡 API Usage

### Request

**POST /identify**

Content-Type: `application/json`

```json
{
  "email": "lorraine@hillvalley.edu",
  "phoneNumber": "123456"
}
```

---

### Response

```json
{
  "contact": {
    "primaryContactId": 1,
    "emails": [
      "lorraine@hillvalley.edu",
      "mcfly@hillvalley.edu"
    ],
    "phoneNumbers": [
      "123456"
    ],
    "secondaryContactIds": [2]
  }
}
```

---

## 🧠 Business Logic Summary

The service:

- Creates a **primary contact** if no match exists
- Creates a **secondary contact** if new information matches an existing identity
- Maintains the **oldest contact as the canonical primary**
- Merges multiple identities when overlap is detected
- Returns:
  - Primary Contact ID
  - All unique emails
  - All unique phone numbers
  - All secondary contact IDs

---

## 🧪 Example Test Cases

### 1️⃣ First Order

```json
{
  "email": "lorraine@hillvalley.edu",
  "phoneNumber": "123456"
}
```

### 2️⃣ Same Phone, New Email

```json
{
  "email": "mcfly@hillvalley.edu",
  "phoneNumber": "123456"
}
```

### 3️⃣ Lookup Using Only Phone

```json
{
  "phoneNumber": "123456"
}
```

All return the same consolidated contact object.

---

## ▶ Running Locally

```bash
npm install
npm run dev
```

Runs at:

```
http://localhost:3000/identify
```

---

## ☁ Deployment (Render)

- Environment: Node
- Build Command:
  ```
  npm install && npm run build
  ```
- Start Command:
  ```
  npm start
  ```

Render automatically sets `PORT` using `process.env.PORT`.

---

## 📸 Screenshots

### ✅ Successful API Response (Postman)

![Postman Success](./screenshots/postman-success.png)

### ☁ Render Deployment

![Render Deployment](./screenshots/render-deployment.png)

---

## 📌 Submission Links

Hosted Endpoint:
https://bitespeed-assignment-l8a5.onrender.com/identify

GitHub Repository:
(Add your repository link here)
