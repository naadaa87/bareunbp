/**
 * 바른혈압 — Cloudflare Pages Functions API  (경로: /api/*)
 *
 * 필요한 설정 (Cloudflare Pages > Settings)
 *   - D1 바인딩     : DB
 *   - 비밀 변수     : ADMIN_KEY     (관리자 로그인 키, 필수)
 *   - 비밀 변수     : REVIEWER_KEY  (감수자 로그인 키, 선택)
 *
 * 데이터베이스 표는 첫 요청 때 자동으로 만들어지고, 새 버전에서 필요한 열도 자동으로 추가된다.
 * (schema.sql을 콘솔에 붙여넣는 과정은 선택 사항)
 *
 * 원칙: 혈압 값 등 개인 건강정보는 서버에 저장하지 않는다. 통계는 경로·날짜·이벤트 이름만 집계한다.
 */

const SCHEMA_VERSION = 3;
const JSON_HEADERS = { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" };
const SESSION_HOURS = 12;
const COOKIE = "bp_admin";

// ------------------------------------------------------------------ 공통
function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), { status, headers: { ...JSON_HEADERS, ...extra } });
}
function clean(v, max) {
  if (v === undefined || v === null) return "";
  return String(v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim().slice(0, max);
}
function cleanMulti(v, max) {
  if (v === undefined || v === null) return "";
  return String(v).replace(/\r\n?/g, "\n").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim().slice(0, max);
}
const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
const isPath = (s) => /^\/[A-Za-z0-9\-_/.#]*$/.test(s) && s.length <= 160;
const nowIso = () => new Date().toISOString();
const kstDay = (offsetDays = 0) => new Date(Date.now() + 9 * 3600e3 - offsetDays * 86400e3).toISOString().slice(0, 10);
const daysAgoIso = (d) => new Date(Date.now() - d * 86400e3).toISOString();

async function readBody(request) {
  try { return await request.json(); } catch (e) { return null; }
}
function b64url(buf) {
  let s = typeof buf === "string" ? btoa(unescape(encodeURIComponent(buf))) : btoa(String.fromCharCode(...new Uint8Array(buf)));
  return s.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function fromB64url(s) {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  return decodeURIComponent(escape(atob(s)));
}
async function hmac(secret, msg) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64url(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(msg)));
}
async function sha(s) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s + ":bareun"));
  return Array.from(new Uint8Array(buf)).slice(0, 8).map((b) => b.toString(16).padStart(2, "0")).join("");
}
async function safeEqual(a, b) {
  if (!a || !b) return false;
  const k = "cmp";
  return (await hmac(k, String(a))) === (await hmac(k, String(b)));
}
function getCookie(request, name) {
  const c = request.headers.get("Cookie") || "";
  const m = c.match(new RegExp("(?:^|;\\s*)" + name + "=([^;]+)"));
  return m ? m[1] : null;
}

// ------------------------------------------------------------------ 스키마 (자동 생성·갱신)
const TABLES = [
  `CREATE TABLE IF NOT EXISTS qna (id INTEGER PRIMARY KEY AUTOINCREMENT, created_at TEXT NOT NULL, nickname TEXT NOT NULL, category TEXT, question TEXT NOT NULL, answer TEXT, answered_at TEXT, status TEXT NOT NULL DEFAULT 'pending', ip_hash TEXT, ua TEXT)`,
  `CREATE TABLE IF NOT EXISTS leads (id INTEGER PRIMARY KEY AUTOINCREMENT, created_at TEXT NOT NULL, type TEXT NOT NULL, org TEXT, name TEXT, contact TEXT NOT NULL, message TEXT, ip_hash TEXT, ua TEXT)`,
  `CREATE TABLE IF NOT EXISTS newsletter (id INTEGER PRIMARY KEY AUTOINCREMENT, created_at TEXT NOT NULL, email TEXT NOT NULL UNIQUE, source TEXT, unsubscribed_at TEXT)`,
  `CREATE TABLE IF NOT EXISTS factcheck_reports (id INTEGER PRIMARY KEY AUTOINCREMENT, created_at TEXT NOT NULL, claim TEXT NOT NULL, source_url TEXT, contact TEXT, status TEXT NOT NULL DEFAULT 'pending', ip_hash TEXT)`,
  `CREATE TABLE IF NOT EXISTS rate_limits (id TEXT PRIMARY KEY, hits INTEGER NOT NULL DEFAULT 0)`,
  `CREATE TABLE IF NOT EXISTS content_reviews (id INTEGER PRIMARY KEY AUTOINCREMENT, path TEXT NOT NULL, title TEXT, reviewer_name TEXT NOT NULL, reviewer_title TEXT, reviewer_org TEXT, reviewed_at TEXT NOT NULL, result TEXT NOT NULL, note TEXT, name_public INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, created_by TEXT)`,
  `CREATE TABLE IF NOT EXISTS corrections (id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT NOT NULL, target_path TEXT, target_title TEXT, content TEXT NOT NULL, reason TEXT, created_at TEXT NOT NULL, created_by TEXT, updated_at TEXT)`,
  `CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT, updated_at TEXT, updated_by TEXT)`,
  `CREATE TABLE IF NOT EXISTS audit_log (id INTEGER PRIMARY KEY AUTOINCREMENT, ts TEXT NOT NULL, actor TEXT, role TEXT, action TEXT NOT NULL, target TEXT, detail TEXT)`,
  `CREATE TABLE IF NOT EXISTS stats_daily (day TEXT NOT NULL, kind TEXT NOT NULL, key TEXT NOT NULL, n INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (day, kind, key))`,
  `CREATE INDEX IF NOT EXISTS idx_qna_status ON qna(status, created_at)`,
  `CREATE INDEX IF NOT EXISTS idx_reviews_path ON content_reviews(path, reviewed_at)`,
  `CREATE INDEX IF NOT EXISTS idx_audit_ts ON audit_log(ts)`,
  `CREATE INDEX IF NOT EXISTS idx_stats_kind ON stats_daily(kind, day)`,
];
const COLUMNS = {
  qna: { updated_at: "TEXT", handled_by: "TEXT", question_original: "TEXT", review_note: "TEXT", reviewed_by: "TEXT", reviewed_at: "TEXT" },
  leads: { status: "TEXT DEFAULT 'new'", memo: "TEXT", updated_at: "TEXT", handled_by: "TEXT" },
  newsletter: { token: "TEXT" },
  factcheck_reports: { memo: "TEXT", published_url: "TEXT", updated_at: "TEXT", handled_by: "TEXT" },
  rate_limits: { bucket: "INTEGER" },
};
let migration = null;
async function ensureSchema(env) {
  if (!migration) {
    migration = (async () => {
      await env.DB.batch(TABLES.map((s) => env.DB.prepare(s)));
      for (const [table, cols] of Object.entries(COLUMNS)) {
        const { results } = await env.DB.prepare(`PRAGMA table_info(${table})`).all();
        const have = new Set(results.map((r) => r.name));
        for (const [col, type] of Object.entries(cols)) {
          if (!have.has(col)) await env.DB.prepare(`ALTER TABLE ${table} ADD COLUMN ${col} ${type}`).run();
        }
      }
      await env.DB.prepare("UPDATE leads SET status = 'new' WHERE status IS NULL").run();
      await env.DB.prepare("UPDATE newsletter SET token = lower(hex(randomblob(12))) WHERE token IS NULL").run();
      await env.DB.prepare("CREATE UNIQUE INDEX IF NOT EXISTS idx_newsletter_token ON newsletter(token)").run();
      await env.DB.prepare("INSERT INTO settings (key, value, updated_at) VALUES ('schema_version', ?1, ?2) ON CONFLICT(key) DO UPDATE SET value = excluded.value").bind(String(SCHEMA_VERSION), nowIso()).run();
    })().catch((e) => { migration = null; throw e; });
  }
  return migration;
}

// ------------------------------------------------------------------ 속도 제한
async function rateLimited(env, ip, key, limit, windowMin = 1) {
  try {
    const bucket = Math.floor(Date.now() / (60000 * windowMin));
    const id = `${key}:${ip}:${windowMin}:${bucket}`;
    await env.DB.prepare("INSERT INTO rate_limits (id, hits, bucket) VALUES (?1, 1, ?2) ON CONFLICT(id) DO UPDATE SET hits = hits + 1").bind(id, Math.floor(Date.now() / 60000)).run();
    const row = await env.DB.prepare("SELECT hits FROM rate_limits WHERE id = ?1").bind(id).first();
    return row && row.hits > limit;
  } catch (e) {
    return false;
  }
}
const hitThrottle = new Map();
function throttleHit(ip) {
  const t = Math.floor(Date.now() / 60000);
  const v = hitThrottle.get(ip);
  if (!v || v.t !== t) { hitThrottle.set(ip, { t, n: 1 }); if (hitThrottle.size > 5000) hitThrottle.clear(); return false; }
  v.n++;
  return v.n > 90;
}

// ------------------------------------------------------------------ 세션·권한
function sessionSecret(env) {
  return (env.SESSION_SECRET || "") + "|" + (env.ADMIN_KEY || "") + "|bareun-session-v1";
}
async function makeSession(env, role, name) {
  const payload = b64url(JSON.stringify({ r: role, n: name, e: Date.now() + SESSION_HOURS * 3600e3 }));
  return payload + "." + (await hmac(sessionSecret(env), payload));
}
async function readSession(env, request) {
  const tok = getCookie(request, COOKIE);
  if (!tok || !env.ADMIN_KEY) return null;
  const [payload, sig] = tok.split(".");
  if (!payload || !sig) return null;
  if (sig !== (await hmac(sessionSecret(env), payload))) return null;
  try {
    const s = JSON.parse(fromB64url(payload));
    if (!s.e || s.e < Date.now()) return null;
    if (s.r === "reviewer" && !env.REVIEWER_KEY) return null;
    return { role: s.r, name: s.n };
  } catch (e) {
    return null;
  }
}
function cookieHeader(value, maxAge) {
  return `${COOKIE}=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;
}
// 감수자(reviewer)가 쓸 수 있는 기능
const REVIEWER_OK = new Set(["me", "logout", "dashboard", "qna:list", "qna:review", "reviews:list", "reviews:create", "corrections:list"]);
function can(sess, perm) {
  if (!sess) return false;
  if (sess.role === "admin") return true;
  return sess.role === "reviewer" && REVIEWER_OK.has(perm);
}
async function audit(env, sess, action, target, detail) {
  try {
    await env.DB.prepare("INSERT INTO audit_log (ts, actor, role, action, target, detail) VALUES (?1, ?2, ?3, ?4, ?5, ?6)")
      .bind(nowIso(), sess ? sess.name : null, sess ? sess.role : null, action, target || null, detail ? String(detail).slice(0, 1000) : null).run();
  } catch (e) {}
}

// 답변 금칙어 — 편집 정책(VII장 표현 가이드)과 동일
const BANNED = ["완치", "치료합니다", "치료해", "치료 효과", "치료됩니다", "약을 끊", "약 끊", "끊으세요", "끊어도 됩니다", "줄이세요", "복용을 중단", "중단하세요", "드시면 됩니다", "처방합니다", "진단합니다", "진단됩니다", "발병위험", "사망위험", "위험도", "보장합니다", "100%", "특효", "특효약", "확실히 낮", "무조건"];
function bannedIn(text) {
  const t = String(text || "");
  return BANNED.filter((w) => t.indexOf(w) > -1);
}

// ------------------------------------------------------------------ 진입점
export async function onRequest(context) {
  const { request, env, params } = context;
  const path = (params.path || []).join("/");
  const method = request.method;
  const ip = request.headers.get("CF-Connecting-IP") || "0.0.0.0";
  const url = new URL(request.url);

  if (path === "health") {
    let ok = false;
    if (env.DB) { try { await ensureSchema(env); ok = true; } catch (e) {} }
    return json({ ok: true, db: !!env.DB, schema: ok, admin_key: !!env.ADMIN_KEY, time: nowIso() });
  }

  // ---------------------------------------------- 관리자
  if (path === "admin" || path.startsWith("admin/")) return admin(context, path.slice(6), method, ip, url);

  // ---------------------------------------------- 공개 GET
  if (method === "GET") {
    if (!env.DB) return json({ ok: false, error: "not_configured" }, 503);
    try { await ensureSchema(env); } catch (e) { return json({ ok: false, error: "db_error" }, 500); }

    if (path === "qna") {
      const { results } = await env.DB.prepare(
        "SELECT id, created_at, nickname, category, question, answer, answered_at, CASE WHEN reviewed_by IS NOT NULL THEN 1 ELSE 0 END AS reviewed FROM qna WHERE status = 'published' ORDER BY COALESCE(answered_at, created_at) DESC LIMIT 30"
      ).all();
      return json({ ok: true, items: results }, 200, { "Cache-Control": "public, max-age=60" });
    }
    if (path === "public") {
      const n = await env.DB.prepare("SELECT key, value FROM settings WHERE key IN ('notice_on','notice_text','notice_link')").all();
      const s = Object.fromEntries(n.results.map((r) => [r.key, r.value]));
      const { results } = await env.DB.prepare(
        "SELECT r.path, r.reviewer_name, r.reviewer_title, r.reviewer_org, r.reviewed_at FROM content_reviews r WHERE r.result = 'approved' AND r.name_public = 1 AND r.id = (SELECT r2.id FROM content_reviews r2 WHERE r2.path = r.path ORDER BY r2.reviewed_at DESC, r2.id DESC LIMIT 1)"
      ).all();
      const reviews = {};
      results.forEach((r) => { reviews[r.path] = { n: r.reviewer_name, t: r.reviewer_title || "", o: r.reviewer_org || "", d: r.reviewed_at }; });
      const notice = s.notice_on === "1" && s.notice_text ? { text: s.notice_text, link: s.notice_link || "" } : null;
      return json({ ok: true, notice, reviews }, 200, { "Cache-Control": "public, max-age=300" });
    }
    if (path === "corrections") {
      const { results } = await env.DB.prepare("SELECT id, date, target_path, target_title, content, reason FROM corrections ORDER BY date DESC, id DESC LIMIT 200").all();
      return json({ ok: true, items: results }, 200, { "Cache-Control": "public, max-age=300" });
    }
    if (path === "newsletter/unsubscribe") return unsubscribePage(env, url);
    return json({ ok: false, error: "unknown_endpoint" }, 404);
  }

  if (method !== "POST") return json({ ok: false, error: "method_not_allowed" }, 405);

  // ---------------------------------------------- 익명 방문 통계 (DB 없으면 조용히 무시)
  if (path === "hit") {
    if (!env.DB) return new Response(null, { status: 204 });
    const ua = request.headers.get("User-Agent") || "";
    if (/bot|crawl|spider|slurp|preview|headless|lighthouse|monitor/i.test(ua) || throttleHit(ip)) return new Response(null, { status: 204 });
    let b = null;
    try { b = JSON.parse(await request.text()); } catch (e) {}
    if (!b) return new Response(null, { status: 204 });
    try {
      await ensureSchema(env);
      await recordHit(env, b, url.host);
    } catch (e) {}
    return new Response(null, { status: 204 });
  }

  if (!env.DB) return json({ ok: false, error: "not_configured" }, 503);
  try { await ensureSchema(env); } catch (e) { return json({ ok: false, error: "db_error" }, 500); }

  const body = await readBody(request);
  if (!body) return json({ ok: false, error: "잘못된 요청입니다." }, 400);
  if (body.website) return json({ ok: true }); // honeypot

  const now = nowIso();
  const ua = clean(request.headers.get("User-Agent"), 200);

  try {
    if (path === "qna") {
      if (await rateLimited(env, ip, "qna", 5)) return json({ ok: false, error: "잠시 후 다시 시도해 주세요." }, 429);
      const nickname = clean(body.nickname, 20), category = clean(body.category, 20), topic = clean(body.topic, 40);
      const question = (topic ? "[" + topic + "] " : "") + cleanMulti(body.question, 600);
      if (!nickname || question.length < 5) return json({ ok: false, error: "닉네임과 질문을 확인해 주세요." }, 400);
      await env.DB.prepare("INSERT INTO qna (created_at, nickname, category, question, status, ip_hash, ua) VALUES (?1, ?2, ?3, ?4, 'pending', ?5, ?6)")
        .bind(now, nickname, category, question, await sha(ip), ua).run();
      return json({ ok: true });
    }
    if (path === "lead") {
      if (await rateLimited(env, ip, "lead", 5)) return json({ ok: false, error: "잠시 후 다시 시도해 주세요." }, 429);
      const type = clean(body.type, 20) || "other", org = clean(body.org, 100), name = clean(body.name, 50), contact = clean(body.contact, 100), message = cleanMulti(body.message, 2000);
      if (!contact) return json({ ok: false, error: "연락처를 입력해 주세요." }, 400);
      await env.DB.prepare("INSERT INTO leads (created_at, type, org, name, contact, message, ip_hash, ua, status) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, 'new')")
        .bind(now, type, org, name, contact, message, await sha(ip), ua).run();
      return json({ ok: true });
    }
    if (path === "newsletter") {
      if (await rateLimited(env, ip, "nl", 5)) return json({ ok: false, error: "잠시 후 다시 시도해 주세요." }, 429);
      const email = clean(body.email, 120).toLowerCase();
      if (!isEmail(email)) return json({ ok: false, error: "이메일 형식을 확인해 주세요." }, 400);
      await env.DB.prepare("INSERT INTO newsletter (created_at, email, source, token) VALUES (?1, ?2, ?3, lower(hex(randomblob(12)))) ON CONFLICT(email) DO UPDATE SET unsubscribed_at = NULL")
        .bind(now, email, clean(body.source, 50) || "site").run();
      return json({ ok: true });
    }
    if (path === "report") {
      if (await rateLimited(env, ip, "rep", 5)) return json({ ok: false, error: "잠시 후 다시 시도해 주세요." }, 429);
      const claim = cleanMulti(body.claim, 500), source_url = clean(body.source_url, 500), contact = clean(body.contact, 120);
      if (claim.length < 5) return json({ ok: false, error: "검증할 주장을 입력해 주세요." }, 400);
      await env.DB.prepare("INSERT INTO factcheck_reports (created_at, claim, source_url, contact, status, ip_hash) VALUES (?1, ?2, ?3, ?4, 'pending', ?5)")
        .bind(now, claim, source_url, contact, await sha(ip)).run();
      return json({ ok: true });
    }
    return json({ ok: false, error: "unknown_endpoint" }, 404);
  } catch (e) {
    return json({ ok: false, error: "db_error" }, 500);
  }
}

// ------------------------------------------------------------------ 통계 기록
const EVENTS = new Set(["record_saved", "quick_entry", "csv_export", "report_view", "report_print", "timer_start", "timer_done", "sodium_use", "meds_check", "reminder_ics", "backup_export", "backup_import", "challenge_done", "form_qna", "form_lead", "form_newsletter", "form_report", "search", "logsheet_print", "recipe_print", "mealplan_print"]);
async function recordHit(env, b, ownHost) {
  const day = kstDay();
  const stmts = [];
  const up = (kind, key) => stmts.push(env.DB.prepare("INSERT INTO stats_daily (day, kind, key, n) VALUES (?1, ?2, ?3, 1) ON CONFLICT(day, kind, key) DO UPDATE SET n = n + 1").bind(day, kind, key));
  let p = clean(b.p, 160).split("?")[0].split("#")[0].replace(/\/index\.html$/, "/").replace(/\.html$/, "");
  if (!p || !/^\/[A-Za-z0-9\-_/.]*$/.test(p) || p.startsWith("/admin") || p.startsWith("/api")) return;
  const ev = clean(b.e, 30);
  if (ev) {
    if (!EVENTS.has(ev)) return;
    up("event", ev);
    if (ev === "search") {
      const q = clean(b.q, 40).toLowerCase().replace(/\s+/g, " ");
      if (q.length >= 1) up("search", q);
    }
  } else {
    up("pv", p);
    up("pv_total", "all");
    const r = clean(b.r, 80).toLowerCase();
    if (r && /^[a-z0-9.\-]+$/.test(r) && r !== ownHost) up("ref", r.replace(/^www\./, "").replace(/^m\./, ""));
    if (b.n === 1) up("visitor", "new");
  }
  if (stmts.length) await env.DB.batch(stmts);
}

// ------------------------------------------------------------------ 수신거부 페이지
async function unsubscribePage(env, url) {
  const t = clean(url.searchParams.get("t"), 40);
  let ok = false;
  if (/^[a-f0-9]{24}$/.test(t)) {
    const r = await env.DB.prepare("UPDATE newsletter SET unsubscribed_at = COALESCE(unsubscribed_at, ?1) WHERE token = ?2").bind(nowIso(), t).run();
    ok = r.meta && r.meta.changes > 0;
  }
  const msg = ok ? "수신거부가 처리되었습니다. 앞으로 주간 혈압 레터를 보내지 않으며, 이메일 주소는 30일 이내 파기됩니다." : "링크가 올바르지 않거나 이미 처리되었습니다. 문제가 계속되면 spaceblank0100@gmail.com 으로 알려주세요.";
  const html = `<!DOCTYPE html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>수신거부 | 바른혈압</title><link rel="stylesheet" href="/assets/css/site.css"></head><body><main class="section"><div class="wrap wrap--narrow" style="text-align:center;padding:60px 24px"><img src="/assets/img/logo.png" alt="바른혈압" style="height:40px;margin:0 auto 24px"><h1 style="font-size:1.6rem">${ok ? "수신거부 완료" : "확인이 필요합니다"}</h1><p style="color:#5b6b7d">${msg}</p><p><a class="btn btn--secondary" href="/">바른혈압 홈으로</a></p></div></main></body></html>`;
  return new Response(html, { status: 200, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } });
}

// ------------------------------------------------------------------ 관리자 라우터
async function admin(context, sub, method, ip, url) {
  const { request, env } = context;

  // 로그인
  if (sub === "login" && method === "POST") {
    if (!env.ADMIN_KEY) return json({ ok: false, error: "no_admin_key" }, 503);
    if (!env.DB) return json({ ok: false, error: "not_configured" }, 503);
    try { await ensureSchema(env); } catch (e) { return json({ ok: false, error: "db_error", detail: String(e).slice(0, 200) }, 500); }
    // 실패한 시도만 센다: 10분 동안 8번 틀리면 잠시 막는다
    const failId = `loginfail:${await sha(ip)}:${Math.floor(Date.now() / 600000)}`;
    const fails = await env.DB.prepare("SELECT hits FROM rate_limits WHERE id = ?1").bind(failId).first();
    if (fails && fails.hits >= 8) return json({ ok: false, error: "로그인 시도가 너무 많습니다. 10분 뒤 다시 시도하세요." }, 429);
    const b = (await readBody(request)) || {};
    const key = clean(b.key, 200), name = clean(b.name, 20);
    if (!name) return json({ ok: false, error: "처리자 이름을 입력하세요." }, 400);
    let role = null;
    if (await safeEqual(key, env.ADMIN_KEY)) role = "admin";
    else if (env.REVIEWER_KEY && (await safeEqual(key, env.REVIEWER_KEY))) role = "reviewer";
    if (!role) {
      await env.DB.prepare("INSERT INTO rate_limits (id, hits, bucket) VALUES (?1, 1, ?2) ON CONFLICT(id) DO UPDATE SET hits = hits + 1").bind(failId, Math.floor(Date.now() / 60000)).run();
      await audit(env, { name: name || "?", role: "-" }, "login_failed", null, "ip " + (await sha(ip)));
      return json({ ok: false, error: "키가 올바르지 않습니다." }, 401);
    }
    const tok = await makeSession(env, role, name);
    await audit(env, { name, role }, "login", null, null);
    return json({ ok: true, role, name }, 200, { "Set-Cookie": cookieHeader(tok, SESSION_HOURS * 3600) });
  }
  if (sub === "logout") {
    return json({ ok: true }, 200, { "Set-Cookie": cookieHeader("", 0) });
  }

  // 인증: 서명된 세션 쿠키만 인정한다 (주소에 키를 붙이는 방식은 쓰지 않음)
  const sess = await readSession(env, request);
  if (!sess) return json({ ok: false, error: "unauthorized" }, 401);
  // 다른 사이트에서 보낸 요청 차단: 콘솔이 붙이는 헤더가 있어야 변경 요청을 받는다
  if (method === "POST" && request.headers.get("X-BP-Admin") !== "1") return json({ ok: false, error: "bad_request" }, 400);
  if (!env.DB) return json({ ok: false, error: "not_configured" }, 503);
  try { await ensureSchema(env); } catch (e) { return json({ ok: false, error: "db_error", detail: String(e).slice(0, 200) }, 500); }

  const db = env.DB;
  const deny = () => json({ ok: false, error: "forbidden", message: "이 기능은 관리자만 사용할 수 있습니다." }, 403);
  const body = method === "POST" ? (await readBody(request)) || {} : {};
  const q = (k, max = 60) => clean(url.searchParams.get(k), max);
  const lim = Math.min(200, Math.max(1, parseInt(url.searchParams.get("limit") || "50", 10)));
  const off = Math.max(0, parseInt(url.searchParams.get("offset") || "0", 10));
  const m = sub.match(/^([a-z]+)\/(\d+)(?:\/([a-z]+))?$/);
  const res = m ? m[1] : sub, id = m ? parseInt(m[2], 10) : null, act = m ? m[3] || "update" : null;

  try {
    // ---------------- 내 정보
    if (sub === "me") return json({ ok: true, role: sess.role, name: sess.name, reviewer_enabled: !!env.REVIEWER_KEY });

    // ---------------- 대시보드
    if (sub === "dashboard") {
      const d7 = kstDay(6), d14 = kstDay(13), d30 = kstDay(29), today = kstDay();
      const [counts, series, top, refs, searches, events, recentAudit, latestQ, latestL, reviewsLatest] = await db.batch([
        db.prepare(`SELECT
          (SELECT COUNT(*) FROM qna WHERE status = 'pending') AS qna_pending,
          (SELECT COUNT(*) FROM qna WHERE status = 'draft') AS qna_draft,
          (SELECT COUNT(*) FROM qna WHERE status = 'review') AS qna_review,
          (SELECT COUNT(*) FROM qna WHERE status = 'published') AS qna_published,
          (SELECT COUNT(*) FROM leads WHERE status = 'new') AS leads_new,
          (SELECT COUNT(*) FROM leads WHERE status IN ('contacted','progress')) AS leads_open,
          (SELECT COUNT(*) FROM newsletter WHERE unsubscribed_at IS NULL) AS nl_active,
          (SELECT COUNT(*) FROM newsletter WHERE unsubscribed_at IS NULL AND created_at >= ?1) AS nl_week,
          (SELECT COUNT(*) FROM factcheck_reports WHERE status IN ('pending','reviewing')) AS reports_open,
          (SELECT COUNT(*) FROM corrections) AS corrections`).bind(daysAgoIso(7)),
        db.prepare("SELECT day, SUM(n) AS n FROM stats_daily WHERE kind = 'pv_total' AND day >= ?1 GROUP BY day ORDER BY day").bind(d30),
        db.prepare("SELECT key, SUM(n) AS n FROM stats_daily WHERE kind = 'pv' AND day >= ?1 GROUP BY key ORDER BY n DESC LIMIT 12").bind(d7),
        db.prepare("SELECT key, SUM(n) AS n FROM stats_daily WHERE kind = 'ref' AND day >= ?1 GROUP BY key ORDER BY n DESC LIMIT 10").bind(d30),
        db.prepare("SELECT key, SUM(n) AS n FROM stats_daily WHERE kind = 'search' AND day >= ?1 GROUP BY key ORDER BY n DESC LIMIT 15").bind(d30),
        db.prepare("SELECT key, SUM(n) AS n FROM stats_daily WHERE kind = 'event' AND day >= ?1 GROUP BY key ORDER BY n DESC").bind(d30),
        db.prepare("SELECT ts, actor, role, action, target FROM audit_log ORDER BY id DESC LIMIT 8"),
        db.prepare("SELECT id, created_at, nickname, category, question FROM qna WHERE status = 'pending' ORDER BY id DESC LIMIT 5"),
        db.prepare("SELECT id, created_at, type, org, name FROM leads WHERE status = 'new' ORDER BY id DESC LIMIT 5"),
        db.prepare("SELECT r.path, r.result, r.reviewed_at FROM content_reviews r WHERE r.id = (SELECT r2.id FROM content_reviews r2 WHERE r2.path = r.path ORDER BY r2.reviewed_at DESC, r2.id DESC LIMIT 1)"),
      ]);
      // 오래된 속도제한 기록 정리 (가벼운 유지보수)
      context.waitUntil(db.prepare("DELETE FROM rate_limits WHERE bucket IS NULL OR bucket < ?1").bind(Math.floor(Date.now() / 60000) - 120).run().catch(() => {}));
      const s = counts.results[0];
      const sum = (rows, from) => rows.filter((r) => r.day >= from).reduce((a, r) => a + r.n, 0);
      return json({
        ok: true, today, counts: s,
        visits: { today: sum(series.results, today), d7: sum(series.results, d7), d30: sum(series.results, d30), series: series.results.filter((r) => r.day >= d14) },
        top: top.results, refs: refs.results, searches: searches.results, events: events.results,
        audit: recentAudit.results, latest_qna: latestQ.results, latest_leads: sess.role === "admin" ? latestL.results : [],
        reviews: reviewsLatest.results,
      });
    }

    // ---------------- Q&A
    if (res === "qna" && !id && method === "GET") {
      if (!can(sess, "qna:list")) return deny();
      const st = q("status", 20) || "pending", kw = q("q", 60), cat = q("cat", 20);
      const where = [], args = [];
      if (st !== "all") { where.push("status = ?"); args.push(st); }
      if (cat) { where.push("category = ?"); args.push(cat); }
      if (kw) { where.push("(question LIKE ? OR nickname LIKE ? OR answer LIKE ?)"); args.push(`%${kw}%`, `%${kw}%`, `%${kw}%`); }
      const w = where.length ? "WHERE " + where.join(" AND ") : "";
      const [items, total, tabs] = await db.batch([
        db.prepare(`SELECT id, created_at, nickname, category, question, question_original, answer, answered_at, status, review_note, reviewed_by, reviewed_at, handled_by, updated_at, (SELECT COUNT(*) FROM qna q2 WHERE q2.ip_hash = qna.ip_hash) AS same_ip FROM qna ${w} ORDER BY id DESC LIMIT ${lim} OFFSET ${off}`).bind(...args),
        db.prepare(`SELECT COUNT(*) AS n FROM qna ${w}`).bind(...args),
        db.prepare("SELECT status, COUNT(*) AS n FROM qna GROUP BY status"),
      ]);
      return json({ ok: true, items: items.results, total: total.results[0].n, tabs: Object.fromEntries(tabs.results.map((r) => [r.status, r.n])) });
    }
    if (res === "qna" && id && method === "POST") {
      const row = await db.prepare("SELECT * FROM qna WHERE id = ?1").bind(id).first();
      if (!row) return json({ ok: false, error: "not_found" }, 404);
      if (act === "review") {
        if (!can(sess, "qna:review")) return deny();
        const note = cleanMulti(body.review_note, 1000), approve = body.approve === true;
        if (approve) {
          if (!clean(row.answer, 10)) return json({ ok: false, error: "답변이 없는 글은 검토 완료할 수 없습니다." }, 400);
          await db.prepare("UPDATE qna SET review_note = ?1, reviewed_by = ?2, reviewed_at = ?3, updated_at = ?3 WHERE id = ?4").bind(note || null, sess.name, nowIso(), id).run();
        } else {
          await db.prepare("UPDATE qna SET review_note = ?1, reviewed_by = NULL, reviewed_at = NULL, status = CASE WHEN status = 'review' THEN 'draft' ELSE status END, updated_at = ?2 WHERE id = ?3").bind(note || null, nowIso(), id).run();
        }
        await audit(env, sess, approve ? "qna_review_ok" : "qna_review_back", "qna#" + id, note);
        return json({ ok: true });
      }
      if (sess.role !== "admin") return deny();
      if (act === "delete") {
        await db.prepare("DELETE FROM qna WHERE id = ?1").bind(id).run();
        await audit(env, sess, "qna_delete", "qna#" + id, row.question.slice(0, 200));
        return json({ ok: true });
      }
      const status = ["pending", "draft", "review", "published", "hidden"].includes(body.status) ? body.status : row.status;
      const answer = body.answer !== undefined ? cleanMulti(body.answer, 4000) : row.answer || "";
      const question = body.question !== undefined ? cleanMulti(body.question, 800) : row.question;
      const nickname = body.nickname !== undefined ? clean(body.nickname, 20) || row.nickname : row.nickname;
      const category = body.category !== undefined ? clean(body.category, 20) : row.category;
      if (!question) return json({ ok: false, error: "질문 내용이 비어 있습니다." }, 400);
      const isStory = category === "경험담";
      if (status === "published" && !answer && !isStory) return json({ ok: false, error: "답변이 없으면 게시할 수 없습니다. 경험담만 답변 없이 게시할 수 있습니다." }, 400);
      const hits = bannedIn(answer);
      if (status === "published" && hits.length && body.ack_terms !== true) return json({ ok: false, error: "banned_terms", terms: hits }, 409);
      const answerChanged = answer !== (row.answer || "");
      const qOrig = question !== row.question && !row.question_original ? row.question : row.question_original;
      const answeredAt = answer ? (answerChanged || !row.answered_at ? nowIso() : row.answered_at) : null;
      await db.prepare(`UPDATE qna SET question = ?1, question_original = ?2, nickname = ?3, category = ?4, answer = ?5, answered_at = ?6, status = ?7,
          reviewed_by = CASE WHEN ?8 = 1 THEN NULL ELSE reviewed_by END, reviewed_at = CASE WHEN ?8 = 1 THEN NULL ELSE reviewed_at END,
          handled_by = ?9, updated_at = ?10 WHERE id = ?11`)
        .bind(question, qOrig, nickname, category, answer || null, answeredAt, status, answerChanged ? 1 : 0, sess.name, nowIso(), id).run();
      const changes = [];
      if (status !== row.status) changes.push(`상태 ${row.status}→${status}`);
      if (answerChanged) changes.push("답변 수정");
      if (question !== row.question) changes.push("질문 수정(원문 보관)");
      await audit(env, sess, status === "published" && row.status !== "published" ? "qna_publish" : "qna_update", "qna#" + id, changes.join(", ") + (hits.length ? " / 표현 확인: " + hits.join(",") : ""));
      return json({ ok: true });
    }

    // ---------------- 문의·신청 (leads)
    if (res === "leads" && !id && method === "GET") {
      if (sess.role !== "admin") return deny();
      const st = q("status", 20) || "all", type = q("type", 20), kw = q("q", 60);
      const where = [], args = [];
      if (st !== "all") { where.push("status = ?"); args.push(st); }
      if (type) { where.push("type = ?"); args.push(type); }
      if (kw) { where.push("(org LIKE ? OR name LIKE ? OR contact LIKE ? OR message LIKE ? OR memo LIKE ?)"); args.push(...Array(5).fill(`%${kw}%`)); }
      const w = where.length ? "WHERE " + where.join(" AND ") : "";
      const [items, total, tabs] = await db.batch([
        db.prepare(`SELECT id, created_at, type, org, name, contact, message, status, memo, handled_by, updated_at FROM leads ${w} ORDER BY id DESC LIMIT ${lim} OFFSET ${off}`).bind(...args),
        db.prepare(`SELECT COUNT(*) AS n FROM leads ${w}`).bind(...args),
        db.prepare("SELECT status, COUNT(*) AS n FROM leads GROUP BY status"),
      ]);
      return json({ ok: true, items: items.results, total: total.results[0].n, tabs: Object.fromEntries(tabs.results.map((r) => [r.status, r.n])) });
    }
    if (res === "leads" && id && method === "POST") {
      if (sess.role !== "admin") return deny();
      const row = await db.prepare("SELECT * FROM leads WHERE id = ?1").bind(id).first();
      if (!row) return json({ ok: false, error: "not_found" }, 404);
      if (act === "delete") {
        await db.prepare("DELETE FROM leads WHERE id = ?1").bind(id).run();
        await audit(env, sess, "lead_delete", "lead#" + id, (row.org || row.name || "") + " 개인정보 파기");
        return json({ ok: true });
      }
      const status = ["new", "contacted", "progress", "done", "hold"].includes(body.status) ? body.status : row.status;
      const memo = body.memo !== undefined ? cleanMulti(body.memo, 2000) : row.memo;
      await db.prepare("UPDATE leads SET status = ?1, memo = ?2, handled_by = ?3, updated_at = ?4 WHERE id = ?5").bind(status, memo, sess.name, nowIso(), id).run();
      await audit(env, sess, "lead_update", "lead#" + id, status !== row.status ? `상태 ${row.status}→${status}` : "메모 수정");
      return json({ ok: true });
    }

    // ---------------- 구독자
    if (res === "newsletter" && !id && method === "GET") {
      if (sess.role !== "admin") return deny();
      const st = q("status", 20) || "active", kw = q("q", 60);
      const where = [], args = [];
      if (st === "active") where.push("unsubscribed_at IS NULL");
      if (st === "unsubscribed") where.push("unsubscribed_at IS NOT NULL");
      if (kw) { where.push("email LIKE ?"); args.push(`%${kw}%`); }
      const w = where.length ? "WHERE " + where.join(" AND ") : "";
      const all = url.searchParams.get("all") === "1";
      const [items, total, tabs] = await db.batch([
        db.prepare(`SELECT id, created_at, email, source, unsubscribed_at, token FROM newsletter ${w} ORDER BY id DESC ${all ? "" : `LIMIT ${lim} OFFSET ${off}`}`).bind(...args),
        db.prepare(`SELECT COUNT(*) AS n FROM newsletter ${w}`).bind(...args),
        db.prepare("SELECT SUM(CASE WHEN unsubscribed_at IS NULL THEN 1 ELSE 0 END) AS active, SUM(CASE WHEN unsubscribed_at IS NULL THEN 0 ELSE 1 END) AS unsubscribed FROM newsletter"),
      ]);
      const origin = url.origin;
      const list = items.results.map((r) => ({ ...r, unsub_url: `${origin}/api/newsletter/unsubscribe?t=${r.token}`, token: undefined }));
      if (all) await audit(env, sess, "newsletter_export", null, `${list.length}건 내보내기`);
      return json({ ok: true, items: list, total: total.results[0].n, tabs: tabs.results[0] });
    }
    if (res === "newsletter" && id && method === "POST") {
      if (sess.role !== "admin") return deny();
      const row = await db.prepare("SELECT * FROM newsletter WHERE id = ?1").bind(id).first();
      if (!row) return json({ ok: false, error: "not_found" }, 404);
      if (act === "delete") {
        await db.prepare("DELETE FROM newsletter WHERE id = ?1").bind(id).run();
        await audit(env, sess, "newsletter_delete", "nl#" + id, "구독자 개인정보 파기");
      } else if (body.action === "unsubscribe") {
        await db.prepare("UPDATE newsletter SET unsubscribed_at = ?1 WHERE id = ?2").bind(nowIso(), id).run();
        await audit(env, sess, "newsletter_unsubscribe", "nl#" + id, "관리자 수신거부 처리");
      } else if (body.action === "restore") {
        await db.prepare("UPDATE newsletter SET unsubscribed_at = NULL WHERE id = ?1").bind(id).run();
        await audit(env, sess, "newsletter_restore", "nl#" + id, "구독 복구");
      }
      return json({ ok: true });
    }

    // ---------------- 팩트체크 요청
    if (res === "reports" && !id && method === "GET") {
      if (sess.role !== "admin") return deny();
      const st = q("status", 20) || "open", kw = q("q", 60);
      const where = [], args = [];
      if (st === "open") where.push("status IN ('pending','reviewing')");
      else if (st !== "all") { where.push("status = ?"); args.push(st); }
      if (kw) { where.push("(claim LIKE ? OR memo LIKE ?)"); args.push(`%${kw}%`, `%${kw}%`); }
      const w = where.length ? "WHERE " + where.join(" AND ") : "";
      const [items, total, tabs] = await db.batch([
        db.prepare(`SELECT id, created_at, claim, source_url, contact, status, memo, published_url, handled_by, updated_at FROM factcheck_reports ${w} ORDER BY id DESC LIMIT ${lim} OFFSET ${off}`).bind(...args),
        db.prepare(`SELECT COUNT(*) AS n FROM factcheck_reports ${w}`).bind(...args),
        db.prepare("SELECT status, COUNT(*) AS n FROM factcheck_reports GROUP BY status"),
      ]);
      return json({ ok: true, items: items.results, total: total.results[0].n, tabs: Object.fromEntries(tabs.results.map((r) => [r.status, r.n])) });
    }
    if (res === "reports" && id && method === "POST") {
      if (sess.role !== "admin") return deny();
      const row = await db.prepare("SELECT * FROM factcheck_reports WHERE id = ?1").bind(id).first();
      if (!row) return json({ ok: false, error: "not_found" }, 404);
      if (act === "delete") {
        await db.prepare("DELETE FROM factcheck_reports WHERE id = ?1").bind(id).run();
        await audit(env, sess, "report_delete", "report#" + id, row.claim.slice(0, 200));
        return json({ ok: true });
      }
      const status = ["pending", "reviewing", "published", "rejected", "duplicate"].includes(body.status) ? body.status : row.status;
      const memo = body.memo !== undefined ? cleanMulti(body.memo, 2000) : row.memo;
      const pub = body.published_url !== undefined ? clean(body.published_url, 200) : row.published_url;
      if (pub && !isPath(pub) && !/^https:\/\//.test(pub)) return json({ ok: false, error: "발행 주소는 /factcheck/... 형식으로 입력하세요." }, 400);
      await db.prepare("UPDATE factcheck_reports SET status = ?1, memo = ?2, published_url = ?3, handled_by = ?4, updated_at = ?5 WHERE id = ?6").bind(status, memo, pub || null, sess.name, nowIso(), id).run();
      await audit(env, sess, "report_update", "report#" + id, status !== row.status ? `상태 ${row.status}→${status}` : "메모 수정");
      return json({ ok: true });
    }

    // ---------------- 콘텐츠 감수 기록
    if (res === "reviews" && !id && method === "GET") {
      if (!can(sess, "reviews:list")) return deny();
      const { results } = await db.prepare("SELECT * FROM content_reviews ORDER BY reviewed_at DESC, id DESC LIMIT 1000").all();
      return json({ ok: true, items: results });
    }
    if (res === "reviews" && !id && method === "POST") {
      if (!can(sess, "reviews:create")) return deny();
      const p = clean(body.path, 160), name = clean(body.reviewer_name, 40), result = body.result === "approved" ? "approved" : body.result === "revise" ? "revise" : null;
      const date = clean(body.reviewed_at, 10);
      if (!isPath(p)) return json({ ok: false, error: "콘텐츠를 선택하세요." }, 400);
      if (!name) return json({ ok: false, error: "감수자 이름을 입력하세요." }, 400);
      if (!result) return json({ ok: false, error: "감수 결과를 선택하세요." }, 400);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date > kstDay()) return json({ ok: false, error: "감수일을 확인하세요(미래 날짜 불가)." }, 400);
      const title = clean(body.reviewer_title, 40);
      if (result === "approved" && !title) return json({ ok: false, error: "승인 기록에는 감수자 자격(예: 내과 전문의)이 필요합니다." }, 400);
      const pub = body.name_public === true && result === "approved" ? 1 : 0;
      await db.prepare("INSERT INTO content_reviews (path, title, reviewer_name, reviewer_title, reviewer_org, reviewed_at, result, note, name_public, created_at, created_by) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11)")
        .bind(p, clean(body.title, 160), name, title, clean(body.reviewer_org, 60), date, result, cleanMulti(body.note, 2000), pub, nowIso(), sess.name).run();
      await audit(env, sess, result === "approved" ? "review_approve" : "review_revise", p, `${name}${title ? " (" + title + ")" : ""}${pub ? " · 실명 공개" : ""}`);
      return json({ ok: true });
    }
    if (res === "reviews" && id && act === "delete" && method === "POST") {
      if (sess.role !== "admin") return deny();
      const row = await db.prepare("SELECT * FROM content_reviews WHERE id = ?1").bind(id).first();
      if (!row) return json({ ok: false, error: "not_found" }, 404);
      await db.prepare("DELETE FROM content_reviews WHERE id = ?1").bind(id).run();
      await audit(env, sess, "review_delete", row.path, `${row.reviewer_name} ${row.reviewed_at} ${row.result} 기록 삭제`);
      return json({ ok: true });
    }

    // ---------------- 정정 이력
    if (res === "corrections" && !id && method === "GET") {
      if (!can(sess, "corrections:list")) return deny();
      const { results } = await db.prepare("SELECT * FROM corrections ORDER BY date DESC, id DESC LIMIT 500").all();
      return json({ ok: true, items: results });
    }
    if (res === "corrections" && method === "POST") {
      if (sess.role !== "admin") return deny();
      const date = clean(body.date, 10), content = cleanMulti(body.content, 1000), reason = clean(body.reason, 200);
      const tp = clean(body.target_path, 160), tt = clean(body.target_title, 160);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return json({ ok: false, error: "날짜를 확인하세요." }, 400);
      if (content.length < 5) return json({ ok: false, error: "정정 내용을 입력하세요." }, 400);
      if (tp && !isPath(tp)) return json({ ok: false, error: "대상 주소 형식을 확인하세요." }, 400);
      if (id) {
        const row = await db.prepare("SELECT * FROM corrections WHERE id = ?1").bind(id).first();
        if (!row) return json({ ok: false, error: "not_found" }, 404);
        await db.prepare("UPDATE corrections SET date = ?1, target_path = ?2, target_title = ?3, content = ?4, reason = ?5, updated_at = ?6 WHERE id = ?7").bind(date, tp || null, tt || null, content, reason, nowIso(), id).run();
        await audit(env, sess, "correction_edit", "correction#" + id, "수정 전: " + row.content.slice(0, 300));
      } else {
        await db.prepare("INSERT INTO corrections (date, target_path, target_title, content, reason, created_at, created_by) VALUES (?1,?2,?3,?4,?5,?6,?7)").bind(date, tp || null, tt || null, content, reason, nowIso(), sess.name).run();
        await audit(env, sess, "correction_add", tp || null, content.slice(0, 200));
      }
      return json({ ok: true });
    }

    // ---------------- 사이트 설정 (공지 배너)
    if (sub === "settings" && method === "GET") {
      if (sess.role !== "admin") return deny();
      const { results } = await db.prepare("SELECT key, value, updated_at, updated_by FROM settings").all();
      return json({ ok: true, items: Object.fromEntries(results.map((r) => [r.key, r])) });
    }
    if (sub === "settings" && method === "POST") {
      if (sess.role !== "admin") return deny();
      const vals = { notice_on: body.notice_on ? "1" : "0", notice_text: clean(body.notice_text, 140), notice_link: clean(body.notice_link, 200) };
      if (vals.notice_link && !isPath(vals.notice_link) && !/^https:\/\//.test(vals.notice_link)) return json({ ok: false, error: "링크는 /로 시작하는 사이트 주소 또는 https:// 주소만 가능합니다." }, 400);
      if (vals.notice_on === "1" && !vals.notice_text) return json({ ok: false, error: "공지 문구를 입력하세요." }, 400);
      const now = nowIso();
      await db.batch(Object.entries(vals).map(([k, v]) => db.prepare("INSERT INTO settings (key, value, updated_at, updated_by) VALUES (?1, ?2, ?3, ?4) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at, updated_by = excluded.updated_by").bind(k, v, now, sess.name)));
      await audit(env, sess, "settings_notice", null, vals.notice_on === "1" ? "공지 켜기: " + vals.notice_text : "공지 끄기");
      return json({ ok: true });
    }

    // ---------------- 활동 기록
    if (sub === "audit" && method === "GET") {
      if (sess.role !== "admin") return deny();
      const kw = q("q", 60);
      const w = kw ? "WHERE action LIKE ?1 OR target LIKE ?1 OR detail LIKE ?1 OR actor LIKE ?1" : "";
      const stmt = db.prepare(`SELECT * FROM audit_log ${w} ORDER BY id DESC LIMIT ${lim} OFFSET ${off}`);
      const { results } = kw ? await stmt.bind(`%${kw}%`).all() : await stmt.all();
      return json({ ok: true, items: results });
    }

    // ---------------- 시스템
    if (sub === "system" && method === "GET") {
      if (sess.role !== "admin") return deny();
      const t = await db.prepare(`SELECT
        (SELECT COUNT(*) FROM qna) AS qna, (SELECT COUNT(*) FROM leads) AS leads, (SELECT COUNT(*) FROM newsletter) AS newsletter,
        (SELECT COUNT(*) FROM factcheck_reports) AS factcheck_reports, (SELECT COUNT(*) FROM content_reviews) AS content_reviews,
        (SELECT COUNT(*) FROM corrections) AS corrections, (SELECT COUNT(*) FROM audit_log) AS audit_log,
        (SELECT COUNT(*) FROM stats_daily) AS stats_daily, (SELECT COUNT(*) FROM rate_limits) AS rate_limits,
        (SELECT MIN(day) FROM stats_daily) AS stats_from`).first();
      const purgeable = await db.prepare(`SELECT
        (SELECT COUNT(*) FROM leads WHERE status IN ('done','hold') AND COALESCE(updated_at, created_at) < ?1) AS leads,
        (SELECT COUNT(*) FROM factcheck_reports WHERE status IN ('published','rejected','duplicate') AND COALESCE(updated_at, created_at) < ?1) AS reports,
        (SELECT COUNT(*) FROM newsletter WHERE unsubscribed_at IS NOT NULL AND unsubscribed_at < ?2) AS newsletter,
        (SELECT COUNT(*) FROM stats_daily WHERE day < ?3) AS stats`).bind(daysAgoIso(365), daysAgoIso(30), kstDay(400)).first();
      return json({ ok: true, db: true, schema_version: SCHEMA_VERSION, keys: { admin: !!env.ADMIN_KEY, reviewer: !!env.REVIEWER_KEY }, tables: t, purgeable, now: nowIso() });
    }
    if (sub === "purge" && method === "POST") {
      if (sess.role !== "admin") return deny();
      const r = await db.batch([
        db.prepare("DELETE FROM leads WHERE status IN ('done','hold') AND COALESCE(updated_at, created_at) < ?1").bind(daysAgoIso(365)),
        db.prepare("DELETE FROM factcheck_reports WHERE status IN ('published','rejected','duplicate') AND COALESCE(updated_at, created_at) < ?1").bind(daysAgoIso(365)),
        db.prepare("DELETE FROM newsletter WHERE unsubscribed_at IS NOT NULL AND unsubscribed_at < ?1").bind(daysAgoIso(30)),
        db.prepare("DELETE FROM stats_daily WHERE day < ?1").bind(kstDay(400)),
        db.prepare("DELETE FROM rate_limits WHERE bucket IS NULL OR bucket < ?1").bind(Math.floor(Date.now() / 60000) - 120),
      ]);
      const n = r.map((x) => (x.meta && x.meta.changes) || 0);
      const detail = `문의 ${n[0]} · 팩트체크 요청 ${n[1]} · 수신거부 구독자 ${n[2]} · 오래된 통계 ${n[3]}`;
      await audit(env, sess, "purge", null, detail);
      return json({ ok: true, deleted: { leads: n[0], reports: n[1], newsletter: n[2], stats: n[3], rate_limits: n[4] }, detail });
    }
    if (sub === "export" && method === "GET") {
      if (sess.role !== "admin") return deny();
      const names = ["qna", "leads", "newsletter", "factcheck_reports", "content_reviews", "corrections", "settings", "audit_log", "stats_daily"];
      const out = { app: "bareunbp", exported_at: nowIso(), schema_version: SCHEMA_VERSION, tables: {} };
      const rs = await db.batch(names.map((n) => db.prepare(`SELECT * FROM ${n}`)));
      names.forEach((n, i) => { out.tables[n] = rs[i].results; });
      await audit(env, sess, "export_all", null, "전체 데이터 백업 내려받기");
      return new Response(JSON.stringify(out, null, 1), { status: 200, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "Content-Disposition": `attachment; filename="bareunbp-backup-${kstDay()}.json"` } });
    }

    return json({ ok: false, error: "unknown_endpoint" }, 404);
  } catch (e) {
    return json({ ok: false, error: "db_error", detail: String(e && e.message ? e.message : e).slice(0, 300) }, 500);
  }
}
