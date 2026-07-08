# Copyright (c) 2026, CB Maintenance and contributors
import frappe
from frappe.utils import add_days, date_diff, today

CACHE_KEY = "cb_maintenance_dashboard_stats"
CACHE_TTL = 60


def clear_dashboard_cache():
	frappe.cache.delete_value(CACHE_KEY)


@frappe.whitelist()
def get_dashboard_stats():
	"""Fast summary counts + insights + queue previews for dashboard."""
	cached = frappe.cache.get_value(CACHE_KEY)
	if cached:
		return cached

	core = frappe.db.sql(
		"""
		SELECT
			(SELECT COUNT(*) FROM `tabCB Outlet`) AS outlets,
			(SELECT COUNT(*) FROM `tabCB Asset`) AS assets,
			(SELECT COUNT(*) FROM `tabCB PM Schedule Rule` WHERE is_active = 1) AS pm_rules,
			(SELECT COUNT(*) FROM `tabCB PM Work Order` WHERE status = 'Open') AS pm_open,
			(SELECT COUNT(*) FROM `tabCB PM Work Order` WHERE status = 'Overdue') AS pm_overdue,
			(SELECT COUNT(*) FROM `tabCB PM Work Order`
				WHERE status IN ('Open', 'Overdue')
				AND due_date = %(today)s) AS pm_due_today,
			(SELECT COUNT(*) FROM `tabCB PM Work Order`
				WHERE status IN ('Open', 'Overdue')
				AND due_date BETWEEN %(today)s AND %(week_end)s) AS pm_due_week,
			(SELECT COUNT(*) FROM `tabCB Maintenance Ticket`
				WHERE status IN ('Open', 'In Progress')) AS tickets_open,
			(SELECT COUNT(*) FROM `tabCB Maintenance Ticket`
				WHERE status = 'In Progress') AS tickets_in_progress,
			(SELECT COUNT(*) FROM `tabCB Maintenance Ticket`
				WHERE assigned_to IS NULL AND status != 'Closed') AS tickets_unassigned,
			(SELECT COUNT(*) FROM `tabCB Maintenance Staff` WHERE is_active = 1) AS staff
		""",
		{"today": today(), "week_end": add_days(today(), 7)},
		as_dict=True,
	)[0]

	overdue_preview = _get_overdue_preview()
	unassigned_preview = _get_unassigned_preview()
	zone_ticket_load = _get_zone_ticket_load()
	insights = _build_insights(core, overdue_preview, unassigned_preview)
	health = _health_score(core)

	payload = {
		**core,
		"health_score": health,
		"insights": insights,
		"zone_ticket_load": zone_ticket_load,
		"overdue_preview": overdue_preview,
		"unassigned_preview": unassigned_preview,
	}

	frappe.cache.set_value(CACHE_KEY, payload, expires_in_sec=CACHE_TTL)
	return payload


def _get_overdue_preview():
	rows = frappe.get_all(
		"CB PM Work Order",
		filters={"status": "Overdue"},
		fields=["name", "outlet", "asset", "task", "due_date"],
		order_by="due_date asc",
		limit=8,
	)
	today_date = today()
	for row in rows:
		row["days_overdue"] = max(date_diff(today_date, row.get("due_date")), 0)
	return rows


def _get_unassigned_preview():
	return frappe.get_all(
		"CB Maintenance Ticket",
		filters={"assigned_to": ["is", "not set"], "status": ["!=", "Closed"]},
		fields=["name", "subject", "outlet", "priority", "status", "modified"],
		order_by="modified desc",
		limit=8,
	)


def _get_zone_ticket_load():
	return frappe.db.sql(
		"""
		SELECT
			o.zonal_office AS zonal_office,
			COUNT(t.name) AS open_tickets
		FROM `tabCB Maintenance Ticket` t
		LEFT JOIN `tabCB Outlet` o ON o.name = t.outlet
		WHERE t.status IN ('Open', 'In Progress')
		GROUP BY o.zonal_office
		ORDER BY open_tickets DESC
		LIMIT 5
		""",
		as_dict=True,
	)


def _health_score(core: dict) -> int:
	# Simple operational score: reward low overdue and low unassigned rate.
	pm_total = max((core.get("pm_open") or 0) + (core.get("pm_overdue") or 0), 1)
	ticket_total = max(core.get("tickets_open") or 0, 1)
	overdue_ratio = (core.get("pm_overdue") or 0) / pm_total
	unassigned_ratio = (core.get("tickets_unassigned") or 0) / ticket_total
	raw = 100 - int(overdue_ratio * 55) - int(unassigned_ratio * 45)
	return max(min(raw, 100), 0)


def _build_insights(core: dict, overdue_preview: list, unassigned_preview: list):
	insights = []

	if (core.get("pm_overdue") or 0) > 0:
		insights.append(
			{
				"type": "warning",
				"title": "Overdue PM backlog",
				"message": f"{core.get('pm_overdue')} PM tasks are overdue. Prioritize them to avoid equipment failure.",
				"action": "pm-overdue",
			}
		)
	else:
		insights.append(
			{
				"type": "success",
				"title": "PM on track",
				"message": "No overdue PM tasks right now.",
				"action": "pm-open",
			}
		)

	if (core.get("tickets_unassigned") or 0) > 0:
		insights.append(
			{
				"type": "warning",
				"title": "Unassigned tickets need owner",
				"message": f"{core.get('tickets_unassigned')} tickets are waiting for assignment.",
				"action": "tickets-unassigned",
			}
		)

	if overdue_preview:
		peak = max((row.get("days_overdue") or 0) for row in overdue_preview)
		insights.append(
			{
				"type": "info",
				"title": "Longest overdue task",
				"message": f"Oldest overdue PM is {peak} days late.",
				"action": "pm-overdue",
			}
		)

	if not unassigned_preview and (core.get("tickets_open") or 0) > 0:
		insights.append(
			{
				"type": "success",
				"title": "Tickets are assigned",
				"message": "All active tickets currently have an owner.",
				"action": "tickets",
			}
		)

	return insights[:4]
