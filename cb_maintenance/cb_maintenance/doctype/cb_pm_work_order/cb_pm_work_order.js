frappe.ui.form.on("CB PM Work Order", {
	refresh(frm) {
		if (frm.doc.status === "Open" || frm.doc.status === "Overdue") {
			frm.add_custom_button(__("Mark Done"), () => complete_pm(frm, 0), __("Actions"));
			frm.add_custom_button(__("Fail & Raise Ticket"), () => complete_pm(frm, 1), __("Actions"));
		}
	},
});

function complete_pm(frm, failed) {
	frappe.prompt(
		[{ fieldname: "notes", fieldtype: "Small Text", label: __("Notes") }],
		(values) => {
			frappe.call({
				method: "cb_maintenance.cb_maintenance.utils.pm_utils.complete_pm_work_order",
				args: { work_order: frm.doc.name, notes: values.notes, failed },
				callback: () => frm.reload_doc(),
			});
		},
		__("Complete PM"),
		__("Submit")
	);
}
