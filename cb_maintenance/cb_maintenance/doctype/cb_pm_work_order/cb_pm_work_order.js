frappe.ui.form.on("CB PM Work Order", {
	refresh(frm) {
		if (frm.is_new()) {
			show_pm_guide(frm, __("New work orders are usually auto-created from PM rules. Use this form only for manual exceptions."));
			return;
		}

		if (frm.doc.status === "Open" || frm.doc.status === "Overdue") {
			const status_note =
				frm.doc.status === "Overdue"
					? __("This task is <strong>overdue</strong>. Complete it or raise a ticket if blocked.")
					: __("This PM task is <strong>due</strong>. Mark done after on-site inspection.");

			show_pm_guide(frm, status_note);

			frm.add_custom_button(__("Mark Done"), () => complete_pm(frm, 0), __("Actions"));
			frm.add_custom_button(
				__("Fail & Raise Ticket"),
				() => complete_pm(frm, 1),
				__("Actions")
			);
		} else if (frm.doc.status === "Completed") {
			show_pm_guide(
				frm,
				__("Completed on {0} by {1}. Next occurrence is scheduled automatically.", [
					frm.doc.completed_on || "—",
					frm.doc.completed_by_staff || "—",
				])
			);
		}

		if (frm.doc.asset) {
			frm.add_custom_button(__("View Asset"), () => {
				frappe.set_route("Form", "CB Asset", frm.doc.asset);
			});
		}
	},
});

function show_pm_guide(frm, message) {
	const $guide = $(`
		<div class="cb-form-guide">
			<strong>Step 2 — Complete PM:</strong> ${message}
		</div>
	`);
	frm.layout.wrapper.find(".cb-form-guide").remove();
	frm.layout.wrapper.prepend($guide);
}

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
					if (failed) {
						frappe.show_alert({
							message: __("Ticket created from failed PM"),
							indicator: "orange",
						});
					} else {
						frappe.show_alert({
							message: __("PM completed — next due date scheduled"),
							indicator: "green",
						});
					}
					frm.reload_doc();
				},
			});
		},
		title,
		primary
	);
}
