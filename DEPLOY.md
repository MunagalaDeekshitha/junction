# Deploying Junction Online (Free)

This puts your backend and frontend on the public internet so anyone with the link
can use it — not just your computer. We'll use two free services:
- **Render.com** — hosts the Flask backend
- **Vercel.com** — hosts the React frontend

Both have free tiers with no credit card required for this kind of small project.

---

## Part A — Put your code on GitHub first

Both hosting services deploy directly from a GitHub repository, so this is step zero.

1. Go to https://github.com and create a free account if you don't have one.
2. Click the **+** icon (top right) → **New repository**. Name it `junction`. Keep it Public. Click **Create repository**.
3. On your computer, in a terminal, go to your main `junction` folder:
   ```
   cd C:\Users\munag\OneDrive\Documents\junction
   ```
4. Run these commands one at a time:
   ```
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/junction.git
   git push -u origin main
   ```
   Replace `YOUR_USERNAME` with your actual GitHub username. It may open a browser window asking you to log in and authorize — do that.

   (If `git` isn't recognized, install it from https://git-scm.com/downloads first, restart your terminal, then retry.)

---

## Part B — Deploy the backend on Render

1. Go to https://render.com and sign up (you can sign up with your GitHub account — easiest option).
2. Click **New +** → **Web Service**.
3. Connect your GitHub account if asked, then select your `junction` repository.
4. Fill in these settings:
   - **Name:** `junction-backend` (or anything you like)
   - **Root Directory:** `backend`
   - **Runtime:** Python 3
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn app:app`
   - **Instance Type:** Free
5. Click **Create Web Service**. Wait a few minutes while it builds.
6. Once it's live, Render gives you a public URL like:
   ```
   https://junction-backend-xxxx.onrender.com
   ```
   **Copy this URL** — you'll need it in Part C.

Note: Render's free tier "sleeps" after 15 minutes of no traffic and takes ~30 seconds to
wake back up on the next visit. That's normal for a free prototype, not a bug.

---

## Part C — Point your frontend at the deployed backend

1. Open `junction-frontend/src/App.jsx` on your computer.
2. Find this line near the top:
   ```js
   const API_BASE = "http://127.0.0.1:5001/api";
   ```
3. Replace it with your Render URL + `/api`, for example:
   ```js
   const API_BASE = "https://junction-backend-xxxx.onrender.com/api";
   ```
4. Save the file.
5. Push this change to GitHub too:
   ```
   git add .
   git commit -m "Point frontend at deployed backend"
   git push
   ```

---

## Part D — Deploy the frontend on Vercel

1. Go to https://vercel.com and sign up with your GitHub account.
2. Click **Add New...** → **Project**.
3. Select your `junction` repository.
4. When it asks for the **Root Directory**, choose `junction-frontend`.
5. Leave the framework preset as **Vite** (it should auto-detect).
6. Click **Deploy**. Wait a minute or two.
7. You'll get a public link like:
   ```
   https://junction-frontend-xxxx.vercel.app
   ```

**That link is now shareable with anyone** — friends, professors, recruiters — and it'll
talk to your live backend on Render.

---

## Troubleshooting

- **"CORS error" in the deployed site:** the backend already allows all origins
  (`Access-Control-Allow-Origin: *"` in `app.py`), so this shouldn't happen — but if it
  does, double check `API_BASE` in `App.jsx` doesn't have a typo or trailing slash.
- **Backend URL loads but shows nothing:** visit `https://your-backend-url/api/health`
  directly — you should see `{"status":"ok"...}`. If that fails, check Render's "Logs"
  tab for the actual error.
- **Database resets:** the free Render tier's filesystem isn't permanent, so your SQLite
  database (`junction.db`) may reset on redeploys. That's fine for a demo; a real product
  would use Render's free PostgreSQL add-on instead — ask me if you want that upgrade.
