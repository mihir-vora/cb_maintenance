frappe.ui.form.on("CB PM Schedule Rule", {
	refresh(frm) {
		const is_new = frm.is_new();
		cb_maintenance.form_ux.setup(frm, {
			kicker: __("Step 1 · Define PM program"),
			title: is_new ? __("New PM schedule rule") : frm.doc.rule_name || frm.doc.name,
			description: is_new
				? __("Pick asset type, task, and frequency. Saving rolls work orders to every matching asset.")
				: frm.doc.asset_type
					? __("Rolls out to all {0} assets when active.", [frm.doc.asset_type])
					: __("PM schedule rule"),
			message: is_new
				? __("Keep task names action-oriented (e.g. “Clean condenser coil”). Frequency drives due dates.")
				: __("Edit carefully — changes re-sync work orders across the asset fleet."),
			badges: frm.doc.is_active
				? [{ label: __("Active"), tone: "success" }]
				: [{ label: __("Inactive"), tone: "neutral" }],
		});

		if (!is_new && frm.doc.asset_type) {
			frm.add_custom_button(__("View Work Orders"), () => {
				frappe.route_options = { schedule_rule: frm.doc.name };
				frappe.set_route("List", "CB PM Work Order");
			});
		}
	},
});
