# Copyright (c) 2026, CB Maintenance and contributors
import json
from pathlib import Path

import frappe

from cb_maintenance.cb_maintenance.utils.pm_utils import parse_frequency

SEED_DIR = Path(__file__).resolve().parent / "seed_data"

CITY_TO_ZONE = {
	"BLR": "Zonal Office - Bengaluru",
	"NCR": "Zonal Office - Delhi/NCR",
	"HYD": "Zonal Office - Hyderabad",
	"CHN": "Zonal Office - Chennai",
	"PUN": "Zonal Office - Pune",
}


def after_install():
	"""Load case data after app install."""
	frappe.clear_cache()
	_load_zonal_offices()
	_load_outlets()
	_load_staff()
	_load_asset_types_and_rules()
	_load_assets_and_pm_history()
	_load_ticket_categories()
	_load_spare_parts()
	frappe.db.commit()
	frappe.msgprint("CB Maintenance seed data imported successfully.")


def _load_json(name: str):
	path = SEED_DIR / name
	if not path.exists():
		frappe.log_error(f"Seed file missing: {path}")
		return []
	return json.loads(path.read_text(encoding="utf-8"))


def _load_zonal_offices():
	seen = set()
	for zone in CITY_TO_ZONE.values():
		seen.add(zone)
	for row in _load_json("staff.json"):
		home = (row.get("Home") or "").strip()
		if home and home != "COR":
			seen.add(home)
	for zone in sorted(seen):
		if not frappe.db.exists("CB Zonal Office", zone):
			frappe.get_doc({"doctype": "CB Zonal Office", "office_name": zone}).insert(
				ignore_permissions=True
			)


def _load_outlets():
	for row in _load_json("outlets.json"):
		code = row.get("outlet_code")
		city = row.get("city")
		if not code or frappe.db.exists("CB Outlet", code):
			continue
		frappe.get_doc(
			{
				"doctype": "CB Outlet",
				"outlet_code": code,
				"city": city,
				"zonal_office": CITY_TO_ZONE.get(city),
			}
		).insert(ignore_permissions=True)


def _load_staff():
	reports_map = {}
	for row in _load_json("staff.json"):
		emp_no = str(row.get("Employee No", "")).strip()
		if not emp_no:
			continue
		name = emp_no
		if frappe.db.exists("CB Maintenance Staff", name):
			continue
		doc = frappe.get_doc(
			{
				"doctype": "CB Maintenance Staff",
				"employee_no": emp_no,
				"full_name": (row.get("Name") or "").strip(),
				"job_title": (row.get("Job title") or "").strip(),
				"email": (row.get("Email") or "").strip(),
				"mobile": str(row.get("Mobile") or "").strip(),
				"zonal_office": (row.get("Home") or "").strip() or None,
				"is_active": 1,
			}
		)
		doc.insert(ignore_permissions=True)
		reports_map[doc.full_name.lower()] = doc.name

	# Second pass: wire reports_to links
	for row in _load_json("staff.json"):
		emp_no = str(row.get("Employee No", "")).strip()
		manager = (row.get("Reports to") or "").strip().lower()
		if emp_no and manager and manager in reports_map:
			frappe.db.set_value(
				"CB Maintenance Staff", emp_no, "reports_to", reports_map[manager], update_modified=False
			)


def _load_asset_types_and_rules():
	pm_rows = _load_json("pm_tracker.json")
	asset_types = set()
	rules = set()
	for row in pm_rows:
		asset = (row.get("Asset") or "").strip()
		task = (row.get("Task") or "").strip()
		freq = row.get("Freq")
		if asset:
			asset_types.add(asset)
		if asset and task:
			rules.add((asset, task, freq))

	for asset in sorted(asset_types):
		if not frappe.db.exists("CB Asset Type", asset):
			frappe.get_doc({"doctype": "CB Asset Type", "asset_type_name": asset}).insert(
				ignore_permissions=True
			)

	for asset, task, freq in sorted(rules):
		rule_name = f"{asset}::{task}"
		if frappe.db.exists("CB PM Schedule Rule", rule_name):
			continue
		doc = frappe.get_doc(
			{
				"doctype": "CB PM Schedule Rule",
				"rule_name": rule_name,
				"asset_type": asset,
				"task": task,
				"frequency": freq or "Monthly",
				"frequency_days": parse_frequency(freq),
				"is_active": 1,
			}
		)
		doc.insert(ignore_permissions=True)


def _load_assets_and_pm_history():
	pm_rows = _load_json("pm_tracker.json")
	for row in pm_rows:
		outlet = (row.get("Outlet") or "").strip()
		asset_type = (row.get("Asset") or "").strip()
		task = (row.get("Task") or "").strip()
		freq = row.get("Freq")
		if not outlet or not asset_type:
			continue
		if not frappe.db.exists("CB Outlet", outlet):
			continue

		asset_name = f"{outlet}-{asset_type}"
		if not frappe.db.exists("CB Asset", asset_name):
			frappe.get_doc(
				{
					"doctype": "CB Asset",
					"asset_name": asset_name,
					"outlet": outlet,
					"asset_type": asset_type,
				}
			).insert(ignore_permissions=True)

		rule_name = f"{asset_type}::{task}"
		if not frappe.db.exists("CB PM Schedule Rule", rule_name):
			continue

		# Import last done date if present
		last_done = row.get("Last Done")
		done_by = row.get("Done By")
		status = "Open"
		completed_on = None
		if last_done and str(last_done).lower() not in ("nan", "nat", "none"):
			status = "Completed"
			try:
				completed_on = frappe.utils.getdate(last_done)
			except Exception:
				completed_on = None

		wo_name = f"{asset_name}::{task}"
		if frappe.db.exists("CB PM Work Order", wo_name):
			continue

		from frappe.utils import add_days, today

		due = completed_on or today()
		if status == "Open":
			# If monthly marks exist without last_done, set due to start of period
			due = today()

		frappe.get_doc(
			{
				"doctype": "CB PM Work Order",
				"work_order_name": wo_name,
				"outlet": outlet,
				"asset": asset_name,
				"asset_type": asset_type,
				"schedule_rule": rule_name,
				"task": task,
				"frequency": freq or "Monthly",
				"due_date": due if status == "Open" else add_days(completed_on, parse_frequency(freq)),
				"status": status,
				"completed_on": completed_on,
				"completed_by_staff": done_by if done_by and str(done_by) != "nan" else None,
				"notes": row.get("Notes"),
			}
		).insert(ignore_permissions=True)


def _load_ticket_categories():
	for row in _load_json("tickets_maintenance.json"):
		dept = row.get("Department")
		cat = row.get("Category")
		sub1 = row.get("Sub Category 1")
		sub2 = row.get("Sub Category 2")
		key = " | ".join(str(x) for x in [dept, cat, sub1, sub2] if x and str(x) != "nan")
		if not key or frappe.db.exists("CB Ticket Category", key):
			continue
		frappe.get_doc(
			{
				"doctype": "CB Ticket Category",
				"category_key": key,
				"department": dept,
				"category": cat,
				"sub_category_1": sub1 if sub1 and str(sub1) != "nan" else None,
				"sub_category_2": sub2 if sub2 and str(sub2) != "nan" else None,
			}
		).insert(ignore_permissions=True)


def _load_spare_parts():
	for row in _load_json("tickets_spare_parts.json"):
		dept = row.get("Department")
		cat = row.get("Category")
		sub1 = row.get("Sub Category 1")
		part_code = sub1 if sub1 and str(sub1) != "nan" else None
		if not part_code:
			continue
		if frappe.db.exists("CB Spare Part", part_code):
			continue
		frappe.get_doc(
			{
				"doctype": "CB Spare Part",
				"part_code": part_code,
				"part_name": part_code,
				"category": cat,
				"department": dept,
			}
		).insert(ignore_permissions=True)
