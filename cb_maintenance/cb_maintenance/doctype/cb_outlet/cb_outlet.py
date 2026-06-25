# Copyright (c) 2026, CB Maintenance and contributors
from frappe.model.document import Document

CITY_TO_ZONE = {
	"BLR": "Zonal Office - Bengaluru",
	"NCR": "Zonal Office - Delhi/NCR",
	"HYD": "Zonal Office - Hyderabad",
	"CHN": "Zonal Office - Chennai",
	"PUN": "Zonal Office - Pune",
}


class CBOutlet(Document):
	def validate(self):
		if self.city and not self.zonal_office:
			self.zonal_office = CITY_TO_ZONE.get(self.city)
