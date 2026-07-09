/* Global CB Maintenance desk registry — loads via app_include_js on every desk page */
frappe.provide("cb_maintenance.registry");

cb_maintenance.list_ux.CONFIGS = {
	"CB PM Work Order": {
		shell_id: "cb-pm-list-shell",
		page_class: "cb-modern-list-page cb-pm-list-page",
		kicker: __("Step 2 · Execute PM"),
		title: __("PM work orders"),
		description: __(
			"Work oldest overdue tasks first. Open a row to mark done or raise a ticket when inspection fails."
		),
		stats: [
			{ key: "pm_overdue", label: __("Overdue"), danger: true },
			{ key: "pm_open", label: __("Open") },
			{ key: "pm_due_today", label: __("Due today") },
		],
		filters: [
			{
				key: "all-open",
				label: __("All open"),
				apply(lv) {
					cb_maintenance.list_ux.apply_filters(lv, [
						["CB PM Work Order", "status", "in", ["Open", "Overdue"]],
					]);
				},
			},
			{
				key: "overdue",
				label: __("Overdue"),
				apply(lv) {
					cb_maintenance.list_ux.apply_filters(lv, [["CB PM Work Order", "status", "=", "Overdue"]]);
				},
			},
			{
				key: "due-today",
				label: __("Due today"),
				apply(lv) {
					cb_maintenance.list_ux.apply_filters(lv, [
						["CB PM Work Order", "status", "in", ["Open", "Overdue"]],
						["CB PM Work Order", "due_date", "=", frappe.datetime.get_today()],
					]);
				},
			},
			{
				key: "completed",
				label: __("Completed"),
				apply(lv) {
					cb_maintenance.list_ux.apply_filters(lv, [["CB PM Work Order", "status", "=", "Completed"]]);
				},
			},
		],
		on_refresh(lv, update) {
			cb_maintenance.list_ux.dashboard_stats((s) =>
				update({ pm_overdue: s.pm_overdue, pm_open: s.pm_open, pm_due_today: s.pm_due_today })
			);
		},
	},
	"CB Maintenance Ticket": {
		shell_id: "cb-ticket-list-shell",
		page_class: "cb-modern-list-page cb-ticket-list-page",
		kicker: __("Step 3 · Handle tickets"),
		title: __("Maintenance tickets"),
		description: __(
			"Reactive breakdowns and PM failures. Assign owners, progress status, and close when resolved."
		),
		stats: [
			{ key: "tickets_open", label: __("Open"), danger: true },
			{ key: "tickets_in_progress", label: __("In progress") },
			{ key: "tickets_unassigned", label: __("Unassigned"), danger: true },
		],
		filters: [
			{
				key: "active",
				label: __("Active"),
				apply(lv) {
					cb_maintenance.list_ux.apply_filters(lv, [
						["CB Maintenance Ticket", "status", "in", ["Open", "In Progress"]],
					]);
				},
			},
			{
				key: "unassigned",
				label: __("Unassigned"),
				apply(lv) {
					cb_maintenance.list_ux.apply_filters(lv, [
						["CB Maintenance Ticket", "assigned_to", "is", "not set"],
						["CB Maintenance Ticket", "status", "!=", "Closed"],
					]);
				},
			},
			{
				key: "open",
				label: __("Open"),
				apply(lv) {
					cb_maintenance.list_ux.apply_filters(lv, [["CB Maintenance Ticket", "status", "=", "Open"]]);
				},
			},
			{
				key: "closed",
				label: __("Closed"),
				apply(lv) {
					cb_maintenance.list_ux.apply_filters(lv, [["CB Maintenance Ticket", "status", "=", "Closed"]]);
				},
			},
		],
		on_refresh(lv, update) {
			cb_maintenance.list_ux.dashboard_stats((s) =>
				update({
					tickets_open: s.tickets_open,
					tickets_in_progress: s.tickets_in_progress,
					tickets_unassigned: s.tickets_unassigned,
				})
			);
		},
	},
	"CB PM Schedule Rule": {
		shell_id: "cb-rule-list-shell",
		kicker: __("Step 1 · Define PM program"),
		title: __("PM schedule rules"),
		description: __("Define preventive tasks per asset type. Saving rolls work orders to all matching assets."),
		stats: [
			{ key: "active", label: __("Active rules") },
			{ key: "total", label: __("Total rules") },
			{ key: "assets", label: __("Assets") },
		],
		filters: [
			{
				key: "active",
				label: __("Active"),
				apply(lv) {
					cb_maintenance.list_ux.apply_filters(lv, [["CB PM Schedule Rule", "is_active", "=", 1]]);
				},
			},
			{
				key: "all",
				label: __("All rules"),
				apply(lv) {
					cb_maintenance.list_ux.apply_filters(lv, []);
				},
			},
		],
		on_refresh(lv, update) {
			cb_maintenance.list_ux.count_stats(
				[
					{ key: "active", doctype: "CB PM Schedule Rule", filters: { is_active: 1 } },
					{ key: "total", doctype: "CB PM Schedule Rule" },
					{ key: "assets", doctype: "CB Asset", filters: { is_active: 1 } },
				],
				update
			);
		},
	},
	"CB Asset": {
		shell_id: "cb-asset-list-shell",
		kicker: __("Equipment inventory"),
		title: __("Assets"),
		description: __("Equipment instances by outlet. New assets auto-generate PM work orders from active rules."),
		stats: [
			{ key: "active", label: __("Active") },
			{ key: "total", label: __("Total") },
			{ key: "outlets", label: __("Outlets") },
		],
		filters: [
			{
				key: "active",
				label: __("Active"),
				apply(lv) {
					cb_maintenance.list_ux.apply_filters(lv, [["CB Asset", "is_active", "=", 1]]);
				},
			},
			{
				key: "all",
				label: __("All assets"),
				apply(lv) {
					cb_maintenance.list_ux.apply_filters(lv, []);
				},
			},
		],
		on_refresh(lv, update) {
			cb_maintenance.list_ux.count_stats(
				[
					{ key: "active", doctype: "CB Asset", filters: { is_active: 1 } },
					{ key: "total", doctype: "CB Asset" },
					{ key: "outlets", doctype: "CB Outlet", filters: { is_active: 1 } },
				],
				update
			);
		},
	},
	"CB Outlet": {
		shell_id: "cb-outlet-list-shell",
		kicker: __("Store network"),
		title: __("Outlets"),
		description: __("133-store master with city and zonal routing for maintenance ownership."),
		stats: [
			{ key: "active", label: __("Active") },
			{ key: "total", label: __("Total") },
			{ key: "zones", label: __("Zones") },
		],
		filters: [
			{
				key: "active",
				label: __("Active"),
				apply(lv) {
					cb_maintenance.list_ux.apply_filters(lv, [["CB Outlet", "is_active", "=", 1]]);
				},
			},
			{
				key: "all",
				label: __("All outlets"),
				apply(lv) {
					cb_maintenance.list_ux.apply_filters(lv, []);
				},
			},
		],
		on_refresh(lv, update) {
			cb_maintenance.list_ux.count_stats(
				[
					{ key: "active", doctype: "CB Outlet", filters: { is_active: 1 } },
					{ key: "total", doctype: "CB Outlet" },
					{ key: "zones", doctype: "CB Zonal Office" },
				],
				update
			);
		},
	},
	"CB Maintenance Staff": {
		shell_id: "cb-staff-list-shell",
		kicker: __("Maintenance team"),
		title: __("Maintenance staff"),
		description: __("Technicians and managers mapped to zonal offices for ticket routing."),
		stats: [
			{ key: "active", label: __("Active") },
			{ key: "total", label: __("Total") },
			{ key: "zones", label: __("Zones") },
		],
		filters: [
			{
				key: "active",
				label: __("Active"),
				apply(lv) {
					cb_maintenance.list_ux.apply_filters(lv, [["CB Maintenance Staff", "is_active", "=", 1]]);
				},
			},
			{
				key: "all",
				label: __("All staff"),
				apply(lv) {
					cb_maintenance.list_ux.apply_filters(lv, []);
				},
			},
		],
		on_refresh(lv, update) {
			cb_maintenance.list_ux.count_stats(
				[
					{ key: "active", doctype: "CB Maintenance Staff", filters: { is_active: 1 } },
					{ key: "total", doctype: "CB Maintenance Staff" },
					{ key: "zones", doctype: "CB Zonal Office" },
				],
				update
			);
		},
	},
	"CB Zonal Office": {
		shell_id: "cb-zone-list-shell",
		kicker: __("Regional operations"),
		title: __("Zonal offices"),
		description: __("Regional maintenance hubs that own outlets and staff in each city cluster."),
		stats: [
			{ key: "zones", label: __("Offices") },
			{ key: "outlets", label: __("Outlets") },
			{ key: "staff", label: __("Staff") },
		],
		filters: [
			{
				key: "all",
				label: __("All offices"),
				apply(lv) {
					cb_maintenance.list_ux.apply_filters(lv, []);
				},
			},
		],
		on_refresh(lv, update) {
			cb_maintenance.list_ux.count_stats(
				[
					{ key: "zones", doctype: "CB Zonal Office" },
					{ key: "outlets", doctype: "CB Outlet", filters: { is_active: 1 } },
					{ key: "staff", doctype: "CB Maintenance Staff", filters: { is_active: 1 } },
				],
				update
			);
		},
	},
	"CB Ticket Category": {
		shell_id: "cb-category-list-shell",
		kicker: __("Issue taxonomy"),
		title: __("Ticket categories"),
		description: __("Structured department → category → sub-category hierarchy for consistent reporting."),
		stats: [
			{ key: "total", label: __("Categories") },
			{ key: "departments", label: __("Departments") },
		],
		filters: [
			{
				key: "all",
				label: __("All categories"),
				apply(lv) {
					cb_maintenance.list_ux.apply_filters(lv, []);
				},
			},
		],
		on_refresh(lv, update) {
			Promise.all([
				frappe.db.count("CB Ticket Category"),
				frappe.call({
					method: "frappe.client.get_list",
					args: { doctype: "CB Ticket Category", fields: ["department"], limit_page_length: 500 },
				}),
			]).then(([total, res]) => {
				const departments = new Set((res.message || []).map((r) => r.department).filter(Boolean));
				update({ total: total || 0, departments: departments.size });
			});
		},
	},
	"CB Spare Part": {
		shell_id: "cb-part-list-shell",
		kicker: __("Parts catalog"),
		title: __("Spare parts"),
		description: __("Part codes linked to equipment categories for ticket spare-part hints."),
		stats: [
			{ key: "total", label: __("Parts") },
			{ key: "categories", label: __("Categories") },
		],
		filters: [
			{
				key: "all",
				label: __("All parts"),
				apply(lv) {
					cb_maintenance.list_ux.apply_filters(lv, []);
				},
			},
		],
		on_refresh(lv, update) {
			Promise.all([
				frappe.db.count("CB Spare Part"),
				frappe.call({
					method: "frappe.client.get_list",
					args: { doctype: "CB Spare Part", fields: ["category"], limit_page_length: 500 },
				}),
			]).then(([total, res]) => {
				const categories = new Set((res.message || []).map((r) => r.category).filter(Boolean));
				update({ total: total || 0, categories: categories.size });
			});
		},
	},
	"CB Asset Type": {
		shell_id: "cb-asset-type-list-shell",
		kicker: __("Equipment taxonomy"),
		title: __("Asset types"),
		description: __("Equipment classes used by assets and PM schedule rules."),
		stats: [
			{ key: "types", label: __("Types") },
			{ key: "assets", label: __("Assets") },
			{ key: "rules", label: __("PM rules") },
		],
		filters: [
			{
				key: "all",
				label: __("All types"),
				apply(lv) {
					cb_maintenance.list_ux.apply_filters(lv, []);
				},
			},
		],
		on_refresh(lv, update) {
			cb_maintenance.list_ux.count_stats(
				[
					{ key: "types", doctype: "CB Asset Type" },
					{ key: "assets", doctype: "CB Asset", filters: { is_active: 1 } },
					{ key: "rules", doctype: "CB PM Schedule Rule", filters: { is_active: 1 } },
				],
				update
			);
		},
	},
};

cb_maintenance.list_ux.mount_if_cb = function (listview) {
	if (!listview || !listview.doctype) return;
	const config = cb_maintenance.list_ux.CONFIGS[listview.doctype];
	if (!config) return;
	cb_maintenance.list_ux.setup(listview, config);
};

cb_maintenance.registry._fmt = function (map) {
	return cb_maintenance.list_ux.lazy_formatters_map(map);
};

cb_maintenance.registry.register_lists = function () {
	const F = cb_maintenance.registry._fmt;

	const defs = {
		"CB PM Work Order": {
			add_fields: ["due_date", "outlet", "asset_type", "task", "work_order_name", "status"],
			filters: [["status", "in", ["Open", "Overdue"]]],
			get_indicator(doc) {
				const map = {
					Overdue: [__("Overdue"), "red", "status,=,Overdue"],
					Open: [__("Open"), "orange", "status,=,Open"],
					Completed: [__("Completed"), "green", "status,=,Completed"],
					Cancelled: [__("Cancelled"), "gray", "status,=,Cancelled"],
				};
				return map[doc.status] || [doc.status, "gray", `status,=,${doc.status}`];
			},
			formatters: F({ due_date: "due_date", outlet: "outlet", task: "task", asset: "name_cell" }),
		},
		"CB Maintenance Ticket": {
			add_fields: ["priority", "assigned_to", "outlet", "asset"],
			filters: [["status", "in", ["Open", "In Progress"]]],
			get_indicator(doc) {
				const colors = { Open: "red", "In Progress": "orange", Resolved: "blue", Closed: "green" };
				return [__(doc.status), colors[doc.status] || "gray", `status,=,${doc.status}`];
			},
			formatters: F({ subject: "name_cell", outlet: "outlet", priority: "priority" }),
		},
		"CB PM Schedule Rule": {
			add_fields: ["frequency", "is_active"],
			get_indicator(doc) {
				return doc.is_active
					? [__("Active"), "green", "is_active,=,1"]
					: [__("Inactive"), "gray", "is_active,=,0"];
			},
			formatters: F({
				rule_name: "name_cell",
				task: "task",
				asset_type: "outlet",
				is_active: "active_flag",
			}),
		},
		"CB Asset": {
			add_fields: ["is_active", "serial_no"],
			get_indicator(doc) {
				return doc.is_active
					? [__("Active"), "green", "is_active,=,1"]
					: [__("Inactive"), "gray", "is_active,=,0"];
			},
			formatters: F({ asset_name: "name_cell", outlet: "outlet", asset_type: "task" }),
		},
		"CB Outlet": {
			add_fields: ["is_active", "zonal_office"],
			get_indicator(doc) {
				return doc.is_active
					? [__(doc.city || __("Active")), "green", `city,=,${doc.city}`]
					: [__("Inactive"), "gray", "is_active,=,0"];
			},
			formatters: F({
				outlet_code: "outlet",
				city: "name_cell",
				zonal_office: "task",
				is_active: "active_flag",
			}),
		},
		"CB Maintenance Staff": {
			add_fields: ["email", "is_active"],
			get_indicator(doc) {
				return doc.is_active
					? [__(doc.job_title || __("Active")), "blue", "is_active,=,1"]
					: [__("Inactive"), "gray", "is_active,=,0"];
			},
			formatters: F({
				employee_no: "outlet",
				full_name: "name_cell",
				job_title: "task",
				zonal_office: "outlet",
			}),
		},
		"CB Zonal Office": {
			formatters: F({ office_name: "name_cell", city_code: "outlet" }),
		},
		"CB Ticket Category": {
			formatters: F({ department: "outlet", category: "name_cell", sub_category_1: "task" }),
		},
		"CB Spare Part": {
			formatters: F({ part_code: "outlet", part_name: "name_cell", category: "task" }),
		},
		"CB Asset Type": {
			formatters: F({ asset_type_name: "name_cell" }),
		},
	};

	Object.entries(defs).forEach(([doctype, settings]) => {
		const config = cb_maintenance.list_ux.CONFIGS[doctype];
		frappe.listview_settings[doctype] = Object.assign({}, settings, {
			onload(listview) {
				cb_maintenance.list_ux.setup(listview, config);
			},
			refresh(listview) {
				cb_maintenance.list_ux.refresh(listview, config);
			},
		});
	});
};

cb_maintenance.registry.patch_list_view = function () {
	const candidates = [
		frappe.views && frappe.views.ListView,
		frappe.listview && frappe.listview.ListView,
	].filter(Boolean);

	const call_mount = (listview) => {
		cb_maintenance.list_ux.mount_if_cb(listview);
		setTimeout(() => cb_maintenance.list_ux.mount_if_cb(listview), 250);
		setTimeout(() => cb_maintenance.list_ux.mount_if_cb(listview), 800);
	};

	candidates.forEach((LV) => {
		if (!LV || LV.prototype.__cb_patched) return;

		if (LV.prototype.setup_view) {
			const orig_setup = LV.prototype.setup_view;
			LV.prototype.setup_view = function () {
				orig_setup.apply(this, arguments);
				call_mount(this);
			};
		}

		if (LV.prototype.refresh) {
			const orig_refresh = LV.prototype.refresh;
			LV.prototype.refresh = function () {
				const ret = orig_refresh.apply(this, arguments);
				call_mount(this);
				return ret;
			};
		}

		LV.prototype.__cb_patched = true;
	});
};

cb_maintenance.registry.register_forms = function () {
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
				frm.add_custom_button(__("Mark Done"), () => cb_maintenance.registry.complete_pm(frm, 0), __("Actions"));
				frm.add_custom_button(
					__("Fail & Raise Ticket"),
					() => cb_maintenance.registry.complete_pm(frm, 1),
					__("Actions")
				);
			}
			if (frm.doc.asset) {
				frm.add_custom_button(__("View Asset"), () => frappe.set_route("Form", "CB Asset", frm.doc.asset));
			}
		},
	});

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
					: __("Assign staff, update status as work progresses, and close when resolved."),
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
				frm.add_custom_button(__("Start Work"), () => cb_maintenance.registry.set_ticket_status(frm, "In Progress"), __("Actions"));
			}
			if (frm.doc.status === "In Progress") {
				frm.add_custom_button(__("Mark Resolved"), () => cb_maintenance.registry.set_ticket_status(frm, "Resolved"), __("Actions"));
			}
			if (frm.doc.status === "Resolved") {
				frm.add_custom_button(__("Close Ticket"), () => cb_maintenance.registry.set_ticket_status(frm, "Closed"), __("Actions"));
			}
			if (frm.doc.source_pm_work_order) {
				frm.add_custom_button(__("View Source PM"), () =>
					frappe.set_route("Form", "CB PM Work Order", frm.doc.source_pm_work_order)
				);
			}
			if (frm.doc.asset) {
				frm.add_custom_button(__("View Asset"), () => frappe.set_route("Form", "CB Asset", frm.doc.asset));
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
					? __("Keep task names action-oriented. Frequency drives due dates.")
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

	frappe.ui.form.on("CB Outlet", {
		refresh(frm) {
			if (frm.is_new()) {
				cb_maintenance.form_ux.setup(frm, {
					kicker: __("Store network"),
					title: __("New outlet"),
					description: __("Outlet code, city, and zonal office drive maintenance routing."),
					message: __("Use the same outlet codes as the case master for consistent reporting."),
				});
				return;
			}
			cb_maintenance.form_ux.setup(frm, {
				kicker: __("Store network"),
				title: frm.doc.outlet_code || frm.doc.name,
				description: [frm.doc.city, frm.doc.zonal_office].filter(Boolean).join(" · "),
				message: __("Jump to assets, PM work orders, or tickets for this outlet."),
				badges: frm.doc.is_active
					? [{ label: frm.doc.city || __("Active"), tone: "success" }]
					: [{ label: __("Inactive"), tone: "neutral" }],
			});
			frm.add_custom_button(__("View Assets"), () => {
				frappe.route_options = { outlet: frm.doc.name };
				frappe.set_route("List", "CB Asset");
			});
			frm.add_custom_button(__("PM Work Orders"), () => {
				frappe.route_options = { outlet: frm.doc.name };
				frappe.set_route("List", "CB PM Work Order");
			});
			frm.add_custom_button(__("Tickets"), () => {
				frappe.route_options = { outlet: frm.doc.name };
				frappe.set_route("List", "CB Maintenance Ticket");
			});
		},
	});

	frappe.ui.form.on("CB Asset", {
		refresh(frm) {
			const is_new = frm.is_new();
			cb_maintenance.form_ux.setup(frm, {
				kicker: __("Equipment inventory"),
				title: is_new ? __("New asset") : frm.doc.asset_name || frm.doc.name,
				description: is_new
					? __("Link equipment to an outlet and asset type. PM work orders generate from active rules.")
					: [frm.doc.outlet, frm.doc.asset_type].filter(Boolean).join(" · "),
				message: is_new
					? __("Saving creates PM work orders for all matching active schedule rules.")
					: __("Serial number and active flag control whether PM continues for this unit."),
				badges: !is_new
					? [{ label: frm.doc.is_active ? __("Active") : __("Inactive"), tone: frm.doc.is_active ? "success" : "neutral" }]
					: [],
			});
			if (is_new) return;
			frm.add_custom_button(__("PM Work Orders"), () => {
				frappe.route_options = { asset: frm.doc.name };
				frappe.set_route("List", "CB PM Work Order");
			});
			frm.add_custom_button(__("Tickets"), () => {
				frappe.route_options = { asset: frm.doc.name };
				frappe.set_route("List", "CB Maintenance Ticket");
			});
			if (frm.doc.outlet) {
				frm.add_custom_button(__("View Outlet"), () => frappe.set_route("Form", "CB Outlet", frm.doc.outlet));
			}
		},
	});

	frappe.ui.form.on("CB Maintenance Staff", {
		refresh(frm) {
			const is_new = frm.is_new();
			cb_maintenance.form_ux.setup(frm, {
				kicker: __("Maintenance team"),
				title: is_new ? __("New staff member") : frm.doc.full_name || frm.doc.name,
				description: is_new
					? __("Map technicians to zonal offices for automatic ticket assignment.")
					: [frm.doc.job_title, frm.doc.zonal_office].filter(Boolean).join(" · "),
				message: __("Active staff appear in ticket assignment and zonal routing."),
				badges: !is_new
					? [{ label: frm.doc.is_active ? __("Active") : __("Inactive"), tone: frm.doc.is_active ? "success" : "neutral" }]
					: [],
			});
		},
	});

	frappe.ui.form.on("CB Zonal Office", {
		refresh(frm) {
			const is_new = frm.is_new();
			cb_maintenance.form_ux.setup(frm, {
				kicker: __("Regional operations"),
				title: is_new ? __("New zonal office") : frm.doc.office_name || frm.doc.name,
				description: __("Regional hub for outlets and maintenance staff in a city cluster."),
				message: frm.doc.city_code
					? __("Primary city code: {0}", [frm.doc.city_code])
					: __("Set city code to align with outlet routing."),
				badges: frm.doc.city_code ? [{ label: frm.doc.city_code, tone: "brand" }] : [],
			});
			if (is_new) return;
			frm.add_custom_button(__("Outlets"), () => {
				frappe.route_options = { zonal_office: frm.doc.name };
				frappe.set_route("List", "CB Outlet");
			});
			frm.add_custom_button(__("Staff"), () => {
				frappe.route_options = { zonal_office: frm.doc.name };
				frappe.set_route("List", "CB Maintenance Staff");
			});
		},
	});

	frappe.ui.form.on("CB Ticket Category", {
		refresh(frm) {
			cb_maintenance.form_ux.setup(frm, {
				kicker: __("Issue taxonomy"),
				title: frm.is_new() ? __("New ticket category") : frm.doc.category || frm.doc.name,
				description: [frm.doc.department, frm.doc.sub_category_1].filter(Boolean).join(" → "),
				message: __("Structured categories improve reporting and spare-part matching on tickets."),
			});
		},
	});

	frappe.ui.form.on("CB Spare Part", {
		refresh(frm) {
			cb_maintenance.form_ux.setup(frm, {
				kicker: __("Parts catalog"),
				title: frm.is_new() ? __("New spare part") : frm.doc.part_name || frm.doc.name,
				description: [frm.doc.part_code, frm.doc.category].filter(Boolean).join(" · "),
				message: __("Parts can be suggested automatically when raising tickets from matching categories."),
				badges: frm.doc.department ? [{ label: frm.doc.department, tone: "info" }] : [],
			});
		},
	});

	frappe.ui.form.on("CB Asset Type", {
		refresh(frm) {
			cb_maintenance.form_ux.setup(frm, {
				kicker: __("Equipment taxonomy"),
				title: frm.is_new() ? __("New asset type") : frm.doc.asset_type_name || frm.doc.name,
				description: __("Equipment class used by assets and PM schedule rules."),
				message: frm.doc.description || __("Examples: AC, RO Plant, Walk-in Chiller, DG Set."),
			});
			if (frm.is_new()) return;
			frm.add_custom_button(__("PM Rules"), () => {
				frappe.route_options = { asset_type: frm.doc.name };
				frappe.set_route("List", "CB PM Schedule Rule");
			});
			frm.add_custom_button(__("Assets"), () => {
				frappe.route_options = { asset_type: frm.doc.name };
				frappe.set_route("List", "CB Asset");
			});
		},
	});
};

cb_maintenance.registry.complete_pm = function (frm, failed) {
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
		failed ? __("Fail inspection & raise ticket") : __("Mark PM as done"),
		failed ? __("Raise Ticket") : __("Mark Done")
	);
};

cb_maintenance.registry.set_ticket_status = function (frm, status) {
	frm.set_value("status", status);
	frm.save();
};

cb_maintenance.registry.init = function () {
	if (cb_maintenance.registry._inited) return;
	cb_maintenance.registry._inited = true;
	cb_maintenance.registry.register_lists();
	cb_maintenance.registry.register_forms();
	cb_maintenance.registry.patch_list_view();

	frappe.router.on("change", () => {
		setTimeout(() => {
			if (window.cur_list) cb_maintenance.list_ux.mount_if_cb(window.cur_list);
		}, 400);
	});

	if (window.cur_list) cb_maintenance.list_ux.mount_if_cb(window.cur_list);
};

$(document).on("app_ready", () => cb_maintenance.registry.init());

if (typeof frappe.ready === "function") {
	frappe.ready(() => cb_maintenance.registry.init());
} else {
	setTimeout(() => cb_maintenance.registry.init(), 0);
}
