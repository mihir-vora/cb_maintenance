# Copyright (c) 2026, CB Maintenance and contributors
import frappe


def has_app_permission():
	"""Allow desk users with read access to open the maintenance app."""
	if frappe.session.user == "Administrator":
		return True
	return frappe.has_permission("CB PM Work Order", "read") or frappe.has_permission(
		"CB Maintenance Ticket", "read"
	)


def extend_bootinfo(bootinfo):
	bootinfo.cb_maintenance_home = "/app/maintenance-home"
