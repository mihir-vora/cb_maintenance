# Copyright (c) 2026, CB Maintenance and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import add_days, today

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


def parse_frequency(freq: str | None) -> int:
	if not freq:
		return 30
	key = str(freq).strip().lower()
	return FREQUENCY_DAYS.get(key, 30)


def _work_order_name(asset: str, task: str, due_date) -> str:
	return f"{asset}::{task}::{due_date}"


def generate_work_orders_for_asset(doc, method=None):
	"""Create open PM work orders for every active schedule rule matching this asset type."""
	if getattr(frappe.flags, "cb_maintenance_seed", False):
		return
	rules = frappe.get_all(
		"CB PM Schedule Rule",
		filters={"asset_type": doc.asset_type, "is_active": 1},
		fields=["name", "task", "frequency"],
	)
	for rule in rules:
		_create_work_order_if_missing(doc.name, rule.name, rule.task, rule.frequency)


def roll_out_rule_to_assets(doc, method=None):
	"""When a schedule rule is saved, ensure work orders exist for all assets of that type."""
	if getattr(frappe.flags, "cb_maintenance_seed", False):
		return
	if not doc.is_active:
		return
	assets = frappe.get_all(
		"CB Asset",
		filters={"asset_type": doc.asset_type},
		pluck="name",
	)
	for asset in assets:
		_create_work_order_if_missing(asset, doc.name, doc.task, doc.frequency)


def _create_work_order_if_missing(asset, rule_name, task, frequency):
	if frappe.db.exists(
		"CB PM Work Order",
		{"asset": asset, "schedule_rule": rule_name, "status": ["in", ["Open", "Overdue"]]},
	):
		return

	asset_doc = frappe.get_doc("CB Asset", asset)
	due = today()
	work_order_name = _work_order_name(asset, task, due)
	frappe.get_doc(
		{
			"doctype": "CB PM Work Order",
			"work_order_name": work_order_name,
			"outlet": asset_doc.outlet,
			"asset": asset,
			"asset_type": asset_doc.asset_type,
			"schedule_rule": rule_name,
			"task": task,
			"frequency": frequency,
			"due_date": due,
			"status": "Open",
		}
	).insert(ignore_permissions=True)


def mark_overdue_work_orders():
	for name in frappe.get_all(
		"CB PM Work Order",
		filters={"status": "Open", "due_date": ["<", today()]},
		pluck="name",
	):
		frappe.db.set_value("CB PM Work Order", name, "status", "Overdue", update_modified=False)
	frappe.db.commit()


@frappe.whitelist()
def complete_pm_work_order(work_order: str, notes: str | None = None, failed: int = 0):
	"""Mark PM done and schedule next occurrence, or raise a ticket on failure."""
	doc = frappe.get_doc("CB PM Work Order", work_order)
	if doc.status == "Completed":
		frappe.throw(_("This work order is already completed."))

	done_on = today()
	doc.status = "Completed"
	doc.completed_on = done_on
	staff_name = frappe.db.get_value(
		"CB Maintenance Staff", {"email": frappe.session.user}, "full_name"
	)
	doc.completed_by_staff = staff_name or frappe.session.user
	if notes:
		doc.notes = notes

	if int(failed):
		doc.inspection_failed = 1
		doc.save(ignore_permissions=True)
		_create_ticket_from_failed_pm(doc)
	else:
		doc.inspection_failed = 0
		doc.save(ignore_permissions=True)
		_schedule_next_work_order(doc)

	return doc.name


def _schedule_next_work_order(completed: Document):
	days = parse_frequency(completed.frequency)
	next_due = add_days(completed.completed_on or today(), days)
	work_order_name = _work_order_name(completed.asset, completed.task, next_due)
	frappe.get_doc(
		{
			"doctype": "CB PM Work Order",
			"work_order_name": work_order_name,
			"outlet": completed.outlet,
			"asset": completed.asset,
			"asset_type": completed.asset_type,
			"schedule_rule": completed.schedule_rule,
			"task": completed.task,
			"frequency": completed.frequency,
			"due_date": next_due,
			"status": "Open",
		}
	).insert(ignore_permissions=True)


def _create_ticket_from_failed_pm(pm_doc: Document):
	asset_doc = frappe.get_doc("CB Asset", pm_doc.asset)
	category = _guess_ticket_category(asset_doc.asset_type)
	spare = _find_spare_part(asset_doc.asset_type, pm_doc.task)

	ticket = frappe.get_doc(
		{
			"doctype": "CB Maintenance Ticket",
			"outlet": pm_doc.outlet,
			"asset": pm_doc.asset,
			"ticket_category": category,
			"subject": f"PM failed: {pm_doc.task}",
			"description": f"Preventive task '{pm_doc.task}' failed during inspection.\n\n{pm_doc.notes or ''}",
			"source_pm_work_order": pm_doc.name,
			"suggested_spare_part": spare,
			"status": "Open",
			"priority": "Medium",
		}
	).insert(ignore_permissions=True)
	return ticket.name


def _guess_ticket_category(asset_type: str) -> str | None:
	"""Best-effort link from asset type name to maintenance ticket taxonomy."""
	clean = (asset_type or "").strip()
	if not clean:
		return None
	# Try exact category match first
	match = frappe.db.get_value(
		"CB Ticket Category",
		{"department": "Maintenance", "category": clean},
		"name",
	)
	if match:
		return match
	# Fuzzy: asset type contained in category or vice versa
	for row in frappe.get_all(
		"CB Ticket Category",
		filters={"department": "Maintenance"},
		fields=["name", "category"],
		limit=500,
	):
		cat = (row.category or "").lower()
		if clean.lower() in cat or cat in clean.lower():
			return row.name
	return None


def _find_spare_part(asset_type: str, task: str) -> str | None:
	needle = (task or asset_type or "").lower()
	if not needle:
		return None
	for row in frappe.get_all(
		"CB Spare Part",
		fields=["name", "part_name", "category"],
		limit=1000,
	):
		blob = f"{row.category or ''} {row.part_name or ''}".lower()
		if "gasket" in needle and "gasket" in blob:
			return row.name
		if asset_type and asset_type.lower() in blob:
			return row.name
	return None


@frappe.whitelist()
def suggest_spare_part(ticket_category: str | None = None, asset_type: str | None = None):
	return _find_spare_part(asset_type or "", ticket_category or "")


@frappe.whitelist()
def assign_ticket_to_zonal_staff(ticket: str, silent: int = 0):
	"""Route ticket to maintenance staff at the outlet's zonal office."""
	doc = frappe.get_doc("CB Maintenance Ticket", ticket)
	outlet = frappe.get_doc("CB Outlet", doc.outlet)
	if not outlet.zonal_office:
		if not silent:
			frappe.msgprint(_("No zonal office mapped for this outlet."))
		return

	staff = frappe.get_all(
		"CB Maintenance Staff",
		filters={"zonal_office": outlet.zonal_office, "is_active": 1},
		fields=["name", "full_name", "job_title"],
		order_by="job_title asc",
		limit=1,
	)
	if staff:
		doc.assigned_to = staff[0].name
		doc.save(ignore_permissions=True)
		if not silent:
			frappe.msgprint(_("Assigned to {0}").format(staff[0].full_name))
	elif not silent:
		frappe.msgprint(_("No active staff found for {0}").format(outlet.zonal_office))
