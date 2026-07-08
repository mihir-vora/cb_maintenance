/* CB Maintenance — portfolio-quality operations dashboard */
frappe.pages["cb-maintenance"].on_page_load = function (wrapper) {
	const page = frappe.ui.make_app_page({
		parent: wrapper,
		title: __("CB Maintenance"),
		single_column: true,
	});

	const $root = $(page.body).addClass("cb-desk");
	$root.html(CB.template());

	CB.bind($root);
	CB.load_stats($root);
	CB.bind_shortcuts($root);
};

const CB = {
	routes: {
		"pm-overdue": { list: "CB PM Work Order", filters: { status: "Overdue" } },
		"pm-open": { list: "CB PM Work Order", filters: { status: "Open" } },
		"pm-due-today": { list: "CB PM Work Order", filters: { due_date: frappe.datetime.get_today() } },
		tickets: { list: "CB Maintenance Ticket", filters: { status: "Open" } },
		"tickets-open": { list: "CB Maintenance Ticket", filters: { status: "Open" } },
		"tickets-unassigned": {
			list: "CB Maintenance Ticket",
			filters: { assigned_to: ["is", "not set"], status: ["!=", "Closed"] },
		},
		rules: { list: "CB PM Schedule Rule", filters: {} },
		"new-rule": { form: "CB PM Schedule Rule" },
		"new-ticket": { form: "CB Maintenance Ticket" },
		outlets: { list: "CB Outlet", filters: {} },
		assets: { list: "CB Asset", filters: {} },
		staff: { list: "CB Maintenance Staff", filters: {} },
		zones: { list: "CB Zonal Office", filters: {} },
		categories: { list: "CB Ticket Category", filters: {} },
		parts: { list: "CB Spare Part", filters: {} },
	},
	shortcut_help_open: false,

	go(key) {
		const r = this.routes[key];
		if (!r) return;
		if (r.form) {
			frappe.new_doc(r.form);
			return;
		}
		frappe.route_options = { ...(r.filters || {}) };
		frappe.set_route("List", r.list);
	},

	bind($root) {
		$root.on("click", "[data-nav]", (e) => {
			e.preventDefault();
			CB.go(e.currentTarget.dataset.nav);
		});

		$root.on("click", "[data-open-form]", (e) => {
			e.preventDefault();
			const doctype = e.currentTarget.dataset.doctype;
			const name = e.currentTarget.dataset.name;
			if (doctype && name) frappe.set_route("Form", doctype, name);
		});

		$root.on("click", "[data-tab]", (e) => {
			const id = e.currentTarget.dataset.tab;
			CB.switch_tab($root, id);
		});

		$root.on("click", "[data-accordion]", function () {
			const $item = $(this).closest(".cb-acc-item");
			const open = $item.hasClass("is-open");
			$root.find(".cb-acc-item").removeClass("is-open");
			if (!open) $item.addClass("is-open");
		});

		$root.on("input", "#cb-search", (e) => {
			CB.filter_content($root, e.target.value || "");
		});

		$root.on("click", "#cb-shortcuts-btn", () => {
			CB.toggle_shortcut_help($root);
		});
		$root.on("click", "#cb-close-shortcuts", () => {
			CB.toggle_shortcut_help($root, false);
		});

		$root.on("click", ".cb-link-btn[data-tab]", function (e) {
			e.preventDefault();
			CB.switch_tab($root, this.dataset.tab);
		});
	},

	bind_shortcuts($root) {
		$(document).on("keydown.cb-maintenance", (e) => {
			if (!$root.closest("body").length) return;

			if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
				e.preventDefault();
				$root.find("#cb-search").focus().select();
				return;
			}
			if (!e.ctrlKey && !e.metaKey && e.key === "/") {
				const tag = (document.activeElement?.tagName || "").toLowerCase();
				if (tag !== "input" && tag !== "textarea") {
					e.preventDefault();
					$root.find("#cb-search").focus();
				}
				return;
			}
			if (!e.ctrlKey && !e.metaKey && e.key === "?") {
				e.preventDefault();
				CB.toggle_shortcut_help($root);
				return;
			}
			if (e.altKey && ["1", "2", "3", "4"].includes(e.key)) {
				e.preventDefault();
				const map = { 1: "overview", 2: "howto", 3: "features", 4: "reference" };
				CB.switch_tab($root, map[e.key]);
				return;
			}
			if (e.altKey && e.key.toLowerCase() === "o") {
				e.preventDefault();
				CB.go("pm-overdue");
				return;
			}
			if (e.altKey && e.key.toLowerCase() === "t") {
				e.preventDefault();
				CB.go("tickets-open");
				return;
			}
			if (e.altKey && e.key.toLowerCase() === "n") {
				e.preventDefault();
				CB.go("new-ticket");
			}
		});
	},

	switch_tab($root, id) {
		$root.find("[data-tab]").removeClass("is-active").attr("aria-selected", "false");
		$root.find(`[data-tab="${id}"]`).addClass("is-active").attr("aria-selected", "true");
		$root.find("[data-panel]").removeClass("is-active");
		$root.find(`[data-panel="${id}"]`).addClass("is-active");
	},

	toggle_shortcut_help($root, force) {
		if (typeof force === "boolean") {
			this.shortcut_help_open = force;
		} else {
			this.shortcut_help_open = !this.shortcut_help_open;
		}
		$root.find("#cb-shortcuts").toggleClass("is-open", this.shortcut_help_open);
	},

	filter_content($root, term) {
		const q = term.trim().toLowerCase();
		if (!q) {
			$root.find("[data-searchable]").removeClass("is-hidden");
			$root.find("#cb-search-empty").removeClass("is-visible");
			return;
		}
		let visible = 0;
		$root.find("[data-searchable]").each((_, el) => {
			const text = (el.textContent || "").toLowerCase();
			const match = text.includes(q);
			$(el).toggleClass("is-hidden", !match);
			if (match) visible += 1;
		});
		$root.find("#cb-search-empty").toggleClass("is-visible", visible === 0);
	},

	load_stats($root) {
		const $stats = $root.find("#cb-stats");
		$stats.addClass("is-loading");

		frappe.call({
			method: "cb_maintenance.cb_maintenance.utils.dashboard.get_dashboard_stats",
			async: true,
			callback: (res) => {
				const s = res.message || {};
				$stats.removeClass("is-loading");
				CB.render_metrics($root, s);
				CB.render_insights($root, s);
				CB.render_queues($root, s);
				CB.render_health($root, s);
				CB.render_onboarding($root, s);
			},
			error: () => {
				$stats.removeClass("is-loading").html(
					`<div class="cb-alert cb-alert-warn">${__(
						"Could not load dashboard analytics. Use quick actions below."
					)}</div>`
				);
				$root.find("#cb-insights").html(
					`<div class="cb-alert cb-alert-note">${__(
						"Insights are temporarily unavailable. Check connectivity and refresh."
					)}</div>`
				);
			},
		});
	},

	render_metrics($root, s) {
		const items = [
			{
				v: s.pm_overdue,
				label: __("Overdue PM"),
				nav: "pm-overdue",
				tone: "danger",
				icon: "⚠",
				tip: __("Tasks past due date — action needed"),
			},
			{
				v: s.pm_open,
				label: __("Open PM"),
				nav: "pm-open",
				tone: "brand",
				icon: "◷",
				tip: __("Preventive tasks pending"),
			},
			{
				v: s.tickets_open,
				label: __("Open Tickets"),
				nav: "tickets-open",
				tone: "info",
				icon: "◎",
				tip: __("Reactive incidents being handled"),
			},
			{
				v: s.outlets,
				label: __("Outlets"),
				nav: "outlets",
				tone: "neutral",
				icon: "⌂",
				tip: __("Stores in the network"),
			},
		];
		$root.find("#cb-stats").html(
			items
				.map(
					(x) => `
				<button type="button" class="cb-stat cb-stat--${x.tone}${(x.v || 0) > 0 && x.tone === "danger" ? " is-alert" : ""}" data-nav="${x.nav}" title="${x.tip}">
					<span class="cb-stat-icon" aria-hidden="true">${x.icon}</span>
					<span class="cb-stat-body">
						<span class="cb-stat-val">${x.v ?? 0}</span>
						<span class="cb-stat-lbl">${x.label}</span>
					</span>
				</button>`
				)
				.join("")
		);

		$root.find("#cb-meta-rules").text(`${s.pm_rules || 0} ${__("rules")}`);
		$root.find("#cb-meta-assets").text(`${s.assets || 0} ${__("assets")}`);
		$root.find("#cb-meta-overdue").text(`${s.pm_overdue || 0} ${__("overdue")}`);
		$root.find("#cb-meta-week").text(`${s.pm_due_week || 0} ${__("due this week")}`);
		$root.find("#cb-meta-tickets").text(`${s.tickets_open || 0} ${__("open")}`);
		$root.find("#cb-meta-unassigned").text(`${s.tickets_unassigned || 0} ${__("unassigned")}`);
	},

	render_health($root, s) {
		const score = s.health_score ?? 0;
		const tone = score >= 85 ? "good" : score >= 65 ? "ok" : "risk";
		const label = score >= 85 ? __("Healthy") : score >= 65 ? __("Watchlist") : __("Needs Attention");
		const color =
			tone === "good" ? "#16a34a" : tone === "ok" ? "#ca8a04" : "#dc2626";
		$root.find("#cb-health").html(
			`<div class="cb-gauge cb-gauge--${tone}">
				<div class="cb-gauge-ring" style="--cb-gauge: ${score}; --cb-gauge-color: ${color};">
					<div class="cb-gauge-inner">
						<span class="cb-gauge-score">${score}</span>
					</div>
				</div>
				<div class="cb-gauge-copy">
					<span class="cb-gauge-title">${__("Health Score")}</span>
					<span class="cb-gauge-label">${label}</span>
				</div>
			</div>`
		);
	},

	render_insights($root, s) {
		const insights = Array.isArray(s.insights) ? s.insights : [];
		if (!insights.length) {
			$root.find("#cb-insights").html(
				`<div class="cb-alert cb-alert-note">${__("No critical alerts right now. Operations look stable.")}</div>`
			);
			return;
		}
		$root.find("#cb-insights").html(
			insights
				.map((item) => {
					const type = item.type || "info";
					const dot = type === "warning" ? "!" : type === "success" ? "✓" : "i";
					return `<article class="cb-insight cb-insight--${type}" data-searchable>
						<div class="cb-insight-icon" aria-hidden="true">${dot}</div>
						<div class="cb-insight-content">
							<div class="cb-insight-title">${item.title || __("Insight")}</div>
							<div class="cb-insight-msg">${item.message || ""}</div>
						</div>
						${
							item.action
								? `<button type="button" class="cb-btn cb-btn-ghost cb-btn-sm" data-nav="${item.action}">${__(
										"View"
								  )}</button>`
								: ""
						}
					</article>`;
				})
				.join("")
		);
	},

	render_queues($root, s) {
		const overdue = Array.isArray(s.overdue_preview) ? s.overdue_preview : [];
		const unassigned = Array.isArray(s.unassigned_preview) ? s.unassigned_preview : [];

		if (!overdue.length) {
			$root.find("#cb-overdue-queue").html(
				`<div class="cb-empty">${__("No overdue PM right now. Great job.")}</div>`
			);
		} else {
			$root.find("#cb-overdue-queue").html(
				overdue
					.map(
						(row) => `<tr data-searchable>
							<td>${frappe.utils.escape_html(row.outlet || "—")}</td>
							<td>${frappe.utils.escape_html(row.task || "—")}</td>
							<td><span class="cb-badge-danger">${row.days_overdue || 0}d</span></td>
							<td><button type="button" class="cb-table-link" data-open-form data-doctype="CB PM Work Order" data-name="${row.name}">${__(
								"Open"
							)}</button></td>
						</tr>`
					)
					.join("")
			);
		}

		if (!unassigned.length) {
			$root.find("#cb-unassigned-queue").html(
				`<div class="cb-empty">${__("No unassigned tickets. All active tickets have an owner.")}</div>`
			);
		} else {
			$root.find("#cb-unassigned-queue").html(
				unassigned
					.map(
						(row) => `<tr data-searchable>
							<td>${frappe.utils.escape_html(row.outlet || "—")}</td>
							<td>${frappe.utils.escape_html(row.subject || "—")}</td>
							<td>${frappe.utils.escape_html(row.priority || "Medium")}</td>
							<td><button type="button" class="cb-table-link" data-open-form data-doctype="CB Maintenance Ticket" data-name="${row.name}">${__(
								"Open"
							)}</button></td>
						</tr>`
					)
					.join("")
			);
		}
	},

	render_onboarding($root, s) {
		const missing = [];
		if (!(s.pm_rules > 0)) missing.push({ label: __("Create PM Rule"), nav: "new-rule" });
		if (!(s.assets > 0)) missing.push({ label: __("Review Assets"), nav: "assets" });
		if (!(s.staff > 0)) missing.push({ label: __("Review Staff"), nav: "staff" });

		if (!missing.length) {
			$root.find("#cb-onboarding").html("");
			return;
		}
		$root.find("#cb-onboarding").html(
			`<section class="cb-section">
				<h2 class="cb-h2">${__("Onboarding Checklist")}</h2>
				<p class="cb-sub">${__("Finish setup steps to make the workflow fully operational.")}</p>
				<div class="cb-checklist">
					${missing
						.map(
							(step) => `<button type="button" class="cb-check-item" data-nav="${step.nav}">
								<span>${step.label}</span>
								<span>→</span>
							</button>`
						)
						.join("")}
				</div>
			</section>`
		);
	},

	template() {
		return `<div class="cb-app">
			<header class="cb-top">
				<div class="cb-brand">
					<div class="cb-brand-mark" aria-hidden="true">CB</div>
					<div>
						<p class="cb-brand-kicker">${__("California Burrito")}</p>
						<h1 class="cb-brand-title">${__("Maintenance")}</h1>
					</div>
				</div>
				<div class="cb-top-actions">
					<button type="button" class="cb-chip" data-nav="pm-overdue" title="${__("Alt + O")}">
						<span class="cb-chip-dot cb-chip-dot--danger"></span>${__("Overdue PM")}
					</button>
					<button type="button" class="cb-chip" data-nav="tickets-open" title="${__("Alt + T")}">
						<span class="cb-chip-dot cb-chip-dot--info"></span>${__("Tickets")}
					</button>
					<button type="button" class="cb-btn cb-btn-primary" data-nav="new-ticket" title="${__(
						"Alt + N"
					)}">${__("Raise Ticket")}</button>
				</div>
			</header>

			<nav class="cb-nav" aria-label="${__("Dashboard navigation")}">
				<div class="cb-nav-tabs" role="tablist">
					<button class="cb-nav-tab is-active" data-tab="overview" role="tab" aria-selected="true">${__(
						"Overview"
					)}</button>
					<button class="cb-nav-tab" data-tab="howto" role="tab" aria-selected="false">${__(
						"How to Use"
					)}</button>
					<button class="cb-nav-tab" data-tab="features" role="tab" aria-selected="false">${__(
						"Features"
					)}</button>
					<button class="cb-nav-tab" data-tab="reference" role="tab" aria-selected="false">${__(
						"Reference"
					)}</button>
				</div>
				<div class="cb-search-wrap">
					<span class="cb-search-icon" aria-hidden="true">⌕</span>
					<input id="cb-search" class="cb-search" type="search" placeholder="${__(
						"Search…  Ctrl+K"
					)}" />
				</div>
				<button type="button" id="cb-shortcuts-btn" class="cb-icon-chip" title="${__(
					"Keyboard shortcuts"
				)}">?</button>
			</nav>
			<div id="cb-search-empty" class="cb-search-empty">${__(
				"No matches found for this search term."
			)}</div>

			<div id="cb-shortcuts" class="cb-shortcuts">
				<div class="cb-shortcuts-card">
					<div class="cb-shortcuts-head">
						<h3>${__("Keyboard shortcuts")}</h3>
						<button type="button" id="cb-close-shortcuts" class="cb-icon-btn">×</button>
					</div>
					<ul>
						<li><kbd>Ctrl/Cmd</kbd> + <kbd>K</kbd> ${__("Focus dashboard search")}</li>
						<li><kbd>/</kbd> ${__("Focus search")}</li>
						<li><kbd>Alt</kbd> + <kbd>1..4</kbd> ${__("Switch tabs")}</li>
						<li><kbd>Alt</kbd> + <kbd>O</kbd> ${__("Open overdue PM")}</li>
						<li><kbd>Alt</kbd> + <kbd>T</kbd> ${__("Open tickets")}</li>
						<li><kbd>Alt</kbd> + <kbd>N</kbd> ${__("Raise ticket")}</li>
						<li><kbd>?</kbd> ${__("Show/hide this help")}</li>
					</ul>
				</div>
			</div>

			<div class="cb-panel is-active" data-panel="overview" role="tabpanel">
				<section class="cb-hero-grid" data-searchable>
					<article class="cb-welcome">
						<p class="cb-eyebrow">${__("Operations desk · 133 outlets")}</p>
						<h2 class="cb-welcome-title">${__("Plan PM, fix breakdowns, close the loop.")}</h2>
						<p class="cb-welcome-desc">${__(
							"Preventive schedules roll out automatically. Overdue work and open tickets surface here so teams act before equipment fails."
						)}</p>
						<div id="cb-health" class="cb-welcome-gauge"></div>
					</article>
					<div class="cb-bento" id="cb-stats">
						<div class="cb-skel"></div><div class="cb-skel"></div>
						<div class="cb-skel"></div><div class="cb-skel"></div>
					</div>
				</section>

				<section class="cb-section" data-searchable>
					<div class="cb-section-head">
						<h2 class="cb-h2">${__("Insights")}</h2>
						<p class="cb-sub">${__("What needs attention right now")}</p>
					</div>
					<div id="cb-insights" class="cb-insights"></div>
				</section>

				<section id="cb-onboarding"></section>

				<section class="cb-section" data-searchable>
					<div class="cb-section-head">
						<h2 class="cb-h2">${__("Workflow")}</h2>
						<p class="cb-sub">${__("Three steps to run maintenance daily")}</p>
					</div>
					<div class="cb-workflow">
						<article class="cb-wf-card" data-searchable>
							<span class="cb-wf-step">${__("Step 1")}</span>
							<h3>${__("Define PM Program")}</h3>
							<p>${__("Create schedule rules per asset type. Saving rolls work orders to all matching assets.")}</p>
							<p class="cb-wf-meta"><span id="cb-meta-rules">—</span> · <span id="cb-meta-assets">—</span></p>
							<div class="cb-wf-actions">
								<button type="button" class="cb-btn cb-btn-fill" data-nav="rules">${__("View Rules")}</button>
								<button type="button" class="cb-btn" data-nav="new-rule">${__("+ New Rule")}</button>
							</div>
						</article>
						<article class="cb-wf-card is-focus" data-searchable>
							<span class="cb-wf-step">${__("Step 2")}</span>
							<h3>${__("Complete Due PM")}</h3>
							<p>${__("Technicians open work orders and mark done or raise ticket when failed.")}</p>
							<p class="cb-wf-meta"><span id="cb-meta-overdue">—</span> · <span id="cb-meta-week">—</span></p>
							<div class="cb-wf-actions">
								<button type="button" class="cb-btn cb-btn-fill" data-nav="pm-overdue">${__("Overdue PM")}</button>
								<button type="button" class="cb-btn" data-nav="pm-due-today">${__("Due Today")}</button>
							</div>
						</article>
						<article class="cb-wf-card" data-searchable>
							<span class="cb-wf-step">${__("Step 3")}</span>
							<h3>${__("Handle Tickets")}</h3>
							<p>${__("Track incidents from Open to Close with assignment and ownership.")}</p>
							<p class="cb-wf-meta"><span id="cb-meta-tickets">—</span> · <span id="cb-meta-unassigned">—</span></p>
							<div class="cb-wf-actions">
								<button type="button" class="cb-btn cb-btn-fill" data-nav="tickets-open">${__("Open Tickets")}</button>
								<button type="button" class="cb-btn" data-nav="tickets-unassigned">${__("Unassigned")}</button>
							</div>
						</article>
					</div>
				</section>

				<section class="cb-section">
					<div class="cb-section-head">
						<h2 class="cb-h2">${__("Queues")}</h2>
						<p class="cb-sub">${__("Oldest overdue PM and unassigned tickets")}</p>
					</div>
					<div class="cb-queue-grid">
						<div class="cb-queue-card" data-searchable>
							<h3>${__("Overdue PM Queue")}</h3>
							<table class="cb-table">
								<thead><tr><th>${__("Outlet")}</th><th>${__("Task")}</th><th>${__("Aging")}</th><th></th></tr></thead>
								<tbody id="cb-overdue-queue"></tbody>
							</table>
						</div>
						<div class="cb-queue-card" data-searchable>
							<h3>${__("Unassigned Tickets")}</h3>
							<table class="cb-table">
								<thead><tr><th>${__("Outlet")}</th><th>${__("Subject")}</th><th>${__("Priority")}</th><th></th></tr></thead>
								<tbody id="cb-unassigned-queue"></tbody>
							</table>
						</div>
					</div>
				</section>
			</div>

			<div class="cb-panel" data-panel="howto" role="tabpanel">
				<section class="cb-section">
					<h2 class="cb-h2">${__("How to Use CB Maintenance")}</h2>
					<p class="cb-sub">${__("Follow these steps in order. No Frappe training required.")}</p>
					<div class="cb-acc">
						${CB.howto_step(1, __("Set up PM rules (HQ — one time)"), `
							<ol class="cb-steps-list">
								<li>${__("Open")} <button type="button" class="cb-link-btn" data-nav="rules">${__("PM Schedule Rules")}</button>.</li>
								<li>${__("Create a rule with Asset Type, Task, and Frequency.")}</li>
								<li>${__("Save. Work orders auto-generate for all matching assets.")}</li>
							</ol>
							<div class="cb-alert cb-alert-note">${__("Tip: Keep task names action-oriented (e.g. 'Clean condenser coil').")}</div>
						`)}
						${CB.howto_step(2, __("Execute PM tasks (daily operations)"), `
							<ol class="cb-steps-list">
								<li>${__("Open")} <button type="button" class="cb-link-btn" data-nav="pm-overdue">${__("Overdue PM")}</button> ${__("first.")}</li>
								<li>${__("Open a work order and verify outlet, asset, and task.")}</li>
								<li>${__("Use")} <strong>${__("Mark Done")}</strong> ${__("or")} <strong>${__("Fail & Raise Ticket")}</strong>.</li>
							</ol>
							<div class="cb-alert cb-alert-warn">${__("Warning: Overdue PM increases downtime risk and emergency repair cost.")}</div>
						`)}
						${CB.howto_step(3, __("Manage tickets"), `
							<ol class="cb-steps-list">
								<li>${__("Raise a ticket from the top action or directly from failed PM.")}</li>
								<li>${__("Assign or auto-assign to zonal staff.")}</li>
								<li>${__("Move status Open → In Progress → Resolved → Closed.")}</li>
							</ol>
						`)}
						${CB.howto_step(4, __("Leadership monitoring"), `
							<p>${__("Use metric cards and insight alerts to monitor backlogs, ownership, and operational health.")}</p>
							<p>${__("Drill down with one click from any metric, queue row, or insight action.")}</p>
						`)}
					</div>
				</section>
			</div>

			<div class="cb-panel" data-panel="features" role="tabpanel">
				<section class="cb-section">
					<h2 class="cb-h2">${__("Feature Catalog")}</h2>
					<p class="cb-sub">${__("Every feature has a clear operational purpose.")}</p>
					<div class="cb-feat-grid">
						${CB.feat(__("PM Schedule Rule"), __("Define PM once per equipment type + frequency."), "rules")}
						${CB.feat(__("PM Work Order"), __("Executable PM task at an outlet with due date and status."), "pm-open")}
						${CB.feat(__("Maintenance Ticket"), __("Reactive incident ticket with owner and lifecycle."), "tickets-open")}
						${CB.feat(__("Outlets"), __("Store master with city/zonal mapping."), "outlets")}
						${CB.feat(__("Assets"), __("Equipment inventory by outlet."), "assets")}
						${CB.feat(__("Maintenance Staff"), __("Zonal maintenance ownership map."), "staff")}
						${CB.feat(__("Ticket Categories"), __("Structured issue taxonomy for consistent reporting."), "categories")}
						${CB.feat(__("Spare Parts"), __("Part suggestions and catalog lookup."), "parts")}
					</div>
				</section>
			</div>

			<div class="cb-panel" data-panel="reference" role="tabpanel">
				<section class="cb-section">
					<h2 class="cb-h2">${__("Buttons & Fields Explained")}</h2>
					<p class="cb-sub">${__("What each key action and field does, and why it matters.")}</p>
					<div class="cb-ref-grid">
						${CB.ref(__("Mark Done"), __("PM Work Order"), __("Completes PM and auto-schedules the next due date."))}
						${CB.ref(__("Fail & Raise Ticket"), __("PM Work Order"), __("Creates a linked maintenance ticket for failure follow-up."))}
						${CB.ref(__("Assign to Zonal Staff"), __("Maintenance Ticket"), __("Routes ticket to maintenance owner for that zone."))}
						${CB.ref(__("Start Work"), __("Maintenance Ticket"), __("Moves ticket from Open to In Progress."))}
						${CB.ref(__("Mark Resolved"), __("Maintenance Ticket"), __("Field work finished; pending closure confirmation."))}
						${CB.ref(__("Close Ticket"), __("Maintenance Ticket"), __("Marks ticket complete and exits active workload."))}
						${CB.ref(__("Asset Type"), __("PM Rule"), __("Determines where rule will roll out."))}
						${CB.ref(__("Frequency"), __("PM Rule"), __("Defines recurrence interval for PM scheduling."))}
						${CB.ref(__("Due Date"), __("PM Work Order"), __("Planned completion date; drives overdue flag."))}
						${CB.ref(__("Suggested Spare Part"), __("Maintenance Ticket"), __("Best-effort recommendation based on issue context."))}
						${CB.ref(__("Source PM Work Order"), __("Maintenance Ticket"), __("Traceability to PM inspection failure."))}
						${CB.ref(__("Zonal Office"), __("Outlet / Staff"), __("Operational region used for routing and ownership."))}
					</div>
				</section>
			</div>
		</div>`;
	},

	howto_step(n, title, body) {
		return `<div class="cb-acc-item${n === 1 ? " is-open" : ""}" data-searchable>
			<button type="button" class="cb-acc-head" data-accordion>
				<span class="cb-acc-num">${n}</span>
				<span class="cb-acc-title">${title}</span>
				<span class="cb-acc-chevron" aria-hidden="true"></span>
			</button>
			<div class="cb-acc-body">${body}</div>
		</div>`;
	},

	feat(title, desc, nav) {
		return `<article class="cb-feat-card" data-searchable>
			<h3>${title}</h3>
			<p>${desc}</p>
			<button type="button" class="cb-btn cb-btn-ghost cb-btn-sm" data-nav="${nav}">${__("Open")}</button>
		</article>`;
	},

	ref(name, where, desc) {
		return `<div class="cb-ref-card" data-searchable>
			<div class="cb-ref-name">${name}</div>
			<div class="cb-ref-where">${where}</div>
			<p>${desc}</p>
		</div>`;
	},
};
