app_name = "cb_maintenance"
app_title = "CB Maintenance"
app_publisher = "California Burrito Case"
app_description = "Preventive and reactive maintenance operations for multi-outlet restaurants"
app_email = "er.voramihir@gmail.com"
app_license = "MIT"
app_version = "0.0.1"

required_apps = ["frappe"]

scheduler_events = {
	"daily": [
		"cb_maintenance.cb_maintenance.utils.pm_utils.mark_overdue_work_orders",
	],
}

doc_events = {
	"CB Asset": {
		"after_insert": "cb_maintenance.cb_maintenance.utils.pm_utils.generate_work_orders_for_asset",
	},
	"CB PM Schedule Rule": {
		"after_insert": "cb_maintenance.cb_maintenance.utils.pm_utils.roll_out_rule_to_assets",
		"on_update": "cb_maintenance.cb_maintenance.utils.pm_utils.roll_out_rule_to_assets",
	},
}

after_install = "cb_maintenance.install.after_install"
