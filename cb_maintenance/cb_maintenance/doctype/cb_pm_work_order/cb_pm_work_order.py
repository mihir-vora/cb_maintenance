# Copyright (c) 2026, CB Maintenance and contributors
import frappe
from frappe.model.document import Document


class CBPMWorkOrder(Document):
	def before_insert(self):
		if not self.work_order_name and self.asset and self.task and self.due_date:
			self.work_order_name = f"{self.asset}::{self.task}::{self.due_date}"

	def validate(self):
		if self.asset and not self.asset_type:
			self.asset_type = frappe.db.get_value("CB Asset", self.asset, "asset_type")
