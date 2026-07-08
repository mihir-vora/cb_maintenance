const CB_PART_LIST = {
	shell_id: "cb-part-list-shell",
	kicker: __("Parts catalog"),
	title: __("Spare parts"),
	description: __("Part codes linked to equipment categories for ticket spare-part hints."),
	stats: [
		{ key: "total", label: __("Parts") },
		{ key: "categories", label: __("Categories") },
	],
	filters: [
		{
			key: "all",
			label: __("All parts"),
			apply(listview) {
				cb_maintenance.list_ux.apply_filters(listview, []);
			},
		},
	],
	on_refresh(listview, update) {
		Promise.all([
			frappe.db.count("CB Spare Part"),
			frappe.call({
				method: "frappe.client.get_list",
				args: {
					doctype: "CB Spare Part",
					fields: ["category"],
					limit_page_length: 500,
				},
			}),
		]).then(([total, cat_res]) => {
			const categories = new Set((cat_res.message || []).map((r) => r.category).filter(Boolean));
			update({ total: total || 0, categories: categories.size });
		});
	},
};

frappe.listview_settings["CB Spare Part"] = {
	formatters: cb_maintenance.list_ux.lazy_formatters_map({
		part_code: "outlet",
		part_name: "name_cell",
		category: "task",
	}),
	onload(listview) {
		cb_maintenance.list_ux.setup(listview, CB_PART_LIST);
	},
	refresh(listview) {
		cb_maintenance.list_ux.refresh(listview, CB_PART_LIST);
	},
};
