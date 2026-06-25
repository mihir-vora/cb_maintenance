# Copyright (c) 2026, CB Maintenance and contributors
import frappe
from frappe.model.document import Document

from cb_maintenance.cb_maintenance.utils.pm_utils import _find_spare_part, assign_ticket_to_zonal_staff


class CBMaintenanceTicket(Document):
	def validate(self):
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
