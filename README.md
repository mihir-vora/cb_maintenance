# CB Maintenance — Frappe App

**Live demo:** [https://mihir-cb-maintenance.m.frappe.cloud](https://mihir-cb-maintenance.m.frappe.cloud)

Maintenance operations system for California Burrito: preventive maintenance (PM) scheduling and reactive tickets.

## Reviewer walkthrough (3 steps)

After login, open **CB Maintenance** in the app switcher (or go to **Maintenance Home** in the sidebar).

| Step | What to do | Where |
|------|------------|--------|
| **1. Define PM** | See how rules are set once per equipment type | Maintenance Home → **View PM Rules** |
| **2. Complete PM** | Open a due task → **Mark Done** or **Fail & Raise Ticket** | **Open PM Tasks** or **Overdue PM** |
| **3. Handle tickets** | Track breakdowns; use **Start Work → Resolved → Close** | **Open Tickets** |

The home page shows live counts (overdue PM, open tickets, outlets) and a visual data-flow diagram.

## Features (v1)

- **PM program once, roll everywhere** — `CB PM Schedule Rule` defines tasks per asset type; work orders generate for all matching assets.
- **Due / overdue tracking** — `CB PM Work Order` list with status filters; daily scheduler marks overdue items.
- **Reactive tickets** — raise `CB Maintenance Ticket` against an outlet asset with taxonomy from the case data.
- **Org routing** — outlets → city → zonal office → maintenance staff reporting chain.
- **Spare parts hint** — ticket sub-category can link to matching spare part codes.

## DocTypes

| DocType | Purpose |
|---------|---------|
| CB Zonal Office | Regional maintenance office |
| CB Outlet | Store (133 outlets) |
| CB Asset Type | Equipment taxonomy (AC, RO Plant, …) |
| CB Asset | Equipment instance at an outlet |
| CB PM Schedule Rule | PM task + frequency per asset type |
| CB PM Work Order | Scheduled / due PM instance |
| CB Maintenance Staff | Technicians and managers |
| CB Ticket Category | Dept → Category → Sub-category taxonomy |
| CB Spare Part | Parts catalog with codes |
| CB Maintenance Ticket | Reactive breakdown ticket |

---

## Local setup

Seed data loads automatically on `install-app` from the bundled case files in `cb_maintenance/seed_data/`.

### Option A — Docker (recommended on Windows)

**Prerequisites:** [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.

```powershell
# Clone the repo, then from the project root:
cd docker
docker compose up
```

First run takes 10–20 minutes (bench init, site creation, app install, asset build). Later starts are faster.

| Item | Value |
|------|-------|
| URL | [http://localhost:8000](http://localhost:8000) |
| Site | `cb-maintenance.localhost` |
| User | `Administrator` |
| Password | `admin123` |

**Useful commands:**

```powershell
# Run in background
docker compose up -d

# View logs
docker compose logs -f frappe

# Stop
docker compose down

# Reinstall app after code changes (inside container)
docker exec -it docker-frappe-1 bash -c "cd /home/frappe/frappe-bench && rm -rf apps/cb_maintenance && cp -a /workspace/cb_maintenance apps/cb_maintenance && cp /workspace/cb_maintenance/README.md apps/cb_maintenance/ && ./env/bin/pip install -e apps/cb_maintenance -q && bench --site cb-maintenance.localhost install-app cb_maintenance --force"
```

The compose file mounts the repo at `/workspace/cb_maintenance` and persists the bench in `.docker-bench/`.

### Option B — Frappe bench (Ubuntu / WSL)

**Prerequisites:** [Frappe bench](https://frappeframework.com/docs/user/en/installation) (v15), MariaDB, Redis, Python 3.10+.

```bash
# Create or use an existing bench
cd ~/frappe-bench

# Add this app (use your clone path)
bench get-app /path/to/cb_maintenance

# Create a site (skip if you already have one)
bench new-site cb-maintenance.localhost

# Install app (runs seed import via after_install)
bench --site cb-maintenance.localhost install-app cb_maintenance

# Start the dev server
bench start
```

Open [http://localhost:8000](http://localhost:8000) and log in with the Administrator password you set during `bench new-site`.

**Validate seed files without Frappe:**

```bash
python scripts/validate_seed.py
```

---

## Frappe Cloud deployment

1. Push this repo to **public GitHub**.
2. Create a site at [frappecloud.com](https://frappecloud.com) with **Frappe** (ERPNext not required).
3. **Update bench** → **Install App** → paste your GitHub repo URL → Install.
4. After install, verify **CB Outlet** (~133 records) and **CB PM Work Order** are populated.
5. Create a **System Manager** user for reviewers and share URL + credentials.

**Live instance:** [https://mihir-cb-maintenance.m.frappe.cloud](https://mihir-cb-maintenance.m.frappe.cloud)

---

## Demo login

- **Frappe Cloud:** use the Administrator password set at site creation, or a reviewer account you create.
- **Docker local:** `Administrator` / `admin123` (see table above).

---

## Scope notes

- PM tracker sample covers 10 outlets; all 133 outlets are seeded from the case outlet master.
- Ticket/spare-parts taxonomy imported from case files (Maintenance + Spare Parts departments).
- Mumbai zonal office included for staff; no Mumbai outlets in outlet master.
