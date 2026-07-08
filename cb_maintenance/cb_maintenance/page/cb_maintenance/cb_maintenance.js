/* CB Maintenance — unified desk experience */
frappe.pages["cb-maintenance"].on_page_load = function (wrapper) {
	const page = frappe.ui.make_app_page({
		parent: wrapper,
		title: __("CB Maintenance"),
		single_column: true,
	});

	page.set_primary_action(__("Raise Ticket"), () => CB.go("new-ticket"), "add");

	const $root = $(page.body).addClass("cb-desk");
	$root.html(CB.template());

	CB.bind($root);
	CB.load_stats($root);
};

const CB = {
	routes: {
		"pm-overdue": { list: "CB PM Work Order", filters: { status: "Overdue" } },
		"pm-open": { list: "CB PM Work Order", filters: { status: "Open" } },
		"pm-all": { list: "CB PM Work Order", filters: {} },
		tickets: { list: "CB Maintenance Ticket", filters: { status: "Open" } },
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

		$root.on("click", "[data-tab]", function () {
			const id = this.dataset.tab;
			$root.find("[data-tab]").removeClass("is-active").attr("aria-selected", "false");
			$(this).addClass("is-active").attr("aria-selected", "true");
			$root.find("[data-panel]").removeClass("is-active");
			$root.find(`[data-panel="${id}"]`).addClass("is-active");
		});

		$root.on("click", "[data-accordion]", function () {
			const $item = $(this).closest(".cb-acc-item");
			const open = $item.hasClass("is-open");
			$root.find(".cb-acc-item").removeClass("is-open");
			if (!open) $item.addClass("is-open");
		});
	},

	load_stats($root) {
		const $stats = $root.find("#cb-stats");
		$stats.addClass("is-loading");

		frappe.call({
			method: "cb_maintenance.cb_maintenance.utils.dashboard.get_dashboard_stats",
			async: true,
			callback: (res) => {
				$stats.removeClass("is-loading");
				const s = res.message || {};
				const items = [
					{
						v: s.pm_overdue,
						label: __("Overdue PM"),
						nav: "pm-overdue",
						warn: s.pm_overdue > 0,
						tip: __("Tasks past due date — action needed"),
					},
					{
						v: s.pm_open,
						label: __("Open PM"),
						nav: "pm-open",
						tip: __("Scheduled preventive tasks"),
					},
					{
						v: s.tickets_open,
						label: __("Active Tickets"),
						nav: "tickets",
						tip: __("Open + in progress breakdowns"),
					},
					{
						v: s.outlets,
						label: __("Outlets"),
						nav: "outlets",
						tip: __("Stores in the network"),
					},
				];
				$stats.html(
					items
						.map(
							(x) => `
					<button type="button" class="cb-metric${x.warn ? " is-warn" : ""}" data-nav="${x.nav}" title="${x.tip}">
						<span class="cb-metric-val">${x.v ?? 0}</span>
						<span class="cb-metric-lbl">${x.label}</span>
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
			error: () => {
				$stats.removeClass("is-loading").html(
					`<div class="cb-alert cb-alert-warn">${__("Could not load stats. Use quick actions below.")}</div>`
				);
			},
		});
	},

	template() {
		return `
		<div class="cb-app">
			<nav class="cb-nav" aria-label="${__("Quick actions")}">
				<div class="cb-nav-tabs" role="tablist">
					<button class="cb-nav-tab is-active" data-tab="overview" role="tab" aria-selected="true">${__("Overview")}</button>
					<button class="cb-nav-tab" data-tab="howto" role="tab" aria-selected="false">${__("How to Use")}</button>
					<button class="cb-nav-tab" data-tab="features" role="tab" aria-selected="false">${__("Features")}</button>
					<button class="cb-nav-tab" data-tab="reference" role="tab" aria-selected="false">${__("Buttons & Fields")}</button>
				</div>
				<div class="cb-nav-actions">
					<button type="button" class="cb-action cb-action-warn" data-nav="pm-overdue">${__("Overdue PM")}</button>
					<button type="button" class="cb-action" data-nav="pm-open">${__("Open PM")}</button>
					<button type="button" class="cb-action" data-nav="tickets">${__("Tickets")}</button>
					<button type="button" class="cb-action cb-action-primary" data-nav="new-ticket">${__("+ Raise Ticket")}</button>
				</div>
			</nav>

			<!-- OVERVIEW -->
			<div class="cb-panel is-active" data-panel="overview" role="tabpanel">
				<header class="cb-hero">
					<div class="cb-hero-copy">
						<span class="cb-kicker">${__("California Burrito · 133 Outlets")}</span>
						<h1>${__("CB Maintenance")}</h1>
						<p class="cb-hero-desc">
							${__(
								"One system for preventive maintenance (PM) and reactive repairs. HQ defines PM rules once — they roll out to every outlet. Staff complete tasks, raise tickets when equipment fails, and zonal teams get auto-assigned work."
							)}
						</p>
					</div>
					<div class="cb-metrics" id="cb-stats">
						<div class="cb-skel"></div><div class="cb-skel"></div>
						<div class="cb-skel"></div><div class="cb-skel"></div>
					</div>
				</header>

				<section class="cb-section">
					<h2 class="cb-h2">${__("What this module does")}</h2>
					<div class="cb-purpose-grid">
						<article class="cb-purpose-card">
							<div class="cb-purpose-icon">1</div>
							<h3>${__("Preventive Maintenance")}</h3>
							<p>${__("Schedule recurring tasks (monthly AC clean, weekly RO check) per equipment type across all stores.")}</p>
						</article>
						<article class="cb-purpose-card">
							<div class="cb-purpose-icon">2</div>
							<h3>${__("Due & Overdue Tracking")}</h3>
							<p>${__("See what is due today, overdue, or coming this week. Daily job marks past-due items automatically.")}</p>
						</article>
						<article class="cb-purpose-card">
							<div class="cb-purpose-icon">3</div>
							<h3>${__("Reactive Tickets")}</h3>
							<p>${__("Breakdowns and failed PM inspections become tickets with category, spare-part hints, and zonal routing.")}</p>
						</article>
						<article class="cb-purpose-card">
							<div class="cb-purpose-icon">4</div>
							<h3>${__("Org-aware Routing")}</h3>
							<p>${__("Outlets map to cities and zonal offices. Tickets assign to the right maintenance staff automatically.")}</p>
						</article>
					</div>
				</section>

				<section class="cb-section">
					<h2 class="cb-h2">${__("Daily workflow")}</h2>
					<p class="cb-sub">${__("Three steps — click any card to jump to that screen.")}</p>
					<div class="cb-workflow">
						<article class="cb-wf-card">
							<span class="cb-wf-step">${__("Step 1")}</span>
							<h3>${__("Define PM Program")}</h3>
							<p>${__("Create schedule rules per asset type. Saving rolls work orders to all matching assets.")}</p>
							<p class="cb-wf-meta"><span id="cb-meta-rules">—</span> · <span id="cb-meta-assets">—</span></p>
							<div class="cb-wf-actions">
								<button type="button" class="cb-btn cb-btn-fill" data-nav="rules">${__("View Rules")}</button>
								<button type="button" class="cb-btn" data-nav="new-rule">${__("+ New Rule")}</button>
							</div>
							<p class="cb-tip">${__("Tip: Do this once at HQ — not per outlet.")}</p>
						</article>
						<article class="cb-wf-card is-focus">
							<span class="cb-wf-step">${__("Step 2")}</span>
							<h3>${__("Complete Due PM")}</h3>
							<p>${__("Technicians open work orders and mark done on site, or raise a ticket if inspection fails.")}</p>
							<p class="cb-wf-meta"><span id="cb-meta-overdue">—</span> · <span id="cb-meta-week">—</span></p>
							<div class="cb-wf-actions">
								<button type="button" class="cb-btn cb-btn-fill" data-nav="pm-overdue">${__("Overdue PM")}</button>
								<button type="button" class="cb-btn" data-nav="pm-open">${__("Open Tasks")}</button>
							</div>
							<p class="cb-tip">${__("Tip: Start with Overdue PM for the fastest demo.")}</p>
						</article>
						<article class="cb-wf-card">
							<span class="cb-wf-step">${__("Step 3")}</span>
							<h3>${__("Handle Tickets")}</h3>
							<p>${__("Track breakdowns from Open → In Progress → Resolved → Closed.")}</p>
							<p class="cb-wf-meta"><span id="cb-meta-tickets">—</span> · <span id="cb-meta-unassigned">—</span></p>
							<div class="cb-wf-actions">
								<button type="button" class="cb-btn cb-btn-fill" data-nav="tickets">${__("Open Tickets")}</button>
								<button type="button" class="cb-btn" data-nav="new-ticket">${__("+ Raise Ticket")}</button>
							</div>
							<p class="cb-tip">${__("Tip: Failed PM auto-creates a linked ticket.")}</p>
						</article>
					</div>
				</section>

				<div class="cb-alert cb-alert-info">
					<strong>${__("New here?")}</strong>
					${__("Open the")} <button type="button" class="cb-link-btn" data-tab="howto">${__("How to Use")}</button>
					${__("tab for a full walkthrough with field explanations.")}
				</div>
			</div>

			<!-- HOW TO USE -->
			<div class="cb-panel" data-panel="howto" role="tabpanel">
				<section class="cb-section">
					<h2 class="cb-h2">${__("How to Use CB Maintenance")}</h2>
					<p class="cb-sub">${__("Follow these steps in order. No Frappe training required.")}</p>

					<div class="cb-acc">
						${CB.howto_step(1, __("Set up PM rules (HQ — one time)"), `
							<ol class="cb-steps-list">
								<li>${__("Go to")} <button type="button" class="cb-link-btn" data-nav="rules">${__("PM Schedule Rules")}</button>.</li>
								<li>${__("Click")} <strong>+ New</strong>. ${__("Pick")} <strong>${__("Asset Type")}</strong> ${__("(e.g. AC Plant), describe the")} <strong>${__("Task")}</strong>, ${__("set")} <strong>${__("Frequency")}</strong>.</li>
								<li>${__("Save. Work orders are auto-created for every asset of that type at every outlet.")}</li>
							</ol>
							<div class="cb-alert cb-alert-note">${__("Note: Changing a rule updates future work orders for matching assets.")}</div>
						`)}
						${CB.howto_step(2, __("Complete PM at outlets (daily)"), `
							<ol class="cb-steps-list">
								<li>${__("Open")} <button type="button" class="cb-link-btn" data-nav="pm-open">${__("PM Work Orders")}</button> ${__("— filter Overdue or Open.")}</li>
								<li>${__("Click a row. Review outlet, asset, task, and due date on the form.")}</li>
								<li><strong>${__("Mark Done")}</strong> — ${__("job finished; next due date is scheduled automatically.")}</li>
								<li><strong>${__("Fail & Raise Ticket")}</strong> — ${__("inspection failed; a maintenance ticket is created and routed.")}</li>
							</ol>
							<div class="cb-alert cb-alert-warn">${__("Warning: Overdue PM means revenue risk — equipment may fail if delayed.")}</div>
						`)}
						${CB.howto_step(3, __("Raise a reactive ticket"), `
							<ol class="cb-steps-list">
								<li>${__("Click")} <button type="button" class="cb-link-btn" data-nav="new-ticket">${__("+ Raise Ticket")}</button> ${__("or open")} <button type="button" class="cb-link-btn" data-nav="tickets">${__("Maintenance Tickets")}</button>.</li>
								<li>${__("Select")} <strong>${__("Outlet")}</strong>, <strong>${__("Asset")}</strong>, <strong>${__("Category")}</strong>, ${__("and describe the issue.")}</li>
								<li>${__("Save — zonal staff is auto-assigned. Spare part may be suggested.")}</li>
							</ol>
						`)}
						${CB.howto_step(4, __("Resolve and close tickets"), `
							<ol class="cb-steps-list">
								<li><strong>${__("Assign to Zonal Staff")}</strong> — ${__("if not auto-assigned.")}</li>
								<li><strong>${__("Start Work")}</strong> → <strong>${__("Mark Resolved")}</strong> → <strong>${__("Close Ticket")}</strong>.</li>
								<li>${__("Check")} <strong>${__("Suggested Spare Part")}</strong> ${__("for parts to order.")}</li>
							</ol>
						`)}
						${CB.howto_step(5, __("Monitor the network (leadership)"), `
							<p>${__("Return to this page for live counts. Click any metric to drill into the list.")}</p>
							<p>${__("Review")} <button type="button" class="cb-link-btn" data-nav="outlets">${__("Outlets")}</button>,
							<button type="button" class="cb-link-btn" data-nav="staff">${__("Staff")}</button>,
							${__("and")} <button type="button" class="cb-link-btn" data-nav="zones">${__("Zonal Offices")}</button> ${__("for org structure.")}</p>
						`)}
					</div>
					<button type="button" class="cb-btn cb-btn-fill cb-btn-lg" data-nav="pm-overdue">${__("Start 5-minute walkthrough →")}</button>
				</section>
			</div>

			<!-- FEATURES -->
			<div class="cb-panel" data-panel="features" role="tabpanel">
				<section class="cb-section">
					<h2 class="cb-h2">${__("Features at a glance")}</h2>
					<div class="cb-feat-grid">
						${CB.feat(__("PM Schedule Rule"), __("Define PM once per equipment type + task + frequency."), "rules")}
						${CB.feat(__("PM Work Order"), __("A due PM task at one outlet. Status: Open, Overdue, Completed."), "pm-open")}
						${CB.feat(__("Maintenance Ticket"), __("Reactive breakdown or PM failure. Routed to zonal staff."), "tickets")}
						${CB.feat(__("CB Outlet"), __("Store master — 133 outlets with city and zonal office."), "outlets")}
						${CB.feat(__("CB Asset"), __("Equipment at an outlet (e.g. CAR-AC Plant). PM attaches here."), "assets")}
						${CB.feat(__("Maintenance Staff"), __("Technicians with zonal office and reporting chain."), "staff")}
						${CB.feat(__("Ticket Category"), __("Dept → Category → Sub-category taxonomy from case data."), "categories")}
						${CB.feat(__("Spare Part"), __("Parts catalog with codes for ticket suggestions."), "parts")}
					</div>
				</section>
				<section class="cb-section">
					<h2 class="cb-h2">${__("Data flow")}</h2>
					<div class="cb-flow">
						<div class="cb-flow-item">${__("Outlet")}<small>133 stores</small></div>
						<span class="cb-flow-arr">→</span>
						<div class="cb-flow-item">${__("Asset")}<small>${__("equipment")}</small></div>
						<span class="cb-flow-arr">→</span>
						<div class="cb-flow-item is-hot">${__("PM Rule")}<small>${__("set once")}</small></div>
						<span class="cb-flow-arr">→</span>
						<div class="cb-flow-item is-hot">${__("Work Order")}<small>${__("due date")}</small></div>
						<span class="cb-flow-arr">→</span>
						<div class="cb-flow-item">${__("Done / Ticket")}<small>${__("closed loop")}</small></div>
					</div>
				</section>
			</div>

			<!-- REFERENCE -->
			<div class="cb-panel" data-panel="reference" role="tabpanel">
				<section class="cb-section">
					<h2 class="cb-h2">${__("Buttons & fields explained")}</h2>
					<p class="cb-sub">${__("What every key action and field means — so nothing is a guess.")}</p>
					<div class="cb-ref-grid">
						${CB.ref(__("Mark Done"), __("PM Work Order form"), __("Completes the PM. Schedules the next occurrence based on frequency."))}
						${CB.ref(__("Fail & Raise Ticket"), __("PM Work Order form"), __("Marks inspection failed and creates a Maintenance Ticket linked to this PM."))}
						${CB.ref(__("Assign to Zonal Staff"), __("Ticket form"), __("Routes ticket to maintenance staff at the outlet's zonal office."))}
						${CB.ref(__("Start Work"), __("Ticket form"), __("Moves status from Open to In Progress."))}
						${CB.ref(__("Mark Resolved"), __("Ticket form"), __("Work finished on site; awaiting closure."))}
						${CB.ref(__("Close Ticket"), __("Ticket form"), __("Fully closed — removed from active queue."))}
						${CB.ref(__("Asset Type"), __("PM Schedule Rule"), __("Equipment category — rule applies to all assets of this type."))}
						${CB.ref(__("Frequency"), __("PM Schedule Rule"), __("Weekly, Monthly, Yearly, etc. — drives next due date."))}
						${CB.ref(__("Due Date"), __("PM Work Order"), __("When the PM should be completed. Past due → Overdue status."))}
						${CB.ref(__("Suggested Spare Part"), __("Ticket"), __("Auto-hint from asset type and category — may need ordering."))}
						${CB.ref(__("Source PM Work Order"), __("Ticket"), __("Read-only link when ticket was created from a failed PM."))}
						${CB.ref(__("Zonal Office"), __("Outlet / Staff"), __("Regional hub — tickets route to staff in this zone."))}
					</div>
				</section>
			</div>
		</div>`;
	},

	howto_step(n, title, body) {
		return `
		<div class="cb-acc-item${n === 1 ? " is-open" : ""}">
			<button type="button" class="cb-acc-head" data-accordion>
				<span class="cb-acc-num">${n}</span>
				<span class="cb-acc-title">${title}</span>
				<span class="cb-acc-chevron" aria-hidden="true"></span>
			</button>
			<div class="cb-acc-body">${body}</div>
		</div>`;
	},

	feat(title, desc, nav) {
		return `
		<article class="cb-feat-card">
			<h3>${title}</h3>
			<p>${desc}</p>
			<button type="button" class="cb-btn cb-btn-sm" data-nav="${nav}">${__("Open")} →</button>
		</article>`;
	},

	ref(name, where, desc) {
		return `
		<div class="cb-ref-card">
			<div class="cb-ref-name">${name}</div>
			<div class="cb-ref-where">${where}</div>
			<p>${desc}</p>
		</div>`;
	},
};

// Tab switch from inline link buttons
$(document).on("click", ".cb-desk .cb-link-btn[data-tab]", function (e) {
	e.preventDefault();
	const tab = this.dataset.tab;
	const $root = $(this).closest(".cb-desk");
	$root.find(`[data-tab="${tab}"]`).first().trigger("click");
});
