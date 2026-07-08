frappe.ui.form.on("CB Spare Part", {
	refresh(frm) {
		const is_new = frm.is_new();
		cb_maintenance.form_ux.setup(frm, {
			kicker: __("Parts catalog"),
			title: is_new ? __("New spare part") : frm.doc.part_name || frm.doc.name,
			description: [frm.doc.part_code, frm.doc.category].filter(Boolean).join(" · "),
			message: __("Parts can be suggested automatically when raising tickets from matching categories."),
			badges: frm.doc.department ? [{ label: frm.doc.department, tone: "info" }] : [],
		});
	},
});
