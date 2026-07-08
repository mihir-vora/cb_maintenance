frappe.ui.form.on("CB Asset", {
	refresh(frm) {
		const is_new = frm.is_new();
		cb_maintenance.form_ux.setup(frm, {
			kicker: __("Equipment inventory"),
			title: is_new ? __("New asset") : frm.doc.asset_name || frm.doc.name,
			description: is_new
				? __("Link equipment to an outlet and asset type. PM work orders generate from active rules.")
				: [frm.doc.outlet, frm.doc.asset_type].filter(Boolean).join(" · "),
			message: is_new
				? __("Saving creates PM work orders for all matching active schedule rules.")
				: __("Serial number and active flag control whether PM continues for this unit."),
			badges: !is_new
				? [{ label: frm.doc.is_active ? __("Active") : __("Inactive"), tone: frm.doc.is_active ? "success" : "neutral" }]
				: [],
		});

		if (is_new) return;

		frm.add_custom_button(__("PM Work Orders"), () => {
			frappe.route_options = { asset: frm.doc.name };
			frappe.set_route("List", "CB PM Work Order");
		});
		frm.add_custom_button(__("Tickets"), () => {
			frappe.route_options = { asset: frm.doc.name };
			frappe.set_route("List", "CB Maintenance Ticket");
		});
		if (frm.doc.outlet) {
			frm.add_custom_button(__("View Outlet"), () => {
				frappe.set_route("Form", "CB Outlet", frm.doc.outlet);
			});
		}
	},
});
