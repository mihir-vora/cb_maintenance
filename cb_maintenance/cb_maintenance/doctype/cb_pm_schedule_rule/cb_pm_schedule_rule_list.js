const CB_RULE_LIST = {
	shell_id: "cb-rule-list-shell",
	kicker: __("Step 1 · Define PM program"),
	title: __("PM schedule rules"),
	description: __("Define preventive tasks per asset type. Saving rolls work orders to all matching assets."),
	stats: [
		{ key: "active", label: __("Active rules") },
		{ key: "total", label: __("Total rules") },
		{ key: "assets", label: __("Assets") },
	],
	filters: [
		{
			key: "active",
			label: __("Active"),
			apply(listview) {
				cb_maintenance.list_ux.apply_filters(listview, [["CB PM Schedule Rule", "is_active", "=", 1]]);
			},
		},
		{
			key: "all",
			label: __("All rules"),
			apply(listview) {
				cb_maintenance.list_ux.apply_filters(listview, []);
			},
		},
	],
	on_refresh(listview, update) {
		cb_maintenance.list_ux.count_stats(
			[
				{ key: "active", doctype: "CB PM Schedule Rule", filters: { is_active: 1 } },
				{ key: "total", doctype: "CB PM Schedule Rule" },
				{ key: "assets", doctype: "CB Asset", filters: { is_active: 1 } },
			],
			update
		);
	},
};

frappe.listview_settings["CB PM Schedule Rule"] = {
	add_fields: ["frequency", "is_active"],
	get_indicator(doc) {
		return doc.is_active
			? [__("Active"), "green", "is_active,=,1"]
			: [__("Inactive"), "gray", "is_active,=,0"];
	},
	formatters: cb_maintenance.list_ux.lazy_formatters_map({
		rule_name: "name_cell",
		task: "task",
		asset_type: "outlet",
		is_active: "active_flag",
	}),
	onload(listview) {
		cb_maintenance.list_ux.setup(listview, CB_RULE_LIST);
	},
	refresh(listview) {
		cb_maintenance.list_ux.refresh(listview, CB_RULE_LIST);
	},
};
