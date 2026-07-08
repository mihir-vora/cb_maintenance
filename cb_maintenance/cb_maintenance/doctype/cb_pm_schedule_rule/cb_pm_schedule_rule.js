frappe.ui.form.on("CB PM Schedule Rule", {
	refresh(frm) {
		if (frm.is_new()) {
			show_rule_guide(
				frm,
				__(
					"<strong>Step 1 — Define PM program:</strong> Pick an asset type, describe the task, and set frequency. Saving rolls this out to every matching asset at all outlets."
				)
			);
		} else {
			show_rule_guide(
				frm,
				__(
					"This rule auto-generates work orders for all <strong>{0}</strong> assets when saved.",
					[frm.doc.asset_type || __("matching")]
				)
			);
			if (frm.doc.asset_type) {
				frm.add_custom_button(__("View Work Orders"), () => {
					frappe.route_options = { schedule_rule: frm.doc.name };
					frappe.set_route("List", "CB PM Work Order");
				});
			}
		}
	},
});

function show_rule_guide(frm, message) {
	const $guide = $(`<div class="cb-form-guide">${message}</div>`);
	frm.layout.wrapper.find(".cb-form-guide").remove();
	frm.layout.wrapper.prepend($guide);
}
