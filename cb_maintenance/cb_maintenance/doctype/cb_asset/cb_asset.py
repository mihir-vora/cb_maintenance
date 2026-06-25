# Copyright (c) 2026, CB Maintenance and contributors
from frappe.model.document import Document


class CBAsset(Document):
	def validate(self):
		if not self.asset_name and self.outlet and self.asset_type:
			self.asset_name = f"{self.outlet}-{self.asset_type}"
