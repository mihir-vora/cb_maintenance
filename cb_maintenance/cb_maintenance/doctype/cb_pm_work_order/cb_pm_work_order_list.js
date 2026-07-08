const CB_PM_LIST = {
	shell_id: "cb-pm-list-shell",
	page_class: "cb-modern-list-page cb-pm-list-page",
	kicker: __("Step 2 · Execute PM"),
	title: __("PM work orders"),
	description: __(
		"Work oldest overdue tasks first. Open a row to mark done or raise a ticket when inspection fails."
	),
	stats: [
		{ key: "pm_overdue", label: __("Overdue"), danger: true },
		{ key: "pm_open", label: __("Open") },
		{ key: "pm_due_today", label: __("Due today") },
	],
	filters: [
		{
			key: "all-open",
			label: __("All open"),
			apply(listview) {
				cb_maintenance.list_ux.apply_filters(listview, [
					["CB PM Work Order", "status", "in", ["Open", "Overdue"]],
				]);
			},
		},
		{
			key: "overdue",
			label: __("Overdue"),
			apply(listview) {
				cb_maintenance.list_ux.apply_filters(listview, [["CB PM Work Order", "status", "=", "Overdue"]]);
			},
		},
		{
			key: "due-today",
			label: __("Due today"),
			apply(listview) {
				cb_maintenance.list_ux.apply_filters(listview, [
					["CB PM Work Order", "status", "in", ["Open", "Overdue"]],
					["CB PM Work Order", "due_date", "=", frappe.datetime.get_today()],
				]);
			},
		},
		{
			key: "completed",
			label: __("Completed"),
			apply(listview) {
				cb_maintenance.list_ux.apply_filters(listview, [["CB PM Work Order", "status", "=", "Completed"]]);
			},
		},
	],
	on_refresh(listview, update) {
		cb_maintenance.list_ux.dashboard_stats((s) => {
			update({
				pm_overdue: s.pm_overdue,
				pm_open: s.pm_open,
				pm_due_today: s.pm_due_today,
			});
		});
	},
};

frappe.listview_settings["CB PM Work Order"] = {
	add_fields: ["due_date", "outlet", "asset_type", "task", "work_order_name"],
	filters: [["status", "in", ["Open", "Overdue"]]],
	get_indicator(doc) {
		const map = {
			Overdue: [__("Overdue"), "red", "status,=,Overdue"],
			Open: [__("Open"), "orange", "status,=,Open"],
			Completed: [__("Completed"), "green", "status,=,Completed"],
			Cancelled: [__("Cancelled"), "gray", "status,=,Cancelled"],
		};
		return map[doc.status] || [doc.status, "gray", `status,=,${doc.status}`];
	},
	formatters: {
		due_date: cb_maintenance.list_ux.formatters.due_date,
		outlet: cb_maintenance.list_ux.formatters.outlet,
		task: cb_maintenance.list_ux.formatters.task,
		asset: cb_maintenance.list_ux.formatters.name_cell,
	},
	onload(listview) {
		cb_maintenance.list_ux.setup(listview, CB_PM_LIST);
	},
	refresh(listview) {
		cb_maintenance.list_ux.refresh(listview, CB_PM_LIST);
	},
};
