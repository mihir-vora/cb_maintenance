frappe.listview_settings["CB PM Work Order"] = {
	add_fields: ["due_date", "outlet", "asset_type"],
	get_indicator(doc) {
		const indicators = {
			Overdue: [__("Overdue"), "red", "status,=,Overdue"],
			Open: [__("Open"), "orange", "status,=,Open"],
			Completed: [__("Completed"), "green", "status,=,Completed"],
			Cancelled: [__("Cancelled"), "gray", "status,=,Cancelled"],
		};
		return indicators[doc.status] || [doc.status, "gray", `status,=,${doc.status}`];
	},
	onload(listview) {
		listview.page.add_inner_button(__("Due & Overdue"), () => {
			listview.filter_area.clear();
			listview.filter_area.add([
				["CB PM Work Order", "status", "in", ["Open", "Overdue"]],
			]);
		});

		listview.page.add_inner_button(__("Overdue Only"), () => {
			listview.filter_area.clear();
			listview.filter_area.add([["CB PM Work Order", "status", "=", "Overdue"]]);
		});
	},
};
