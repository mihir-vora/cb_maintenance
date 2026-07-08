frappe.listview_settings["CB PM Work Order"] = {
	add_fields: ["due_date", "outlet", "asset_type", "task"],
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
		due_date(value) {
			if (!value) return "";
			const today = frappe.datetime.get_today();
			if (value < today) return `<span class="text-danger bold">${frappe.datetime.str_to_user(value)}</span>`;
			return frappe.datetime.str_to_user(value);
		},
	},
	onload(listview) {
		listview.page.add_inner_button(__("All Open"), () => {
			listview.filter_area.clear();
			listview.filter_area.add([["CB PM Work Order", "status", "in", ["Open", "Overdue"]]]);
		});
		listview.page.add_inner_button(__("Overdue"), () => {
			listview.filter_area.clear();
			listview.filter_area.add([["CB PM Work Order", "status", "=", "Overdue"]]);
		});
	},
};
