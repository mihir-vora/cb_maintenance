frappe.pages["maintenance-home"].on_page_load = function (wrapper) {
	const page = frappe.ui.make_app_page({
		parent: wrapper,
		title: __("California Burrito Maintenance"),
		single_column: true,
	});

	page.set_primary_action(__("Raise Ticket"), () => {
		frappe.new_doc("CB Maintenance Ticket");
	}, "add");

	const $body = $(page.body);
	$body.addClass("cb-maintenance-home");

	$body.html(`
		<div class="cb-home">
			<section class="cb-hero">
				<div class="cb-hero-text">
					<p class="cb-eyebrow">California Burrito · 133 Outlets</p>
					<h1>Maintenance made simple</h1>
					<p class="cb-lead">
						Follow the 3 steps below — set PM rules once, complete due tasks at outlets,
						and handle breakdown tickets when equipment fails.
					</p>
				</div>
				<div class="cb-hero-stats" id="cb-hero-stats">
					<div class="cb-stat-skeleton"></div>
				</div>
			</section>

			<section class="cb-steps">
				<h2>Your 3-step workflow</h2>
				<div class="cb-step-grid">
					<article class="cb-step-card" data-step="1">
						<div class="cb-step-badge">Step 1</div>
						<h3>Define PM program</h3>
						<p>Create schedule rules per equipment type (e.g. AC filter clean every month). Rules auto-roll to every matching asset across all outlets.</p>
						<div class="cb-step-meta" id="cb-step-1-meta">—</div>
						<button class="btn btn-primary btn-sm cb-step-btn" data-route="List/CB PM Schedule Rule">
							View PM Rules
						</button>
						<button class="btn btn-default btn-sm cb-step-btn" data-route="Form/CB PM Schedule Rule/New">
							+ New Rule
						</button>
					</article>

					<article class="cb-step-card cb-step-highlight" data-step="2">
						<div class="cb-step-badge">Step 2</div>
						<h3>Complete due PM</h3>
						<p>Technicians open their due work orders, mark tasks done on site, or raise a ticket if inspection fails.</p>
						<div class="cb-step-meta" id="cb-step-2-meta">—</div>
						<button class="btn btn-primary btn-sm cb-step-btn" data-route="List/CB PM Work Order?status=Overdue">
							Overdue PM
						</button>
						<button class="btn btn-default btn-sm cb-step-btn" data-route="List/CB PM Work Order?status=Open">
							Open PM Tasks
						</button>
					</article>

					<article class="cb-step-card" data-step="3">
						<div class="cb-step-badge">Step 3</div>
						<h3>Handle tickets</h3>
						<p>Reactive breakdowns and PM failures become tickets — auto-routed to zonal maintenance staff with spare-part hints.</p>
						<div class="cb-step-meta" id="cb-step-3-meta">—</div>
						<button class="btn btn-primary btn-sm cb-step-btn" data-route="List/CB Maintenance Ticket?status=Open">
							Open Tickets
						</button>
						<button class="btn btn-default btn-sm cb-step-btn" data-action="new-ticket">
							+ Raise Ticket
						</button>
					</article>
				</div>
			</section>

			<section class="cb-flow">
				<h2>How data flows</h2>
				<div class="cb-flow-diagram">
					<div class="cb-flow-node">Outlet<div class="cb-flow-sub">133 stores</div></div>
					<div class="cb-flow-arrow">→</div>
					<div class="cb-flow-node">Asset<div class="cb-flow-sub">equipment</div></div>
					<div class="cb-flow-arrow">→</div>
					<div class="cb-flow-node cb-flow-accent">PM Rule<div class="cb-flow-sub">set once</div></div>
					<div class="cb-flow-arrow">→</div>
					<div class="cb-flow-node cb-flow-accent">Work Order<div class="cb-flow-sub">due / overdue</div></div>
					<div class="cb-flow-arrow">→</div>
					<div class="cb-flow-node">Done ✓<div class="cb-flow-sub">or ticket</div></div>
				</div>
			</section>

			<section class="cb-quick">
				<h2>Quick links</h2>
				<div class="cb-quick-grid">
					<a class="cb-quick-link" data-route="List/CB Outlet">Outlets</a>
					<a class="cb-quick-link" data-route="List/CB Asset">Assets</a>
					<a class="cb-quick-link" data-route="List/CB Maintenance Staff">Staff</a>
					<a class="cb-quick-link" data-route="List/CB Ticket Category">Ticket Categories</a>
					<a class="cb-quick-link" data-route="List/CB Spare Part">Spare Parts</a>
					<a class="cb-quick-link" data-route="List/CB Zonal Office">Zonal Offices</a>
				</div>
			</section>

			<section class="cb-demo-tip">
				<strong>Demo tip for reviewers:</strong>
				Start at <em>Step 2 → Open PM Tasks</em>, open any work order, click
				<strong>Mark Done</strong> or <strong>Fail &amp; Raise Ticket</strong> to see the full loop.
			</section>
		</div>
	`);

	bind_home_events($body);
	load_dashboard_stats($body);
};

function bind_home_events($body) {
	$body.on("click", ".cb-step-btn, .cb-quick-link", function (e) {
		e.preventDefault();
		const $el = $(this);
		if ($el.data("action") === "new-ticket") {
			frappe.new_doc("CB Maintenance Ticket");
			return;
		}
		const route = $el.data("route");
		if (route) navigate_route(route);
	});
}

function navigate_route(route) {
	// route like List/CB PM Work Order?status=Overdue
	const [path, query] = route.split("?");
	const parts = path.split("/");
	const view = parts[0];
	const doctype = parts[1];

	if (view === "Form" && parts[2] === "New") {
		frappe.new_doc(doctype);
		return;
	}

	if (view === "List") {
		frappe.set_route("List", doctype);
		if (query) {
			const params = new URLSearchParams(query);
			setTimeout(() => {
				const listview = frappe.views.list_view?.cur_list;
				if (!listview) return;
				params.forEach((value, key) => {
					listview.filter_area.add([[doctype, key, "=", value]]);
				});
			}, 600);
		}
	}
}

function load_dashboard_stats($body) {
	frappe.call({
		method: "cb_maintenance.cb_maintenance.utils.dashboard.get_dashboard_stats",
		callback(r) {
			const s = r.message || {};
			$body.find("#cb-hero-stats").html(`
				<div class="cb-stat ${s.pm_overdue ? "cb-stat-danger" : ""}">
					<span class="cb-stat-value">${s.pm_overdue || 0}</span>
					<span class="cb-stat-label">Overdue PM</span>
				</div>
				<div class="cb-stat">
					<span class="cb-stat-value">${s.pm_open || 0}</span>
					<span class="cb-stat-label">Open PM</span>
				</div>
				<div class="cb-stat">
					<span class="cb-stat-value">${s.tickets_open || 0}</span>
					<span class="cb-stat-label">Open Tickets</span>
				</div>
				<div class="cb-stat">
					<span class="cb-stat-value">${s.outlets || 0}</span>
					<span class="cb-stat-label">Outlets</span>
				</div>
			`);

			$body.find("#cb-step-1-meta").text(
				`${s.pm_rules || 0} active rules · ${s.assets || 0} assets`
			);
			$body.find("#cb-step-2-meta").html(
				`<span class="${s.pm_overdue ? "text-danger" : ""}">${s.pm_overdue || 0} overdue</span> · ${s.pm_due_week || 0} due this week`
			);
			$body.find("#cb-step-3-meta").text(
				`${s.tickets_open || 0} open · ${s.tickets_unassigned || 0} unassigned`
			);
		},
	});
}
