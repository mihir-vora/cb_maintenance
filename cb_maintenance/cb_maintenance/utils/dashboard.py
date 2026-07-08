# Copyright (c) 2026, CB Maintenance and contributors
import frappe
from frappe.utils import today, add_days


@frappe.whitelist()
def get_dashboard_stats():
	"""Summary counts for the maintenance home page."""
	open_pm = frappe.db.count("CB PM Work Order", {"status": "Open"})
	overdue_pm = frappe.db.count("CB PM Work Order", {"status": "Overdue"})
	open_tickets = frappe.db.count(
		"CB Maintenance Ticket", {"status": ["in", ["Open", "In Progress"]]}
	)
	unassigned_tickets = frappe.db.count(
		"CB Maintenance Ticket", {"assigned_to": ["is", "not set"], "status": ["!=", "Closed"]}
	)
	due_this_week = frappe.db.count(
		"CB PM Work Order",
		{
			"status": ["in", ["Open", "Overdue"]],
			"due_date": ["between", [today(), add_days(today(), 7)]],
		},
	)

	return {
		"outlets": frappe.db.count("CB Outlet"),
		"assets": frappe.db.count("CB Asset"),
		"pm_rules": frappe.db.count("CB PM Schedule Rule", {"is_active": 1}),
		"pm_open": open_pm,
		"pm_overdue": overdue_pm,
		"pm_due_week": due_this_week,
		"tickets_open": open_tickets,
		"tickets_unassigned": unassigned_tickets,
		"staff": frappe.db.count("CB Maintenance Staff", {"is_active": 1}),
	}
