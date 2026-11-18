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
 * 원칙
 *   - 혈압 값 등 개인 건강정보는 서버에 저장하지 않는다. 회원 계정에도 연결하지 않는다.
 *   - 통계는 경로·날짜·이벤트 이름만 집계한다. (방문자·체류시간도 브라우저가 보낸 '처음 여부'·'초' 값을 날짜별로 더할 뿐, 식별자를 받지 않는다)
 *   - 바른혈압몰 상품 링크는 쿠팡 파트너스 단축 주소만 받는다.
 *   - 회원 비밀번호는 브라우저에서 PBKDF2로 늘린 값만 받아, 서버에서 회원별 소금값으로 한 번 더 해시해 저장한다.
 */

const SCHEMA_VERSION = 5;
const KPI_SINCE = "2026-11-18"; // 방문자·세션·체류·몰 지표 집계 시작일 (KST)
const USER_COOKIE = "bp_user";
const USER_SESSION_DAYS = 30;
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
  // ---- 회원·저장·자유게시판 (v4)
  `CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL UNIQUE, nickname TEXT, email TEXT, pw_hash TEXT, pw_salt TEXT, pw_ver INTEGER NOT NULL DEFAULT 1, recovery_hash TEXT, created_at TEXT NOT NULL, last_login_at TEXT, status TEXT NOT NULL DEFAULT 'active', session_ver INTEGER NOT NULL DEFAULT 1, must_change_pw INTEGER NOT NULL DEFAULT 0, agreed_at TEXT, memo TEXT, updated_at TEXT, handled_by TEXT)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_users_nickname ON users(nickname)`,
  `CREATE TABLE IF NOT EXISTS app_secrets (key TEXT PRIMARY KEY, value TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS bookmarks (user_id INTEGER NOT NULL, key TEXT NOT NULL, title TEXT, created_at TEXT NOT NULL, PRIMARY KEY (user_id, key))`,
  `CREATE TABLE IF NOT EXISTS posts (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, author_label TEXT, category TEXT NOT NULL, title TEXT NOT NULL, body TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT, status TEXT NOT NULL DEFAULT 'visible', pinned INTEGER NOT NULL DEFAULT 0, views INTEGER NOT NULL DEFAULT 0, like_count INTEGER NOT NULL DEFAULT 0, comment_count INTEGER NOT NULL DEFAULT 0, report_count INTEGER NOT NULL DEFAULT 0, hidden_reason TEXT, handled_by TEXT, ip_hash TEXT)`,
  `CREATE INDEX IF NOT EXISTS idx_posts_list ON posts(status, pinned, id)`,
  `CREATE INDEX IF NOT EXISTS idx_posts_user ON posts(user_id)`,
  `CREATE TABLE IF NOT EXISTS comments (id INTEGER PRIMARY KEY AUTOINCREMENT, post_id INTEGER NOT NULL, user_id INTEGER, body TEXT NOT NULL, created_at TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'visible', report_count INTEGER NOT NULL DEFAULT 0, hidden_reason TEXT, handled_by TEXT, ip_hash TEXT)`,
  `CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id, id)`,
  `CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id)`,
  `CREATE TABLE IF NOT EXISTS post_likes (post_id INTEGER NOT NULL, user_id INTEGER NOT NULL, created_at TEXT NOT NULL, PRIMARY KEY (post_id, user_id))`,
  `CREATE TABLE IF NOT EXISTS ugc_reports (id INTEGER PRIMARY KEY AUTOINCREMENT, target_type TEXT NOT NULL, target_id INTEGER NOT NULL, user_id INTEGER NOT NULL, reason TEXT NOT NULL, detail TEXT, created_at TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'open', handled_by TEXT, handled_at TEXT, UNIQUE (target_type, target_id, user_id))`,
  `CREATE TABLE IF NOT EXISTS videos (id INTEGER PRIMARY KEY AUTOINCREMENT, youtube_id TEXT NOT NULL, title TEXT NOT NULL, source TEXT, category TEXT, note TEXT, status TEXT NOT NULL DEFAULT 'visible', sort INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, created_by TEXT)`,
  `CREATE TABLE IF NOT EXISTS mall_items (id INTEGER PRIMARY KEY AUTOINCREMENT, pid TEXT NOT NULL, cat TEXT NOT NULL, name TEXT NOT NULL, url TEXT NOT NULL, img TEXT, note TEXT, status TEXT NOT NULL DEFAULT 'visible', sort INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, created_by TEXT)`,
  `CREATE TABLE IF NOT EXISTS mall_reports (month TEXT PRIMARY KEY, clicks INTEGER, orders INTEGER, cancels INTEGER, gmv INTEGER, commission INTEGER, memo TEXT, updated_at TEXT, updated_by TEXT)`,
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
    const id = `${key}:${await sha(String(ip))}:${windowMin}:${bucket}`;
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

  // ---------------------------------------------- 회원·저장·자유게시판·영상
  if (/^(auth|bookmarks|board)(\/|$)/.test(path) || path === "videos") return member(context, path, method, ip, url);

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
    if (path === "mall") {
      const [items, hid] = await env.DB.batch([
        env.DB.prepare("SELECT pid, cat, name, url, img, note FROM mall_items WHERE status = 'visible' ORDER BY sort DESC, id DESC LIMIT 200"),
        env.DB.prepare("SELECT value FROM settings WHERE key = 'mall_hidden'"),
      ]);
      let hidden = [];
      try { hidden = JSON.parse((hid.results[0] || {}).value || "[]"); } catch (e) {}
      return json({ ok: true, items: items.results, hidden }, 200, { "Cache-Control": "public, max-age=300" });
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
const EVENTS = new Set(["share", "save", "video_play", "record_saved", "quick_entry", "csv_export", "report_view", "report_print", "timer_start", "timer_done", "sodium_use", "meds_check", "reminder_ics", "backup_export", "backup_import", "challenge_done", "form_qna", "form_lead", "form_newsletter", "form_report", "search", "logsheet_print", "recipe_print", "mealplan_print", "mall_click", "mall_view", "mall_box", "out", "cta"]);
// 유입 경로 분류 (방문이 시작될 때 한 번)
const SOURCES = [
  [/(^|\.)(chatgpt\.com|openai\.com|perplexity\.ai|claude\.ai|gemini\.google\.com|copilot\.microsoft\.com)$/, "ai"],
  [/^(m\.)?search\.naver\.com$/, "naver"],
  [/(^|\.)google\.[a-z.]+$/, "google"],
  [/(^|\.)daum\.net$/, "daum"],
  [/(^|\.)bing\.com$/, "bing"],
  [/(^|\.)(naver\.com|naver\.me)$/, "naver_etc"],
  [/(^|\.)band\.us$/, "band"],
  [/(^|\.)(kakao\.com|kakaocdn\.net)$/, "kakao"],
  [/(^|\.)(facebook\.com|fb\.com)$/, "facebook"],
  [/(^|\.)instagram\.com$/, "instagram"],
  [/(^|\.)(youtube\.com|youtu\.be)$/, "youtube"],
  [/(^|\.)(x\.com|twitter\.com|t\.co)$/, "x"],
  [/(^|\.)threads\.(net|com)$/, "threads"],
];
function sourceOf(host) {
  if (!host) return "direct";
  for (const [re, k] of SOURCES) if (re.test(host)) return k;
  return "other";
}
async function recordHit(env, b, ownHost) {
  const day = kstDay();
  const stmts = [];
  const add = (kind, key, v) => stmts.push(env.DB.prepare("INSERT INTO stats_daily (day, kind, key, n) VALUES (?1, ?2, ?3, ?4) ON CONFLICT(day, kind, key) DO UPDATE SET n = n + ?4").bind(day, kind, key, v));
  const up = (kind, key) => add(kind, key, 1);
  let p = clean(b.p, 160).split("?")[0].split("#")[0].replace(/\/index\.html$/, "/").replace(/\.html$/, "");
  if (!p || !/^\/[A-Za-z0-9\-_/.]*$/.test(p) || p.startsWith("/admin") || p.startsWith("/api")) return;
  const ev = clean(b.e, 30);
  if (ev === "_t") {
    // 머문 시간(초, 화면에 보인 시간만)과 스크롤 정도(%)
    const t = Math.max(0, Math.min(1800, parseInt(b.t, 10) || 0)), sc = Math.max(0, Math.min(100, parseInt(b.sc, 10) || 0));
    if (t < 1) return;
    add("tsum", p, t);
    up("tcnt", p);
    if (t >= 10) up("eng", p);
    if (sc >= 75 && t >= 15) up("read", p);
  } else if (ev) {
    if (!EVENTS.has(ev)) return;
    up("event", ev);
    const k = clean(b.k, 40);
    if (ev === "search") {
      const qq = clean(b.q, 40).toLowerCase().replace(/\s+/g, " ");
      if (qq.length >= 1) up("search", qq);
    } else if (ev === "mall_click") {
      if (/^[A-Za-z0-9_-]{1,30}$/.test(k)) { up("mall_click", k); up("mall_click_page", p); }
    } else if (ev === "mall_view") {
      const ids = Array.isArray(b.ids) ? b.ids.slice(0, 40) : [];
      for (const i of ids) { const v = clean(String(i), 30); if (/^[A-Za-z0-9_-]{1,30}$/.test(v)) up("mall_imp", v); }
    } else if (ev === "mall_box") {
      up("mall_box", p);
    } else if (ev === "out") {
      const h = k.toLowerCase();
      if (/^[a-z0-9.-]{3,60}$/.test(h)) up("out", h);
    } else if (ev === "cta") {
      const l = k.replace(/[<>"'`\\]/g, "").trim();
      if (l) up("cta", (p + " ▸ " + l).slice(0, 160));
    } else {
      up("ev_p", ev + "|" + p);
    }
  } else {
    up("pv", p);
    up("pv_total", "all");
    const r = clean(b.r, 80).toLowerCase();
    const ext = r && /^[a-z0-9.\-]+$/.test(r) && r !== ownHost ? r : "";
    if (ext) up("ref", ext.replace(/^www\./, "").replace(/^m\./, ""));
    if (b.n === 1) up("visitor", "new");
    if (b.v === 1) up("uv", "all");
    if (b.u === 1) up("upv", p);
    if (b.s === 1) {
      up("session", "all");
      up("src", sourceOf(ext));
      up("device", b.d === "m" ? "mobile" : "desktop");
      up("land", p);
    }
    if (b.s2 === 1) up("session2", "all");
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
          (SELECT COUNT(*) FROM corrections) AS corrections,
          (SELECT COUNT(*) FROM users WHERE status != 'deleted') AS members,
          (SELECT COUNT(*) FROM users WHERE status != 'deleted' AND created_at >= ?1) AS members_week,
          (SELECT COUNT(*) FROM posts WHERE status = 'visible') AS posts,
          (SELECT COUNT(*) FROM posts WHERE status != 'deleted' AND created_at >= ?1) AS posts_week,
          (SELECT COUNT(*) FROM comments WHERE status != 'deleted' AND created_at >= ?1) AS comments_week,
          (SELECT COUNT(*) FROM posts WHERE status = 'hidden') + (SELECT COUNT(*) FROM comments WHERE status = 'hidden') AS ugc_hidden,
          (SELECT COUNT(DISTINCT target_type || ':' || target_id) FROM ugc_reports WHERE status = 'open') AS ugc_reports_open`).bind(daysAgoIso(7)),
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
        (SELECT COUNT(*) FROM users WHERE status != 'deleted') AS users, (SELECT COUNT(*) FROM posts WHERE status != 'deleted') AS posts,
        (SELECT COUNT(*) FROM comments WHERE status != 'deleted') AS comments, (SELECT COUNT(*) FROM bookmarks) AS bookmarks,
        (SELECT COUNT(*) FROM ugc_reports) AS ugc_reports, (SELECT COUNT(*) FROM videos) AS videos,
        (SELECT COUNT(*) FROM mall_items) AS mall_items, (SELECT COUNT(*) FROM mall_reports) AS mall_reports,
        (SELECT MIN(day) FROM stats_daily) AS stats_from`).first();
      const purgeable = await db.prepare(`SELECT
        (SELECT COUNT(*) FROM leads WHERE status IN ('done','hold') AND COALESCE(updated_at, created_at) < ?1) AS leads,
        (SELECT COUNT(*) FROM factcheck_reports WHERE status IN ('published','rejected','duplicate') AND COALESCE(updated_at, created_at) < ?1) AS reports,
        (SELECT COUNT(*) FROM newsletter WHERE unsubscribed_at IS NOT NULL AND unsubscribed_at < ?2) AS newsletter,
        (SELECT COUNT(*) FROM stats_daily WHERE day < ?3) AS stats,
        (SELECT COUNT(*) FROM posts WHERE status = 'deleted' AND COALESCE(updated_at, created_at) < ?2) + (SELECT COUNT(*) FROM comments WHERE status = 'deleted' AND created_at < ?2) AS ugc,
        (SELECT COUNT(*) FROM ugc_reports WHERE status = 'resolved' AND COALESCE(handled_at, created_at) < ?1) AS ugc_reports`).bind(daysAgoIso(365), daysAgoIso(30), kstDay(400)).first();
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
        // 회원이 삭제한 글·댓글은 30일 뒤 완전히 지운다 (딸린 댓글·공감·신고 포함)
        db.prepare("DELETE FROM comments WHERE post_id IN (SELECT id FROM posts WHERE status = 'deleted' AND COALESCE(updated_at, created_at) < ?1)").bind(daysAgoIso(30)),
        db.prepare("DELETE FROM post_likes WHERE post_id IN (SELECT id FROM posts WHERE status = 'deleted' AND COALESCE(updated_at, created_at) < ?1)").bind(daysAgoIso(30)),
        db.prepare("DELETE FROM posts WHERE status = 'deleted' AND COALESCE(updated_at, created_at) < ?1").bind(daysAgoIso(30)),
        db.prepare("DELETE FROM comments WHERE status = 'deleted' AND created_at < ?1").bind(daysAgoIso(30)),
        db.prepare("DELETE FROM ugc_reports WHERE status = 'resolved' AND COALESCE(handled_at, created_at) < ?1").bind(daysAgoIso(365)),
      ]);
      const n = r.map((x) => (x.meta && x.meta.changes) || 0);
      const ugc = n[7] + n[8];
      const detail = `문의 ${n[0]} · 팩트체크 요청 ${n[1]} · 수신거부 구독자 ${n[2]} · 오래된 통계 ${n[3]} · 삭제된 글·댓글 ${ugc} · 처리된 신고 ${n[9]}`;
      await audit(env, sess, "purge", null, detail);
      return json({ ok: true, deleted: { leads: n[0], reports: n[1], newsletter: n[2], stats: n[3], rate_limits: n[4], ugc, ugc_reports: n[9] }, detail });
    }
    if (sub === "export" && method === "GET") {
      if (sess.role !== "admin") return deny();
      const names = ["qna", "leads", "newsletter", "factcheck_reports", "content_reviews", "corrections", "settings", "audit_log", "stats_daily", "posts", "comments", "post_likes", "bookmarks", "ugc_reports", "videos", "mall_items", "mall_reports"];
      const out = { app: "bareunbp", exported_at: nowIso(), schema_version: SCHEMA_VERSION, tables: {} };
      const rs = await db.batch(names.map((n) => db.prepare(`SELECT * FROM ${n}`)));
      names.forEach((n, i) => { out.tables[n] = rs[i].results; });
      // 회원 표는 비밀번호·복구 코드 해시를 빼고 내보낸다
      out.tables.users = (await db.prepare("SELECT id, username, nickname, email, created_at, last_login_at, status, agreed_at, memo FROM users").all()).results;
      await audit(env, sess, "export_all", null, "전체 데이터 백업 내려받기");
      return new Response(JSON.stringify(out, null, 1), { status: 200, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "Content-Disposition": `attachment; filename="bareunbp-backup-${kstDay()}.json"` } });
    }

    // ---------------- 회원 관리
    if (res === "members" && !id && method === "GET") {
      if (sess.role !== "admin") return deny();
      const st = q("status", 20) || "current", kw = q("q", 60);
      const where = [], args = [];
      if (st === "current") where.push("u.status != 'deleted'");
      else if (st !== "all") { where.push("u.status = ?"); args.push(st); }
      if (kw) { where.push("(u.username LIKE ? OR u.nickname LIKE ? OR u.email LIKE ? OR u.memo LIKE ?)"); args.push(...Array(4).fill(`%${kw}%`)); }
      const w = where.length ? "WHERE " + where.join(" AND ") : "";
      const [items, total, tabs] = await db.batch([
        db.prepare(`SELECT u.id, u.username, u.nickname, u.email, u.created_at, u.last_login_at, u.status, u.memo, u.must_change_pw, u.handled_by, u.updated_at,
          (SELECT COUNT(*) FROM posts p WHERE p.user_id = u.id AND p.status != 'deleted') AS posts,
          (SELECT COUNT(*) FROM comments c WHERE c.user_id = u.id AND c.status != 'deleted') AS comments,
          (SELECT COUNT(*) FROM posts p WHERE p.user_id = u.id AND p.status = 'hidden') + (SELECT COUNT(*) FROM comments c WHERE c.user_id = u.id AND c.status = 'hidden') AS hidden
          FROM users u ${w} ORDER BY u.id DESC LIMIT ${lim} OFFSET ${off}`).bind(...args),
        db.prepare(`SELECT COUNT(*) AS n FROM users u ${w}`).bind(...args),
        db.prepare("SELECT status, COUNT(*) AS n FROM users GROUP BY status"),
      ]);
      return json({ ok: true, items: items.results, total: total.results[0].n, tabs: Object.fromEntries(tabs.results.map((r) => [r.status, r.n])) });
    }
    if (res === "members" && id && method === "POST") {
      if (sess.role !== "admin") return deny();
      const row = await db.prepare("SELECT * FROM users WHERE id = ?1").bind(id).first();
      if (!row) return json({ ok: false, error: "not_found" }, 404);
      if (row.status === "deleted") return json({ ok: false, error: "이미 탈퇴 처리된 계정입니다." }, 400);
      if (act === "temppw") {
        // 임시 비밀번호: 콘솔(브라우저)에서 만든 값을 받아 저장하고, 기존 로그인은 모두 끊는다
        if (!isProof(body.proof)) return json({ ok: false, error: "bad_request" }, 400);
        const salt = randHex(16);
        await db.prepare("UPDATE users SET pw_salt = ?1, pw_hash = ?2, must_change_pw = 1, session_ver = session_ver + 1, handled_by = ?3, updated_at = ?4 WHERE id = ?5")
          .bind(salt, await hmac(salt, body.proof), sess.name, nowIso(), id).run();
        await audit(env, sess, "member_temppw", "member#" + id, row.username + " 임시 비밀번호 발급");
        return json({ ok: true });
      }
      if (act === "delete") {
        const hide = body.hide_posts === true;
        await withdrawUser(db, row, hide);
        await audit(env, sess, "member_delete", "member#" + id, row.username + " 강제 탈퇴" + (hide ? " · 작성 글 숨김" : ""));
        return json({ ok: true });
      }
      const status = ["active", "suspended"].includes(body.status) ? body.status : row.status;
      const memo = body.memo !== undefined ? cleanMulti(body.memo, 1000) : row.memo;
      await db.prepare("UPDATE users SET status = ?1, memo = ?2, handled_by = ?3, updated_at = ?4, session_ver = session_ver + ?5 WHERE id = ?6")
        .bind(status, memo, sess.name, nowIso(), status !== row.status && status === "suspended" ? 1 : 0, id).run();
      await audit(env, sess, status !== row.status ? (status === "suspended" ? "member_suspend" : "member_restore") : "member_memo", "member#" + id, row.username + (memo && memo !== row.memo ? " · " + memo.slice(0, 200) : ""));
      return json({ ok: true });
    }

    // ---------------- 게시판 관리 (글)
    if (res === "board" && !id && method === "GET") {
      if (sess.role !== "admin") return deny();
      const st = q("status", 20) || "visible", kw = q("q", 60), cat = q("cat", 20), uid = parseInt(url.searchParams.get("user") || "0", 10);
      const where = [], args = [];
      if (st === "reported") where.push("p.status != 'deleted' AND p.report_count > 0");
      else if (st !== "all") { where.push("p.status = ?"); args.push(st); }
      if (cat) { where.push("p.category = ?"); args.push(cat); }
      if (uid) { where.push("p.user_id = ?"); args.push(uid); }
      if (kw) { where.push("(p.title LIKE ? OR p.body LIKE ? OR u.nickname LIKE ? OR u.username LIKE ?)"); args.push(...Array(4).fill(`%${kw}%`)); }
      const w = where.length ? "WHERE " + where.join(" AND ") : "";
      const [items, total, tabs] = await db.batch([
        db.prepare(`SELECT p.id, p.user_id, p.author_label, p.category, p.title, p.body, p.created_at, p.updated_at, p.status, p.pinned, p.views, p.like_count, p.comment_count, p.report_count, p.hidden_reason, p.handled_by, u.nickname, u.username, u.status AS user_status
          FROM posts p LEFT JOIN users u ON u.id = p.user_id ${w} ORDER BY p.id DESC LIMIT ${lim} OFFSET ${off}`).bind(...args),
        db.prepare(`SELECT COUNT(*) AS n FROM posts p LEFT JOIN users u ON u.id = p.user_id ${w}`).bind(...args),
        db.prepare("SELECT status, COUNT(*) AS n FROM posts GROUP BY status"),
      ]);
      return json({ ok: true, items: items.results, total: total.results[0].n, tabs: Object.fromEntries(tabs.results.map((r) => [r.status, r.n])) });
    }
    if (res === "board" && !id && method === "POST") {
      // 운영팀 공지 작성
      if (sess.role !== "admin") return deny();
      const title = clean(body.title, 80), text = cleanMulti(body.body, 5000);
      if (title.length < 2 || text.length < 5) return json({ ok: false, error: "제목과 내용을 입력하세요." }, 400);
      const r = await db.prepare("INSERT INTO posts (user_id, author_label, category, title, body, created_at, status, pinned) VALUES (NULL, '바른혈압 운영팀', '공지', ?1, ?2, ?3, 'visible', ?4)")
        .bind(title, text, nowIso(), body.pinned === false ? 0 : 1).run();
      await audit(env, sess, "notice_add", "post#" + r.meta.last_row_id, title);
      return json({ ok: true, id: r.meta.last_row_id });
    }
    if (res === "board" && id && method === "POST") {
      if (sess.role !== "admin") return deny();
      const row = await db.prepare("SELECT * FROM posts WHERE id = ?1").bind(id).first();
      if (!row) return json({ ok: false, error: "not_found" }, 404);
      if (act === "delete") {
        await db.batch([
          db.prepare("DELETE FROM comments WHERE post_id = ?1").bind(id),
          db.prepare("DELETE FROM post_likes WHERE post_id = ?1").bind(id),
          db.prepare("DELETE FROM ugc_reports WHERE target_type = 'post' AND target_id = ?1").bind(id),
          db.prepare("DELETE FROM bookmarks WHERE key = ?1").bind("post:" + id),
          db.prepare("DELETE FROM posts WHERE id = ?1").bind(id),
        ]);
        await audit(env, sess, "post_delete", "post#" + id, row.title.slice(0, 200));
        return json({ ok: true });
      }
      const status = ["visible", "hidden"].includes(body.status) ? body.status : row.status;
      const pinned = body.pinned !== undefined ? (body.pinned ? 1 : 0) : row.pinned;
      const reason = status === "hidden" ? clean(body.hidden_reason, 100) || row.hidden_reason || "운영 원칙 위반" : null;
      const title = row.author_label && body.title !== undefined ? clean(body.title, 80) || row.title : row.title;
      const text = row.author_label && body.body !== undefined ? cleanMulti(body.body, 5000) || row.body : row.body;
      const stmts = [db.prepare("UPDATE posts SET status = ?1, pinned = ?2, hidden_reason = ?3, handled_by = ?4, title = ?5, body = ?6, updated_at = CASE WHEN ?7 = 1 THEN ?8 ELSE updated_at END WHERE id = ?9")
        .bind(status, pinned, reason, sess.name, title, text, title !== row.title || text !== row.body ? 1 : 0, nowIso(), id)];
      // 숨김·복구로 처리했으면 이 글에 걸린 신고를 처리 완료로 바꾼다
      if (status !== row.status) stmts.push(db.prepare("UPDATE ugc_reports SET status = 'resolved', handled_by = ?1, handled_at = ?2 WHERE target_type = 'post' AND target_id = ?3 AND status = 'open'").bind(sess.name, nowIso(), id));
      if (status === "visible" && row.status === "hidden") stmts.push(db.prepare("UPDATE posts SET report_count = 0 WHERE id = ?1").bind(id));
      await db.batch(stmts);
      const what = status !== row.status ? (status === "hidden" ? "post_hide" : "post_restore") : pinned !== row.pinned ? "post_pin" : "post_update";
      await audit(env, sess, what, "post#" + id, row.title.slice(0, 120) + (reason ? " · " + reason : "") + (what === "post_pin" ? (pinned ? " · 상단 고정" : " · 고정 해제") : ""));
      return json({ ok: true });
    }

    // ---------------- 게시판 관리 (댓글)
    if (res === "comments" && !id && method === "GET") {
      if (sess.role !== "admin") return deny();
      const st = q("status", 20) || "visible", kw = q("q", 60), pid = parseInt(url.searchParams.get("post") || "0", 10);
      const where = [], args = [];
      if (st === "reported") where.push("c.status != 'deleted' AND c.report_count > 0");
      else if (st !== "all") { where.push("c.status = ?"); args.push(st); }
      if (pid) { where.push("c.post_id = ?"); args.push(pid); }
      if (kw) { where.push("(c.body LIKE ? OR u.nickname LIKE ? OR u.username LIKE ?)"); args.push(...Array(3).fill(`%${kw}%`)); }
      const w = where.length ? "WHERE " + where.join(" AND ") : "";
      const [items, total, tabs] = await db.batch([
        db.prepare(`SELECT c.id, c.post_id, c.user_id, c.body, c.created_at, c.status, c.report_count, c.hidden_reason, c.handled_by, u.nickname, u.username, p.title AS post_title
          FROM comments c LEFT JOIN users u ON u.id = c.user_id LEFT JOIN posts p ON p.id = c.post_id ${w} ORDER BY c.id DESC LIMIT ${lim} OFFSET ${off}`).bind(...args),
        db.prepare(`SELECT COUNT(*) AS n FROM comments c LEFT JOIN users u ON u.id = c.user_id ${w}`).bind(...args),
        db.prepare("SELECT status, COUNT(*) AS n FROM comments GROUP BY status"),
      ]);
      return json({ ok: true, items: items.results, total: total.results[0].n, tabs: Object.fromEntries(tabs.results.map((r) => [r.status, r.n])) });
    }
    if (res === "comments" && id && method === "POST") {
      if (sess.role !== "admin") return deny();
      const row = await db.prepare("SELECT * FROM comments WHERE id = ?1").bind(id).first();
      if (!row) return json({ ok: false, error: "not_found" }, 404);
      if (act === "delete") {
        await db.batch([
          db.prepare("DELETE FROM ugc_reports WHERE target_type = 'comment' AND target_id = ?1").bind(id),
          db.prepare("DELETE FROM comments WHERE id = ?1").bind(id),
          db.prepare("UPDATE posts SET comment_count = (SELECT COUNT(*) FROM comments WHERE post_id = ?1 AND status = 'visible') WHERE id = ?1").bind(row.post_id),
        ]);
        await audit(env, sess, "comment_delete", "comment#" + id, row.body.slice(0, 200));
        return json({ ok: true });
      }
      const status = ["visible", "hidden"].includes(body.status) ? body.status : row.status;
      const reason = status === "hidden" ? clean(body.hidden_reason, 100) || row.hidden_reason || "운영 원칙 위반" : null;
      await db.batch([
        db.prepare("UPDATE comments SET status = ?1, hidden_reason = ?2, handled_by = ?3, report_count = CASE WHEN ?1 = 'visible' THEN 0 ELSE report_count END WHERE id = ?4").bind(status, reason, sess.name, id),
        db.prepare("UPDATE ugc_reports SET status = 'resolved', handled_by = ?1, handled_at = ?2 WHERE target_type = 'comment' AND target_id = ?3 AND status = 'open'").bind(sess.name, nowIso(), id),
        db.prepare("UPDATE posts SET comment_count = (SELECT COUNT(*) FROM comments WHERE post_id = ?1 AND status = 'visible') WHERE id = ?1").bind(row.post_id),
      ]);
      await audit(env, sess, status === "hidden" ? "comment_hide" : "comment_restore", "comment#" + id, row.body.slice(0, 120) + (reason ? " · " + reason : ""));
      return json({ ok: true });
    }

    // ---------------- 신고 처리
    if (res === "ugcreports" && !id && method === "GET") {
      if (sess.role !== "admin") return deny();
      const st = q("status", 20) || "open";
      const w = st === "all" ? "" : "WHERE r.status = ?1";
      const stmt = db.prepare(`SELECT r.target_type, r.target_id, COUNT(*) AS n, MIN(r.created_at) AS first_at, MAX(r.created_at) AS last_at, GROUP_CONCAT(DISTINCT r.reason) AS reasons, GROUP_CONCAT(r.detail, ' / ') AS details, MAX(r.status) AS status, MAX(r.handled_by) AS handled_by,
          CASE WHEN r.target_type = 'post' THEN (SELECT p.title FROM posts p WHERE p.id = r.target_id) ELSE (SELECT p.title FROM posts p JOIN comments c ON c.post_id = p.id WHERE c.id = r.target_id) END AS post_title,
          CASE WHEN r.target_type = 'post' THEN (SELECT p.body FROM posts p WHERE p.id = r.target_id) ELSE (SELECT c.body FROM comments c WHERE c.id = r.target_id) END AS body,
          CASE WHEN r.target_type = 'post' THEN (SELECT p.status FROM posts p WHERE p.id = r.target_id) ELSE (SELECT c.status FROM comments c WHERE c.id = r.target_id) END AS target_status,
          CASE WHEN r.target_type = 'post' THEN r.target_id ELSE (SELECT c.post_id FROM comments c WHERE c.id = r.target_id) END AS post_id,
          CASE WHEN r.target_type = 'post' THEN (SELECT u.nickname FROM users u JOIN posts p ON p.user_id = u.id WHERE p.id = r.target_id) ELSE (SELECT u.nickname FROM users u JOIN comments c ON c.user_id = u.id WHERE c.id = r.target_id) END AS nickname
          FROM ugc_reports r ${w} GROUP BY r.target_type, r.target_id ORDER BY last_at DESC LIMIT ${lim} OFFSET ${off}`);
      const { results } = st === "all" ? await stmt.all() : await stmt.bind(st).all();
      return json({ ok: true, items: results });
    }
    if (sub === "ugcreports/resolve" && method === "POST") {
      if (sess.role !== "admin") return deny();
      const tt = body.target_type === "comment" ? "comment" : "post", tid = parseInt(body.target_id, 10), hide = body.action === "hide";
      if (!tid) return json({ ok: false, error: "bad_request" }, 400);
      const table = tt === "post" ? "posts" : "comments";
      const row = await db.prepare(`SELECT * FROM ${table} WHERE id = ?1`).bind(tid).first();
      const stmts = [db.prepare("UPDATE ugc_reports SET status = 'resolved', handled_by = ?1, handled_at = ?2 WHERE target_type = ?3 AND target_id = ?4 AND status = 'open'").bind(sess.name, nowIso(), tt, tid)];
      if (row && row.status !== "deleted") {
        if (hide) stmts.push(db.prepare(`UPDATE ${table} SET status = 'hidden', hidden_reason = ?1, handled_by = ?2 WHERE id = ?3`).bind(clean(body.hidden_reason, 100) || "신고 검토 후 숨김", sess.name, tid));
        else stmts.push(db.prepare(`UPDATE ${table} SET status = 'visible', hidden_reason = NULL, report_count = 0, handled_by = ?1 WHERE id = ?2`).bind(sess.name, tid));
        if (tt === "comment") stmts.push(db.prepare("UPDATE posts SET comment_count = (SELECT COUNT(*) FROM comments WHERE post_id = ?1 AND status = 'visible') WHERE id = ?1").bind(row.post_id));
      }
      await db.batch(stmts);
      await audit(env, sess, "ugc_resolve", tt + "#" + tid, hide ? "신고 인정 · 숨김" : "문제 없음 · 유지");
      return json({ ok: true });
    }

    // ---------------- KPI
    if (sub === "kpi" && method === "GET") {
      if (sess.role !== "admin") return deny();
      const days = Math.min(365, Math.max(1, parseInt(url.searchParams.get("days") || "30", 10) || 30));
      const to = kstDay(), from = kstDay(days - 1), pto = kstDay(days), pfrom = kstDay(days * 2 - 1);
      // 방문자·세션·체류시간 같은 지표는 KPI_SINCE부터 쌓였다. 그 전 날짜가 섞이면 비율이 어긋나므로 기간 합계는 이날부터 센다
      const sfrom = from < KPI_SINCE ? KPI_SINCE : from, compare = pfrom >= KPI_SINCE;
      const iso = (d) => new Date(d + "T00:00:00+09:00").toISOString();
      const fromIso = iso(from), pfromIso = iso(pfrom);
      const y1 = kstDay(400).slice(0, 7);
      const [series, cur, prev, pages, dims, ugc, months, reports] = await db.batch([
        db.prepare("SELECT day, kind, SUM(n) AS n FROM stats_daily WHERE day >= ?1 AND kind IN ('pv_total','uv','session','session2','visitor','mall_click') GROUP BY day, kind").bind(from),
        db.prepare("SELECT kind, SUM(n) AS n FROM stats_daily WHERE day >= ?1 GROUP BY kind").bind(sfrom),
        db.prepare("SELECT kind, SUM(n) AS n FROM stats_daily WHERE day >= ?1 AND day <= ?2 GROUP BY kind").bind(compare ? pfrom : "9999", pto),
        db.prepare("SELECT kind, key, SUM(n) AS n FROM stats_daily WHERE day >= ?1 AND kind IN ('pv','upv','tsum','tcnt','eng','read','land','mall_box') GROUP BY kind, key").bind(sfrom),
        db.prepare("SELECT kind, key, SUM(n) AS n FROM stats_daily WHERE day >= ?1 AND kind IN ('src','device','ref','search','event','out','cta','mall_click','mall_imp','mall_click_page','ev_p') GROUP BY kind, key ORDER BY n DESC LIMIT 4000").bind(sfrom),
        db.prepare(`SELECT
          (SELECT COUNT(*) FROM users WHERE created_at >= ?1) AS signups, (SELECT COUNT(*) FROM users WHERE created_at >= ?2 AND created_at < ?1) AS signups_prev,
          (SELECT COUNT(*) FROM posts WHERE created_at >= ?1 AND status != 'deleted') AS posts, (SELECT COUNT(*) FROM posts WHERE created_at >= ?2 AND created_at < ?1 AND status != 'deleted') AS posts_prev,
          (SELECT COUNT(*) FROM comments WHERE created_at >= ?1 AND status != 'deleted') AS comments, (SELECT COUNT(*) FROM comments WHERE created_at >= ?2 AND created_at < ?1 AND status != 'deleted') AS comments_prev,
          (SELECT COUNT(*) FROM newsletter WHERE created_at >= ?1) AS newsletter, (SELECT COUNT(*) FROM newsletter WHERE created_at >= ?2 AND created_at < ?1) AS newsletter_prev,
          (SELECT COUNT(*) FROM qna WHERE created_at >= ?1) AS qna, (SELECT COUNT(*) FROM qna WHERE created_at >= ?2 AND created_at < ?1) AS qna_prev,
          (SELECT COUNT(*) FROM users WHERE status != 'deleted') AS members`).bind(fromIso, pfromIso),
        db.prepare("SELECT substr(day, 1, 7) AS month, kind, SUM(n) AS n FROM stats_daily WHERE substr(day, 1, 7) >= ?1 AND kind IN ('mall_click','mall_imp','pv_total','uv','session') GROUP BY month, kind").bind(y1),
        db.prepare("SELECT * FROM mall_reports ORDER BY month DESC LIMIT 24"),
      ]);
      const tot = (rows) => Object.fromEntries(rows.results.map((r) => [r.kind, r.n]));
      return json({ ok: true, days, range: { from, to, prev_from: pfrom, prev_to: pto, since: KPI_SINCE, stat_from: sfrom, compare }, series: series.results, cur: tot(cur), prev: tot(prev), pages: pages.results, dims: dims.results, ugc: ugc.results[0], months: months.results, reports: reports.results });
    }

    // ---------------- 바른혈압몰
    const MALL_CATS = ["record", "body", "kitchen", "exercise"];
    const mallUrl = (u) => (/^https:\/\/(link\.coupang\.com|coupa\.ng)\/[A-Za-z0-9/_\-?=&.]{2,200}$/.test(u || "") ? u : "");
    const mallImg = (u) => (/^https:\/\/[a-z0-9.-]+\.coupangcdn\.com\/[A-Za-z0-9/_\-.%]{5,300}$/.test(u || "") ? u : "");
    if (sub === "mall" && method === "GET") {
      if (sess.role !== "admin") return deny();
      const [items, hid, reports] = await db.batch([
        db.prepare("SELECT * FROM mall_items ORDER BY sort DESC, id DESC LIMIT 500"),
        db.prepare("SELECT value FROM settings WHERE key = 'mall_hidden'"),
        db.prepare("SELECT * FROM mall_reports ORDER BY month DESC LIMIT 36"),
      ]);
      let hidden = [];
      try { hidden = JSON.parse((hid.results[0] || {}).value || "[]"); } catch (e) {}
      return json({ ok: true, items: items.results, hidden, reports: reports.results });
    }
    if (sub.startsWith("mall/") && method === "POST") {
      if (sess.role !== "admin") return deny();
      const num = (v) => { const x = parseInt(String(v == null ? "" : v).replace(/[^0-9-]/g, ""), 10); return isNaN(x) ? null : Math.max(0, Math.min(1e12, x)); };
      if (sub === "mall/report") {
        const month = clean(body.month, 7);
        if (!/^20\d\d-(0[1-9]|1[0-2])$/.test(month)) return json({ ok: false, error: "월을 2026-11 형식으로 입력하세요." }, 400);
        const v = [num(body.clicks), num(body.orders), num(body.cancels), num(body.gmv), num(body.commission)];
        await db.prepare("INSERT INTO mall_reports (month, clicks, orders, cancels, gmv, commission, memo, updated_at, updated_by) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9) ON CONFLICT(month) DO UPDATE SET clicks = excluded.clicks, orders = excluded.orders, cancels = excluded.cancels, gmv = excluded.gmv, commission = excluded.commission, memo = excluded.memo, updated_at = excluded.updated_at, updated_by = excluded.updated_by")
          .bind(month, v[0], v[1], v[2], v[3], v[4], clean(body.memo, 200), nowIso(), sess.name).run();
        await audit(env, sess, "mall_report", month, `클릭 ${v[0] ?? "-"} · 구매 ${v[1] ?? "-"} · 수익 ${v[4] ?? "-"}`);
        return json({ ok: true });
      }
      if (sub === "mall/report/delete") {
        const month = clean(body.month, 7);
        await db.prepare("DELETE FROM mall_reports WHERE month = ?1").bind(month).run();
        await audit(env, sess, "mall_report_delete", month, null);
        return json({ ok: true });
      }
      if (sub === "mall/hide") {
        const pid = clean(body.pid, 30);
        if (!/^[A-Za-z0-9_-]{1,30}$/.test(pid)) return json({ ok: false, error: "bad_pid" }, 400);
        const row = await db.prepare("SELECT value FROM settings WHERE key = 'mall_hidden'").first();
        let list = [];
        try { list = JSON.parse((row || {}).value || "[]"); } catch (e) {}
        list = list.filter((x) => x !== pid);
        if (body.hidden) list.push(pid);
        await db.prepare("INSERT INTO settings (key, value, updated_at) VALUES ('mall_hidden', ?1, ?2) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at").bind(JSON.stringify(list.slice(0, 500)), nowIso()).run();
        await audit(env, sess, "mall_hide", pid, body.hidden ? "숨김" : "다시 보이기");
        return json({ ok: true, hidden: list });
      }
      if (sub === "mall/item/delete") {
        const iid = parseInt(body.id, 10) || 0;
        const row = await db.prepare("SELECT name FROM mall_items WHERE id = ?1").bind(iid).first();
        await db.prepare("DELETE FROM mall_items WHERE id = ?1").bind(iid).run();
        await audit(env, sess, "mall_item_delete", "mall#" + iid, row ? row.name : "");
        return json({ ok: true });
      }
      if (sub === "mall/item") {
        const iid = parseInt(body.id, 10) || 0;
        const cat = MALL_CATS.includes(body.cat) ? body.cat : "";
        const name = clean(body.name, 60), note = clean(body.note, 200), u = mallUrl(clean(body.url, 220)), img = mallImg(clean(body.img, 320));
        const status = body.status === "hidden" ? "hidden" : "visible", sort = Math.max(-999, Math.min(999, parseInt(body.sort || "0", 10) || 0));
        if (!cat) return json({ ok: false, error: "분류를 고르세요." }, 400);
        if (!name) return json({ ok: false, error: "상품 이름을 입력하세요." }, 400);
        if (!u) return json({ ok: false, error: "쿠팡 파트너스에서 만든 링크(https://link.coupang.com/a/...)를 붙여 넣으세요." }, 400);
        if (clean(body.img, 320) && !img) return json({ ok: false, error: "이미지 주소는 쿠팡 이미지(…coupangcdn.com) 주소만 쓸 수 있습니다." }, 400);
        if (iid) {
          await db.prepare("UPDATE mall_items SET cat = ?1, name = ?2, url = ?3, img = ?4, note = ?5, status = ?6, sort = ?7 WHERE id = ?8").bind(cat, name, u, img, note, status, sort, iid).run();
          await audit(env, sess, "mall_item_edit", "mall#" + iid, name);
        } else {
          const pid0 = clean(body.pid, 30);
          const pid = /^\d{3,15}$/.test(pid0) ? pid0 : "a" + Date.now().toString(36);
          await db.prepare("INSERT INTO mall_items (pid, cat, name, url, img, note, status, sort, created_at, created_by) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10)").bind(pid, cat, name, u, img, note, status, sort, nowIso(), sess.name).run();
          await audit(env, sess, "mall_item_add", null, name);
        }
        return json({ ok: true });
      }
      return json({ ok: false, error: "unknown_endpoint" }, 404);
    }

    // ---------------- 영상 관리
    if (res === "videos" && !id && method === "GET") {
      if (sess.role !== "admin") return deny();
      const { results } = await db.prepare("SELECT * FROM videos ORDER BY sort DESC, id DESC LIMIT 500").all();
      return json({ ok: true, items: results });
    }
    if (res === "videos" && method === "POST") {
      if (sess.role !== "admin") return deny();
      if (id && act === "delete") {
        const row = await db.prepare("SELECT title FROM videos WHERE id = ?1").bind(id).first();
        await db.prepare("DELETE FROM videos WHERE id = ?1").bind(id).run();
        await audit(env, sess, "video_delete", "video#" + id, row ? row.title : "");
        return json({ ok: true });
      }
      const yid = youtubeId(body.url || body.youtube_id);
      const title = clean(body.title, 120), source = clean(body.source, 60), category = clean(body.category, 20), note = clean(body.note, 300);
      const status = body.status === "hidden" ? "hidden" : "visible", sort = Math.max(-999, Math.min(999, parseInt(body.sort || "0", 10) || 0));
      if (!yid) return json({ ok: false, error: "유튜브 주소를 확인하세요. (예: https://www.youtube.com/watch?v=...)" }, 400);
      if (!title) return json({ ok: false, error: "제목을 입력하세요." }, 400);
      if (!source) return json({ ok: false, error: "출처(채널·기관명)를 입력하세요." }, 400);
      if (id) {
        await db.prepare("UPDATE videos SET youtube_id = ?1, title = ?2, source = ?3, category = ?4, note = ?5, status = ?6, sort = ?7 WHERE id = ?8").bind(yid, title, source, category, note, status, sort, id).run();
        await audit(env, sess, "video_edit", "video#" + id, title);
      } else {
        const dup = await db.prepare("SELECT id FROM videos WHERE youtube_id = ?1").bind(yid).first();
        if (dup) return json({ ok: false, error: "이미 등록된 영상입니다." }, 400);
        await db.prepare("INSERT INTO videos (youtube_id, title, source, category, note, status, sort, created_at, created_by) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9)").bind(yid, title, source, category, note, status, sort, nowIso(), sess.name).run();
        await audit(env, sess, "video_add", null, title + " · " + source);
      }
      return json({ ok: true });
    }

    return json({ ok: false, error: "unknown_endpoint" }, 404);
  } catch (e) {
    return json({ ok: false, error: "db_error", detail: String(e && e.message ? e.message : e).slice(0, 300) }, 500);
  }
}

// ================================================================== 회원 · 저장 · 자유게시판 · 영상
const BOARD_CATS = ["자유", "정보공유", "생활습관", "음식·식단", "측정·기기", "가족·돌봄", "질문"];
const REPORT_REASONS = ["광고·홍보", "의료 조언·약 권유", "허위·과장 정보", "욕설·비방", "개인정보 노출", "기타"];
const NICK_RESERVED = ["바른혈압", "운영", "관리자", "편집팀", "감수", "전문의", "의사", "약사", "간호사", "교수", "원장", "admin", "탈퇴"];
const AUTO_HIDE_REPORTS = 5; // 서로 다른 회원 5명이 신고하면 운영자 확인 전까지 자동으로 숨긴다
const SUPPORT = "spaceblank0100@gmail.com";

const hex = (buf) => Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
const randHex = (n) => hex(crypto.getRandomValues(new Uint8Array(n)));
// 브라우저가 PBKDF2-SHA256으로 늘려 보낸 비밀번호 값(64자리 16진수)
const isProof = (s) => typeof s === "string" && /^[a-f0-9]{64}$/.test(s);
const isUsername = (s) => /^[a-z][a-z0-9_]{3,19}$/.test(s);

function youtubeId(v) {
  const s = clean(v, 200);
  if (/^[A-Za-z0-9_-]{11}$/.test(s)) return s;
  const m = s.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}
function nicknameError(n) {
  if (!/^[가-힣A-Za-z0-9_]{2,12}$/.test(n)) return "닉네임은 한글·영문·숫자 2~12자로 정해 주세요.";
  const low = n.toLowerCase();
  if (NICK_RESERVED.some((w) => low.indexOf(w) > -1)) return "운영자나 의료인으로 오해될 수 있는 닉네임은 쓸 수 없습니다.";
  return null;
}
function recoveryCode() {
  const abc = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 헷갈리는 글자(0·O·1·I) 제외, 32자
  const r = crypto.getRandomValues(new Uint8Array(16));
  let out = "";
  for (let i = 0; i < 16; i++) { out += abc[r[i] % 32]; if (i % 4 === 3 && i < 15) out += "-"; }
  return out;
}
const normCode = (c) => String(c || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
const recoveryHash = (username, code) => hmac("recovery:" + username, normCode(code));

// 회원 세션 서명 키: SESSION_SECRET이 없으면 DB에 무작위 값을 한 번 만들어 쓴다 (공개 소스만으로는 위조할 수 없게)
let userSecretCache = null;
async function userSecret(env) {
  if (env.SESSION_SECRET) return env.SESSION_SECRET + "|user-v1";
  if (userSecretCache) return userSecretCache;
  let row = await env.DB.prepare("SELECT value FROM app_secrets WHERE key = 'user_session'").first();
  if (!row) {
    await env.DB.prepare("INSERT OR IGNORE INTO app_secrets (key, value) VALUES ('user_session', ?1)").bind(randHex(32)).run();
    row = await env.DB.prepare("SELECT value FROM app_secrets WHERE key = 'user_session'").first();
  }
  userSecretCache = row.value + "|user-v1";
  return userSecretCache;
}
async function makeUserSession(env, u) {
  const payload = b64url(JSON.stringify({ u: u.id, v: u.session_ver, e: Date.now() + USER_SESSION_DAYS * 86400e3 }));
  return payload + "." + (await hmac(await userSecret(env), payload));
}
async function readUser(env, request) {
  const tok = getCookie(request, USER_COOKIE);
  if (!tok) return null;
  const [payload, sig] = tok.split(".");
  if (!payload || !sig) return null;
  if (sig !== (await hmac(await userSecret(env), payload))) return null;
  let s;
  try { s = JSON.parse(fromB64url(payload)); } catch (e) { return null; }
  if (!s.u || !s.e || s.e < Date.now()) return null;
  const u = await env.DB.prepare("SELECT id, username, nickname, email, status, session_ver, must_change_pw, created_at FROM users WHERE id = ?1").bind(s.u).first();
  if (!u || u.status === "deleted" || u.session_ver !== s.v) return null;
  return u;
}
const userCookie = (value, maxAge) => `${USER_COOKIE}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
const publicUser = (u) => ({ id: u.id, username: u.username, nickname: u.nickname, email: u.email || "", created_at: u.created_at, status: u.status, must_change_pw: !!u.must_change_pw });

async function failCount(env, key) {
  const id = `${key}:${Math.floor(Date.now() / 600000)}`;
  const r = await env.DB.prepare("SELECT hits FROM rate_limits WHERE id = ?1").bind(id).first();
  return { id, n: r ? r.hits : 0 };
}
async function failBump(env, id) {
  await env.DB.prepare("INSERT INTO rate_limits (id, hits, bucket) VALUES (?1, 1, ?2) ON CONFLICT(id) DO UPDATE SET hits = hits + 1").bind(id, Math.floor(Date.now() / 60000)).run();
}
async function bumpEvent(env, ev) {
  try { await env.DB.prepare("INSERT INTO stats_daily (day, kind, key, n) VALUES (?1, 'event', ?2, 1) ON CONFLICT(day, kind, key) DO UPDATE SET n = n + 1").bind(kstDay(), ev).run(); } catch (e) {}
}
// 탈퇴 처리: 계정 정보를 지우고(아이디는 재사용 방지용 임의 값으로 바꿈) 저장·공감 기록을 삭제한다. 글은 선택에 따라 남기거나 지운다.
async function withdrawUser(db, u, removePosts) {
  const stmts = [
    db.prepare("UPDATE users SET username = ?1, nickname = NULL, email = NULL, pw_hash = NULL, pw_salt = NULL, recovery_hash = NULL, memo = NULL, status = 'deleted', session_ver = session_ver + 1, updated_at = ?2 WHERE id = ?3").bind("deleted_" + u.id + "_" + randHex(4), nowIso(), u.id),
    db.prepare("DELETE FROM bookmarks WHERE user_id = ?1").bind(u.id),
    db.prepare("DELETE FROM post_likes WHERE user_id = ?1").bind(u.id),
    db.prepare("DELETE FROM ugc_reports WHERE user_id = ?1 AND status = 'open'").bind(u.id),
  ];
  if (removePosts) {
    stmts.push(db.prepare("UPDATE posts SET status = 'deleted', updated_at = ?1 WHERE user_id = ?2 AND status != 'deleted'").bind(nowIso(), u.id));
    stmts.push(db.prepare("UPDATE comments SET status = 'deleted' WHERE user_id = ?1 AND status != 'deleted'").bind(u.id));
  }
  await db.batch(stmts);
  if (removePosts) await db.prepare("UPDATE posts SET comment_count = (SELECT COUNT(*) FROM comments c WHERE c.post_id = posts.id AND c.status = 'visible') WHERE status = 'visible'").run();
  await db.batch([
    db.prepare("UPDATE posts SET like_count = (SELECT COUNT(*) FROM post_likes l WHERE l.post_id = posts.id) WHERE status != 'deleted'"),
    db.prepare("UPDATE posts SET report_count = (SELECT COUNT(*) FROM ugc_reports r WHERE r.target_type = 'post' AND r.target_id = posts.id) WHERE report_count > 0"),
    db.prepare("UPDATE comments SET report_count = (SELECT COUNT(*) FROM ugc_reports r WHERE r.target_type = 'comment' AND r.target_id = comments.id) WHERE report_count > 0"),
  ]);
}
const authorOf = (r) => r.author_label || r.nickname || "탈퇴한 회원";

async function member(context, path, method, ip, url) {
  const { request, env } = context;
  if (!env.DB) return json({ ok: false, error: "not_configured" }, 503);
  try { await ensureSchema(env); } catch (e) { return json({ ok: false, error: "db_error" }, 500); }
  if (method !== "GET" && method !== "POST") return json({ ok: false, error: "method_not_allowed" }, 405);
  // 다른 사이트에서 보낸 요청 차단: 사이트 스크립트가 붙이는 헤더가 있어야 변경 요청을 받는다
  if (method === "POST" && request.headers.get("X-BP") !== "1") return json({ ok: false, error: "bad_request" }, 400);

  const db = env.DB;
  const body = method === "POST" ? (await readBody(request)) || {} : {};
  if (body.website) return json({ ok: true }); // honeypot
  const now = nowIso();
  const ipHash = await sha(ip);
  const qs = (k, max = 60) => clean(url.searchParams.get(k), max);
  const fail = (message, status = 400, error = "invalid") => json({ ok: false, error, message }, status);

  try {
    const user = await readUser(env, request);
    const needLogin = () => fail("로그인이 필요합니다.", 401, "login_required");
    const blocked = () => fail("이용이 제한된 계정입니다. 문의: " + SUPPORT, 403, "suspended");

    // ============================================================ 계정
    if (path === "auth/me" && method === "GET") return json({ ok: true, user: user ? publicUser(user) : null });

    if (path === "auth/check" && method === "GET") {
      if (await rateLimited(env, ip, "check", 40)) return fail("잠시 후 다시 시도해 주세요.", 429);
      const un = qs("username", 20).toLowerCase(), nn = qs("nickname", 12);
      const out = { ok: true };
      if (un) {
        if (!isUsername(un)) out.username = "아이디는 영문 소문자로 시작하는 4~20자(영문 소문자·숫자·밑줄)로 정해 주세요.";
        else if (await db.prepare("SELECT 1 FROM users WHERE username = ?1").bind(un).first()) out.username = "이미 사용 중인 아이디입니다.";
        else out.username = "";
      }
      if (nn) {
        const e = nicknameError(nn);
        if (e) out.nickname = e;
        else if (await db.prepare("SELECT 1 FROM users WHERE nickname = ?1 AND id != ?2").bind(nn, user ? user.id : 0).first()) out.nickname = "이미 사용 중인 닉네임입니다.";
        else out.nickname = "";
      }
      return json(out);
    }

    if (path === "auth/signup" && method === "POST") {
      if (user) return fail("이미 로그인되어 있습니다.");
      // 같은 접속지에서 1시간에 가입 10건까지 (통신사·사무실처럼 여러 사람이 같은 주소를 쓰는 경우를 고려). 입력 오류는 세지 않는다.
      if (await rateLimited(env, ip, "signup-try", 60, 60)) return fail("가입 시도가 많습니다. 잠시 후 다시 시도해 주세요.", 429);
      const made = await env.DB.prepare("SELECT hits FROM rate_limits WHERE id = ?1").bind(`signup-ok:${ipHash}:${Math.floor(Date.now() / 3600000)}`).first();
      if (made && made.hits >= 10) return fail("이 접속 환경에서 가입이 많이 이루어졌습니다. 1시간 뒤 다시 시도해 주세요.", 429);
      const username = clean(body.username, 20).toLowerCase(), nickname = clean(body.nickname, 12), email = clean(body.email, 120).toLowerCase();
      if (!isUsername(username)) return fail("아이디는 영문 소문자로 시작하는 4~20자(영문 소문자·숫자·밑줄)로 정해 주세요.");
      const ne = nicknameError(nickname);
      if (ne) return fail(ne);
      if (email && !isEmail(email)) return fail("이메일 형식을 확인해 주세요.");
      if (!isProof(body.proof)) return fail("비밀번호를 다시 입력해 주세요.");
      if (body.agree_terms !== true || body.agree_privacy !== true) return fail("이용약관과 개인정보 수집·이용에 동의해 주세요.");
      if (body.age14 !== true) return fail("만 14세 이상만 가입할 수 있습니다.");
      if (await db.prepare("SELECT 1 FROM users WHERE username = ?1").bind(username).first()) return fail("이미 사용 중인 아이디입니다.");
      if (await db.prepare("SELECT 1 FROM users WHERE nickname = ?1").bind(nickname).first()) return fail("이미 사용 중인 닉네임입니다.");
      const salt = randHex(16), code = recoveryCode();
      const r = await db.prepare("INSERT INTO users (username, nickname, email, pw_hash, pw_salt, pw_ver, recovery_hash, created_at, last_login_at, status, agreed_at) VALUES (?1, ?2, ?3, ?4, ?5, 1, ?6, ?7, ?7, 'active', ?7)")
        .bind(username, nickname, email || null, await hmac(salt, body.proof), salt, await recoveryHash(username, code), now).run();
      const u = { id: r.meta.last_row_id, username, nickname, email, status: "active", session_ver: 1, must_change_pw: 0, created_at: now };
      if (body.newsletter === true && email) {
        await db.prepare("INSERT INTO newsletter (created_at, email, source, token) VALUES (?1, ?2, 'signup', lower(hex(randomblob(12)))) ON CONFLICT(email) DO UPDATE SET unsubscribed_at = NULL").bind(now, email).run();
      }
      await failBump(env, `signup-ok:${ipHash}:${Math.floor(Date.now() / 3600000)}`);
      await bumpEvent(env, "signup");
      return json({ ok: true, user: publicUser(u), recovery_code: code }, 200, { "Set-Cookie": userCookie(await makeUserSession(env, u), USER_SESSION_DAYS * 86400) });
    }

    if (path === "auth/login" && method === "POST") {
      const username = clean(body.username, 20).toLowerCase();
      const f1 = await failCount(env, "ulogin:" + ipHash), f2 = await failCount(env, "ulogin-u:" + (await sha(username)));
      if (f1.n >= 10 || f2.n >= 10) return fail("로그인 시도가 너무 많습니다. 10분 뒤 다시 시도해 주세요.", 429);
      const row = isUsername(username) ? await db.prepare("SELECT * FROM users WHERE username = ?1").bind(username).first() : null;
      let ok = false;
      if (row && row.pw_hash && row.status !== "deleted" && isProof(body.proof)) ok = await safeEqual(await hmac(row.pw_salt, body.proof), row.pw_hash);
      if (!ok) {
        await failBump(env, f1.id); await failBump(env, f2.id);
        return fail("아이디 또는 비밀번호가 올바르지 않습니다.", 401, "bad_credentials");
      }
      await db.prepare("UPDATE users SET last_login_at = ?1 WHERE id = ?2").bind(now, row.id).run();
      return json({ ok: true, user: publicUser(row) }, 200, { "Set-Cookie": userCookie(await makeUserSession(env, row), USER_SESSION_DAYS * 86400) });
    }

    if (path === "auth/logout" && method === "POST") return json({ ok: true }, 200, { "Set-Cookie": userCookie("", 0) });

    // 복구 코드로 비밀번호 재설정 (이메일 발송 없이 본인이 직접)
    if (path === "auth/reset" && method === "POST") {
      const username = clean(body.username, 20).toLowerCase();
      const f = await failCount(env, "ureset:" + ipHash);
      if (f.n >= 5) return fail("시도가 너무 많습니다. 10분 뒤 다시 시도해 주세요.", 429);
      if (!isProof(body.proof)) return fail("새 비밀번호를 다시 입력해 주세요.");
      const row = isUsername(username) ? await db.prepare("SELECT * FROM users WHERE username = ?1").bind(username).first() : null;
      const good = row && row.status !== "deleted" && row.recovery_hash && normCode(body.code).length === 16 && (await safeEqual(await recoveryHash(username, body.code), row.recovery_hash));
      if (!good) { await failBump(env, f.id); return fail("아이디 또는 복구 코드가 올바르지 않습니다.", 401, "bad_credentials"); }
      const salt = randHex(16), code = recoveryCode();
      await db.prepare("UPDATE users SET pw_salt = ?1, pw_hash = ?2, recovery_hash = ?3, must_change_pw = 0, session_ver = session_ver + 1, updated_at = ?4 WHERE id = ?5")
        .bind(salt, await hmac(salt, body.proof), await recoveryHash(username, code), now, row.id).run();
      row.session_ver += 1; row.must_change_pw = 0;
      return json({ ok: true, user: publicUser(row), recovery_code: code }, 200, { "Set-Cookie": userCookie(await makeUserSession(env, row), USER_SESSION_DAYS * 86400) });
    }

    if (path === "auth/profile" && method === "POST") {
      if (!user) return needLogin();
      const nickname = body.nickname !== undefined ? clean(body.nickname, 12) : user.nickname;
      const email = body.email !== undefined ? clean(body.email, 120).toLowerCase() : user.email || "";
      if (nickname !== user.nickname) {
        const e = nicknameError(nickname);
        if (e) return fail(e);
        if (await db.prepare("SELECT 1 FROM users WHERE nickname = ?1 AND id != ?2").bind(nickname, user.id).first()) return fail("이미 사용 중인 닉네임입니다.");
      }
      if (email && !isEmail(email)) return fail("이메일 형식을 확인해 주세요.");
      await db.prepare("UPDATE users SET nickname = ?1, email = ?2, updated_at = ?3 WHERE id = ?4").bind(nickname, email || null, now, user.id).run();
      return json({ ok: true, user: publicUser({ ...user, nickname, email }) });
    }

    if ((path === "auth/password" || path === "auth/recovery" || path === "auth/withdraw") && method === "POST") {
      if (!user) return needLogin();
      const f = await failCount(env, "upw:" + user.id);
      if (f.n >= 8) return fail("시도가 너무 많습니다. 10분 뒤 다시 시도해 주세요.", 429);
      const row = await db.prepare("SELECT * FROM users WHERE id = ?1").bind(user.id).first();
      const good = isProof(body.current) && (await safeEqual(await hmac(row.pw_salt, body.current), row.pw_hash));
      if (!good) { await failBump(env, f.id); return fail("현재 비밀번호가 올바르지 않습니다.", 401, "bad_credentials"); }
      if (path === "auth/password") {
        if (!isProof(body.next)) return fail("새 비밀번호를 다시 입력해 주세요.");
        if (body.next === body.current) return fail("현재 비밀번호와 다른 비밀번호를 정해 주세요.");
        const salt = randHex(16);
        await db.prepare("UPDATE users SET pw_salt = ?1, pw_hash = ?2, must_change_pw = 0, session_ver = session_ver + 1, updated_at = ?3 WHERE id = ?4").bind(salt, await hmac(salt, body.next), now, user.id).run();
        row.session_ver += 1; row.must_change_pw = 0;
        // 다른 기기의 로그인은 끊기고, 지금 기기는 새 세션으로 이어진다
        return json({ ok: true, user: publicUser(row) }, 200, { "Set-Cookie": userCookie(await makeUserSession(env, row), USER_SESSION_DAYS * 86400) });
      }
      if (path === "auth/recovery") {
        const code = recoveryCode();
        await db.prepare("UPDATE users SET recovery_hash = ?1, updated_at = ?2 WHERE id = ?3").bind(await recoveryHash(row.username, code), now, user.id).run();
        return json({ ok: true, recovery_code: code });
      }
      await withdrawUser(db, row, body.delete_posts === true);
      await bumpEvent(env, "withdraw");
      return json({ ok: true }, 200, { "Set-Cookie": userCookie("", 0) });
    }

    // ============================================================ 저장(찜)
    if (path === "bookmarks" && method === "GET") {
      if (!user) return needLogin();
      const { results } = await db.prepare(
        "SELECT b.key, CASE WHEN b.key LIKE 'post:%' THEN COALESCE((SELECT p.title FROM posts p WHERE p.id = CAST(substr(b.key, 6) AS INTEGER) AND p.status = 'visible'), '') ELSE b.title END AS title, b.created_at FROM bookmarks b WHERE b.user_id = ?1 ORDER BY b.created_at DESC LIMIT 500"
      ).bind(user.id).all();
      return json({ ok: true, items: results });
    }
    if ((path === "bookmarks" || path === "bookmarks/sync") && method === "POST") {
      if (!user) return needLogin();
      const okKey = (k) => (isPath(k) && !k.startsWith("/admin") && !k.startsWith("/api")) || /^post:\d{1,9}$/.test(k);
      if (path === "bookmarks/sync") {
        // 로그인 전 이 기기에 저장해 둔 목록을 계정으로 옮긴다
        const items = Array.isArray(body.items) ? body.items.slice(0, 200) : [];
        const stmts = [];
        for (const it of items) {
          const k = clean(it && it.k, 160);
          if (okKey(k)) stmts.push(db.prepare("INSERT OR IGNORE INTO bookmarks (user_id, key, title, created_at) VALUES (?1, ?2, ?3, ?4)").bind(user.id, k, clean(it.t, 160), /^\d{4}-\d{2}-\d{2}T/.test(String(it.at)) ? String(it.at).slice(0, 24) : now));
        }
        if (stmts.length) await db.batch(stmts);
        return json({ ok: true, merged: stmts.length });
      }
      const key = clean(body.key, 160);
      if (!okKey(key)) return fail("저장할 수 없는 주소입니다.");
      if (body.on === false) {
        await db.prepare("DELETE FROM bookmarks WHERE user_id = ?1 AND key = ?2").bind(user.id, key).run();
        return json({ ok: true, on: false });
      }
      const cnt = await db.prepare("SELECT COUNT(*) AS n FROM bookmarks WHERE user_id = ?1").bind(user.id).first();
      if (cnt.n >= 500) return fail("저장은 500개까지 할 수 있습니다. 저장함을 정리한 뒤 다시 시도해 주세요.");
      await db.prepare("INSERT OR IGNORE INTO bookmarks (user_id, key, title, created_at) VALUES (?1, ?2, ?3, ?4)").bind(user.id, key, clean(body.title, 160), now).run();
      await bumpEvent(env, "bookmark_add");
      return json({ ok: true, on: true });
    }

    // ============================================================ 영상 (운영자가 콘솔에서 추가한 목록)
    if (path === "videos" && method === "GET") {
      const { results } = await db.prepare("SELECT id, youtube_id, title, source, category, note FROM videos WHERE status = 'visible' ORDER BY sort DESC, id DESC LIMIT 200").all();
      return json({ ok: true, items: results }, 200, { "Cache-Control": "public, max-age=300" });
    }

    // ============================================================ 자유게시판
    if (path === "board" && method === "GET") {
      const cat = qs("cat", 20), kw = qs("q", 40), sort = qs("sort", 10);
      const page = Math.min(500, Math.max(1, parseInt(url.searchParams.get("page") || "1", 10) || 1)), size = 20;
      const where = ["p.status = 'visible'"], args = [];
      if (cat) { where.push("p.category = ?"); args.push(cat); }
      if (kw) { where.push("(p.title LIKE ? OR p.body LIKE ?)"); args.push(`%${kw}%`, `%${kw}%`); }
      const w = "WHERE " + where.join(" AND ");
      const order = sort === "like" ? "p.like_count DESC, p.id DESC" : sort === "comment" ? "p.comment_count DESC, p.id DESC" : (!cat && !kw ? "p.pinned DESC, " : "") + "p.id DESC";
      const [items, total] = await db.batch([
        db.prepare(`SELECT p.id, p.category, p.title, substr(p.body, 1, 110) AS excerpt, p.created_at, p.views, p.like_count, p.comment_count, p.pinned, p.author_label, u.nickname
          FROM posts p LEFT JOIN users u ON u.id = p.user_id ${w} ORDER BY ${order} LIMIT ${size} OFFSET ${(page - 1) * size}`).bind(...args),
        db.prepare(`SELECT COUNT(*) AS n FROM posts p ${w}`).bind(...args),
      ]);
      return json({
        ok: true, page, size, total: total.results[0].n, categories: BOARD_CATS,
        items: items.results.map((r) => ({ id: r.id, category: r.category, title: r.title, excerpt: r.excerpt.replace(/\s+/g, " "), created_at: r.created_at, views: r.views, likes: r.like_count, comments: r.comment_count, pinned: !!r.pinned, author: authorOf(r), staff: !!r.author_label })),
      });
    }

    if (path === "board/mine" && method === "GET") {
      if (!user) return needLogin();
      const [posts, comments] = await db.batch([
        db.prepare("SELECT id, category, title, created_at, status, views, like_count AS likes, comment_count AS comments, hidden_reason FROM posts WHERE user_id = ?1 AND status != 'deleted' ORDER BY id DESC LIMIT 200").bind(user.id),
        db.prepare("SELECT c.id, c.post_id, substr(c.body, 1, 120) AS body, c.created_at, c.status, p.title AS post_title, p.status AS post_status FROM comments c LEFT JOIN posts p ON p.id = c.post_id WHERE c.user_id = ?1 AND c.status != 'deleted' ORDER BY c.id DESC LIMIT 200").bind(user.id),
      ]);
      return json({ ok: true, posts: posts.results, comments: comments.results });
    }

    if (path === "board" && method === "POST") {
      if (!user) return needLogin();
      if (user.status !== "active") return blocked();
      const category = clean(body.category, 20), title = clean(body.title, 80), text = cleanMulti(body.body, 5000).replace(/\n{4,}/g, "\n\n\n");
      if (!BOARD_CATS.includes(category)) return fail("말머리를 선택해 주세요.");
      if (title.length < 2) return fail("제목을 2자 이상 입력해 주세요.");
      if (text.length < 5) return fail("내용을 5자 이상 입력해 주세요.");
      if (await rateLimited(env, "u" + user.id, "post", 5, 10)) return fail("글을 잇달아 올릴 수 없습니다. 잠시 후 다시 시도해 주세요.", 429);
      if (await rateLimited(env, "u" + user.id, "post-day", 30, 1440)) return fail("하루에 올릴 수 있는 글 수를 넘었습니다.", 429);
      const r = await db.prepare("INSERT INTO posts (user_id, category, title, body, created_at, status, ip_hash) VALUES (?1, ?2, ?3, ?4, ?5, 'visible', ?6)").bind(user.id, category, title, text, now, ipHash).run();
      await bumpEvent(env, "post_create");
      return json({ ok: true, id: r.meta.last_row_id });
    }

    const cm = path.match(/^board\/comment\/(\d{1,9})\/(delete|report)$/);
    if (cm && method === "POST") {
      if (!user) return needLogin();
      const cid = parseInt(cm[1], 10);
      const c = await db.prepare("SELECT * FROM comments WHERE id = ?1").bind(cid).first();
      if (!c || c.status === "deleted") return fail("댓글을 찾을 수 없습니다.", 404, "not_found");
      if (cm[2] === "delete") {
        if (c.user_id !== user.id) return fail("본인이 쓴 댓글만 지울 수 있습니다.", 403, "forbidden");
        await db.batch([
          db.prepare("UPDATE comments SET status = 'deleted' WHERE id = ?1").bind(cid),
          db.prepare("UPDATE posts SET comment_count = (SELECT COUNT(*) FROM comments WHERE post_id = ?1 AND status = 'visible') WHERE id = ?1").bind(c.post_id),
          db.prepare("UPDATE ugc_reports SET status = 'resolved', handled_by = '글쓴이 삭제', handled_at = ?1 WHERE target_type = 'comment' AND target_id = ?2 AND status = 'open'").bind(now, cid),
        ]);
        return json({ ok: true });
      }
      return reportTarget(env, user, "comment", c, body, fail);
    }

    const bm = path.match(/^board\/(\d{1,9})(?:\/(like|comment|report|delete))?$/);
    if (bm) {
      const pid = parseInt(bm[1], 10), act = bm[2] || null;
      const p = await db.prepare("SELECT p.*, u.nickname FROM posts p LEFT JOIN users u ON u.id = p.user_id WHERE p.id = ?1").bind(pid).first();
      if (!p || p.status === "deleted") return fail("글을 찾을 수 없습니다. 삭제되었거나 주소가 바뀌었을 수 있습니다.", 404, "not_found");
      const mine = !!(user && p.user_id === user.id);

      if (method === "GET" && !act) {
        if (p.status === "hidden" && !mine) return fail("운영 원칙에 따라 숨김 처리된 글입니다.", 404, "hidden");
        const [cs, liked, saved] = await db.batch([
          db.prepare("SELECT c.id, c.user_id, c.body, c.created_at, c.status, u.nickname FROM comments c LEFT JOIN users u ON u.id = c.user_id WHERE c.post_id = ?1 AND c.status != 'deleted' ORDER BY c.id LIMIT 500").bind(pid),
          db.prepare("SELECT 1 AS x FROM post_likes WHERE post_id = ?1 AND user_id = ?2").bind(pid, user ? user.id : 0),
          db.prepare("SELECT 1 AS x FROM bookmarks WHERE user_id = ?1 AND key = ?2").bind(user ? user.id : 0, "post:" + pid),
        ]);
        if (!mine) context.waitUntil(db.prepare("UPDATE posts SET views = views + 1 WHERE id = ?1").bind(pid).run().catch(() => {}));
        return json({
          ok: true,
          post: { id: p.id, category: p.category, title: p.title, body: p.body, created_at: p.created_at, updated_at: p.updated_at, views: p.views + (mine ? 0 : 1), likes: p.like_count, comments: p.comment_count, pinned: !!p.pinned, author: authorOf(p), staff: !!p.author_label, status: p.status, hidden_reason: mine ? p.hidden_reason : null, mine, liked: liked.results.length > 0, saved: saved.results.length > 0 },
          comments: cs.results.map((c) => c.status === "hidden" ? { id: c.id, hidden: true, created_at: c.created_at } : { id: c.id, body: c.body, created_at: c.created_at, author: c.nickname || "탈퇴한 회원", mine: !!(user && c.user_id === user.id), op: c.user_id != null && c.user_id === p.user_id }),
          viewer: user ? { nickname: user.nickname, status: user.status } : null,
          categories: BOARD_CATS, reasons: REPORT_REASONS,
        });
      }
      if (method !== "POST") return json({ ok: false, error: "method_not_allowed" }, 405);
      if (!user) return needLogin();

      if (!act) { // 수정
        if (!mine) return fail("본인이 쓴 글만 고칠 수 있습니다.", 403, "forbidden");
        if (user.status !== "active") return blocked();
        if (p.status !== "visible") return fail("숨김 처리된 글은 고칠 수 없습니다. 문의: " + SUPPORT, 403, "forbidden");
        const category = clean(body.category, 20), title = clean(body.title, 80), text = cleanMulti(body.body, 5000).replace(/\n{4,}/g, "\n\n\n");
        if (!BOARD_CATS.includes(category)) return fail("말머리를 선택해 주세요.");
        if (title.length < 2) return fail("제목을 2자 이상 입력해 주세요.");
        if (text.length < 5) return fail("내용을 5자 이상 입력해 주세요.");
        await db.prepare("UPDATE posts SET category = ?1, title = ?2, body = ?3, updated_at = ?4 WHERE id = ?5").bind(category, title, text, now, pid).run();
        return json({ ok: true, id: pid });
      }
      if (act === "delete") {
        if (!mine) return fail("본인이 쓴 글만 지울 수 있습니다.", 403, "forbidden");
        await db.batch([
          db.prepare("UPDATE posts SET status = 'deleted', updated_at = ?1 WHERE id = ?2").bind(now, pid),
          db.prepare("DELETE FROM bookmarks WHERE key = ?1").bind("post:" + pid),
          db.prepare("UPDATE ugc_reports SET status = 'resolved', handled_by = '글쓴이 삭제', handled_at = ?1 WHERE status = 'open' AND ((target_type = 'post' AND target_id = ?2) OR (target_type = 'comment' AND target_id IN (SELECT id FROM comments WHERE post_id = ?2)))").bind(now, pid),
        ]);
        return json({ ok: true });
      }
      if (p.status !== "visible") return fail("숨김 처리된 글입니다.", 403, "forbidden");
      if (act === "like") {
        const ex = await db.prepare("SELECT 1 AS x FROM post_likes WHERE post_id = ?1 AND user_id = ?2").bind(pid, user.id).first();
        await db.batch([
          ex ? db.prepare("DELETE FROM post_likes WHERE post_id = ?1 AND user_id = ?2").bind(pid, user.id) : db.prepare("INSERT OR IGNORE INTO post_likes (post_id, user_id, created_at) VALUES (?1, ?2, ?3)").bind(pid, user.id, now),
          db.prepare("UPDATE posts SET like_count = (SELECT COUNT(*) FROM post_likes WHERE post_id = ?1) WHERE id = ?1").bind(pid),
        ]);
        const n = await db.prepare("SELECT like_count AS n FROM posts WHERE id = ?1").bind(pid).first();
        return json({ ok: true, liked: !ex, likes: n.n });
      }
      if (act === "comment") {
        if (user.status !== "active") return blocked();
        const text = cleanMulti(body.body, 1000).replace(/\n{3,}/g, "\n\n");
        if (text.length < 2) return fail("댓글을 2자 이상 입력해 주세요.");
        if (await rateLimited(env, "u" + user.id, "comment", 10, 5)) return fail("댓글을 잇달아 올릴 수 없습니다. 잠시 후 다시 시도해 주세요.", 429);
        const r = await db.prepare("INSERT INTO comments (post_id, user_id, body, created_at, status, ip_hash) VALUES (?1, ?2, ?3, ?4, 'visible', ?5)").bind(pid, user.id, text, now, ipHash).run();
        await db.prepare("UPDATE posts SET comment_count = (SELECT COUNT(*) FROM comments WHERE post_id = ?1 AND status = 'visible') WHERE id = ?1").bind(pid).run();
        await bumpEvent(env, "comment_create");
        return json({ ok: true, comment: { id: r.meta.last_row_id, body: text, created_at: now, author: user.nickname, mine: true, op: mine } });
      }
      if (act === "report") return reportTarget(env, user, "post", p, body, fail);
    }

    return json({ ok: false, error: "unknown_endpoint" }, 404);
  } catch (e) {
    return json({ ok: false, error: "db_error", message: "일시적인 문제가 생겼습니다. 잠시 후 다시 시도해 주세요." }, 500);
  }
}

// 신고 접수: 같은 회원은 한 대상에 한 번만. 신고가 쌓이면 운영자 확인 전까지 자동으로 숨긴다.
async function reportTarget(env, user, type, row, body, fail) {
  const db = env.DB;
  if (row.user_id === user.id) return fail("본인이 쓴 글은 신고할 수 없습니다.");
  if (row.author_label) return fail("운영팀 공지는 신고할 수 없습니다. 의견은 " + SUPPORT + " 으로 보내 주세요.");
  const reason = clean(body.reason, 30);
  if (!REPORT_REASONS.includes(reason)) return fail("신고 사유를 선택해 주세요.");
  if (await rateLimited(env, "u" + user.id, "ugcreport", 20, 60)) return fail("신고를 너무 많이 보냈습니다. 잠시 후 다시 시도해 주세요.", 429);
  const table = type === "post" ? "posts" : "comments";
  const r = await db.prepare("INSERT OR IGNORE INTO ugc_reports (target_type, target_id, user_id, reason, detail, created_at, status) VALUES (?1, ?2, ?3, ?4, ?5, ?6, 'open')")
    .bind(type, row.id, user.id, reason, clean(body.detail, 300) || null, nowIso()).run();
  if (!r.meta.changes) return json({ ok: true, already: true });
  const n = (await db.prepare("SELECT COUNT(*) AS n FROM ugc_reports WHERE target_type = ?1 AND target_id = ?2").bind(type, row.id).first()).n;
  const stmts = [db.prepare(`UPDATE ${table} SET report_count = ?1 WHERE id = ?2`).bind(n, row.id)];
  if (n >= AUTO_HIDE_REPORTS && row.status === "visible") {
    stmts.push(db.prepare(`UPDATE ${table} SET status = 'hidden', hidden_reason = '신고 누적으로 임시 숨김 (운영자 확인 중)' WHERE id = ?1`).bind(row.id));
    if (type === "comment") stmts.push(db.prepare("UPDATE posts SET comment_count = (SELECT COUNT(*) FROM comments WHERE post_id = ?1 AND status = 'visible' AND id != ?2) WHERE id = ?1").bind(row.post_id, row.id));
  }
  await db.batch(stmts);
  return json({ ok: true });
}
