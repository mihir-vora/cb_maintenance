frappe.listview_settings["CB Maintenance Ticket"] = {
	add_fields: ["priority", "assigned_to", "outlet"],
	get_indicator(doc) {
		const status_colors = {
			Open: "red",
			"In Progress": "orange",
			Resolved: "blue",
			Closed: "green",
		};
		const color = status_colors[doc.status] || "gray";
		return [__(doc.status), color, `status,=,${doc.status}`];
	},
	onload(listview) {
		listview.page.add_inner_button(__("Unassigned"), () => {
			listview.filter_area.clear();
			listview.filter_area.add([
				["CB Maintenance Ticket", "assigned_to", "is", "not set"],
				["CB Maintenance Ticket", "status", "!=", "Closed"],
			]);
		});

		listview.page.add_inner_button(__("Open & In Progress"), () => {
			listview.filter_area.clear();
			listview.filter_area.add([
				["CB Maintenance Ticket", "status", "in", ["Open", "In Progress"]],
			]);
		});
	},
};
