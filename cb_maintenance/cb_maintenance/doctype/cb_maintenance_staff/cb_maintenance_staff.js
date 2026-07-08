frappe.ui.form.on("CB Maintenance Staff", {
	refresh(frm) {
		const is_new = frm.is_new();
		cb_maintenance.form_ux.setup(frm, {
			kicker: __("Maintenance team"),
			title: is_new ? __("New staff member") : frm.doc.full_name || frm.doc.name,
			description: is_new
				? __("Map technicians to zonal offices for automatic ticket assignment.")
				: [frm.doc.job_title, frm.doc.zonal_office].filter(Boolean).join(" · "),
			message: __("Active staff appear in ticket assignment and zonal routing."),
			badges: !is_new
				? [{ label: frm.doc.is_active ? __("Active") : __("Inactive"), tone: frm.doc.is_active ? "success" : "neutral" }]
				: [],
		});
	},
});
