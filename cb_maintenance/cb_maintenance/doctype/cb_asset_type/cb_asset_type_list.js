const CB_ASSET_TYPE_LIST = {
	shell_id: "cb-asset-type-list-shell",
	kicker: __("Equipment taxonomy"),
	title: __("Asset types"),
	description: __("Equipment classes (AC, RO Plant, fryer, etc.) used by PM rules and assets."),
	stats: [
		{ key: "types", label: __("Types") },
		{ key: "assets", label: __("Assets") },
		{ key: "rules", label: __("PM rules") },
	],
	filters: [
		{
			key: "all",
			label: __("All types"),
			apply(listview) {
				cb_maintenance.list_ux.apply_filters(listview, []);
			},
		},
	],
	on_refresh(listview, update) {
		cb_maintenance.list_ux.count_stats(
			[
				{ key: "types", doctype: "CB Asset Type" },
				{ key: "assets", doctype: "CB Asset", filters: { is_active: 1 } },
				{ key: "rules", doctype: "CB PM Schedule Rule", filters: { is_active: 1 } },
			],
			update
		);
	},
};

frappe.listview_settings["CB Asset Type"] = {
	formatters: {
		asset_type_name: cb_maintenance.list_ux.formatters.name_cell,
	},
	onload(listview) {
		cb_maintenance.list_ux.setup(listview, CB_ASSET_TYPE_LIST);
	},
	refresh(listview) {
		cb_maintenance.list_ux.refresh(listview, CB_ASSET_TYPE_LIST);
	},
};
