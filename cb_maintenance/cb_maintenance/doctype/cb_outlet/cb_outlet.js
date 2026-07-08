frappe.ui.form.on("CB Outlet", {
	refresh(frm) {
		if (frm.is_new()) {
			cb_maintenance.form_ux.setup(frm, {
				kicker: __("Store network"),
				title: __("New outlet"),
				description: __("Outlet code, city, and zonal office drive maintenance routing."),
				message: __("Use the same outlet codes as the case master for consistent reporting."),
			});
			return;
		}

		cb_maintenance.form_ux.setup(frm, {
			kicker: __("Store network"),
			title: frm.doc.outlet_code || frm.doc.name,
			description: [frm.doc.city, frm.doc.zonal_office].filter(Boolean).join(" · "),
			message: __("Jump to assets, PM work orders, or tickets for this outlet."),
			badges: frm.doc.is_active
				? [{ label: frm.doc.city || __("Active"), tone: "success" }]
				: [{ label: __("Inactive"), tone: "neutral" }],
		});

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
