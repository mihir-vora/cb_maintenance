# Copyright (c) 2026, CB Maintenance and contributors
import frappe
from frappe.model.document import Document


class CBPMWorkOrder(Document):
	def validate(self):
		if not self.work_order_name and self.asset and self.task:
			self.work_order_name = f"{self.asset}::{self.task}"
		if self.asset and not self.asset_type:
			self.asset_type = frappe.db.get_value("CB Asset", self.asset, "asset_type")
