# Copyright (c) 2026, CB Maintenance and contributors
from frappe.model.document import Document


class CBTicketCategory(Document):
	def validate(self):
		if not self.category_key:
			parts = [self.department, self.category, self.sub_category_1, self.sub_category_2]
			self.category_key = " | ".join(p for p in parts if p)
