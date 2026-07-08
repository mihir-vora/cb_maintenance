frappe.ui.form.on("CB Maintenance Ticket", {
	refresh(frm) {
		const is_new = frm.is_new();
		const badges = [];
		if (!is_new && frm.doc.status) {
			badges.push({ label: frm.doc.status, tone: cb_maintenance.form_ux.status_tone(frm.doc.status) });
		}
		if (!is_new && frm.doc.priority) {
			badges.push({ label: frm.doc.priority, tone: cb_maintenance.form_ux.status_tone(frm.doc.priority) });
		}

		cb_maintenance.form_ux.setup(frm, {
			kicker: __("Step 3 · Handle tickets"),
			title: is_new ? __("New maintenance ticket") : frm.doc.subject || frm.doc.name,
			description: is_new
				? __("Log a reactive breakdown. Outlet, asset, and category drive routing and spare-part hints.")
				: [frm.doc.outlet, frm.doc.asset].filter(Boolean).join(" · ") || frm.doc.name,
			message: is_new
				? __("Fill outlet, asset, and category. Staff assignment and spare-part hints are automatic.")
				: __(
						"Assign staff, update status as work progresses, and close when resolved. Use action buttons on the right."
				  ),
			badges,
		});

		if (is_new) return;

		if (frm.doc.status === "Open" && !frm.doc.assigned_to) {
			frm.add_custom_button(__("Assign to Zonal Staff"), () => {
				frappe.call({
					method: "cb_maintenance.cb_maintenance.utils.pm_utils.assign_ticket_to_zonal_staff",
					args: { ticket: frm.doc.name },
					freeze: true,
					callback: () => frm.reload_doc(),
				});
			}, __("Actions"));
		}

		if (frm.doc.status === "Open") {
			frm.add_custom_button(__("Start Work"), () => set_status(frm, "In Progress"), __("Actions"));
		}
		if (frm.doc.status === "In Progress") {
			frm.add_custom_button(__("Mark Resolved"), () => set_status(frm, "Resolved"), __("Actions"));
		}
		if (frm.doc.status === "Resolved") {
			frm.add_custom_button(__("Close Ticket"), () => set_status(frm, "Closed"), __("Actions"));
		}

		if (frm.doc.source_pm_work_order) {
			frm.add_custom_button(__("View Source PM"), () => {
				frappe.set_route("Form", "CB PM Work Order", frm.doc.source_pm_work_order);
			});
		}

		if (frm.doc.asset) {
			frm.add_custom_button(__("View Asset"), () => {
				frappe.set_route("Form", "CB Asset", frm.doc.asset);
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

function set_status(frm, status) {
	frm.set_value("status", status);
	frm.save();
}
