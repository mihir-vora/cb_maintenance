#!/usr/bin/env python3
"""Validate seed JSON and install naming logic without Frappe."""
import json
import sys
from pathlib import Path

SEED_DIR = Path(__file__).resolve().parents[1] / "cb_maintenance" / "seed_data"

FREQUENCY_DAYS = {
	"weekly": 7,
	"monthly": 30,
	"qtrly": 90,
	"quarterly": 90,
	"6 month": 180,
	"half-yearly": 180,
	"yearly": 365,
	"annual": 365,
}


def parse_frequency(freq):
	if freq is None or str(freq).strip().lower() in ("", "nan", "none", "nat"):
		return 30
	return FREQUENCY_DAYS.get(str(freq).strip().lower(), 30)


def normalize_freq(freq):
	if freq is None or str(freq).strip().lower() in ("", "nan", "none", "nat"):
		return "Monthly"
	return str(freq).strip()


def main():
	errors = []
	warnings = []

	outlets = {r["outlet_code"] for r in json.loads((SEED_DIR / "outlets.json").read_text())}
	pm_rows = json.loads((SEED_DIR / "pm_tracker.json").read_text())

	# Rules sort (null freq)
	rules = set()
	for row in pm_rows:
		asset = (row.get("Asset") or "").strip()
		task = (row.get("Task") or "").strip()
		freq = normalize_freq(row.get("Freq"))
		if asset and task:
			rules.add((asset, task, freq))
	try:
		sorted(rules, key=lambda r: (r[0], r[1], r[2]))
	except TypeError as e:
		errors.append(f"Rule sort failed: {e}")

	# PM rows outlet refs
	missing_outlets = set()
	for row in pm_rows:
		outlet = (row.get("Outlet") or "").strip()
		if outlet and outlet not in outlets:
			missing_outlets.add(outlet)
	if missing_outlets:
		warnings.append(f"PM rows reference {len(missing_outlets)} outlets not in outlets.json (skipped on install)")

	# Work order name uniqueness in seed simulation
	wo_names = {}
	for row in pm_rows:
		outlet = (row.get("Outlet") or "").strip()
		asset_type = (row.get("Asset") or "").strip()
		task = (row.get("Task") or "").strip()
		if not outlet or not asset_type or outlet not in outlets:
			continue
		asset_name = f"{outlet}-{asset_type}"
		last_done = row.get("Last Done")
		status = "Open"
		if last_done and str(last_done).lower() not in ("nan", "nat", "none"):
			status = "Completed"
		# due placeholder - install uses frappe.utils.getdate for last_done
		due = "2026-06-25" if status == "Open" else f"next-after-{last_done}"
		wo_name = f"{asset_name}::{task}::{due}"
		if wo_name in wo_names:
			warnings.append(f"Duplicate WO name pattern: {wo_name}")
		wo_names[wo_name] = row

	# Staff reports
	staff = json.loads((SEED_DIR / "staff.json").read_text())
	names = {" ".join((r.get("Name") or "").split()).lower() for r in staff}
	broken = 0
	for row in staff:
		mgr = " ".join((row.get("Reports to") or "").split()).lower()
		if mgr and mgr not in names and mgr not in ("sujith h s", "gadideshi kumar"):
			broken += 1
	if broken:
		warnings.append(f"{broken} staff rows have unresolvable Reports to (aliases may fix some)")

	print(f"Outlets: {len(outlets)}")
	print(f"PM rows: {len(pm_rows)}")
	print(f"Schedule rules: {len(rules)}")
	print(f"Simulated work orders: {len(wo_names)}")
	print(f"Errors: {len(errors)}")
	print(f"Warnings: {len(warnings)}")
	for e in errors:
		print(f"  ERROR: {e}")
	for w in warnings:
		print(f"  WARN: {w}")
	return 1 if errors else 0


if __name__ == "__main__":
	sys.exit(main())
