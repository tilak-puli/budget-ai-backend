## Finly Backend (Firebase Functions)

Backend for the Android app Finly – AI Expense Tracker. It powers AI-assisted expense entry, budgeting, subscriptions, quotas, and app initialization APIs.

App on Google Play: [Finly – AI Expense Tracker][playstore]

### Tech stack

- **Runtime**: Firebase Cloud Functions v2 (Node 18), Express
- **Data**: Google Cloud Firestore
- **Auth**: Firebase Authentication (ID tokens)
- **AI**: LangChain with Gemini 2.0 Flash

### Repository layout

```
budget-ai-backend/
  firebase.json
  functions/
    index.js                 # Exposes HTTP function and a scheduled job
    package.json             # Firebase functions project scripts
    app/
      main.js                # Express app: mounts routes and middleware
      index.js               # Local dev entry (node index.js)
      package.json           # App runtime deps used by the Express app
      src/
        routes/              # Routers (expenses, budgets, subscriptions, etc.)
        controllers/         # Request handlers
        middleware/          # Firebase auth middleware
        db/                  # Firestore access layers
        service/             # Domain services (AI, quota, subscriptions)
        utils/               # Helpers + LangChain config/tools
```

### Cloud Functions

- `backend` (HTTPS) – wraps the Express app
- `verifySubscriptions` (Scheduled, 02:00 UTC daily) – verifies active subscriptions

### Base URL

When deployed with Firebase Functions, the Express app is exposed at:

```
https://<REGION>-<PROJECT_ID>.cloudfunctions.net/backend
```

All routes below are relative to that base URL.

### Authentication

- Protected endpoints require a Firebase ID token in the `Authorization` header: `Authorization: Bearer <ID_TOKEN>`
- The middleware verifies tokens using Firebase Admin and sets `req.firebaseToken`

### Endpoints

- Public

  - `GET /health` – health check
  - `GET /privacy-policy` – privacy policy page
  - `GET /terms-and-conditions` – terms page
  - `POST /subscriptions/notifications` – Google Play RTDN webhook

- App (requires auth)

  - `GET /init` – initialize client: expenses, quota, budget, feature flags
  - `POST /report-ai-expense` – submit feedback about AI parsing

- Expenses (requires auth)

  - `GET /expenses?fromDate&toDate`
  - `POST /expenses` – create expense `{ expense: { category, description, amount, date } }`
  - `PATCH /expenses` – update `{ expense: { _id, category, description, amount, date } }`
  - `DELETE /expenses` – delete `{ id }`
  - `POST /ai/expense` – AI-create from `userMessage` (+ optional `previousMessages`)
  - `GET /messages` – list prior user/AI messages (+stats)
  - `GET /messages/conversation` – recent conversation slice

- Budget (requires auth)

  - `GET /budgets` – get current budget or defaults
  - `GET /budgets/summary?month&year` – budget vs actuals for month
  - `POST /budgets/total` – set total; scales categories proportionally
  - `POST /budgets/category` – set one category amount
  - `POST /budgets/categories` – set many categories at once
  - `DELETE /budgets` – delete user budget

- Subscriptions & quotas (requires auth unless noted)
  - `POST /subscriptions/verify-purchase` – verify Android purchase
  - `GET /subscriptions/status` – subscription status
  - `GET /subscriptions/message-quota` – current daily quota status
  - Admin (requires `req.firebaseToken.admin === true`):
    - `GET /admin/subscription-analytics`
    - `POST /admin/manage-quotas` – `{ action: "reset"|"reset_all"|"get_all", userId? }`

### Quick start (local)

Prereqs: Node 18, Firebase CLI, a Firebase project with Firestore enabled.

1. Install dependencies

```
cd functions/app && npm i
cd .. && npm i
```

2. Configure credentials

- Firebase Admin (used by auth middleware): place a service account JSON at
  `functions/app/src/middleware/auth/firebaseKey.json` (not committed)
- Firestore access locally: either run the Firestore emulator or set
  `GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/gcp-sa.json`
- Google Play API (for subscription verification): set ONE of
  - `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` (env var with full JSON)
  - `GOOGLE_PLAY_SERVICE_ACCOUNT_KEY_PATH=/absolute/path/to/google-play-service-account.json`

3a) Run full Functions emulator (recommended)

```
cd functions
npm run serve
```

The HTTP function will be available under the emulator base URL it prints.

3b) Run the Express app standalone (simple local dev)

```
cd functions/app
npm run dev
```

Serves on `http://localhost:3000`.

### Deployment

```
cd functions
npm run deploy
```

Notes:

- `functions/package.json` runs `predeploy` to install `app` deps
- Make sure the Functions default service account has Android Publisher and Firestore access as needed

### Data model (Firestore)

- `expenses` – user expenses
- `users` – daily message usage (quota)
- `budgets` – total and per-category budgets
- `subscriptions` – platform subscription state per user
- `config/app_config` – feature flags and app config used by `/init`

### AI expense parsing

The AI endpoint `POST /ai/expense` uses LangChain + Gemini 2.0 Flash to parse free-text descriptions into structured expenses. It supports passing `previousMessages` to provide chat context in the request.

### Curl examples

Replace `<TOKEN>` with a Firebase ID token.

```
curl -H "Authorization: Bearer <TOKEN>" \
  "https://<REGION>-<PROJECT_ID>.cloudfunctions.net/backend/expenses"

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer <TOKEN>" \
  -d '{"expense":{"category":"Food","description":"Lunch","amount":250,"date":"2025-06-30"}}' \
  "https://<REGION>-<PROJECT_ID>.cloudfunctions.net/backend/expenses"

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer <TOKEN>" \
  -d '{"userMessage":"Spent 350 on Uber to office"}' \
  "https://<REGION>-<PROJECT_ID>.cloudfunctions.net/backend/ai/expense"
```

### Notes

- Do not commit service account keys. Use env vars or CI secrets.
- The repository includes a basic privacy/terms route used by the app store listings.
- Older MongoDB helpers exist but Firestore is the primary datastore in current code paths.

### License

Proprietary – all rights reserved unless otherwise stated.

[playstore]: https://play.google.com/store/apps/details?id=com.tilakpuli.budget_ai
