"""One-off script: convert case Excel/CSV to JSON for Frappe install."""
import json
from pathlib import Path

import pandas as pd

# Case data bundled in this repo under Software Engineer Case/
SRC = Path(__file__).resolve().parents[1] / "Software Engineer Case" / "Software Engineer Case"
DST = Path(__file__).resolve().parents[1] / "cb_maintenance" / "seed_data"
DST.mkdir(parents=True, exist_ok=True)


def df_to_records(df):
	return json.loads(df.to_json(orient="records"))


def main():
	outlets = pd.read_excel(SRC / "PM_Case_Outlets.xlsx")
	outlets.columns = ["city", "outlet_code"]
	outlets["outlet_code"] = outlets["outlet_code"].astype(str).str.strip()
	outlets["city"] = outlets["city"].astype(str).str.strip()
	(DST / "outlets.json").write_text(json.dumps(df_to_records(outlets), indent=2), encoding="utf-8")

	users = pd.read_csv(SRC / "PM_Case_User_Master.csv")
	users = users[users["Department"] == "Maintenance"]
	(DST / "staff.json").write_text(json.dumps(df_to_records(users), indent=2), encoding="utf-8")

	pm = pd.read_excel(SRC / "PM_Case_Before.xlsx")
	pm = pm.where(pd.notnull(pm), None)
	(DST / "pm_tracker.json").write_text(json.dumps(df_to_records(pm), indent=2), encoding="utf-8")

	tickets = pd.read_excel(SRC / "PM_Case_Ticket_Buckets.xlsx")
	for dept, fname in [("Maintenance", "tickets_maintenance.json"), ("Spare Parts", "tickets_spare_parts.json")]:
		sub = tickets[tickets["Department"] == dept].where(pd.notnull(tickets), None)
		(DST / fname).write_text(json.dumps(df_to_records(sub), indent=2), encoding="utf-8")

	print(f"Wrote seed data to {DST}")


if __name__ == "__main__":
	main()
