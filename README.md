# CB Maintenance — Frappe App

Maintenance operations system for California Burrito: preventive maintenance (PM) scheduling and reactive tickets.

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

## Local setup (Frappe bench)

```bash
# On Ubuntu / WSL with bench installed
cd ~/frappe-bench
bench get-app /path/to/cb_maintenance
bench --site <site> install-app cb_maintenance
bench --site <site> migrate
```

Seed data loads automatically on `install-app` from the bundled case files in `cb_maintenance/seed_data/`.

## Frappe Cloud deployment

1. Push this repo to **public GitHub**.
2. Create a free trial at [frappecloud.com](https://frappecloud.com).
3. New Site → install **Frappe** (no ERPNext required).
4. **Install App** → paste your GitHub repo URL → Install.
5. Create a **System Manager** user for reviewers and share URL + credentials.

## Demo login (after install)

- User: `Administrator` / password you set at site creation
- Or create `reviewer@californiaburrito.in` with System Manager role

## Scope notes

- PM tracker sample covers 10 outlets; all 133 outlets are seeded from `PM_Case_Outlets.xlsx`.
- Ticket/spare-parts taxonomy imported from case files (Maintenance + Spare Parts departments).
- Mumbai zonal office included for staff; no Mumbai outlets in outlet master.
