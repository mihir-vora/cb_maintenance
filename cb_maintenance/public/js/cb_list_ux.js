/* Shared modern list UX for CB Maintenance doctypes */
frappe.provide("cb_maintenance.list_ux");

cb_maintenance.list_ux.setup = function (listview, config) {
	const page_class = config.page_class || "cb-modern-list-page";
	listview.page.wrapper.addClass(page_class);
	cb_maintenance.list_ux._render_shell(listview, config);
	cb_maintenance.list_ux._bind_filters(listview, config);
	cb_maintenance.list_ux._bind_dashboard_link(listview);
	try {
		listview.page.add_menu_item(__("Maintenance Home"), () => frappe.set_route("cb-maintenance"), true);
	} catch (e) {
		/* menu API differs across Frappe versions */
	}
	if (config.on_refresh) {
		config.on_refresh(listview, (stats) =>
			cb_maintenance.list_ux._update_stats(listview, config.shell_id, stats)
		);
	}
};

cb_maintenance.list_ux.refresh = function (listview, config) {
	cb_maintenance.list_ux._render_shell(listview, config);
	if (config.on_refresh) {
		config.on_refresh(listview, (stats) =>
			cb_maintenance.list_ux._update_stats(listview, config.shell_id, stats)
		);
	}
};

cb_maintenance.list_ux.lazy_formatters = function (...keys) {
	const formatters = {};
	keys.forEach((key) => {
		formatters[key] = function (value) {
			const fn = cb_maintenance.list_ux.formatters[key];
			return fn ? fn(value) : value;
		};
	});
	return formatters;
};

cb_maintenance.list_ux.lazy_formatters_map = function (field_map) {
	const formatters = {};
	Object.entries(field_map).forEach(([field, formatter_key]) => {
		formatters[field] = function (value) {
			const fn = cb_maintenance.list_ux.formatters[formatter_key];
			return fn ? fn(value) : value;
		};
	});
	return formatters;
};

cb_maintenance.list_ux._page_root = function (listview) {
	return listview.page?.main || listview.$page || $(listview.page?.body);
};

cb_maintenance.list_ux._build_shell = function (config) {
	const shell_id = config.shell_id;
	const stats_html = (config.stats || [])
		.map(
			(s) => `
		<div class="cb-list-stat${s.danger ? " cb-list-stat--danger" : ""}">
			<span class="cb-list-stat-val" data-stat="${s.key}">—</span>
			<span class="cb-list-stat-lbl">${s.label}</span>
		</div>`
		)
		.join("");

	const filters_html = (config.filters || [])
		.map(
			(f, i) => `
		<button type="button" class="cb-list-filter${i === 0 ? " is-active" : ""}" data-filter="${f.key}">${f.label}</button>`
		)
		.join("");

	return $(`
		<div id="${shell_id}" class="cb-list-shell">
			<div class="cb-list-hero">
				<div class="cb-list-hero-copy">
					<p class="cb-list-kicker">${config.kicker || ""}</p>
					<h2 class="cb-list-title">${config.title || ""}</h2>
					<p class="cb-list-desc">${config.description || ""}</p>
				</div>
				${stats_html ? `<div class="cb-list-stats" id="${shell_id}-stats">${stats_html}</div>` : ""}
			</div>
			<div class="cb-list-toolbar">
				${filters_html ? `<div class="cb-list-filters" id="${shell_id}-filters" role="tablist">${filters_html}</div>` : ""}
				<button type="button" class="cb-list-link" data-route="cb-maintenance">${__("← Dashboard")}</button>
			</div>
		</div>
	`);
};

cb_maintenance.list_ux._insert_shell = function (listview, $shell) {
	const $page = cb_maintenance.list_ux._page_root(listview);
	if (!$page || !$page.length) return false;

	const anchors = [
		".frappe-list",
		".list-view-container",
		".result-list",
		".page-form",
		".layout-main-section",
	];
	for (const selector of anchors) {
		const $anchor = $page.find(selector).first();
		if ($anchor.length) {
			$anchor.before($shell);
			return true;
		}
	}
	$page.prepend($shell);
	return true;
};

cb_maintenance.list_ux._render_shell = function (listview, config) {
	const shell_id = config.shell_id;
	const $page = cb_maintenance.list_ux._page_root(listview);
	if ($page.find(`#${shell_id}`).length) return;

	const $shell = cb_maintenance.list_ux._build_shell(config);

	const mount = () => cb_maintenance.list_ux._insert_shell(listview, $shell);
	if (mount()) return;

	let attempts = 0;
	const timer = setInterval(() => {
		attempts += 1;
		if (mount() || attempts >= 30) {
			clearInterval(timer);
		}
	}, 100);
};

cb_maintenance.list_ux._bind_filters = function (listview, config) {
	const shell_id = config.shell_id;
	const presets = config.filters || [];
	if (!presets.length) return;

	const $page = cb_maintenance.list_ux._page_root(listview);
	$page.off(`click.cb-list-${shell_id}`);
	$page.on(`click.cb-list-${shell_id}`, `#${shell_id}-filters .cb-list-filter`, function () {
		const key = this.dataset.filter;
		const preset = presets.find((f) => f.key === key);
		if (!preset || !preset.apply) return;
		$(`#${shell_id}-filters .cb-list-filter`).removeClass("is-active");
		$(this).addClass("is-active");
		preset.apply(listview);
	});
};

cb_maintenance.list_ux._bind_dashboard_link = function (listview) {
	const $page = cb_maintenance.list_ux._page_root(listview);
	$page.off("click.cb-dashboard-link");
	$page.on("click.cb-dashboard-link", "[data-route='cb-maintenance']", (e) => {
		e.preventDefault();
		frappe.set_route("cb-maintenance");
	});
};

cb_maintenance.list_ux._update_stats = function (listview, shell_id, stats) {
	const $stats = cb_maintenance.list_ux._page_root(listview).find(`#${shell_id}-stats`);
	if (!$stats.length || !stats) return;
	Object.entries(stats).forEach(([key, value]) => {
		$stats.find(`[data-stat="${key}"]`).text(value ?? 0);
	});
};

cb_maintenance.list_ux.dashboard_stats = function (update) {
	frappe.call({
		method: "cb_maintenance.cb_maintenance.utils.dashboard.get_dashboard_stats",
		async: true,
		callback: (res) => update(res.message || {}),
	});
};

cb_maintenance.list_ux.count_stats = function (items, update) {
	const stats = {};
	let pending = items.length;
	if (!pending) return update(stats);

	items.forEach((item) => {
		frappe.db.count(item.doctype, { filters: item.filters || {} }).then((count) => {
			stats[item.key] = count || 0;
			pending -= 1;
			if (pending === 0) update(stats);
		});
	});
};

cb_maintenance.list_ux.formatters = {
	outlet(value) {
		if (!value) return "";
		return `<span class="cb-cell-outlet">${frappe.utils.escape_html(value)}</span>`;
	},
	task(value) {
		if (!value) return "";
		return `<span class="cb-cell-task">${frappe.utils.escape_html(value)}</span>`;
	},
	name_cell(value) {
		if (!value) return "";
		return `<span class="cb-cell-name">${frappe.utils.escape_html(value)}</span>`;
	},
	priority(value) {
		if (!value) return "";
		const tone = { Urgent: "urgent", High: "high", Medium: "medium", Low: "low" }[value] || "medium";
		return `<span class="cb-priority cb-priority--${tone}">${frappe.utils.escape_html(value)}</span>`;
	},
	due_date(value) {
		if (!value) return "";
		const today = frappe.datetime.get_today();
		const label = frappe.datetime.str_to_user(value);
		if (value < today) {
			const days = frappe.datetime.get_diff(today, value);
			return `<span class="cb-due cb-due--overdue">${label}<span class="cb-due-meta">${days}d late</span></span>`;
		}
		if (value === today) {
			return `<span class="cb-due cb-due--today">${label}<span class="cb-due-meta">Today</span></span>`;
		}
		return `<span class="cb-due">${label}</span>`;
	},
	active_flag(value) {
		return value
			? `<span class="cb-flag cb-flag--on">${__("Active")}</span>`
			: `<span class="cb-flag cb-flag--off">${__("Inactive")}</span>`;
	},
};

cb_maintenance.list_ux.apply_filters = function (listview, filters) {
	listview.filter_area.clear();
	if (filters && filters.length) {
		listview.filter_area.add(filters);
	}
};
