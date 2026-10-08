/* Working miniatures of MedGryd. Each one follows the real feature's rules (the planner scores
   subtasks as units, Quiz Mastery schedules on confidence, CaseFlow tracks exactly which history
   facts were uncovered, Board Ops judges each source on its own scale). All data is demo data. */
(function () {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (sel, root = document) => root.querySelector(sel);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const LOGO = "uploads/logo-blue.png";

  function frame(title, meta, body) {
    return `<div class="app"><div class="app-bar"><div class="dots" aria-hidden="true"><i></i><i></i><i></i></div>
      <div class="title"><img src="${LOGO}" alt="" />${title}</div><div class="meta">${meta}</div></div>
      <div class="app-body">${body}<div class="demo-note" aria-hidden="true">Demo data</div></div></div>`;
  }
  function toast(app, text) {
    const t = document.createElement("div");
    t.className = "xp-toast"; t.textContent = text; t.setAttribute("role", "status");
    app.appendChild(t);
    setTimeout(() => t.remove(), 1500);
  }

  /* ─── 01 Planner ─────────────────────────────────────────────────── */
  function planner(root) {
    const state = {
      tasks: [
        { id: "qm", text: 'Quiz Mastery - 1.01 - Glomerular Filtration', mk: "🧠", q: 7, done: false },
        { id: "anki", text: "CEPA Anki", subs: [
          { id: "a1", text: "Cardio deck", n: 120, done: true },
          { id: "a2", text: "Renal deck", n: 86, done: true },
          { id: "a3", text: "Pharm deck", n: 64, done: false },
          { id: "a4", text: "Micro deck", n: 52, done: false },
          { id: "a5", text: "Biochem deck", n: 64, done: false },
        ], open: false },
        { id: "qb", text: "QBank — 40 Renal · UWorld", mk: "📡", board: true, done: false },
        { id: "pa", text: "Pathoma Ch. 12 — Kidney", done: true },
        { id: "soap", text: "Draft SOAP note — chest pain station", br: "[OMED 202]", done: false },
      ],
      xp: 0,
    };
    const units = () => state.tasks.reduce((a, t) => a + (t.subs ? t.subs.length : 1), 0);
    const doneUnits = () => state.tasks.reduce((a, t) => a + (t.subs ? t.subs.filter((s) => s.done).length : t.done ? 1 : 0), 0);
    const C = 2 * Math.PI * 42;

    root.innerHTML = `<div class="pl-wrap">${frame("Weekly Planner", "Oct 4 – 10",
      `<div class="pl-grid">
        <div class="pl-day">
          <div class="pl-head"><span>WED — 10/7</span><span class="today">TODAY</span></div>
          <div class="pl-ev" style="--c:#4fc3f7"><time>9:00 AM</time><span>Renal Physiology — Lecture 14</span></div>
          <div class="pl-ev" style="--c:#ffd75a"><time>11:30 AM</time><span>Quick Check Quiz <span class="muted">· 🔑 password ready</span></span></div>
          <div class="pl-ev" style="--c:#d96a5f"><time>1:00 PM</time><span>OMM Lab — Lumbar ME</span></div>
          <div class="pl-sep"></div>
          <div data-list></div>
        </div>
        <div class="pl-side">
          <div class="orb" aria-live="polite">
            <svg viewBox="0 0 100 100" aria-hidden="true"><circle class="trk" cx="50" cy="50" r="42"/><circle class="val" cx="50" cy="50" r="42" stroke-dasharray="0 ${C}"/></svg>
            <div class="txt"><small>Plan completion</small><b data-pct>0<sup>%</sup></b><span data-units></span></div>
          </div>
          <div class="mini-stats">
            <div class="mini-stat focus"><b>2h 14m</b><span>Focus today</span></div>
            <div class="mini-stat anki"><b data-cards>206</b><span>Anki cards</span></div>
            <div class="mini-stat"><b data-score>71</b><span>Productivity score</span></div>
            <div class="mini-stat"><b data-xp>+0</b><span>XP today</span></div>
          </div>
        </div>
      </div>`)}</div>`;
    const app = $(".app", root);
    const list = $("[data-list]", root);

    function row(t, isSub, parent) {
      const done = t.subs ? t.subs.every((s) => s.done) : t.done;
      const some = t.subs && !done && t.subs.some((s) => s.done);
      const cls = ["chk", done ? "on" : "", some ? "half" : "", t.mk && !done ? "mk" : "", t.board ? "board" : ""].join(" ");
      let extra = "";
      if (t.q) extra += ` <span class="qcount">[<b>${t.q}</b>]</span>`;
      if (t.n) extra += ` <span class="qcount"><i>[${t.n}]</i></span>`;
      if (t.subs) {
        const d = t.subs.filter((s) => s.done).length, tot = t.subs.reduce((a, s) => a + s.n, 0), dn = t.subs.filter((s) => s.done).reduce((a, s) => a + s.n, 0);
        extra += ` <span class="qcount">[<b>${dn}</b><i>/${tot}</i>]</span><span class="qbar" aria-hidden="true"><i style="width:${(dn / tot) * 100}%"></i></span>
          <button type="button" class="sub-chip" data-open="${t.id}" aria-expanded="${t.open}" aria-label="${d} of ${t.subs.length} subtasks done — ${t.open ? "hide" : "show"} subtasks"><b>${d}</b>/${t.subs.length}</button>`;
      }
      const label = `${t.br ? `<span class="br">${esc(t.br)}</span> ` : ""}${esc(t.text)}${extra}`;
      return `<div class="pl-task ${done ? "done" : ""}">
        <button type="button" class="${cls}" data-mk="${t.mk || ""}" data-t="${t.id}" data-p="${parent || ""}" role="checkbox" aria-checked="${done ? "true" : some ? "mixed" : "false"}" aria-label="${esc(t.text)}"></button>
        <span class="lbl">${label}</span></div>`;
    }
    function render() {
      list.innerHTML = state.tasks.map((t) => row(t) + (t.subs ? `<div class="subs ${t.open ? "open" : ""}"><div><ul>${t.subs.map((s) => `<li>${row(s, true, t.id)}</li>`).join("")}</ul></div></div>` : "")).join("");
      const u = units(), d = doneUnits(), pct = Math.round((d / u) * 100);
      $(".val", root).setAttribute("stroke-dasharray", `${(pct / 100) * C} ${C}`);
      $("[data-pct]", root).innerHTML = `${pct}<sup>%</sup>`;
      $("[data-units]", root).textContent = `${d} of ${u} units`;
      $("[data-score]", root).textContent = Math.round(38 + pct * 0.55);
      $("[data-xp]", root).textContent = `+${state.xp}`;
      $("[data-cards]", root).textContent = state.tasks[1].subs.filter((s) => s.done).reduce((a, s) => a + s.n, 0);
    }
    root.addEventListener("click", (e) => {
      const open = e.target.closest("[data-open]");
      if (open) { const t = state.tasks.find((x) => x.id === open.dataset.open); t.open = !t.open; render(); return; }
      const c = e.target.closest("[data-t]");
      if (!c) return;
      let changed = 0, now;
      if (c.dataset.p) {
        const s = state.tasks.find((x) => x.id === c.dataset.p).subs.find((x) => x.id === c.dataset.t);
        s.done = !s.done; now = s.done; changed = 1;
      } else {
        const t = state.tasks.find((x) => x.id === c.dataset.t);
        if (t.subs) {
          const all = t.subs.every((s) => s.done);
          changed = t.subs.filter((s) => s.done === all).length;
          t.subs.forEach((s) => (s.done = !all)); now = !all;
          if (!all) t.open = true;
        } else { t.done = !t.done; now = t.done; changed = 1; }
      }
      state.xp = Math.max(0, state.xp + (now ? 5 : -5) * changed);
      render();
      if (now) toast(app, `+${5 * changed} XP`);
      const again = root.querySelector(`[data-t="${c.dataset.t}"]`);
      again && again.focus({ preventScroll: true });
    });
    render();
  }

  /* ─── 02 Quiz Mastery ────────────────────────────────────────────── */
  function quiz(root) {
    const Q = {
      stem: 'A 54-year-old man with hypertension is started on losartan. Two weeks later his serum creatinine is 1.3 mg/dL <span class="ref">(Reference range: 0.6–1.2 mg/dL)</span>, up from 1.0 mg/dL. Which change in glomerular hemodynamics best explains this?',
      choices: [
        "Constriction of the afferent arteriole",
        "Dilation of the efferent arteriole",
        "Increased filtration fraction",
        "Increased glomerular capillary hydrostatic pressure",
        "Decreased renal plasma flow",
      ],
      correct: 1,
      why: "Angiotensin II preferentially constricts the efferent arteriole to hold glomerular pressure up. Blocking its receptor dilates the efferent arteriole, glomerular capillary pressure falls, GFR drops, and creatinine rises — the expected, modest rise after starting an ACE inhibitor or ARB.",
      alts: {
        0: ["Losartan does not act on afferent tone; afferent constriction lowers GFR by a different route.", "the patient had been started on an NSAID, which removes prostaglandin-mediated afferent dilation."],
        2: ["Efferent dilation lowers glomerular pressure, so filtration fraction falls rather than rises.", "angiotensin II were elevated — for example in volume depletion — constricting the efferent arteriole."],
        3: ["Glomerular capillary pressure drops when the efferent arteriole dilates; that is why GFR falls.", "the question described efferent constriction or afferent dilation, as in early diabetic hyperfiltration."],
        4: ["Dilating the efferent arteriole lowers renal vascular resistance, so plasma flow is preserved or rises.", "a vasoconstrictor were constricting both arterioles, raising total renal vascular resistance."],
      },
    };
    const IV = [1, 3, 7, 14, 30, 60, 120];
    let sel = -1, conf = "sure", checked = false;
    root.innerHTML = frame("Quiz Mastery", "Renal · 1.01 Glomerular Filtration",
      `<div class="qz-top"><span class="pass">PRIMARY PASS</span><span class="muted" style="font-size:12px">3 / 10</span><span class="chip" data-topic hidden>Filtration fraction</span></div>
       <div class="qz-prog"><i></i></div>
       <p class="qz-stem">${Q.stem}</p>
       <div class="qz-choices" role="radiogroup" aria-label="Answer choices">${Q.choices.map((c, i) => `<button type="button" class="qz-choice" role="radio" aria-checked="false" data-i="${i}"><span class="L">${"ABCDE"[i]}</span><span>${esc(c)}</span><span class="mark"></span></button>`).join("")}</div>
       <div class="qz-foot">
         <div class="qz-conf">Confidence <div class="seg2" role="group" aria-label="Confidence"><button type="button" data-c="sure" aria-pressed="true">Sure ✓</button><button type="button" data-c="unsure" aria-pressed="false">Unsure ?</button></div></div>
         <button type="button" class="qbtn cta" data-check disabled>Check answer</button>
       </div>
       <div class="qz-fb" data-fb><div></div></div>`);
    const fb = $("[data-fb]", root), btn = $("[data-check]", root);
    function paint() {
      root.querySelectorAll(".qz-choice").forEach((b) => {
        const i = +b.dataset.i;
        b.className = "qz-choice";
        b.setAttribute("aria-checked", String(i === sel));
        b.querySelector(".mark").textContent = "";
        if (!checked) { if (i === sel) b.classList.add("sel"); b.disabled = false; return; }
        b.disabled = true;
        if (i === Q.correct) { b.classList.add("right"); b.querySelector(".mark").textContent = "✓"; }
        else if (i === sel) { b.classList.add("wrong"); b.querySelector(".mark").textContent = "✗"; }
        else b.classList.add("fade");
      });
      btn.disabled = sel < 0;
      root.querySelectorAll("[data-c]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.c === conf)));
    }
    root.addEventListener("click", (e) => {
      const ch = e.target.closest(".qz-choice");
      if (ch && !checked) { sel = +ch.dataset.i; paint(); return; }
      const c = e.target.closest("[data-c]");
      if (c && !checked) { conf = c.dataset.c; paint(); return; }
      if (e.target.closest("[data-check]")) {
        if (!checked) { checked = true; reveal(); }
        else { checked = false; sel = -1; conf = "sure"; fb.classList.remove("open"); $("[data-topic]", root).hidden = true; btn.textContent = "Check answer"; paint(); }
        paint();
      }
    });
    function reveal() {
      const ok = sel === Q.correct;
      const sure = conf === "sure";
      // Confidence moves the schedule: a sure hit jumps ahead, an unsure one comes back tomorrow,
      // and a confident miss is flagged as the most dangerous kind.
      const step = ok ? (sure ? 1 : 0) : 0;
      const note = ok ? (sure ? "Sure and right — back in 3 days." : "Right, but unsure — counted as a guess. Back tomorrow.") : (sure ? "Confidently wrong — flagged. These are the ones that cost points." : "Missed — recycled this session and back tomorrow.");
      $("[data-topic]", root).hidden = false;
      const order = Q.choices.map((c, i) => i).filter((i) => i !== Q.correct);
      fb.firstElementChild.innerHTML = `<div class="in ${ok ? "ok" : "bad"}">
        <div class="qz-verdict" style="color:${ok ? "var(--ok)" : "var(--crit)"}">${ok ? "✓ Correct" : "✗ Missed on this pass"}<small>Confidence: ${sure ? "Sure" : "Unsure"}</small>${!ok && sure ? '<span class="chip crit">Confidently wrong</span>' : ""}</div>
        <div class="qz-body">
          <div class="eyb ok">Why it's the answer</div>
          <p style="margin:4px 0 8px">${Q.why}</p>
          <div class="eyb">Every other choice</div>
          <ul class="alts">${order.map((i, n) => `<li class="alt" style="--i:${n}"><div class="alt-head"><span class="L">${"ABCDE"[i]}</span><span>${esc(Q.choices[i])}</span>${i === sel ? '<span class="chip crit" style="margin-left:auto">Your answer</span>' : ""}</div>
            <p><span class="eyb">Why not here</span>${Q.alts[i][0]}</p><p><span class="eyb acc">Would be correct if</span>…${Q.alts[i][1]}</p></li>`).join("")}</ul>
          <div class="ivals" aria-label="Review intervals in days"><em>Next review</em>${IV.map((d, i) => `<span class="${i === step ? "on" : ""}">${d}d</span>`).join("")}</div>
          <p class="muted" style="margin:8px 0 0;font-size:12.5px">${note}</p>
        </div></div>`;
      fb.classList.add("open");
      btn.textContent = "Try again";
    }
    paint();
  }

  /* ─── 03 CaseFlow ────────────────────────────────────────────────── */
  function caseflow(root) {
    const FACTS = [
      { id: "on", ask: "When did it start?", say: "About an hour ago. I was carrying groceries up the stairs and it just came on." },
      { id: "ch", ask: "What does it feel like?", say: "Heavy. Like someone's sitting on my chest. Maybe a seven out of ten." },
      { id: "ra", ask: "Does it go anywhere?", say: "Up into my jaw a bit… and my left arm feels achy." },
      { id: "as", ask: "Anything else with it?", say: "I've been sweaty, and I felt sick to my stomach. A little short of breath." },
      { id: "pm", ask: "Any medical history?", say: "High blood pressure and cholesterol. I'm on lisinopril. I was supposed to take a statin but I stopped." },
      { id: "sh", ask: "Do you smoke?", say: "Forty years. A pack a day — I'm down to half a pack now." },
      { id: "fh", ask: "Anyone in the family with heart trouble?", say: "My brother. He died of a heart attack at 62." },
      { id: "wo", ask: "What worries you most?", say: "Honestly? That it's what happened to my brother. I keep thinking about him.", hidden: true },
    ];
    const ACTS = [
      { id: "ex", label: "Examine · Cardiac auscultation", res: "S1 and S2 normal. <b>S4 gallop</b> at the apex. No murmurs or rubs." },
      { id: "ecg", label: "Order · 12-lead ECG", res: '<span class="ab">ST elevation in II, III and aVF</span>, reciprocal depression in I and aVL.' },
      { id: "tn", label: "Order · Troponin I", res: 'Troponin I <span class="ab">2.8 ng/mL</span> <span class="ref">(Reference range: 0.00–0.04 ng/mL)</span>' },
    ];
    const asked = new Set(), done = new Set();
    let busy = false, finished = false;
    root.innerHTML = frame("CaseFlow", "Emergency department · Level: OMS-2",
      `<div class="cf">
        <div class="cf-door"><img src="assets/img/patient-caseflow.jpg" alt="Simulated patient, a man in his sixties in a hospital gown" width="64" height="64" loading="lazy" />
          <div><div class="nm">Walter Hale, 67</div><div class="cc">“My chest feels heavy.”</div>
          <div class="vitals"><span class="hi">BP <b>148/92</b></span><span class="hi">HR <b>96</b></span><span>RR <b>20</b></span><span>SpO₂ <b>95%</b></span><span>T <b>37.0°C</b></span></div></div></div>
        <div class="cf-log" data-log aria-live="polite"><div class="msg pt">Doctor… thanks for seeing me. It's my chest.</div></div>
        <div class="cf-asks" data-asks>${FACTS.map((f) => `<button type="button" data-f="${f.id}">${esc(f.ask)}</button>`).join("")}${ACTS.map((a) => `<button type="button" class="act" data-a="${a.id}">${esc(a.label)}</button>`).join("")}</div>
        <div class="cf-meter"><span>History coverage</span><div class="bar"><i data-bar></i></div><span data-cov>0 / ${FACTS.length}</span></div>
        <div class="cf-dx" data-dx><select aria-label="Your diagnosis"><option value="">Commit a diagnosis…</option><option value="stemi">Inferior STEMI</option><option value="peri">Acute pericarditis</option><option value="diss">Aortic dissection</option><option value="gerd">GERD</option><option value="pe">Pulmonary embolism</option></select><button type="button" class="qbtn cta" data-commit>Finish case</button></div>
      </div>`);
    const log = $("[data-log]", root);
    const add = (cls, html) => { const d = document.createElement("div"); d.className = "msg " + cls; d.innerHTML = html; log.appendChild(d); log.scrollTop = log.scrollHeight; return d; };
    function cov() {
      $("[data-bar]", root).style.width = (asked.size / FACTS.length) * 100 + "%";
      $("[data-cov]", root).textContent = `${asked.size} / ${FACTS.length}`;
    }
    function respond(html, cls) {
      busy = true;
      const t = document.createElement("div"); t.className = "typing"; t.innerHTML = "<i></i><i></i><i></i>";
      log.appendChild(t); log.scrollTop = log.scrollHeight;
      setTimeout(() => { t.remove(); add(cls, html); busy = false; }, reduce ? 0 : 650 + Math.random() * 400);
    }
    root.addEventListener("click", (e) => {
      if (finished && e.target.closest("[data-restart]")) { caseflow(root); return; }
      if (busy || finished) return;
      const f = e.target.closest("[data-f]");
      if (f) {
        const fact = FACTS.find((x) => x.id === f.dataset.f);
        add("me", esc(fact.ask)); f.disabled = true; asked.add(fact.id); cov();
        respond(esc(fact.say), "pt");
        return;
      }
      const a = e.target.closest("[data-a]");
      if (a) {
        const act = ACTS.find((x) => x.id === a.dataset.a);
        a.disabled = true; done.add(act.id);
        respond(`<b>${esc(act.label.split(" · ")[1])}</b>${act.res}`, "sys");
        return;
      }
      if (e.target.closest("[data-commit]")) {
        const v = $("select", root).value;
        if (!v) { $("select", root).focus(); return; }
        finished = true;
        const gather = Math.round(((asked.size / FACTS.length) * 0.7 + (done.size / ACTS.length) * 0.3) * 100);
        const right = v === "stemi";
        const missed = FACTS.filter((x) => !asked.has(x.id)).map((x) => x.ask.replace("?", "").toLowerCase());
        const total = Math.round(gather * 0.55 + (right ? 100 : 0) * 0.45);
        $("[data-asks]", root).remove();
        $("[data-dx]", root).outerHTML = `<div class="debrief">
          ${ringHtml(gather, "Data gathering", "var(--accent)")}
          ${ringHtml(right ? 100 : 0, right ? "Diagnosis ✓" : "Diagnosis ✗", right ? "var(--ok)" : "var(--crit)")}
          ${ringHtml(total, "Case score", "var(--violet)")}
          <div class="cf-miss"><b style="color:#f0f0fa">Inferior STEMI</b> — right coronary artery territory. ${right ? "Correct." : "Not the answer you committed."}
          ${asked.has("wo") ? " You found his hidden worry about his brother." : " <span style='color:var(--warn)'>You never asked what he was most worried about</span> — his brother died of the same thing."}
          ${missed.length && !(missed.length === 1 && !asked.has("wo")) ? `<br/>Missed: ${missed.filter((m) => !m.startsWith("what worries")).join(", ")}.` : ""}
          <div style="margin-top:10px"><button type="button" class="qbtn" data-restart>New case ↺</button></div></div></div>`;
        requestAnimationFrame(() => requestAnimationFrame(() => root.querySelectorAll(".ring .v").forEach((c) => c.setAttribute("stroke-dasharray", c.dataset.to))));
      }
    });
    function ringHtml(pct, label, color) {
      const C = 2 * Math.PI * 30;
      return `<div class="ring"><svg viewBox="0 0 74 74" aria-hidden="true"><circle class="t" cx="37" cy="37" r="30"/><circle class="v" cx="37" cy="37" r="30" stroke="${color}" stroke-dasharray="0 ${C}" data-to="${(pct / 100) * C} ${C}"/></svg><b>${pct}%</b><span>${label}</span></div>`;
    }
  }

  /* ─── 04 Board Ops ───────────────────────────────────────────────── */
  function boards(root) {
    const LANES = {
      school: [
        ["🔁", "Review yesterday's block", "12 unreviewed — reviews come before new questions", "12 q"],
        ["🃏", "Anki", "Due today, kept daily", "182"],
        ["📡", "QBank — Renal", "Matched to what class is covering: Renal block", "40 q"],
        ["▶", "Pathoma 12.1 – 12.3", "Assigned from your resources, never re-assigned", "45 min"],
        ["🤲", "OMM / OPP — Lumbar", "Weakest region in Skills Vault · Savarese ch. 6", "20 min"],
      ],
      dedicated: [
        ["🔁", "Review yesterday's blocks", "Reviews before new questions", "24 q"],
        ["🃏", "Anki", "Kept daily — contact, not cramming", "240"],
        ["📡", "QBank — Mixed, weighted to Renal", "Renal is your weakest system on the evidence", "3 × 40 q"],
        ["🧪", "COMSAE Form F", "Weekly checkpoint · light day tomorrow", "Sat"],
        ["🤲", "OMM / OPP — Cranial", "OPP must stay ≥ 11% of the blueprint", "30 min"],
      ],
    };
    const SYS = [
      { name: "Renal", tag: "weak", rows: [["QBank", 58, 0.6, 0.7], ["School exam", 84, 0.7, 0.8], ["Anki miss", 9, null, null, "vs your 11%"]] },
      { name: "Cardiovascular", tag: "holding", rows: [["QBank", 71, 0.6, 0.7], ["Quiz Mastery", 78, 0.65, 0.75]] },
      { name: "MSK / OPP", tag: "under", rows: [["QBank", 66, 0.6, 0.7], ["Blueprint", 8, 0.13, 0.16, "of 13% floor"]] },
    ];
    let phase = "school";
    root.innerHTML = `<div class="bo-wrap">${frame("Board Ops", "COMLEX Level 1",
      `<div class="bo-top"><div class="exam">COMLEX Level 1 · T–142 days<small>Comfort margin: COMSAE 450 · last COMSAE 468</small></div>
        <div class="seg2" role="group" aria-label="Phase"><button type="button" data-ph="school" aria-pressed="true">Alongside school</button><button type="button" data-ph="dedicated" aria-pressed="false">Dedicated</button></div></div>
       <div class="bo-grid">
         <div><div class="eyb acc">Today</div><ul class="lanes" data-lanes></ul></div>
         <div><div class="eyb">Signals · each source on its own scale</div><div class="sys-list">${SYS.map((s) => `<div class="sys" tabindex="0">
            <div class="sys-head"><span>${s.name}</span>${s.tag === "weak" ? '<span class="chip crit">Weak</span>' : s.tag === "under" ? '<span class="chip warn">Under-weighted</span>' : '<span class="chip ok">Holding</span>'}</div>
            <div class="rulers">${s.rows.map((r) => ruler(r)).join("")}</div></div>`).join("")}</div>
           <div class="eyb" style="margin-top:14px">Miss tally · 64 misses categorised</div>
           <div class="tally" aria-hidden="true"><i style="width:46%;background:var(--accent)"></i><i style="width:18%;background:var(--violet)"></i><i style="width:20%;background:var(--warn)"></i><i style="width:9%;background:#f472b6"></i><i style="width:7%;background:rgba(255,255,255,.3)"></i></div>
           <div class="tally-key"><span style="--c:var(--accent)">Content 46%</span><span style="--c:var(--violet)">Misread 18%</span><span style="--c:var(--warn)">Reasoning 20%</span><span style="--c:#f472b6">Changed 9%</span><span style="--c:rgba(255,255,255,.3)">Timing 7%</span></div>
           <div class="verdict">Mostly <b>content</b>. More review will move this; drilling speed won't.</div>
         </div>
       </div>`)}</div>`;
    function ruler([label, v, weak, hold, note]) {
      // Anki reads as a miss rate (lower is better); blueprint is a share against a floor.
      let x, w, hh, shown;
      if (label === "Anki miss") { x = 100 - v * 4; w = 40; hh = 56; shown = v + "%"; }
      else if (label === "Blueprint") { x = (v / 20) * 100; w = (weak / 0.2) * 100; hh = (hold / 0.2) * 100; shown = v + "%"; }
      else { x = v; w = weak * 100; hh = hold * 100; shown = v + "%"; }
      return `<div class="ruler" title="${label}${note ? " — " + note : ""}"><span>${label}</span><div class="track" style="--w:${w}%;--h:${hh}%"><span class="dot" style="--x:${Math.max(3, Math.min(97, x))}%"></span></div><b>${shown}</b></div>`;
    }
    function lanes() {
      $("[data-lanes]", root).innerHTML = LANES[phase].map((l, i) => `<li style="--i:${i}"><span class="ic" aria-hidden="true">${l[0]}</span><span>${l[1]}<small>${l[2]}</small></span><span class="n">${l[3]}</span></li>`).join("");
      root.querySelectorAll("[data-ph]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.ph === phase)));
    }
    root.addEventListener("click", (e) => { const b = e.target.closest("[data-ph]"); if (b && b.dataset.ph !== phase) { phase = b.dataset.ph; lanes(); } });
    lanes();
  }

  /* ─── 05a Picker wheel ───────────────────────────────────────────── */
  function wheel(root) {
    const T = [
      ["Rib raising", "Thoracic cage", 5], ["OA decompression", "Cranial / cervical", 4], ["Thoracic lymphatic pump", "Lymphatic", 5],
      ["Pedal pump", "Lymphatic", 4], ["Lumbar ME — Type II FRS", "Lumbar", 7], ["Sacral ME — L on L torsion", "Sacrum", 8],
      ["Cervical muscle energy", "Cervical", 6], ["Iliopsoas counterstrain", "Lumbar / hip", 5], ["Spencer technique", "Shoulder", 7],
      ["Frontal lift", "Cranial", 5], ["Thoracic HVLA — supine", "Thoracic", 6], ["Anterior T1 counterstrain", "Thoracic", 5],
    ];
    const cols = ["#38bdf8", "#6366f1", "#22d3ee", "#a78bfa", "#0ea5e9", "#818cf8"];
    const n = T.length, seg = 360 / n;
    let angle = 0, pool = 227, pick = -1;
    const conf = {};
    const paths = T.map((t, i) => {
      const a0 = ((i * seg - 90) * Math.PI) / 180, a1 = (((i + 1) * seg - 90) * Math.PI) / 180;
      const x0 = 50 + 48 * Math.cos(a0), y0 = 50 + 48 * Math.sin(a0), x1 = 50 + 48 * Math.cos(a1), y1 = 50 + 48 * Math.sin(a1);
      return `<path d="M50 50 L${x0.toFixed(2)} ${y0.toFixed(2)} A48 48 0 0 1 ${x1.toFixed(2)} ${y1.toFixed(2)} Z" fill="${cols[i % cols.length]}" fill-opacity="${0.18 + (i % 3) * 0.08}" stroke="#05060d" stroke-width="0.6"/>`;
    }).join("");
    root.innerHTML = `<div class="wh-wrap">${frame("Skills Vault", "OMM · Picker wheel",
      `<div class="wh"><div class="wheel"><span class="pin" aria-hidden="true"></span><svg viewBox="0 0 100 100" data-w aria-hidden="true">${paths}<circle cx="50" cy="50" r="48" fill="none" stroke="rgba(255,255,255,.12)" stroke-width="0.6"/></svg><span class="hub"><img src="${LOGO}" alt="" /></span></div>
        <div class="wh-res" aria-live="polite" data-res><div class="eyb">No-repeat mode · <span data-pool>227</span> in pool</div><h4>Spin to pick a technique</h4><p class="muted" style="margin:0;font-size:13px">Every one carries its full written protocol.</p><div style="margin-top:12px"><button type="button" class="qbtn cta" data-spin>Spin the wheel</button></div></div></div>`)}</div>`;
    const svg = $("[data-w]", root);
    function result() {
      const t = T[pick], c = conf[pick] || 0;
      $("[data-res]", root).innerHTML = `<div class="eyb">No-repeat mode · <span>${pool}</span> in pool</div><h4>${esc(t[0])}</h4>
        <div class="muted" style="font-size:12.5px">${esc(t[1])} · full protocol, ${t[2]} steps</div>
        <div class="conf" role="group" aria-label="Your confidence, 0 to 5">${[1, 2, 3, 4, 5].map((k) => `<button type="button" data-cf="${k}" class="${k <= c ? "on" : ""}" aria-label="Confidence ${k}" aria-pressed="${k <= c}"></button>`).join("")}<span class="muted" style="font-size:12px;margin-left:6px">${c}/5</span></div>
        <button type="button" class="qbtn cta" data-spin>Spin again</button>`;
    }
    root.addEventListener("click", (e) => {
      const cf = e.target.closest("[data-cf]");
      if (cf) { conf[pick] = +cf.dataset.cf === conf[pick] ? 0 : +cf.dataset.cf; result(); return; }
      if (!e.target.closest("[data-spin]")) return;
      const next = Math.floor(Math.random() * n);
      const target = 360 - (next * seg + seg / 2);
      angle += 360 * 4 + ((target - (angle % 360)) + 360) % 360;
      svg.style.transform = `rotate(${angle}deg)`;
      const b = e.target.closest("[data-spin]"); b.disabled = true;
      setTimeout(() => { pick = next; pool = Math.max(1, pool - 1); result(); }, reduce ? 20 : 3650);
    });
  }

  /* ─── 05b Score Matrix ───────────────────────────────────────────── */
  function grades(root) {
    root.innerHTML = frame("Score Matrix", "Mechanisms of Disease",
      `<div class="gr-row"><span>Midterm<span class="w">40%</span></span><b data-mid>82%</b></div>
       <input class="sl" type="range" min="50" max="100" value="82" aria-label="Midterm score" data-sl />
       <div class="gr-row"><span>Quick Checks<span class="w">6.5% · lowest dropped</span></span><b>88%</b></div>
       <div class="gr-row"><span>Daily Quizzes<span class="w">5.5%</span></span><b>94%</b></div>
       <div class="gr-row"><span>Final exam<span class="w">50%</span></span><b class="muted">?</b></div>
       <div class="eyb acc" style="margin-top:12px">What you need on the final</div>
       <div class="needs" data-needs></div>`);
    const sl = $("[data-sl]", root);
    function calc() {
      const M = +sl.value, Q = 88, D = 94;
      $("[data-mid]", root).textContent = M + "%";
      // Weights sum to 102%: the extra 2% is built-in credit, so the grade is the plain weighted sum.
      const need = (T) => (T - 0.4 * M - 0.065 * Q - 0.055 * D) / 0.5;
      $("[data-needs]", root).innerHTML = [["Pass", 70], ["B", 80], ["A", 90]].map(([l, T]) => {
        const v = need(T);
        if (v <= 0) return `<div class="need easy"><small>${l} · ${T}%</small><b>Secured</b></div>`;
        if (v > 100) return `<div class="need no"><small>${l} · ${T}%</small><b>Out of reach</b></div>`;
        return `<div class="need ${v > 90 ? "hard" : v < 65 ? "easy" : ""}"><small>${l} · ${T}%</small><b>${Math.ceil(v)}%</b></div>`;
      }).join("");
    }
    sl.addEventListener("input", calc);
    calc();
  }

  /* ─── 06 GrydRank ────────────────────────────────────────────────── */
  function rank(root) {
    let lvl = 34, xp = 820, need = 1000, total = 41820;
    const board = [
      { nm: "You", xp: 41820, me: true, c: "#38bdf8" },
      { nm: "J. K.", xp: 42610, c: "#a78bfa" },
      { nm: "M. R.", xp: 41990, c: "#22d3ee" },
      { nm: "S. P.", xp: 39870, c: "#f472b6" },
      { nm: "D. L.", xp: 37240, c: "#4ade80" },
    ];
    root.innerHTML = `<div class="gr-wrap">${frame("GrydRank", "Study group · This week",
      `<div class="gr-grid">
        <div class="lvl" data-lvl><svg viewBox="0 0 200 200" aria-hidden="true"><rect class="t" x="12" y="12" width="176" height="176" rx="16"/><rect class="v" x="12" y="12" width="176" height="176" rx="16" pathLength="1000" stroke-dasharray="1000" stroke-dashoffset="1000" data-ring/></svg>
          <div class="in"><small>LEVEL</small><b data-l>${lvl}</b><span>Clinician tier</span><em data-x></em></div></div>
        <div>
          <div class="eyb">Earn XP</div>
          <div class="xp-acts"><button type="button" class="qbtn" data-g="5">Finish a task +5</button><button type="button" class="qbtn" data-g="15">Focus session +15</button><button type="button" class="qbtn" data-g="35">CaseFlow case +35</button></div>
          <ol class="board" data-b></ol>
          <div class="badges" aria-label="Badges"><span title="7-day streak">🔥</span><span title="Anki centurion">🃏</span><span title="Night owl">🦉</span><span title="Quiz streak">🧠</span><span title="Helper">🤝</span></div>
        </div>
      </div>`)}</div>`;
    const app = $(".app", root);
    function paint(up) {
      $("[data-l]", root).textContent = lvl;
      $("[data-x]", root).textContent = `${xp.toLocaleString()} / ${need.toLocaleString()} XP`;
      $("[data-ring]", root).setAttribute("stroke-dashoffset", String(1000 - (xp / need) * 1000));
      board.find((b) => b.me).xp = total;
      const sorted = [...board].sort((a, b) => b.xp - a.xp);
      $("[data-b]", root).innerHTML = sorted.map((b, i) => `<li class="${b.me ? "me" : ""}"><span class="r">${i + 1}</span><span class="av" style="background:${b.c}">${b.nm === "You" ? "Y" : b.nm[0]}</span><span class="nm">${b.nm}</span><b>${b.xp.toLocaleString()}</b></li>`).join("");
      if (up) { const l = $("[data-lvl]", root); l.classList.remove("up"); void l.offsetWidth; l.classList.add("up"); }
    }
    root.addEventListener("click", (e) => {
      const g = e.target.closest("[data-g]");
      if (!g) return;
      const amt = +g.dataset.g * 6; // demo speed: each tap counts a few times over
      xp += amt; total += amt;
      let up = false;
      while (xp >= need) { xp -= need; lvl += 1; need = Math.round(need * 1.06); up = true; }
      paint(up);
      toast(app, up ? `Level ${lvl}!` : `+${g.dataset.g} XP`);
      if (up) { const b = $(".badges", root); if (!b.querySelector(".new")) { const s = document.createElement("span"); s.className = "new"; s.textContent = "⭐"; s.title = "Level up"; b.appendChild(s); } }
    });
    paint(false);
  }

  /* GrydAI: a scripted example of topic linking and the next guide's context.
     No API calls, account data, or persistence; chatting does not change mastery. */
  function grydai(root) {
    const mark = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1.4" stroke="currentColor" stroke-width="1.4"/><rect x="9" y="1.5" width="5.5" height="5.5" rx="1.4" fill="currentColor" opacity=".85"/><rect x="1.5" y="9" width="5.5" height="5.5" rx="1.4" fill="currentColor" opacity=".5"/><path d="m11.75 9.2.7 1.65 1.65.7-1.65.7-.7 1.65-.7-1.65-1.65-.7 1.65-.7z" fill="currentColor"/></svg>`;
    // Renal teaching reference: OHSU, Gustafson, Resistant Arterial Hypertension (2026):
    // https://www.ohsu.edu/sites/default/files/2026-02/pcr26-thu-2-gustafson.pdf
    // Prior error is explicitly supplied in this chat; the tutor does not fetch past quiz answers.
    const examples = [
      {
        label: "Connect two missed questions",
        earlier: "I missed the ibuprofen question. I picked efferent dilation as the reason GFR fell in a dehydrated patient.",
        question: "I got the losartan question wrong too. I chose afferent constriction. Why would creatinine go up?",
        answer: "Same mix-up as the last question you shared: you’re swapping the entrance and exit of the glomerulus. Different drugs, same underlying concept — pressure inside the filter.",
        teaching: [
          ["Ibuprofen / NSAIDs", "Block prostaglandin production, reducing afferent dilation. The entrance can narrow, especially when renal perfusion is low."],
          ["Losartan / ARBs", "Block angiotensin II’s AT1 receptor effects, allowing the efferent exit to relax. Filtration pressure can fall, GFR can drop, and creatinine can rise."],
        ],
        mnemonic: "NSAIDs Narrow the entrance. ACE inhibitors and ARBs Ease the exit.",
        memory: "Afferent Arrives. Efferent Exits. Less coming in or an easier way out can both lower pressure inside the filter.",
        topics: ["Glomerular filtration", "NSAIDs", "RAAS blockers"],
        follow: "So how would an ACE inhibitor compare?",
        followAnswer: "Same exit, different target. ACE inhibitors reduce angiotensin II formation; ARBs block its AT1 receptor. Both reduce angiotensin II–mediated efferent constriction, so both fit “Ease the exit.”",
        followNote: "Also asked how ACE inhibitors connect to the same mechanism.",
        note: "Swaps afferent and efferent drug effects across NSAID and ARB questions.",
        guide: "Compare NSAIDs, ACE inhibitors and ARBs using the entrance/exit mnemonic, then check which vessel changes and what happens to filtration pressure.",
      },
      {
        label: "Untangle a concept",
        question: "I recognize the answer, but I can’t explain it without the choices. How should I study?",
        answer: "Try explaining the concept before looking at the options. Then compare your explanation with your lecture and work through what you missed. If you guessed correctly, mark your confidence honestly in Quiz Mastery so the next review reflects that.",
        note: "Recognizes the answer but struggles to explain the concept without prompts.",
        guide: "A short explanation followed by a recall prompt to answer before revealing the key.",
      },
      {
        label: "Make a study connection",
        question: "I keep mixing up the ideas in this renal lecture. Where should I start?",
        answer: "Pick the two ideas you confuse most. For each, write what it means, what changes it, and how it differs from the other. Then explain the difference out loud. Which pair would you like to work through?",
        note: "Needs help distinguishing related concepts in the renal lecture.",
        guide: "A side-by-side comparison and self-checks that ask you to explain the difference.",
      },
    ];
    const topicsFor = (ex) => ex.topics || ["Glomerular filtration"];
    let selected = 0, linkedTopics = new Set(topicsFor(examples[0])), followed = false;
    root.classList.add("ai-demo");
    root.innerHTML = frame(`${mark}GrydAI`, "Interactive example",
      `<div class="ai-context"><span class="eyb">Quiz Mastery</span><span>Renal physiology / Glomerular filtration</span></div>
       <div class="ai-prompts" role="group" aria-label="Choose an example question">${examples.map((ex, i) => `<button type="button" data-ai-example="${i}" aria-pressed="false">${esc(ex.label)}</button>`).join("")}</div>
       <div class="ai-result" aria-live="polite" aria-atomic="true" data-ai-result></div>
       <div class="ai-actions"><button class="qbtn" type="button" data-ai-follow>How would I check my understanding?</button><button class="qbtn" type="button" data-ai-reset>Reset example</button></div>
       <p class="ai-disclosure">Scripted conversation · No live AI or account required.</p>`);

    function paint() {
      const ex = examples[selected];
      const linked = linkedTopics.size > 0;
      root.querySelectorAll("[data-ai-example]").forEach((button) => button.setAttribute("aria-pressed", String(+button.dataset.aiExample === selected)));
      $("[data-ai-result]", root).innerHTML = `
        ${ex.earlier ? `<div class="ai-earlier"><span class="eyb">Earlier in this chat · You</span><p>${esc(ex.earlier)}</p></div>` : ""}
        <div class="ai-question"><span class="eyb">You</span><p>${esc(ex.question)}</p></div>
        <div class="ai-answer"><span class="ai-who">${mark}GrydAI</span><p>${esc(ex.answer)}</p></div>
        ${ex.teaching ? `<dl class="ai-teaching">${ex.teaching.map(([drug, mechanism]) => `<div><dt>${esc(drug)}</dt><dd>${esc(mechanism)}</dd></div>`).join("")}</dl>` : ""}
        ${ex.mnemonic ? `<div class="ai-mnemonic"><span class="eyb acc">Make it stick</span><p><strong>${esc(ex.mnemonic)}</strong></p><p>${esc(ex.memory)}</p></div>` : ""}
        ${followed ? `<div class="ai-followup"><span class="eyb">You · ${esc(ex.follow || "How would I check my understanding?")}</span><p><b>GrydAI</b> · ${esc(ex.followAnswer || "Close your notes and explain the idea in your own words, then try a fresh practice question. Use the explanation to check your reasoning, even when your answer is correct.")}</p></div>` : ""}
        <div class="ai-links">${linked ? `<span>Linked to</span>${topicsFor(ex).map((topic, i) => linkedTopics.has(topic) ? `<span class="ai-chip">${esc(topic)}<button type="button" data-ai-unlink="${i}" aria-label="Unlink ${esc(topic)}" title="Not about this">×</button></span>` : "").join("")}` : `<span>Topics unlinked from this example.</span>`}</div>
        <div class="ai-guide">
          <div class="ai-guide-heading"><span class="eyb acc">Your next GrydGuide</span><span class="ai-preview">Preview</span></div>
          <h4>${linked ? "The question becomes context." : "You control the connection."}</h4>
          <p>${linked ? esc(ex.note + (followed ? " " + (ex.followNote || "Wants a way to check understanding independently.") : "")) : "This conversation no longer contributes context for these topics. Your quiz evidence still informs the guide."}</p>
          ${linked && ex.topics ? `<p class="ai-guide-topics">Context for: ${esc([...linkedTopics].join(" · "))}</p>` : ""}
          ${linked ? `<div class="ai-guide-example"><span>Example guide focus</span>${esc(ex.guide)}</div>` : ""}
        </div>`;
      $("[data-ai-follow]", root).hidden = followed;
      $("[data-ai-follow]", root).textContent = ex.follow || "How would I check my understanding?";
    }
    root.addEventListener("click", (event) => {
      const example = event.target.closest("[data-ai-example]");
      if (example) {
        selected = +example.dataset.aiExample; linkedTopics = new Set(topicsFor(examples[selected])); followed = false; paint();
      } else if (event.target.closest("[data-ai-unlink]")) {
        const index = +event.target.closest("[data-ai-unlink]").dataset.aiUnlink;
        linkedTopics.delete(topicsFor(examples[selected])[index]); paint(); $("[data-ai-reset]", root).focus({ preventScroll: true });
      } else if (event.target.closest("[data-ai-follow]")) {
        followed = true; paint(); $("[data-ai-reset]", root).focus({ preventScroll: true });
      } else if (event.target.closest("[data-ai-reset]")) {
        selected = 0; linkedTopics = new Set(topicsFor(examples[0])); followed = false; paint();
      }
    });
    paint();
  }

  /* ─── Orbit of tools ─────────────────────────────────────────────── */
  function orbit(root) {
    const TOOLS = [
      { n: "GrydAI", c: "#38bdf8", tag: "Connected tutor · Plus & Max", d: "Ask a question, connect it to a Quiz Mastery topic, and let your next GrydGuide pick up what you found confusing. Your practice results continue to drive reviews and Board Ops.", b: ["Suggested questions from weak concepts", "Saved chats with removable topic links", "Paused during quizzes and CaseFlow encounters"] },
      { n: "Calendar & LMS sync", c: "#4fc3f7", tag: "Automatic", d: "Canvas, D2L Brightspace or any iCal feed arrives on its own, and Google Calendar is properly two-way — edit an event in MedGryd and the real one updates.", b: ["Two-way Google Calendar push", "Recurring events with This / Following / All edits", "Import a PDF schedule straight into the grid"] },
      { n: "Today's To-Do", c: "#38bdf8", tag: "Everywhere", d: "Pin today's list to the corner of every page. Tick items and reorder them without going back to the planner.", b: ["Mirrors the real day card", "Drag the banner anywhere on screen", "Shows subtask and quiz counts"] },
      { n: "Quick Jot", c: "#a78bfa", tag: "Capture", d: "A rich-text scratchpad with named sections. Pin any section out as a sticky note that follows you across the app.", b: ["Unlimited named sections", "Resizable, draggable sticky notes", "Checklists and headings"] },
      { n: "Focus Mode", c: "#ffb43c", tag: "Deep work", d: "Timed or Pomodoro sessions that log themselves into your stats, your Productivity Score and your rank — and hand a finished QBank block straight to Board Ops.", b: ["Pomodoro rounds bank time as they finish", "Sessions drawn on Block view", "Live next-event countdown"] },
      { n: "GrydGuide", c: "#22d3ee", tag: "AI study guide", d: "Turns your top weak concepts — and the questions you actually missed — into one study guide with self-checks, exportable as a MedGryd-branded PDF.", b: ["Built from your own misses", "Maps to your lecture's topics", "Linked GrydAI questions inform your next guide"] },
      { n: "Deeper explanation", c: "#818cf8", tag: "AI tutor", d: "On any question, open a deeper walkthrough of every choice — and a warning when the answer key itself looks wrong.", b: ["Why it's right, why each other choice isn't", "Flags a questionable key", "Cached, so reopening is instant"] },
      { n: "OSCE Tracker", c: "#f472b6", tag: "Clinical", d: "A complete SOAP note: 18 review-of-systems categories, vitals, seven exam areas and 22 labs that flag themselves when out of range.", b: ["22 labs with reference ranges", "Printable patient card", "Same note format CaseFlow uses"] },
      { n: "Research Hub", c: "#4ade80", tag: "Collaborate", d: "Ideas, projects and deadlines on one board. Import literature from Google Sheets, then share the project and split the tasks.", b: ["Seven-stage pipeline to published", "Shared projects with assigned tasks", "Deadline countdowns"] },
      { n: "Anki lessons", c: "#6cb6ff", tag: "Nobody else does this", d: "Reads which cards you keep failing, groups them into concepts, and builds a NotebookLM packet that turns them into one narrated lesson.", b: ["Live card counts from Anki", "Groups by concept, not deck", "Feeds Board Ops retention by system"] },
      { n: "Companion Tracker", c: "#e8b84b", tag: "Resources", d: "Pathoma chapters, SketchyPharm and SketchyMicro videos ticked off as you go — and Board Ops assigns the next ones for you.", b: ["Per-series progress", "Never re-assigns what you've watched", "Earns XP"] },
      { n: "Stats & heatmap", c: "#2dd4bf", tag: "Evidence", d: "Study time, Anki history, task completion and a year heatmap — with a Productivity Score judged against your own baseline, never someone else's.", b: ["30-day trends on every badge", "Personal baselines, fair to any workflow", "Past days frozen, never rewritten"] },
      { n: "Peer Board", c: "#fb7185", tag: "Community", d: "A struggle board for your class. Post anonymously or by name, upvote what you recognise, and answer what you've been through.", b: ["Truly anonymous posting", "Threaded replies", "XP for helping classmates"] },
      { n: "Shared events & goals", c: "#c084fc", tag: "Together", d: "Invite classmates to an event or a goal. Everyone keeps their own copy in their own calendar, and the owner's edits follow.", b: ["See who accepted, declined or is pending", "Recurring shared goals stay linked", "Each person files it in their own calendar"] },
      { n: "Install anywhere", c: "#94a3b8", tag: "Platform", d: "Installs to your home screen on iPhone and Android with a layout built for the phone, and runs on any laptop browser.", b: ["Light, dark or sunrise-to-sunset", "Any accent colour", "Searchable 19-part setup guide"] },
    ];
    const inner = TOOLS.slice(0, 6), outer = TOOLS.slice(6);
    // Both rings turn together as one system, so the offset between them (and therefore the gap
    // between any two labels) never changes; the outer ring sits half a step round from the inner.
    const node = (t, i, count, r, off) => `<div class="node" style="--a:${(360 / count) * i + off}deg;--r:${r}"><button type="button" style="--c:${t.c}" data-i="${TOOLS.indexOf(t)}" aria-pressed="false"><i></i>${esc(t.n)}</button></div>`;
    root.innerHTML = `
      <div class="orbit" data-orb style="container-type:inline-size;--dur:180s">
        <div class="ring" style="--in:26%"></div><div class="ring" style="--in:3%"></div>
        <div class="spin">${inner.map((t, i) => node(t, i, inner.length, "24cqw", 0)).join("")}${outer.map((t, i) => node(t, i, outer.length, "47cqw", 180 / outer.length)).join("")}</div>
        <div class="core"><img src="${LOGO}" alt="" /></div>
      </div>
      <div><div class="orbit-list" role="group" aria-label="Tools">${TOOLS.map((t, i) => `<button type="button" data-i="${i}" aria-pressed="false">${esc(t.n)}</button>`).join("")}</div>
      <div class="orbit-card" aria-live="polite" data-card></div></div>`;
    function show(i) {
      const t = TOOLS[i];
      root.querySelectorAll("[data-i]").forEach((b) => b.setAttribute("aria-pressed", String(+b.dataset.i === i)));
      $("[data-card]", root).innerHTML = `<div class="swap"><div class="tag" style="color:${t.c}">${esc(t.tag)}</div><h3>${esc(t.n)}</h3><p>${esc(t.d)}</p><ul>${t.b.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>`;
    }
    root.addEventListener("click", (e) => { const b = e.target.closest("[data-i]"); if (b) { show(+b.dataset.i); $("[data-orb]", root).classList.add("paused"); } });
    root.addEventListener("mouseover", (e) => { const b = e.target.closest(".orbit [data-i]"); if (b) show(+b.dataset.i); });
    show(0);
  }

  const DEMOS = { planner, quiz, caseflow, boards, wheel, grades, rank, grydai, orbit };
  document.querySelectorAll("[data-demo]").forEach((el) => {
    const fn = DEMOS[el.dataset.demo];
    if (fn) { try { fn(el); } catch (err) { console.error("demo", el.dataset.demo, err); } }
  });
})();
