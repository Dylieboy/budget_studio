# Deployment

This app is split into two hosted pieces:

- **Railway** runs the Python API and Postgres database.
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
   - `railway.json`
   - `vercel.json`

## 2. Create the API Service on Railway

1. Open Railway.
2. Create a new project.
3. Choose **Deploy from GitHub repo**.
4. Select your `budget-studio` repository.
5. Railway will read `railway.json`.
6. Confirm these settings if Railway asks:

```text
Build Command: pip install -r requirements.txt
Start Command: python server.py
Healthcheck Path: /api/health
```

7. Open the API service **Variables** tab.
8. Add:

```text
COOKIE_SECURE=true
COOKIE_SAMESITE=None
CORS_ORIGINS=https://your-vercel-app.vercel.app
```

Do not add `PORT`; Railway provides it automatically.

## 3. Add Postgres on Railway

1. In the same Railway project, click **+ New**.
2. Add a **PostgreSQL** database.
3. Open your Python API service.
4. Add or link this variable:

```text
DATABASE_URL=${{Postgres.DATABASE_URL}}
```

If Railway named the database service something else, use that service name instead of `Postgres`.

5. Redeploy the Python API service.
6. Open this URL after deploy finishes:

```text
https://your-railway-api.up.railway.app/api/health
```

It should show:

```json
{"ok": true}
```

## 4. Deploy the Frontend on Vercel

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

## 5. Connect Vercel to Railway

1. Copy your Railway API public URL, for example:

```text
https://budget-studio-api.up.railway.app
```

2. Update `config.js`:

```js
window.BUDGET_API_BASE_URL = "https://budget-studio-api.up.railway.app";
```

3. Push that change to GitHub.
4. Vercel will redeploy automatically.
5. Go back to Railway and update the API service variable:

```text
CORS_ORIGINS=https://budget-studio.vercel.app
```

6. Redeploy or restart the Railway API service.

## 6. Test Production

1. Open your Vercel URL.
2. Create a new account.
3. Confirm the dashboard starts empty.
4. Add one transaction, one debt note, and one savings goal.
5. Log out.
6. Log back in and confirm the data is still there.
7. Create a second account and confirm it starts empty.

## Local Development

The production backend expects Postgres. Set `DATABASE_URL` before running locally:

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
- Railway provides `PORT` automatically; the server uses it.
- Railway Postgres provides `DATABASE_URL`; the API uses it.
- If login cookies do not behave reliably across `vercel.app` and `up.railway.app`, use custom domains later, such as `app.yourdomain.com` and `api.yourdomain.com`.
