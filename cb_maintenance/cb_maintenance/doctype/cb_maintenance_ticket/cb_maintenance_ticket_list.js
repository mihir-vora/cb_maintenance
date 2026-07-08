frappe.listview_settings["CB Maintenance Ticket"] = {
	add_fields: ["priority", "assigned_to", "outlet"],
	filters: [["status", "in", ["Open", "In Progress"]]],
	get_indicator(doc) {
		const colors = { Open: "red", "In Progress": "orange", Resolved: "blue", Closed: "green" };
		return [__(doc.status), colors[doc.status] || "gray", `status,=,${doc.status}`];
	},
	onload(listview) {
		listview.page.add_inner_button(__("Unassigned"), () => {
			listview.filter_area.clear();
			listview.filter_area.add([
				["CB Maintenance Ticket", "assigned_to", "is", "not set"],
				["CB Maintenance Ticket", "status", "!=", "Closed"],
			]);
		});
		listview.page.add_inner_button(__("Active"), () => {
			listview.filter_area.clear();
			listview.filter_area.add([
				["CB Maintenance Ticket", "status", "in", ["Open", "In Progress"]],
			]);
		});
	},
};
