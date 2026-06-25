# Copyright (c) 2026, CB Maintenance and contributors
from frappe.model.document import Document

from cb_maintenance.cb_maintenance.utils.pm_utils import parse_frequency


class CBPMScheduleRule(Document):
	def validate(self):
		if not self.rule_name and self.asset_type and self.task:
			self.rule_name = f"{self.asset_type}::{self.task}"
		self.frequency_days = parse_frequency(self.frequency)
