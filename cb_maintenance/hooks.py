app_name = "cb_maintenance"
app_title = "CB Maintenance"
app_publisher = "California Burrito Case"
app_description = "Preventive and reactive maintenance operations for multi-outlet restaurants"
app_email = "er.voramihir@gmail.com"
app_license = "MIT"
app_version = "0.0.8"

required_apps = ["frappe"]

app_include_css = "cb_maintenance/css/cb_maintenance.bundle.css"
app_include_js = "cb_maintenance/js/cb_desk_route.js"
extend_bootinfo = "cb_maintenance.boot.extend_bootinfo"

# Do not use add_to_apps_screen on a single-app site — it shows a generic
# "Select an app" page with a broken logo and an extra click before the desk.
# Users land on the cb-maintenance desk page (see install.setup_ui_defaults).

after_migrate = "cb_maintenance.install.after_migrate"

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
