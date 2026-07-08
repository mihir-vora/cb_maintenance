frappe.ui.form.on("CB Asset Type", {
	refresh(frm) {
		const is_new = frm.is_new();
		cb_maintenance.form_ux.setup(frm, {
			kicker: __("Equipment taxonomy"),
			title: is_new ? __("New asset type") : frm.doc.asset_type_name || frm.doc.name,
			description: __("Equipment class used by assets and PM schedule rules."),
			message: frm.doc.description || __("Examples: AC, RO Plant, Walk-in Chiller, DG Set."),
		});

		if (is_new) return;

		frm.add_custom_button(__("PM Rules"), () => {
			frappe.route_options = { asset_type: frm.doc.name };
			frappe.set_route("List", "CB PM Schedule Rule");
		});
		frm.add_custom_button(__("Assets"), () => {
			frappe.route_options = { asset_type: frm.doc.name };
			frappe.set_route("List", "CB Asset");
		});
	},
});
