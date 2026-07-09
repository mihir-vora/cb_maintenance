/* Public desk sidebar: CB Maintenance entry opens the custom dashboard page */
frappe.provide("cb_maintenance.desk");

const CB_DASHBOARD_ROUTE = "cb-maintenance";
const CB_SIDEBAR_LABEL = "CB Maintenance";
const CB_SIDEBAR_WORKSPACE_SLUG = "cb-maintenance-desk";

function cb_is_sidebar_workspace_route(route) {
	if (!route || !route.length) return false;
	const first = String(route[0] || "").toLowerCase();
	if (first === "workspaces") {
		return frappe.router.slug(String(route[1] || "")) === CB_SIDEBAR_WORKSPACE_SLUG;
	}
	return first === CB_SIDEBAR_WORKSPACE_SLUG;
}

function cb_open_dashboard() {
	if (frappe.get_route_str() === CB_DASHBOARD_ROUTE && $(".cb-desk").length) return;
	frappe.set_route(CB_DASHBOARD_ROUTE);
}

function cb_sidebar_link_label($anchor) {
	return (
		$anchor.find(".sidebar-item-label").text() ||
		$anchor.find(".item-anchor").text() ||
		$anchor.text() ||
		""
	)
		.trim()
		.replace(/\s+/g, " ");
}

function cb_bind_sidebar_clicks() {
	const selectors = [
		".desk-sidebar .item-anchor",
		".body-sidebar .item-anchor",
		".sidebar-item-container a",
		".standard-sidebar-item a",
	].join(", ");

	$(document).off("click.cb_sidebar", selectors);
	$(document).on("click.cb_sidebar", selectors, function (e) {
		const $anchor = $(this);
		const label = cb_sidebar_link_label($anchor);
		const workspace = String($anchor.data("workspace") || "").toLowerCase();
		if (
			label !== CB_SIDEBAR_LABEL &&
			workspace !== CB_SIDEBAR_WORKSPACE_SLUG &&
			workspace !== "cb maintenance desk"
		) {
			return;
		}
		e.preventDefault();
		cb_open_dashboard();
	});
}

function cb_highlight_sidebar() {
	const route = frappe.get_route() || [];
	const on_dashboard =
		route[0] === CB_DASHBOARD_ROUTE ||
		(route[0] === "page" && route[1] === CB_DASHBOARD_ROUTE);
	$(".desk-sidebar .standard-sidebar-item").removeClass("selected");
	if (!on_dashboard) return;
	$(".desk-sidebar .item-anchor").each(function () {
		if (cb_sidebar_link_label($(this)) === CB_SIDEBAR_LABEL) {
			$(this).closest(".standard-sidebar-item").addClass("selected");
		}
	});
}

function cb_handle_sidebar_workspace_route() {
	if (cb_is_sidebar_workspace_route(frappe.get_route() || [])) {
		cb_open_dashboard();
	}
}

cb_maintenance.desk.handle_sidebar_workspace_route = cb_handle_sidebar_workspace_route;
cb_maintenance.desk.highlight_sidebar = cb_highlight_sidebar;

$(document).on("app_ready", function () {
	cb_bind_sidebar_clicks();
	cb_handle_sidebar_workspace_route();
	cb_highlight_sidebar();
});

frappe.router.on("change", function () {
	cb_handle_sidebar_workspace_route();
	cb_highlight_sidebar();
});
