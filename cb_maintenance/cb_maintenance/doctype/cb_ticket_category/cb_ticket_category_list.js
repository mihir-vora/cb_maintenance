const CB_CATEGORY_LIST = {
	shell_id: "cb-category-list-shell",
	kicker: __("Issue taxonomy"),
	title: __("Ticket categories"),
	description: __("Structured department → category → sub-category hierarchy for consistent reporting."),
	stats: [
		{ key: "total", label: __("Categories") },
		{ key: "departments", label: __("Departments") },
	],
	filters: [
		{
			key: "all",
			label: __("All categories"),
			apply(listview) {
				cb_maintenance.list_ux.apply_filters(listview, []);
			},
		},
	],
	on_refresh(listview, update) {
		Promise.all([
			frappe.db.count("CB Ticket Category"),
			frappe.call({
				method: "frappe.client.get_list",
				args: {
					doctype: "CB Ticket Category",
					fields: ["department"],
					limit_page_length: 500,
				},
			}),
		]).then(([total, dept_res]) => {
			const departments = new Set((dept_res.message || []).map((r) => r.department).filter(Boolean));
			update({ total: total || 0, departments: departments.size });
		});
	},
};

frappe.listview_settings["CB Ticket Category"] = {
	formatters: cb_maintenance.list_ux.lazy_formatters_map({
		department: "outlet",
		category: "name_cell",
		sub_category_1: "task",
	}),
	onload(listview) {
		cb_maintenance.list_ux.setup(listview, CB_CATEGORY_LIST);
	},
	refresh(listview) {
		cb_maintenance.list_ux.refresh(listview, CB_CATEGORY_LIST);
	},
};
