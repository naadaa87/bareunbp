-- 바른혈압 D1 스키마
-- 적용: Cloudflare 대시보드 > Workers & Pages > D1 > (데이터베이스) > Console 에 아래 전체를 붙여넣고 실행
-- 원칙: 혈압 원값(개인 건강정보)은 서버에 저장하지 않는다. 아래 표는 문의·질문·구독만 다룬다.

CREATE TABLE IF NOT EXISTS qna (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL,
  nickname TEXT NOT NULL,
  category TEXT,
  question TEXT NOT NULL,
  answer TEXT,
  answered_at TEXT,
  status TEXT NOT NULL DEFAULT 'pending',   -- pending | published | hidden
  ip_hash TEXT,
  ua TEXT
);
CREATE INDEX IF NOT EXISTS idx_qna_status ON qna(status, created_at);

CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL,
  type TEXT NOT NULL,          -- clinic | checkup | corporate | public | device | family | other
  org TEXT,
  name TEXT,
  contact TEXT NOT NULL,
  message TEXT,
  ip_hash TEXT,
  ua TEXT
);

CREATE TABLE IF NOT EXISTS newsletter (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  source TEXT,
  unsubscribed_at TEXT
);

CREATE TABLE IF NOT EXISTS factcheck_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL,
  claim TEXT NOT NULL,
  source_url TEXT,
  contact TEXT,
  status TEXT NOT NULL DEFAULT 'pending',   -- pending | published | rejected
  ip_hash TEXT
);

CREATE TABLE IF NOT EXISTS rate_limits (
  id TEXT PRIMARY KEY,
  hits INTEGER NOT NULL DEFAULT 0
);

-- (2단계) 클라우드 기록 동기화 — 별도 동의 절차·보안 설계 완료 후에만 생성할 것
-- CREATE TABLE IF NOT EXISTS bp_sync (
--   id INTEGER PRIMARY KEY AUTOINCREMENT,
--   user_token TEXT NOT NULL,
--   created_at TEXT NOT NULL,
--   payload TEXT NOT NULL,       -- 암호화된 JSON
--   consent_version TEXT NOT NULL
-- );
