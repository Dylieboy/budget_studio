# Deployment

This app is split into two hosted pieces:

- **Render** runs the Python API and Postgres database.
- **Vercel** hosts the static frontend files.

## 1. Push the Project to GitHub

1. Create a new GitHub repository, for example `budget-studio`.
2. Push this folder to that repository.
3. Confirm these files are in GitHub:
   - `index.html`
   - `styles.css`
   - `app.js`
   - `config.js`
   - `server.py`
   - `requirements.txt`
   - `render.yaml`
   - `vercel.json`

## 2. Deploy the API and Database on Render

1. Open Render and choose **New +**.
2. Choose **Blueprint**.
3. Connect your GitHub repository.
4. Select this repo and let Render read `render.yaml`.
5. Render should create:
   - a Python web service named `budget-studio-api`
   - a Postgres database named `budget-studio-db`
6. In the API service, set or confirm these environment variables:

```text
HOST=0.0.0.0
COOKIE_SECURE=true
COOKIE_SAMESITE=None
CORS_ORIGINS=https://your-vercel-app.vercel.app
DATABASE_URL=<filled automatically from Render Postgres>
```

7. Deploy the Render service.
8. Open this URL after deploy finishes:

```text
https://your-render-api.onrender.com/api/health
```

It should show:

```json
{"ok": true}
```

## 3. Deploy the Frontend on Vercel

1. Open Vercel and choose **Add New Project**.
2. Import the same GitHub repository.
3. Use these settings:

```text
Framework Preset: Other
Build Command: leave empty
Output Directory: leave empty
Install Command: leave empty
```

4. Deploy.
5. Copy the final Vercel production URL, for example:

```text
https://budget-studio.vercel.app
```

## 4. Connect Vercel to Render

1. Copy your Render API URL, for example:

```text
https://budget-studio-api.onrender.com
```

2. Update `config.js`:

```js
window.BUDGET_API_BASE_URL = "https://budget-studio-api.onrender.com";
```

3. Push that change to GitHub.
4. Vercel will redeploy automatically.
5. Go back to Render and update `CORS_ORIGINS` to your exact Vercel URL:

```text
https://budget-studio.vercel.app
```

6. Redeploy or restart the Render API.

## 5. Test Production

1. Open your Vercel URL.
2. Create a new account.
3. Confirm the dashboard starts empty.
4. Add one transaction, one debt note, and one savings goal.
5. Log out.
6. Log back in and confirm the data is still there.
7. Create a second account and confirm it starts empty.

## Local Development

The production backend now expects Postgres. Set `DATABASE_URL` before running locally:

```powershell
$env:DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE"
python server.py
```

Then open:

```text
http://127.0.0.1:8000
```

Keep `config.js` empty for local same-origin testing:

```js
window.BUDGET_API_BASE_URL = "";
```

## Notes

- The old local SQLite file is no longer used.
- No migration from SQLite is included.
- If login cookies do not behave reliably across `vercel.app` and `onrender.com`, use custom domains later, such as `app.yourdomain.com` and `api.yourdomain.com`.
