frappe.ui.form.on("CB PM Work Order", {
	refresh(frm) {
		const is_new = frm.is_new();
		const badges = [];
		if (!is_new && frm.doc.status) {
			badges.push({ label: frm.doc.status, tone: cb_maintenance.form_ux.status_tone(frm.doc.status) });
		}

		let message = "";
		if (is_new) {
			message = __("New work orders are usually auto-created from PM rules. Use this form only for manual exceptions.");
		} else if (frm.doc.status === "Overdue") {
			message = __("This task is overdue. Complete it on site or raise a ticket if blocked.");
		} else if (frm.doc.status === "Open") {
			message = __("PM task is due. Mark done after on-site inspection.");
		} else if (frm.doc.status === "Completed") {
			message = __("Completed on {0} by {1}. Next occurrence is scheduled automatically.", [
				frm.doc.completed_on || "—",
				frm.doc.completed_by_staff || "—",
			]);
		}

		cb_maintenance.form_ux.setup(frm, {
			kicker: __("Step 2 · Execute PM"),
			title: is_new ? __("New PM work order") : frm.doc.task || frm.doc.name,
			description: is_new
				? __("Manual exception entry — prefer auto-generated work orders from PM rules.")
				: [frm.doc.outlet, frm.doc.asset].filter(Boolean).join(" · "),
			message,
			badges,
		});

		if (is_new) return;

		if (frm.doc.status === "Open" || frm.doc.status === "Overdue") {
			frm.add_custom_button(__("Mark Done"), () => complete_pm(frm, 0), __("Actions"));
			frm.add_custom_button(__("Fail & Raise Ticket"), () => complete_pm(frm, 1), __("Actions"));
		}

		if (frm.doc.asset) {
			frm.add_custom_button(__("View Asset"), () => {
				frappe.set_route("Form", "CB Asset", frm.doc.asset);
			});
		}
	},
});

function complete_pm(frm, failed) {
	const title = failed ? __("Fail inspection & raise ticket") : __("Mark PM as done");
	const primary = failed ? __("Raise Ticket") : __("Mark Done");

	frappe.prompt(
		[
			{
				fieldname: "notes",
				fieldtype: "Small Text",
				label: __("Notes"),
				description: failed
					? __("Describe what failed — a maintenance ticket will be created automatically.")
					: __("Optional notes from the site visit."),
			},
		],
		(values) => {
			frappe.call({
				method: "cb_maintenance.cb_maintenance.utils.pm_utils.complete_pm_work_order",
				args: { work_order: frm.doc.name, notes: values.notes, failed },
				freeze: true,
				callback() {
					frappe.show_alert({
						message: failed ? __("Ticket created from failed PM") : __("PM completed — next due date scheduled"),
						indicator: failed ? "orange" : "green",
					});
					frm.reload_doc();
				},
			});
		},
		title,
		primary
	);
}
