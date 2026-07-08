frappe.ui.form.on("CB Outlet", {
	refresh(frm) {
		if (frm.is_new()) return;
		frm.add_custom_button(__("View Assets"), () => {
			frappe.route_options = { outlet: frm.doc.name };
			frappe.set_route("List", "CB Asset");
		});
		frm.add_custom_button(__("PM Work Orders"), () => {
			frappe.route_options = { outlet: frm.doc.name };
			frappe.set_route("List", "CB PM Work Order");
		});
		frm.add_custom_button(__("Tickets"), () => {
			frappe.route_options = { outlet: frm.doc.name };
			frappe.set_route("List", "CB Maintenance Ticket");
		});
	},
});
