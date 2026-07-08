const CB_TICKET_LIST = {
	shell_id: "cb-ticket-list-shell",
	page_class: "cb-modern-list-page cb-ticket-list-page",
	kicker: __("Step 3 · Handle tickets"),
	title: __("Maintenance tickets"),
	description: __(
		"Reactive breakdowns and PM failures. Assign owners, progress status, and close when resolved."
	),
	stats: [
		{ key: "tickets_open", label: __("Open"), danger: true },
		{ key: "tickets_in_progress", label: __("In progress") },
		{ key: "tickets_unassigned", label: __("Unassigned"), danger: true },
	],
	filters: [
		{
			key: "active",
			label: __("Active"),
			apply(listview) {
				cb_maintenance.list_ux.apply_filters(listview, [
					["CB Maintenance Ticket", "status", "in", ["Open", "In Progress"]],
				]);
			},
		},
		{
			key: "unassigned",
			label: __("Unassigned"),
			apply(listview) {
				cb_maintenance.list_ux.apply_filters(listview, [
					["CB Maintenance Ticket", "assigned_to", "is", "not set"],
					["CB Maintenance Ticket", "status", "!=", "Closed"],
				]);
			},
		},
		{
			key: "open",
			label: __("Open"),
			apply(listview) {
				cb_maintenance.list_ux.apply_filters(listview, [["CB Maintenance Ticket", "status", "=", "Open"]]);
			},
		},
		{
			key: "closed",
			label: __("Closed"),
			apply(listview) {
				cb_maintenance.list_ux.apply_filters(listview, [["CB Maintenance Ticket", "status", "=", "Closed"]]);
			},
		},
	],
	on_refresh(listview, update) {
		cb_maintenance.list_ux.dashboard_stats((s) => {
			update({
				tickets_open: s.tickets_open,
				tickets_in_progress: s.tickets_in_progress,
				tickets_unassigned: s.tickets_unassigned,
			});
		});
	},
};

frappe.listview_settings["CB Maintenance Ticket"] = {
	add_fields: ["priority", "assigned_to", "outlet", "asset"],
	filters: [["status", "in", ["Open", "In Progress"]]],
	get_indicator(doc) {
		const colors = { Open: "red", "In Progress": "orange", Resolved: "blue", Closed: "green" };
		return [__(doc.status), colors[doc.status] || "gray", `status,=,${doc.status}`];
	},
	formatters: cb_maintenance.list_ux.lazy_formatters_map({
		subject: "name_cell",
		outlet: "outlet",
		priority: "priority",
	}),
	onload(listview) {
		cb_maintenance.list_ux.setup(listview, CB_TICKET_LIST);
	},
	refresh(listview) {
		cb_maintenance.list_ux.refresh(listview, CB_TICKET_LIST);
	},
};
