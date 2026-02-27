## Bitespeed Backend Task – Identity Reconciliation

This is a Node.js + TypeScript implementation of the Bitespeed identity reconciliation backend task.
It exposes a single endpoint `/identify` that consolidates customer identities across multiple orders,
following the rules described in the task PDF.

### Tech stack

- Node.js (TypeScript)
- Express
- SQLite via `better-sqlite3`

### Project structure

- `src/server.ts` – Express app and `/identify` route
- `src/contactService.ts` – Identity reconciliation logic
- `src/db.ts` – SQLite database setup (`contacts.db`)

### Running locally

1. Install dependencies:

```bash
npm install
```

2. Start the dev server:

```bash
npm run dev
```

3. The API will be available at:

```text
http://localhost:3000/identify
```

### `/identify` endpoint

- **Method**: `POST`
- **URL**: `/identify`
- **Body (JSON)**:

```json
{
  "email": "lorraine@hillvalley.edu",
  "phoneNumber": "123456"
}
```

- **Response (example)**:

```json
{
  "contact": {
    "primaryContactId": 1,
    "emails": ["lorraine@hillvalley.edu", "mcfly@hillvalley.edu"],
    "phoneNumbers": ["123456"],
    "secondaryContactIds": [2]
  }
}
```

The service:

- Creates a **primary** contact when no existing contact matches.
- Creates **secondary** contacts when new information is added for an existing identity.
- Ensures there is always **one canonical primary** per identity (oldest contact).
- Returns all unique emails, phone numbers, and secondary contact IDs for that primary.

### Example Postman requests

1. First order:

```json
POST http://localhost:3000/identify
{
  "email": "lorraine@hillvalley.edu",
  "phoneNumber": "123456"
}
```

2. Second order with same phone, new email:

```json
POST http://localhost:3000/identify
{
  "email": "mcfly@hillvalley.edu",
  "phoneNumber": "123456"
}
```

3. Lookup by only phone:

```json
POST http://localhost:3000/identify
{
  "phoneNumber": "123456"
}
```

All of these should return the same consolidated `contact` object.

### Deploying to Render

1. **Push this project to GitHub.**
2. Go to Render (`https://render.com`) → **New** → **Web Service**.
3. Connect your GitHub repo and select this project.
4. Use these settings:
   - **Environment**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
5. Render will set `PORT` automatically – the app already reads `process.env.PORT`, so no change is needed.
6. After deployment, you will get a URL like:

```text
https://your-service-name.onrender.com/identify
```

Use this URL in your submission form and in this README if required.

