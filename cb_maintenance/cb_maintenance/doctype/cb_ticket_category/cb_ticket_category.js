frappe.ui.form.on("CB Ticket Category", {
	refresh(frm) {
		const is_new = frm.is_new();
		cb_maintenance.form_ux.setup(frm, {
			kicker: __("Issue taxonomy"),
			title: is_new ? __("New ticket category") : frm.doc.category || frm.doc.name,
			description: [frm.doc.department, frm.doc.sub_category_1].filter(Boolean).join(" → "),
			message: __("Structured categories improve reporting and spare-part matching on tickets."),
		});
	},
});
