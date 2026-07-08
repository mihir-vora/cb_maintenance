const CB_ASSET_LIST = {
	shell_id: "cb-asset-list-shell",
	kicker: __("Equipment inventory"),
	title: __("Assets"),
	description: __("Equipment instances by outlet. New assets auto-generate PM work orders from active rules."),
	stats: [
		{ key: "active", label: __("Active") },
		{ key: "total", label: __("Total") },
		{ key: "outlets", label: __("Outlets") },
	],
	filters: [
		{
			key: "active",
			label: __("Active"),
			apply(listview) {
				cb_maintenance.list_ux.apply_filters(listview, [["CB Asset", "is_active", "=", 1]]);
			},
		},
		{
			key: "all",
			label: __("All assets"),
			apply(listview) {
				cb_maintenance.list_ux.apply_filters(listview, []);
			},
		},
	],
	on_refresh(listview, update) {
		cb_maintenance.list_ux.count_stats(
			[
				{ key: "active", doctype: "CB Asset", filters: { is_active: 1 } },
				{ key: "total", doctype: "CB Asset" },
				{ key: "outlets", doctype: "CB Outlet", filters: { is_active: 1 } },
			],
			update
		);
	},
};

frappe.listview_settings["CB Asset"] = {
	add_fields: ["is_active", "serial_no"],
	get_indicator(doc) {
		return doc.is_active
			? [__("Active"), "green", "is_active,=,1"]
			: [__("Inactive"), "gray", "is_active,=,0"];
	},
	formatters: cb_maintenance.list_ux.lazy_formatters_map({
		asset_name: "name_cell",
		outlet: "outlet",
		asset_type: "task",
	}),
	onload(listview) {
		cb_maintenance.list_ux.setup(listview, CB_ASSET_LIST);
	},
	refresh(listview) {
		cb_maintenance.list_ux.refresh(listview, CB_ASSET_LIST);
	},
};
