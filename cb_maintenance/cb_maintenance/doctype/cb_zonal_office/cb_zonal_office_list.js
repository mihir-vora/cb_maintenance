const CB_ZONE_LIST = {
	shell_id: "cb-zone-list-shell",
	kicker: __("Regional operations"),
	title: __("Zonal offices"),
	description: __("Regional maintenance hubs that own outlets and staff in each city cluster."),
	stats: [
		{ key: "zones", label: __("Offices") },
		{ key: "outlets", label: __("Outlets") },
		{ key: "staff", label: __("Staff") },
	],
	filters: [
		{
			key: "all",
			label: __("All offices"),
			apply(listview) {
				cb_maintenance.list_ux.apply_filters(listview, []);
			},
		},
	],
	on_refresh(listview, update) {
		cb_maintenance.list_ux.count_stats(
			[
				{ key: "zones", doctype: "CB Zonal Office" },
				{ key: "outlets", doctype: "CB Outlet", filters: { is_active: 1 } },
				{ key: "staff", doctype: "CB Maintenance Staff", filters: { is_active: 1 } },
			],
			update
		);
	},
};

frappe.listview_settings["CB Zonal Office"] = {
	formatters: cb_maintenance.list_ux.lazy_formatters_map({
		office_name: "name_cell",
		city_code: "outlet",
	}),
	onload(listview) {
		cb_maintenance.list_ux.setup(listview, CB_ZONE_LIST);
	},
	refresh(listview) {
		cb_maintenance.list_ux.refresh(listview, CB_ZONE_LIST);
	},
};
