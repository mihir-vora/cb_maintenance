/* Route guard: custom desk page must win over legacy Workspace at /app/cb-maintenance */
frappe.provide("cb_maintenance.desk");

const CB_DESK_TARGET = "cb-maintenance";
const CB_LEGACY_WORKSPACES = new Set([
	"cb maintenance",
	"cb-maintenance",
	"maintenance home",
	"maintenance-home",
]);
const CB_SIDEBAR_WORKSPACE_SLUG = "cb-maintenance-desk";

function cb_is_legacy_workspace_route(route) {
	if (!route || !route.length) return false;
	const first = String(route[0] || "").toLowerCase();
	if (first === "workspaces") {
		const slug = frappe.router.slug(String(route[1] || ""));
		if (slug === CB_SIDEBAR_WORKSPACE_SLUG) return true;
		return CB_LEGACY_WORKSPACES.has(String(route[1] || "").toLowerCase());
	}
	return first === CB_SIDEBAR_WORKSPACE_SLUG;
}

function cb_workspace_stole_page() {
	const route = frappe.get_route() || [];
	if (route[0] !== CB_DESK_TARGET) return false;
	if ($(".cb-desk").length) return false;
	const $main = $(".layout-main-section");
	return Boolean(
		$main.find(".widget.shortcut").length ||
			$main.find(".workspace-shortcuts").length ||
			$main.find(".workspace-block").length
	);
}

function cb_go_to_dashboard() {
	if (frappe.get_route_str() === CB_DESK_TARGET && $(".cb-desk").length) return;
	frappe.set_route(CB_DESK_TARGET);
}

function cb_ensure_custom_page() {
	const route = frappe.get_route() || [];
	if (cb_is_legacy_workspace_route(route)) {
		cb_go_to_dashboard();
		return;
	}
	if (route[0] === CB_DESK_TARGET) {
		setTimeout(() => {
			if (cb_workspace_stole_page()) cb_go_to_dashboard();
		}, 200);
	}
}

cb_maintenance.desk.ensure_custom_page = cb_ensure_custom_page;

$(document).on("app_ready", cb_ensure_custom_page);
frappe.router.on("change", cb_ensure_custom_page);
