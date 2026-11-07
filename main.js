/*
  Delfino Security
  Autor / Author: Hélio Delfino Lopes de Alcântara —
  Pesquisador e pentester web especializado / Security researcher & web penetration tester
*/
/* ===== Config ===== */
const WHATSAPP_NUMBER = "5561999827436"; // DDI+DDD+número, só dígitos
const EMAIL = "helio.delfinola@gmail.com";

/* ===== i18n ===== */
const EN = {
  "nav.services":"Services","nav.method":"Method","nav.faq":"FAQ","nav.cta":"Get in touch",
  "hero.lead":"I find the vulnerabilities in your application before an attacker does, with AI on offense and a human pentester validating every finding.",
  "hero.cta":"Request an assessment","copied":"copied",
  "tag1":"codebase","tag2":"web pentest + AI","tag3":"secure development",
  "services.eyebrow":"services","services.title":"Three fronts so nothing exploitable reaches production.",
  "s1.title":"Codebase vulnerability analysis","s1.desc":"Source code review with AI assistance and manual reading. Every finding ships with the vulnerable snippet, proof of exploitation and a suggested fix.",
  "s1.i1":"Authentication, authorization and business logic","s1.i2":"Injection, deserialization, SSRF and path traversal","s1.i3":"Vulnerable dependencies and secrets in the repo","s1.i4":"CVSS-prioritized report with suggested patch",
  "s2.badge":"flagship","s2.title":"Automated Web Pentest + AI","s2.desc":"AI agents map and attack your application like a real adversary. Before anything reaches the report, each vulnerability is reproduced by hand.",
  "s2.i1":"Surface recon: subdomains, endpoints and APIs","s2.i2":"OWASP Top 10 and API Top 10: IDOR, BOLA, BFLA, JWT","s2.i3":"Validated exploitation, zero false positives in the report",
  "s3.title":"Secure development consulting","s3.desc":"Security built into your team's process, from feature design to deploy, so the next flaw never gets written.",
  "s3.i1":"Threat modeling for new features","s3.i2":"Checklists and PR review with your team","s3.i3":"SAST, SCA and secret scanning in CI","s3.i4":"Hands-on training using flaws from your own code",
  "method.eyebrow":"method","method.title":"AI brings scale. The pentester brings certainty.",
  "m1.t":"Scope and authorization","m1.d":"We define targets, testing window and rules of engagement. Nothing is tested without formal authorization.",
  "m2.t":"Recon and attack","m2.d":"Tools and AI agents map the surface and fire thousands of attack hypotheses.",
  "m3.t":"Manual validation","m3.d":"Every hypothesis is reproduced by hand. If it doesn't exploit, it doesn't go in the report.",
  "m4.t":"Report","m4.d":"Report in English and Portuguese with step-by-step replication, impact and suggested fix.",
  "f.sev":"HIGH","f.impact":"impact","f.impactv":"any account can create admins","f.fix":"fix","f.fixv":"check the role in middleware","f.caption":"Illustrative example of a finding in the report.",
  "why.eyebrow":"why delfino","why.title":"A web pentester, not a scanner reseller.",
  "w1.t":"Real attacks","w1.d":"I chain flaws the way an adversary would, instead of pasting a tool's output.",
  "w2.t":"No false positives","w2.d":"Every finding in the report was exploited and has reproducible proof.",
  "w3.t":"Bilingual report","w3.d":"One version in English and one in Portuguese, for the dev who fixes and the manager who decides.",
  "w4.t":"Ethical and authorized","w4.d":"Signed scope, agreed window and confidentiality on everything found.",
  "faq.title":"Frequently asked questions",
  "q1":"Does AI replace the pentester?","a1":"No. AI widens coverage and speed. Validation, chaining flaws and impact analysis stay with me.",
  "q2":"Do I need to give access to my code?","a2":"Only for codebase analysis. The web pentest can be black-box (no access) or gray-box (with test users), depending on scope.",
  "q3":"Do you test in production?","a3":"I prefer staging. When testing must happen in production, it runs in an agreed window with no destructive techniques.",
  "q4":"How long does it take and how much does it cost?","a4":"It depends on the size of the application and the scope. Timeline and price are fixed in the proposal, after a quick call.",
  "cta.title":"Find out what an attacker can already see in your application.","cta.wa":"Message on WhatsApp",
  "foot.role":"Security researcher & web penetration tester"
};
const WA_MSG = {pt:"Olá! Vim pelo site da Delfino Security e quero conversar sobre um teste de segurança.", en:"Hi! I found Delfino Security's website and would like to talk about a security assessment."};
const PT = {};
document.querySelectorAll("[data-i18n]").forEach(el => { PT[el.dataset.i18n] = el.textContent; });

function setLang(lang){
  const dict = lang === "en" ? EN : PT;
  document.querySelectorAll("[data-i18n]").forEach(el => { const v = dict[el.dataset.i18n]; if (v) el.textContent = v; });
  document.documentElement.lang = lang === "en" ? "en" : "pt-BR";
  document.querySelectorAll(".lang span").forEach(s => s.classList.toggle("on", s.dataset.lang === lang));
  const wa = "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(WA_MSG[lang]);
  document.querySelectorAll(".js-wa").forEach(a => a.href = wa);
  try { localStorage.setItem("ds-lang", lang); } catch (e) {}
  currentLang = lang;
}
let currentLang = "pt";
let saved = null;
try { saved = localStorage.getItem("ds-lang"); } catch (e) {}
setLang(saved || (navigator.language && !navigator.language.toLowerCase().startsWith("pt") ? "en" : "pt"));
document.getElementById("lang-toggle").addEventListener("click", () => setLang(currentLang === "pt" ? "en" : "pt"));

/* ===== Copy e-mail ===== */
document.querySelectorAll(".js-copy").forEach(btn => btn.addEventListener("click", () => {
  const flash = () => { btn.classList.add("done"); setTimeout(() => btn.classList.remove("done"), 1400); };
  const fallback = () => { const r = document.createRange(); r.selectNodeContents(btn.querySelector(".cmd")); const s = getSelection(); s.removeAllRanges(); s.addRange(r); };
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(EMAIL).then(flash, fallback);
  else fallback();
}));
document.getElementById("year").textContent = new Date().getFullYear();

/* ===== Radar ===== */
(() => {
  const cv = document.getElementById("radar");
  const ctx = cv.getContext("2d");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const BLIPS = [
    {a:-1.95, r:.55, t:"[JWT]"}, {a:-0.55, r:.82, t:"[IDOR]"}, {a:0.45, r:.68, t:"[SSRF]"},
    {a:2.35, r:.78, t:"[SQLi]"}, {a:-2.75, r:.9, t:"[XSS]"}, {a:1.35, r:.42, t:"[../]"}, {a:3.6, r:.38, t:"[BFLA]"}
  ];
  const TAU = Math.PI * 2;
  let W, H, cx, cy, R, K, dpr, theta = -0.4, last = performance.now();

  function size(){
    dpr = Math.min(devicePixelRatio || 1, 2);
    const rect = cv.getBoundingClientRect();
    W = rect.width; H = rect.height;
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const wm = document.querySelector(".wordmark").getBoundingClientRect();
    cx = W / 2;
    cy = wm.top - rect.top + wm.height * 0.55;
    R = Math.min(W * 0.62, 760);
    K = W < 600 ? 0.42 : 0.3;
  }
  const P = (ang, rr) => [cx + Math.cos(ang) * rr, cy + Math.sin(ang) * rr * K];

  function frame(now){
    const dt = Math.min(now - last, 50); last = now;
    if (!reduce) theta = (theta + dt * 0.00085) % TAU;
    ctx.clearRect(0, 0, W, H);

    // rings
    ctx.lineWidth = 1;
    [0.22, 0.45, 0.7, 1].forEach((f, i) => {
      ctx.strokeStyle = `rgba(17,19,24,${i === 3 ? .16 : .09})`;
      ctx.beginPath(); ctx.ellipse(cx, cy, R * f, R * f * K, 0, 0, TAU); ctx.stroke();
    });
    // spokes
    ctx.strokeStyle = "rgba(17,19,24,.06)";
    for (let d = 0; d < 360; d += 20) {
      const a = d * Math.PI / 180, [x1, y1] = P(a, R * .22), [x2, y2] = P(a, R);
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    }
    // ticks
    for (let d = 0; d < 360; d += 2.5) {
      const a = d * Math.PI / 180, major = d % 15 === 0;
      const [x1, y1] = P(a, R), [x2, y2] = P(a, R + (major ? 14 : 7));
      ctx.strokeStyle = major ? "rgba(17,19,24,.28)" : "rgba(17,19,24,.13)";
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    }
    // sweep trail
    const N = 46, span = 0.95;
    for (let i = 0; i < N; i++) {
      const a0 = theta - span * i / N, a1 = theta - span * (i + 1) / N;
      const [x0, y0] = P(a0, R), [x1, y1] = P(a1, R);
      ctx.fillStyle = `rgba(0,87,255,${0.16 * Math.pow(1 - i / N, 2.2)})`;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(x0, y0); ctx.lineTo(x1, y1); ctx.closePath(); ctx.fill();
    }
    // leading beam
    const [bx, by] = P(theta, R + 14);
    const g = ctx.createLinearGradient(cx, cy, bx, by);
    g.addColorStop(0, "rgba(0,87,255,0)"); g.addColorStop(1, "rgba(0,87,255,.95)");
    ctx.strokeStyle = g; ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(bx, by); ctx.stroke();

    // blips
    ctx.font = "500 11px 'IBM Plex Mono', ui-monospace, monospace";
    ctx.textAlign = "center";
    BLIPS.forEach(b => {
      const since = ((theta - b.a) % TAU + TAU) % TAU;
      const glow = reduce ? .6 : Math.max(0, 1 - since / (TAU * .55));
      const [x, y] = P(b.a, R * b.r);
      if (glow > .02) {
        const rg = ctx.createRadialGradient(x, y, 0, x, y, 16);
        rg.addColorStop(0, `rgba(0,87,255,${.35 * glow})`); rg.addColorStop(1, "rgba(0,87,255,0)");
        ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(x, y, 16, 0, TAU); ctx.fill();
      }
      ctx.fillStyle = `rgba(0,87,255,${.25 + .75 * glow})`;
      ctx.beginPath(); ctx.arc(x, y, 3, 0, TAU); ctx.fill();
      ctx.fillStyle = `rgba(0,87,255,${.15 + .85 * glow})`;
      ctx.fillText(b.t, x, y - 11);
    });

    if (!reduce) requestAnimationFrame(frame);
  }
  size();
  addEventListener("resize", size);
  document.fonts && document.fonts.ready.then(size);
  requestAnimationFrame(frame);
})();
