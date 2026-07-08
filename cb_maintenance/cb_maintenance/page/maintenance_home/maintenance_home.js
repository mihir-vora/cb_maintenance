frappe.pages["maintenance-home"].on_page_load = function (wrapper) {
	const page = frappe.ui.make_app_page({
		parent: wrapper,
		title: __("Maintenance Home"),
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
					<h1>Maintenance Home</h1>
					<p class="cb-lead">
						One place to run preventive maintenance (PM) and reactive repairs across every outlet.
						You do not need to know Frappe — follow the guide below.
					</p>
				</div>
				<div class="cb-hero-stats" id="cb-hero-stats">
					<div class="cb-stat-skeleton"></div>
				</div>
			</section>

			<section class="cb-founder">
				<h2>For founders &amp; leadership — how to use this</h2>
				<div class="cb-founder-grid">
					<div class="cb-founder-card">
						<h3>What problem does this solve?</h3>
						<p>
							Across 133 outlets, equipment (AC, RO plant, DG set, kitchen gear) needs regular
							servicing. Missed PM causes breakdowns and revenue loss. This system tracks
							<strong>what is due</strong>, <strong>what is overdue</strong>, and
							<strong>what broke</strong> — with clear ownership by zonal office.
						</p>
					</div>
					<div class="cb-founder-card">
						<h3>Who does what?</h3>
						<ul class="cb-founder-list">
							<li><strong>HQ / Central</strong> — defines PM rules once per equipment type (Step 1)</li>
							<li><strong>Zonal maintenance staff</strong> — complete PM tasks at outlets (Step 2)</li>
							<li><strong>Outlet / Helpdesk</strong> — raise tickets when something fails (Step 3)</li>
							<li><strong>System</strong> — auto-creates work orders, marks overdue, routes tickets</li>
						</ul>
					</div>
				</div>

				<div class="cb-walkthrough">
					<h3>5-minute walkthrough (try this now)</h3>
					<ol class="cb-walkthrough-steps">
						<li>
							<span class="cb-walk-num">1</span>
							<div>
								<strong>See what is overdue</strong> — click <em>Overdue PM</em> below (or the red stat above).
								These are preventive tasks that should already be done.
							</div>
						</li>
						<li>
							<span class="cb-walk-num">2</span>
							<div>
								<strong>Open one work order</strong> — pick any row. You will see outlet, asset, task, and due date.
							</div>
						</li>
						<li>
							<span class="cb-walk-num">3</span>
							<div>
								<strong>Complete it</strong> — click <em>Mark Done</em> if the job was finished on site.
								The system schedules the next occurrence automatically.
							</div>
						</li>
						<li>
							<span class="cb-walk-num">4</span>
							<div>
								<strong>Or raise a ticket</strong> — click <em>Fail &amp; Raise Ticket</em> if inspection failed.
								A maintenance ticket is created and assigned to zonal staff.
							</div>
						</li>
						<li>
							<span class="cb-walk-num">5</span>
							<div>
								<strong>Check tickets</strong> — go to <em>Open Tickets</em>. Use
								<em>Start Work → Mark Resolved → Close</em> to move through the lifecycle.
							</div>
						</li>
					</ol>
					<button class="btn btn-primary cb-walkthrough-cta" data-route="List/CB PM Work Order?status=Overdue">
						Start walkthrough — view Overdue PM
					</button>
				</div>
			</section>

			<section class="cb-steps">
				<h2>Daily workflow — 3 steps</h2>
				<p class="cb-section-hint">Click the buttons on each card to jump straight to the right screen.</p>
				<div class="cb-step-grid">
					<article class="cb-step-card" data-step="1">
						<div class="cb-step-badge">Step 1 · Set once</div>
						<h3>Define PM program</h3>
						<p>
							Create a rule per equipment type + task + frequency (e.g. "AC — filter clean — Monthly").
							When saved, work orders are created for <strong>every matching asset at every outlet</strong>.
						</p>
						<div class="cb-step-who">Owner: HQ / Maintenance head</div>
						<div class="cb-step-meta" id="cb-step-1-meta">—</div>
						<button class="btn btn-primary btn-sm cb-step-btn" data-route="List/CB PM Schedule Rule">
							View PM Rules
						</button>
						<button class="btn btn-default btn-sm cb-step-btn" data-route="Form/CB PM Schedule Rule/New">
							+ New Rule
						</button>
					</article>

					<article class="cb-step-card cb-step-highlight" data-step="2">
						<div class="cb-step-badge">Step 2 · Every day</div>
						<h3>Complete due PM</h3>
						<p>
							Technicians work from the PM Work Order list. Filter by overdue or open.
							On each form: <strong>Mark Done</strong> or <strong>Fail &amp; Raise Ticket</strong>.
						</p>
						<div class="cb-step-who">Owner: Zonal maintenance staff</div>
						<div class="cb-step-meta" id="cb-step-2-meta">—</div>
						<button class="btn btn-primary btn-sm cb-step-btn" data-route="List/CB PM Work Order?status=Overdue">
							Overdue PM
						</button>
						<button class="btn btn-default btn-sm cb-step-btn" data-route="List/CB PM Work Order?status=Open">
							Open PM Tasks
						</button>
					</article>

					<article class="cb-step-card" data-step="3">
						<div class="cb-step-badge">Step 3 · When things break</div>
						<h3>Handle tickets</h3>
						<p>
							Breakdowns and failed PM inspections become tickets. Staff assignment and spare-part
							suggestions are automatic. Track until closed.
						</p>
						<div class="cb-step-who">Owner: Zonal staff + outlet helpdesk</div>
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
				<h2>How data connects</h2>
				<p class="cb-section-hint">You set rules once at the top — they flow down to every outlet automatically.</p>
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
				<h2>Master data &amp; organization</h2>
				<div class="cb-quick-grid">
					<a class="cb-quick-link" data-route="List/CB Outlet">Outlets (133)</a>
					<a class="cb-quick-link" data-route="List/CB Asset">Assets</a>
					<a class="cb-quick-link" data-route="List/CB Maintenance Staff">Staff</a>
					<a class="cb-quick-link" data-route="List/CB Zonal Office">Zonal Offices</a>
					<a class="cb-quick-link" data-route="List/CB Ticket Category">Ticket Categories</a>
					<a class="cb-quick-link" data-route="List/CB Spare Part">Spare Parts</a>
				</div>
			</section>
		</div>
	`);

	bind_home_events($body);
	load_dashboard_stats($body);
};

function bind_home_events($body) {
	$body.on("click", ".cb-step-btn, .cb-quick-link, .cb-walkthrough-cta", function (e) {
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
	const [path, query] = route.split("?");
	const parts = path.split("/");
	const view = parts[0];
	const doctype = parts[1];

	if (view === "Form" && parts[2] === "New") {
		frappe.new_doc(doctype);
		return;
	}

	if (view === "List") {
		frappe.route_options = {};
		if (query) {
			const params = new URLSearchParams(query);
			params.forEach((value, key) => {
				frappe.route_options[key] = value;
			});
		}
		frappe.set_route("List", doctype);
	}
}

function load_dashboard_stats($body) {
	frappe.call({
		method: "cb_maintenance.cb_maintenance.utils.dashboard.get_dashboard_stats",
		callback(r) {
			const s = r.message || {};
			$body.find("#cb-hero-stats").html(`
				<div class="cb-stat cb-stat-clickable ${s.pm_overdue ? "cb-stat-danger" : ""}" data-route="List/CB PM Work Order?status=Overdue" title="Click to view">
					<span class="cb-stat-value">${s.pm_overdue || 0}</span>
					<span class="cb-stat-label">Overdue PM</span>
				</div>
				<div class="cb-stat cb-stat-clickable" data-route="List/CB PM Work Order?status=Open" title="Click to view">
					<span class="cb-stat-value">${s.pm_open || 0}</span>
					<span class="cb-stat-label">Open PM</span>
				</div>
				<div class="cb-stat cb-stat-clickable" data-route="List/CB Maintenance Ticket?status=Open" title="Click to view">
					<span class="cb-stat-value">${s.tickets_open || 0}</span>
					<span class="cb-stat-label">Open Tickets</span>
				</div>
				<div class="cb-stat cb-stat-clickable" data-route="List/CB Outlet" title="Click to view">
					<span class="cb-stat-value">${s.outlets || 0}</span>
					<span class="cb-stat-label">Outlets</span>
				</div>
			`);

			$body.find(".cb-stat-clickable").on("click", function () {
				navigate_route($(this).data("route"));
			});

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
