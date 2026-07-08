frappe.ui.form.on("CB Zonal Office", {
	refresh(frm) {
		const is_new = frm.is_new();
		cb_maintenance.form_ux.setup(frm, {
			kicker: __("Regional operations"),
			title: is_new ? __("New zonal office") : frm.doc.office_name || frm.doc.name,
			description: __("Regional hub for outlets and maintenance staff in a city cluster."),
			message: frm.doc.city_code
				? __("Primary city code: {0}", [frm.doc.city_code])
				: __("Set city code to align with outlet routing."),
			badges: frm.doc.city_code ? [{ label: frm.doc.city_code, tone: "brand" }] : [],
		});

		if (is_new) return;

		frm.add_custom_button(__("Outlets"), () => {
			frappe.route_options = { zonal_office: frm.doc.name };
			frappe.set_route("List", "CB Outlet");
		});
		frm.add_custom_button(__("Staff"), () => {
			frappe.route_options = { zonal_office: frm.doc.name };
			frappe.set_route("List", "CB Maintenance Staff");
		});
	},
});
