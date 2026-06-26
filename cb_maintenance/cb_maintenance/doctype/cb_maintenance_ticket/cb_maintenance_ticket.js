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
		if (!frm.doc.ticket_category || !frm.doc.asset) return;
		frappe.db.get_value("CB Asset", frm.doc.asset, "asset_type").then((r) => {
			const asset_type = r.message?.asset_type || r.message;
			if (!asset_type) return;
			frappe.call({
				method: "cb_maintenance.cb_maintenance.utils.pm_utils.suggest_spare_part",
				args: { ticket_category: frm.doc.ticket_category, asset_type },
				callback(res) {
					if (res.message) frm.set_value("suggested_spare_part", res.message);
				},
			});
		});
	},
});
