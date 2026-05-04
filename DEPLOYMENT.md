# Deployment

This version deploys everything from one Vercel project:

- Static frontend files: `index.html`, `styles.css`, `app.js`
- API routes: `api/*.js`
- Database: Vercel Marketplace Postgres, such as Neon

`config.js` should stay empty for Vercel because the frontend and API use the same domain:

```js
window.BUDGET_API_BASE_URL = "";
```

## 1. Push the Project to GitHub

1. Create a new GitHub repository, for example `budget-studio`.
2. Push this folder to that repository.
3. Confirm these files are in GitHub:
   - `index.html`
   - `styles.css`
   - `app.js`
   - `config.js`
   - `package.json`
   - `vercel.json`
   - `api/health.js`
   - `api/signup.js`
   - `api/login.js`
   - `api/logout.js`
   - `api/me.js`
   - `api/data.js`
   - `api/_lib.js`

## 2. Deploy on Vercel

1. Open Vercel.
2. Choose **Add New Project**.
3. Import your GitHub repo.
4. Use these settings:

```text
Framework Preset: Other
Build Command: leave empty
Output Directory: leave empty
Install Command: npm install
```

5. Click **Deploy**.

## 3. Add the Database on Vercel

1. Open your Vercel project.
2. Go to **Storage** or **Marketplace**.
3. Add a **Postgres** database. Neon is the usual Vercel Marketplace option.
4. Connect the database to this Vercel project.
5. Confirm Vercel adds this environment variable:

```text
DATABASE_URL
```

6. Redeploy the project after the database is connected.

## 4. Test the API

After redeploying, open:

```text
https://your-vercel-app.vercel.app/api/health
```

It should show:

```json
{"ok": true}
```

## 5. Test the App

1. Open your Vercel app URL.
2. Create a new account.
3. Confirm the dashboard starts empty.
4. Add one transaction, one debt note, and one savings goal.
5. Log out.
6. Log back in and confirm the data is still there.
7. Create a second account and confirm it starts empty.

## Local Development

For a full local API test, install dependencies and set `DATABASE_URL`:

```powershell
npm install
$env:DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE"
```

Then run with Vercel CLI:

```powershell
npx vercel dev
```

Open:

```text
http://localhost:3000
```

## Notes

- Railway and Render are no longer needed.
- The old local SQLite file is no longer used.
- The old Python server is no longer used.
- User data is stored in Postgres as one JSON document per account.
- Passwords are hashed before storage.
