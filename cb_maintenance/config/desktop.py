from frappe import _


def get_data():
	return [
		{
			"module_name": "CB Maintenance",
			"color": "orange",
			"icon": "octicon octicon-tools",
			"type": "module",
			"label": _("CB Maintenance"),
		},
		{
			"type": "link",
			"name": "maintenance-home",
			"label": _("Maintenance Home — Guide"),
			"link": "/app/maintenance-home",
			"onboard": 1,
			"description": _("Founder walkthrough — how PM and tickets work"),
		},
		{
			"type": "link",
			"name": "pm-work-orders",
			"label": _("Due PM Tasks"),
			"link": "List/CB PM Work Order",
			"description": _("Step 2 — complete preventive maintenance"),
		},
		{
			"type": "link",
			"name": "maintenance-tickets",
			"label": _("Maintenance Tickets"),
			"link": "List/CB Maintenance Ticket",
			"description": _("Step 3 — reactive breakdown tickets"),
		},
	]
