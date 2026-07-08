const CB_STAFF_LIST = {
	shell_id: "cb-staff-list-shell",
	kicker: __("Maintenance team"),
	title: __("Maintenance staff"),
	description: __("Technicians and managers mapped to zonal offices for ticket routing."),
	stats: [
		{ key: "active", label: __("Active") },
		{ key: "total", label: __("Total") },
		{ key: "zones", label: __("Zones") },
	],
	filters: [
		{
			key: "active",
			label: __("Active"),
			apply(listview) {
				cb_maintenance.list_ux.apply_filters(listview, [["CB Maintenance Staff", "is_active", "=", 1]]);
			},
		},
		{
			key: "all",
			label: __("All staff"),
			apply(listview) {
				cb_maintenance.list_ux.apply_filters(listview, []);
			},
		},
	],
	on_refresh(listview, update) {
		cb_maintenance.list_ux.count_stats(
			[
				{ key: "active", doctype: "CB Maintenance Staff", filters: { is_active: 1 } },
				{ key: "total", doctype: "CB Maintenance Staff" },
				{ key: "zones", doctype: "CB Zonal Office" },
			],
			update
		);
	},
};

frappe.listview_settings["CB Maintenance Staff"] = {
	add_fields: ["email", "is_active"],
	get_indicator(doc) {
		return doc.is_active
			? [__(doc.job_title || __("Active")), "blue", "is_active,=,1"]
			: [__("Inactive"), "gray", "is_active,=,0"];
	},
	formatters: {
		employee_no: cb_maintenance.list_ux.formatters.outlet,
		full_name: cb_maintenance.list_ux.formatters.name_cell,
		job_title: cb_maintenance.list_ux.formatters.task,
		zonal_office: cb_maintenance.list_ux.formatters.outlet,
	},
	onload(listview) {
		cb_maintenance.list_ux.setup(listview, CB_STAFF_LIST);
	},
	refresh(listview) {
		cb_maintenance.list_ux.refresh(listview, CB_STAFF_LIST);
	},
};
