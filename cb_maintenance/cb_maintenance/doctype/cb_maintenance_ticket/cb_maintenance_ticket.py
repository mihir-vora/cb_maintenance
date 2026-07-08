# Copyright (c) 2026, CB Maintenance and contributors
import frappe
from frappe.model.document import Document

from cb_maintenance.cb_maintenance.utils.pm_utils import _find_spare_part, assign_ticket_to_zonal_staff
from cb_maintenance.cb_maintenance.utils.dashboard import clear_dashboard_cache


class CBMaintenanceTicket(Document):
	def validate(self):
		self._validate_status_transition()
		if self.asset and not self.outlet:
			self.outlet = frappe.db.get_value("CB Asset", self.asset, "outlet")
		if not self.suggested_spare_part and self.asset:
			asset_type = frappe.db.get_value("CB Asset", self.asset, "asset_type")
			part = _find_spare_part(asset_type, self.subject or "")
			if part:
				self.suggested_spare_part = part

	def after_insert(self):
		if not self.assigned_to:
			assign_ticket_to_zonal_staff(self.name, silent=True)
		clear_dashboard_cache()

	def on_update(self):
		clear_dashboard_cache()

	def _validate_status_transition(self):
		if self.is_new():
			return
		previous = frappe.db.get_value("CB Maintenance Ticket", self.name, "status")
		allowed = {
			"Open": {"Open", "In Progress", "Resolved", "Closed"},
			"In Progress": {"In Progress", "Resolved", "Closed"},
			"Resolved": {"Resolved", "Closed"},
			"Closed": {"Closed"},
		}
		if previous and self.status not in allowed.get(previous, {self.status}):
			frappe.throw(
				f"Invalid status transition: {previous} → {self.status}. "
				"Use Open → In Progress → Resolved → Closed."
			)
