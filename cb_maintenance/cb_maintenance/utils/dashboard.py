# Copyright (c) 2026, CB Maintenance and contributors
import frappe
from frappe.utils import add_days, today

CACHE_KEY = "cb_maintenance_dashboard_stats"
CACHE_TTL = 60


def clear_dashboard_cache():
	frappe.cache.delete_value(CACHE_KEY)


@frappe.whitelist()
def get_dashboard_stats():
	"""Fast summary counts — single query, short-lived cache."""
	cached = frappe.cache.get_value(CACHE_KEY)
	if cached:
		return cached

	row = frappe.db.sql(
		"""
		SELECT
			(SELECT COUNT(*) FROM `tabCB Outlet`) AS outlets,
			(SELECT COUNT(*) FROM `tabCB Asset`) AS assets,
			(SELECT COUNT(*) FROM `tabCB PM Schedule Rule` WHERE is_active = 1) AS pm_rules,
			(SELECT COUNT(*) FROM `tabCB PM Work Order` WHERE status = 'Open') AS pm_open,
			(SELECT COUNT(*) FROM `tabCB PM Work Order` WHERE status = 'Overdue') AS pm_overdue,
			(SELECT COUNT(*) FROM `tabCB PM Work Order`
				WHERE status IN ('Open', 'Overdue')
				AND due_date BETWEEN %(today)s AND %(week_end)s) AS pm_due_week,
			(SELECT COUNT(*) FROM `tabCB Maintenance Ticket`
				WHERE status IN ('Open', 'In Progress')) AS tickets_open,
			(SELECT COUNT(*) FROM `tabCB Maintenance Ticket`
				WHERE assigned_to IS NULL AND status != 'Closed') AS tickets_unassigned,
			(SELECT COUNT(*) FROM `tabCB Maintenance Staff` WHERE is_active = 1) AS staff
		""",
		{"today": today(), "week_end": add_days(today(), 7)},
		as_dict=True,
	)[0]

	frappe.cache.set_value(CACHE_KEY, row, expires_in_sec=CACHE_TTL)
	return row
