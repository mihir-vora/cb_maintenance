# Submission Guide — CB Maintenance Case

Follow these steps in order to complete and submit the assignment.

---

## Step 1 — Review what was built (already done locally)

The Frappe custom app **`cb_maintenance`** is in:

`c:\Users\Mihir Vora\Downloads\cb_maintenance`

It includes:
- 10 DocTypes (Outlets, Assets, PM rules/work orders, Tickets, Staff, Spare Parts)
- Seed data from all 4 case files (auto-import on install)
- PM completion + failure → ticket flow
- Zonal office routing for tickets

---

## Step 2 — Push source code to GitHub (required)

### 2a. Create a public repo on GitHub
1. Go to [github.com/new](https://github.com/new)
2. Repository name: `cb-maintenance` (or any name)
3. Visibility: **Public**
4. Do **not** initialize with README (we already have one)
5. Click **Create repository**

### 2b. Push from your machine

Open PowerShell in the app folder and run:

```powershell
cd "c:\Users\Mihir Vora\Downloads\cb_maintenance"
git init
git add -A
git commit -m "California Burrito maintenance case submission"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/cb-maintenance.git
git push -u origin main
```

When prompted for credentials, use a **GitHub Personal Access Token** (not your password):
- GitHub → Settings → Developer settings → Personal access tokens → Generate (classic)
- Scope: `repo`

**Share with reviewers:** `https://github.com/YOUR_USERNAME/cb-maintenance`

---

## Step 3 — Deploy live app on Frappe Cloud (required)

### 3a. Create Frappe Cloud account
1. Go to [frappecloud.com](https://frappecloud.com)
2. Sign up (free trial works)
3. Verify email

### 3b. Create a site
1. Dashboard → **+ New Site**
2. Choose **Frappe** (NOT ERPNext — lighter, sufficient for this case)
3. Pick region closest to reviewers
4. Set **Administrator password** — save this for submission email
5. Wait ~5–10 min for site to deploy

### 3c. Install your app from GitHub
1. Open your site → **Apps** tab
2. Click **Install App** → **Install from GitHub**
3. Paste your public repo URL: `https://github.com/YOUR_USERNAME/cb-maintenance`
4. Branch: `main`
5. Click **Install** → wait for build (~5–10 min)

### 3d. Verify seed data loaded
1. Log in to desk: `https://YOUR-SITE.frappe.cloud`
2. Search **CB Outlet** — should show **133** records
3. Search **CB PM Work Order** — due/overdue PM tasks
4. Search **CB Maintenance Ticket** — create a test ticket

### 3e. Create reviewer login (recommended)
1. **User List** → New User
2. Email: e.g. `reviewer@example.com`
3. Role: **System Manager**
4. Set password and share with reviewers

---

## Step 4 — Email your submission

Send an email to the recruiter with:

```
Subject: SDE Assignment Submission — [Your Name]

Hi,

Please find my assignment submission below:

1. Source code: https://github.com/YOUR_USERNAME/cb-maintenance

2. Live application: https://YOUR-SITE.frappe.cloud
   Login: reviewer@example.com / [password]
   (or Administrator / [admin password])

Notes:
- PM program is defined in CB PM Schedule Rule and rolls out via CB PM Work Order
- 133 outlets seeded; PM tracker sample covers 10 outlets with historical work orders
- Ticket taxonomy + spare parts catalog imported from case files

Thank you,
[Your Name]
```

---

## Step 5 — Prepare for walkthrough (~15 min)

Be ready to explain:

| Question | Your answer (short) |
|----------|---------------------|
| New store opens? | Create **CB Outlet** → assets auto-generate PM work orders from **CB PM Schedule Rule** |
| Change AC coil cleaning to bi-monthly chain-wide? | Edit frequency on the **CB PM Schedule Rule** for that task; hook rolls new work orders to all matching assets |
| Records after 1 year / 5 years? | PM work orders accumulate per asset per rule per period; tickets add reactively |
| Route ticket to technician? | Outlet city → zonal office → **CB Maintenance Staff** assigned on ticket create |

---

## What you need to authorize to finish

The app code is ready. To complete **live deployment + GitHub push**, please either:

1. **Run Steps 2–3 yourself** using this guide (recommended), or
2. Share **GitHub PAT** + **Frappe Cloud access** if you want help pushing/deploying
