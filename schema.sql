-- 바른혈압 D1 스키마 (버전 4)
--
-- 이 파일을 직접 실행하지 않아도 됩니다.
-- D1을 DB라는 이름으로 연결해 두면, 사이트의 API가 첫 요청 때 아래 표를 자동으로 만들고
-- 이전 버전 데이터베이스에는 필요한 열을 자동으로 추가합니다.
-- 수동으로 만들고 싶을 때만 Cloudflare 대시보드 > D1 > (데이터베이스) > Console 에 붙여넣어 실행하세요.
--
-- 원칙: 혈압 원값(개인 건강정보)은 서버에 저장하지 않는다.

-- 커뮤니티 질문·경험담
CREATE TABLE IF NOT EXISTS qna (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL,
  nickname TEXT NOT NULL,
  category TEXT,
  question TEXT NOT NULL,
  answer TEXT,
  answered_at TEXT,
  status TEXT NOT NULL DEFAULT 'pending',   -- pending | draft | review | published | hidden
  ip_hash TEXT,
  ua TEXT,
  updated_at TEXT,
  handled_by TEXT,
  question_original TEXT,                   -- 운영자가 개인정보를 지우기 전 원문 (비공개)
  review_note TEXT,
  reviewed_by TEXT,
  reviewed_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_qna_status ON qna(status, created_at);

-- 기관 협력 문의·기능 사전 신청
CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL,
  type TEXT NOT NULL,          -- clinic | checkup | corporate | public | device | family | other
  org TEXT,
  name TEXT,
  contact TEXT NOT NULL,
  message TEXT,
  ip_hash TEXT,
  ua TEXT,
  status TEXT DEFAULT 'new',   -- new | contacted | progress | done | hold
  memo TEXT,
  updated_at TEXT,
  handled_by TEXT
);

-- 주간 혈압 레터 구독자
CREATE TABLE IF NOT EXISTS newsletter (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  source TEXT,
  unsubscribed_at TEXT,
  token TEXT                   -- 수신거부 링크용 임의 값
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_newsletter_token ON newsletter(token);

-- 팩트체크 요청
CREATE TABLE IF NOT EXISTS factcheck_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL,
  claim TEXT NOT NULL,
  source_url TEXT,
  contact TEXT,
  status TEXT NOT NULL DEFAULT 'pending',   -- pending | reviewing | published | rejected | duplicate
  ip_hash TEXT,
  memo TEXT,
  published_url TEXT,
  updated_at TEXT,
  handled_by TEXT
);

-- 접수 속도 제한
CREATE TABLE IF NOT EXISTS rate_limits (
  id TEXT PRIMARY KEY,
  hits INTEGER NOT NULL DEFAULT 0,
  bucket INTEGER
);

-- 콘텐츠 의료진 감수 기록 (승인 + 실명 공개 동의일 때만 공개 화면에 감수자 표시)
CREATE TABLE IF NOT EXISTS content_reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  path TEXT NOT NULL,
  title TEXT,
  reviewer_name TEXT NOT NULL,
  reviewer_title TEXT,
  reviewer_org TEXT,
  reviewed_at TEXT NOT NULL,
  result TEXT NOT NULL,        -- approved | revise
  note TEXT,
  name_public INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  created_by TEXT
);
CREATE INDEX IF NOT EXISTS idx_reviews_path ON content_reviews(path, reviewed_at);

-- 정정 이력 (공개, 삭제하지 않음)
CREATE TABLE IF NOT EXISTS corrections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  target_path TEXT,
  target_title TEXT,
  content TEXT NOT NULL,
  reason TEXT,
  created_at TEXT NOT NULL,
  created_by TEXT,
  updated_at TEXT
);

-- 사이트 설정 (공지 띠 등)
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TEXT,
  updated_by TEXT
);

-- 관리자 활동 기록
CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts TEXT NOT NULL,
  actor TEXT,
  role TEXT,
  action TEXT NOT NULL,
  target TEXT,
  detail TEXT
);
CREATE INDEX IF NOT EXISTS idx_audit_ts ON audit_log(ts);

-- 익명 이용 통계 (날짜별 합계만. 개인 식별자 없음)
CREATE TABLE IF NOT EXISTS stats_daily (
  day TEXT NOT NULL,           -- KST 날짜
  kind TEXT NOT NULL,          -- pv | pv_total | ref | visitor | event | search
  key TEXT NOT NULL,
  n INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, kind, key)
);
CREATE INDEX IF NOT EXISTS idx_stats_kind ON stats_daily(kind, day);

-- ============================================================
-- 버전 4: 회원 · 저장한 글 · 자유게시판 · 영상
-- ============================================================

-- 회원. 비밀번호 원문은 서버에 오지 않는다.
-- 브라우저가 PBKDF2로 변환한 값을 받아 pw_salt로 한 번 더 HMAC 처리한 값만 pw_hash에 저장한다.
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,            -- 로그인 아이디 (탈퇴 시 deleted_... 로 바꿈)
  nickname TEXT,                            -- 게시판 표시 이름 (탈퇴 시 NULL)
  email TEXT,                               -- 선택. 비밀번호 분실 시 본인 확인용
  pw_hash TEXT,
  pw_salt TEXT,
  pw_ver INTEGER NOT NULL DEFAULT 1,
  recovery_hash TEXT,                       -- 복구 코드의 변환값
  created_at TEXT NOT NULL,
  last_login_at TEXT,
  status TEXT NOT NULL DEFAULT 'active',    -- active | suspended | deleted
  session_ver INTEGER NOT NULL DEFAULT 1,   -- 올리면 기존 로그인이 모두 풀린다
  must_change_pw INTEGER NOT NULL DEFAULT 0,
  agreed_at TEXT,
  memo TEXT,                                -- 운영자 메모 (비공개)
  updated_at TEXT,
  handled_by TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_nickname ON users(nickname);

-- 서버가 스스로 만든 비밀값 (회원 로그인 쿠키 서명용). 내보내기에 포함하지 않는다.
CREATE TABLE IF NOT EXISTS app_secrets (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- 저장한 글 (key: 글 주소 또는 post:<게시글 번호>)
CREATE TABLE IF NOT EXISTS bookmarks (
  user_id INTEGER NOT NULL,
  key TEXT NOT NULL,
  title TEXT,
  created_at TEXT NOT NULL,
  PRIMARY KEY (user_id, key)
);

-- 자유게시판 글
CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  author_label TEXT,                        -- 공지일 때 '바른혈압 운영팀'
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT,
  status TEXT NOT NULL DEFAULT 'visible',   -- visible | hidden | deleted
  pinned INTEGER NOT NULL DEFAULT 0,
  views INTEGER NOT NULL DEFAULT 0,
  like_count INTEGER NOT NULL DEFAULT 0,
  comment_count INTEGER NOT NULL DEFAULT 0,
  report_count INTEGER NOT NULL DEFAULT 0,
  hidden_reason TEXT,
  handled_by TEXT,
  ip_hash TEXT
);
CREATE INDEX IF NOT EXISTS idx_posts_list ON posts(status, pinned, id);
CREATE INDEX IF NOT EXISTS idx_posts_user ON posts(user_id);

-- 댓글
CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL,
  user_id INTEGER,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'visible',   -- visible | hidden | deleted
  report_count INTEGER NOT NULL DEFAULT 0,
  hidden_reason TEXT,
  handled_by TEXT,
  ip_hash TEXT
);
CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id, id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id);

-- 공감 (글 하나에 회원당 한 번)
CREATE TABLE IF NOT EXISTS post_likes (
  post_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (post_id, user_id)
);

-- 글·댓글 신고 (같은 대상을 같은 회원이 두 번 신고할 수 없음. 서로 다른 5명이 신고하면 자동 임시 숨김)
CREATE TABLE IF NOT EXISTS ugc_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  target_type TEXT NOT NULL,                -- post | comment
  target_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  reason TEXT NOT NULL,
  detail TEXT,
  created_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',      -- open | resolved
  handled_by TEXT,
  handled_at TEXT,
  UNIQUE (target_type, target_id, user_id)
);

-- 운영자가 관리자 콘솔에서 추가한 영상 (기본 영상은 사이트 페이지에 들어 있음)
CREATE TABLE IF NOT EXISTS videos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  youtube_id TEXT NOT NULL,
  title TEXT NOT NULL,
  source TEXT,
  category TEXT,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'visible',   -- visible | hidden
  sort INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  created_by TEXT
);
