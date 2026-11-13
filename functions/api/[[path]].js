/**
 * 바른혈압 — Cloudflare Pages Functions API
 * 경로: /api/*
 *
 * D1 바인딩명: DB   (Cloudflare Pages > Settings > Bindings > D1 database)
 * 환경변수:   ADMIN_KEY  (관리 조회용 비밀 키)
 *
 * 데이터베이스가 아직 연결되지 않은 경우 {ok:false, error:"not_configured"}를 돌려주고,
 * 프론트엔드는 이메일 링크로 대체 안내합니다. 따라서 DB 연결 전에도 사이트는 정상 동작합니다.
 */

const JSON_HEADERS = { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" };

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}

function clean(v, max) {
  if (v === undefined || v === null) return "";
  return String(v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim().slice(0, max);
}

function isEmail(s) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

async function readBody(request) {
  try { return await request.json(); } catch (e) { return null; }
}

// 간단한 IP 기준 속도 제한 (D1의 rate_limits 테이블 사용, 분당 N회)
async function rateLimited(env, ip, key, limitPerMin) {
  try {
    const bucket = Math.floor(Date.now() / 60000);
    const id = `${key}:${ip}:${bucket}`;
    await env.DB.prepare("INSERT INTO rate_limits (id, hits) VALUES (?1, 1) ON CONFLICT(id) DO UPDATE SET hits = hits + 1").bind(id).run();
    const row = await env.DB.prepare("SELECT hits FROM rate_limits WHERE id = ?1").bind(id).first();
    return row && row.hits > limitPerMin;
  } catch (e) {
    return false;
  }
}

export async function onRequest(context) {
  const { request, env, params } = context;
  const path = (params.path || []).join("/");
  const ip = request.headers.get("CF-Connecting-IP") || "0.0.0.0";

  // 헬스체크
  if (path === "health") {
    return json({ ok: true, db: !!env.DB, time: new Date().toISOString() });
  }

  // 공개 조회: 게시된 Q&A
  if (path === "qna" && request.method === "GET") {
    if (!env.DB) return json({ ok: false, error: "not_configured" }, 503);
    try {
      const { results } = await env.DB.prepare(
        "SELECT id, created_at, nickname, category, question, answer, answered_at FROM qna WHERE status = 'published' ORDER BY COALESCE(answered_at, created_at) DESC LIMIT 20"
      ).all();
      return json({ ok: true, items: results });
    } catch (e) {
      return json({ ok: false, error: "db_error" }, 500);
    }
  }

  // 관리자 조회 (?key=ADMIN_KEY)
  if (path.startsWith("admin/") && request.method === "GET") {
    const url = new URL(request.url);
    if (!env.ADMIN_KEY || url.searchParams.get("key") !== env.ADMIN_KEY) return json({ ok: false, error: "unauthorized" }, 401);
    if (!env.DB) return json({ ok: false, error: "not_configured" }, 503);
    const table = path.slice(6);
    const allowed = { qna: "SELECT * FROM qna ORDER BY created_at DESC LIMIT 200", leads: "SELECT * FROM leads ORDER BY created_at DESC LIMIT 200", newsletter: "SELECT * FROM newsletter ORDER BY created_at DESC LIMIT 500", reports: "SELECT * FROM factcheck_reports ORDER BY created_at DESC LIMIT 200" };
    if (!allowed[table]) return json({ ok: false, error: "unknown" }, 404);
    const { results } = await env.DB.prepare(allowed[table]).all();
    return json({ ok: true, items: results });
  }

  // 관리자: Q&A 답변/게시 (POST /api/admin/qna/answer {key,id,answer,status})
  if (path === "admin/qna/answer" && request.method === "POST") {
    const b = await readBody(request);
    if (!b || !env.ADMIN_KEY || b.key !== env.ADMIN_KEY) return json({ ok: false, error: "unauthorized" }, 401);
    if (!env.DB) return json({ ok: false, error: "not_configured" }, 503);
    const status = ["pending", "published", "hidden"].includes(b.status) ? b.status : "published";
    await env.DB.prepare("UPDATE qna SET answer = ?1, status = ?2, answered_at = ?3 WHERE id = ?4").bind(clean(b.answer, 4000), status, new Date().toISOString(), Number(b.id)).run();
    return json({ ok: true });
  }

  if (request.method !== "POST") return json({ ok: false, error: "method_not_allowed" }, 405);
  if (!env.DB) return json({ ok: false, error: "not_configured" }, 503);

  const body = await readBody(request);
  if (!body) return json({ ok: false, error: "잘못된 요청입니다." }, 400);
  if (body.website) return json({ ok: true }); // honeypot: 조용히 성공 처리

  const now = new Date().toISOString();
  const ua = clean(request.headers.get("User-Agent"), 200);

  try {
    // ---- 커뮤니티 질문
    if (path === "qna") {
      if (await rateLimited(env, ip, "qna", 5)) return json({ ok: false, error: "잠시 후 다시 시도해 주세요." }, 429);
      const nickname = clean(body.nickname, 20), category = clean(body.category, 20), topic = clean(body.topic, 40);
      const question = (topic ? "[" + topic + "] " : "") + clean(body.question, 600);
      if (!nickname || question.length < 5) return json({ ok: false, error: "닉네임과 질문을 확인해 주세요." }, 400);
      await env.DB.prepare("INSERT INTO qna (created_at, nickname, category, question, status, ip_hash, ua) VALUES (?1, ?2, ?3, ?4, 'pending', ?5, ?6)")
        .bind(now, nickname, category, question, await hash(ip), ua).run();
      return json({ ok: true });
    }

    // ---- 협력·기능 신청
    if (path === "lead") {
      if (await rateLimited(env, ip, "lead", 5)) return json({ ok: false, error: "잠시 후 다시 시도해 주세요." }, 429);
      const type = clean(body.type, 20) || "other", org = clean(body.org, 100), name = clean(body.name, 50), contact = clean(body.contact, 100), message = clean(body.message, 2000);
      if (!contact) return json({ ok: false, error: "연락처를 입력해 주세요." }, 400);
      await env.DB.prepare("INSERT INTO leads (created_at, type, org, name, contact, message, ip_hash, ua) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)")
        .bind(now, type, org, name, contact, message, await hash(ip), ua).run();
      return json({ ok: true });
    }

    // ---- 뉴스레터
    if (path === "newsletter") {
      if (await rateLimited(env, ip, "nl", 5)) return json({ ok: false, error: "잠시 후 다시 시도해 주세요." }, 429);
      const email = clean(body.email, 120).toLowerCase();
      if (!isEmail(email)) return json({ ok: false, error: "이메일 형식을 확인해 주세요." }, 400);
      await env.DB.prepare("INSERT INTO newsletter (created_at, email, source) VALUES (?1, ?2, ?3) ON CONFLICT(email) DO UPDATE SET unsubscribed_at = NULL")
        .bind(now, email, clean(body.source, 50) || "site").run();
      return json({ ok: true });
    }

    // ---- 팩트체크 요청
    if (path === "report") {
      if (await rateLimited(env, ip, "rep", 5)) return json({ ok: false, error: "잠시 후 다시 시도해 주세요." }, 429);
      const claim = clean(body.claim, 500), source_url = clean(body.source_url, 500), contact = clean(body.contact, 120);
      if (claim.length < 5) return json({ ok: false, error: "검증할 주장을 입력해 주세요." }, 400);
      await env.DB.prepare("INSERT INTO factcheck_reports (created_at, claim, source_url, contact, status, ip_hash) VALUES (?1, ?2, ?3, ?4, 'pending', ?5)")
        .bind(now, claim, source_url, contact, await hash(ip)).run();
      return json({ ok: true });
    }

    return json({ ok: false, error: "unknown_endpoint" }, 404);
  } catch (e) {
    return json({ ok: false, error: "db_error" }, 500);
  }
}

async function hash(s) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s + ":bareun"));
  return Array.from(new Uint8Array(buf)).slice(0, 8).map((b) => b.toString(16).padStart(2, "0")).join("");
}
