frappe.ui.form.on("CB Maintenance Ticket", {
	refresh(frm) {
		if (frm.doc.status === "Open" && !frm.doc.assigned_to) {
			frm.add_custom_button(__("Assign to Zonal Staff"), () => {
				frappe.call({
					method: "cb_maintenance.cb_maintenance.utils.pm_utils.assign_ticket_to_zonal_staff",
					args: { ticket: frm.doc.name },
					callback: () => frm.reload_doc(),
				});
			});
		}
	},
	ticket_category(frm) {
		if (frm.doc.ticket_category && frm.doc.asset) {
			const asset_type = frappe.db.get_value("CB Asset", frm.doc.asset, "asset_type");
			frappe.call({
				method: "cb_maintenance.cb_maintenance.utils.pm_utils.suggest_spare_part",
				args: { ticket_category: frm.doc.ticket_category, asset_type },
				callback(r) {
					if (r.message) frm.set_value("suggested_spare_part", r.message);
				},
			});
		}
	},
});
