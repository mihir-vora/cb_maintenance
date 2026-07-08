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
			"name": "cb-maintenance",
			"label": _("CB Maintenance"),
			"link": "/app/cb-maintenance",
			"onboard": 1,
			"description": _("Maintenance operations — PM, tickets, and guided workflow"),
		},
	]
