/* Shared modern form UX for CB Maintenance doctypes */
frappe.provide("cb_maintenance.form_ux");

cb_maintenance.form_ux.setup = function (frm, config) {
	if (!frm || !frm.page) return;
	frm.page.wrapper.addClass("cb-modern-form-page");

	const shell_id = `cb-form-${frappe.scrub(frm.doctype)}`;
	if (frm.layout.wrapper.find(`#${shell_id}`).length) {
		cb_maintenance.form_ux._update_shell(frm, config, shell_id);
		return;
	}

	const badges = (config.badges || [])
		.map((b) => `<span class="cb-form-badge cb-form-badge--${b.tone || "neutral"}">${b.label}</span>`)
		.join("");

	const $shell = $(`
		<div id="${shell_id}" class="cb-form-shell">
			<div class="cb-form-hero">
				<div class="cb-form-hero-copy">
					<p class="cb-list-kicker">${config.kicker || __("CB Maintenance")}</p>
					<h2 class="cb-form-title">${config.title || frm.doc.name || frm.doctype}</h2>
					<p class="cb-form-desc">${config.description || ""}</p>
				</div>
				${badges ? `<div class="cb-form-badges">${badges}</div>` : ""}
			</div>
			${config.message ? `<div class="cb-form-guide-modern">${config.message}</div>` : ""}
		</div>
	`);

	frm.layout.wrapper.find(".cb-form-shell").remove();
	frm.layout.wrapper.prepend($shell);
};

cb_maintenance.form_ux._update_shell = function (frm, config, shell_id) {
	const $shell = frm.layout.wrapper.find(`#${shell_id}`);
	if (!$shell.length) return;
	if (config.title) $shell.find(".cb-form-title").text(config.title);
	if (config.description) $shell.find(".cb-form-desc").text(config.description);
	if (config.message !== undefined) {
		let $guide = $shell.find(".cb-form-guide-modern");
		if (config.message) {
			if ($guide.length) $guide.html(config.message);
			else $shell.append(`<div class="cb-form-guide-modern">${config.message}</div>`);
		} else {
			$guide.remove();
		}
	}
	if (config.badges) {
		const badges = config.badges
			.map((b) => `<span class="cb-form-badge cb-form-badge--${b.tone || "neutral"}">${b.label}</span>`)
			.join("");
		const $wrap = $shell.find(".cb-form-badges");
		if ($wrap.length) $wrap.html(badges);
		else $shell.find(".cb-form-hero").append(`<div class="cb-form-badges">${badges}</div>`);
	}
};

cb_maintenance.form_ux.status_tone = function (status) {
	const map = {
		Overdue: "danger",
		Open: "brand",
		"In Progress": "info",
		Resolved: "success",
		Completed: "success",
		Closed: "neutral",
		Cancelled: "neutral",
		Urgent: "danger",
		High: "warn",
		Medium: "info",
		Low: "neutral",
	};
	return map[status] || "neutral";
};
