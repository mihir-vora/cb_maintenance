const CB_OUTLET_LIST = {
	shell_id: "cb-outlet-list-shell",
	kicker: __("Store network"),
	title: __("Outlets"),
	description: __("133-store master with city and zonal routing for maintenance ownership."),
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
				cb_maintenance.list_ux.apply_filters(listview, [["CB Outlet", "is_active", "=", 1]]);
			},
		},
		{
			key: "all",
			label: __("All outlets"),
			apply(listview) {
				cb_maintenance.list_ux.apply_filters(listview, []);
			},
		},
	],
	on_refresh(listview, update) {
		cb_maintenance.list_ux.count_stats(
			[
				{ key: "active", doctype: "CB Outlet", filters: { is_active: 1 } },
				{ key: "total", doctype: "CB Outlet" },
				{ key: "zones", doctype: "CB Zonal Office" },
			],
			update
		);
	},
};

frappe.listview_settings["CB Outlet"] = {
	add_fields: ["is_active", "zonal_office"],
	get_indicator(doc) {
		return doc.is_active
			? [__(doc.city || __("Active")), "green", `city,=,${doc.city}`]
			: [__("Inactive"), "gray", "is_active,=,0"];
	},
	formatters: cb_maintenance.list_ux.lazy_formatters_map({
		outlet_code: "outlet",
		city: "name_cell",
		zonal_office: "task",
		is_active: "active_flag",
	}),
	onload(listview) {
		cb_maintenance.list_ux.setup(listview, CB_OUTLET_LIST);
	},
	refresh(listview) {
		cb_maintenance.list_ux.refresh(listview, CB_OUTLET_LIST);
	},
};
