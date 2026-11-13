# 바른혈압 홈페이지 · 배포 가이드

이 폴더가 그대로 웹사이트입니다. 빌드(변환) 과정이 없어서 GitHub에 올리고 Cloudflare Pages에 연결하면 바로 열립니다.

---

## 1단계. GitHub에 올리기 (10분)

1. https://github.com 로그인 → 오른쪽 위 **+** → **New repository**
2. Repository name: `bareunbp` (아무 이름이나 됩니다) → **Private** 선택 → **Create repository**
3. 만들어진 화면에서 **uploading an existing file** 링크 클릭
4. 이 폴더 안의 **모든 파일과 폴더**를 드래그해서 올립니다.
   - `index.html`, `assets`, `functions`, `info`, `factcheck`, `_headers`, `_redirects`, `schema.sql` 등 전부
   - 폴더째로 드래그하면 안의 파일까지 올라갑니다. 파일이 60개가 넘으므로 한 번에 안 되면 폴더 단위로 나눠 올리세요.
5. 아래 **Commit changes** 클릭

---

## 2단계. Cloudflare Pages 연결 (10분)

1. https://dash.cloudflare.com 로그인 → 왼쪽 **Workers & Pages** → **Create** → **Pages** 탭 → **Connect to Git**
2. GitHub 계정 연결 → 방금 만든 저장소 선택 → **Begin setup**
3. 설정값:
   - Project name: `bareunbp` (이게 임시 주소가 됩니다: `bareunbp.pages.dev`)
   - Production branch: `main`
   - Framework preset: **None**
   - Build command: **비워둠**
   - Build output directory: `/` (슬래시 하나)
4. **Save and Deploy** → 1~2분 뒤 `https://bareunbp.pages.dev` 에서 사이트가 열립니다.

여기까지 하면 **사이트의 모든 페이지와 7일 기록·리포트 도구가 정상 동작**합니다.
기록은 이용자의 브라우저에만 저장되므로 서버가 없어도 됩니다.
문의·질문·구독 폼만 "접수 서버가 아직 연결되지 않았습니다 → 이메일로 보내기"로 안내됩니다.
3단계를 마치면 폼이 데이터베이스에 저장됩니다.

---

## 3단계. 데이터베이스(D1) 연결 (15분)

문의·커뮤니티 질문·뉴스레터 구독·팩트체크 요청을 저장하는 단계입니다.

### 3-1. 데이터베이스 만들기
1. Cloudflare 대시보드 → **Workers & Pages** → **D1 SQL Database** → **Create**
2. 이름: `bareunbp` → **Create**
3. 만들어진 데이터베이스 화면에서 **Console** 탭 클릭
4. 이 폴더의 `schema.sql` 파일을 메모장으로 열어 **전체 복사** → Console에 붙여넣기 → **Execute**
   - "5 tables created" 같은 결과가 나오면 성공입니다.

### 3-2. 사이트와 연결하기
1. **Workers & Pages** → `bareunbp` 프로젝트 클릭 → **Settings** 탭
2. **Bindings** (또는 Functions → D1 database bindings) → **Add** → **D1 database**
   - Variable name: `DB` (대문자, 정확히)
   - D1 database: `bareunbp` 선택 → **Save**
3. 같은 Settings에서 **Variables and Secrets** → **Add**
   - Type: **Secret**
   - Variable name: `ADMIN_KEY`
   - Value: 아무 긴 비밀번호 (예: 영문+숫자 20자 이상). 이 값은 접수 내역을 조회할 때 씁니다. 메모해 두세요.
   - **Save**
4. **Deployments** 탭 → 최신 배포 오른쪽 **⋯** → **Retry deployment** (바인딩을 반영하려면 한 번 재배포)

### 3-3. 확인
- 브라우저에서 `https://bareunbp.pages.dev/api/health` 를 열어 `"db":true` 가 보이면 연결된 것입니다.
- 사이트의 커뮤니티 페이지에서 질문을 하나 보내보고 "접수됐습니다"가 뜨면 완료입니다.

---

## 4단계. 도메인 연결 (선택)

1. `bareunbp` 프로젝트 → **Custom domains** → **Set up a custom domain** → 도메인 입력
2. 도메인이 Cloudflare에 등록돼 있으면 자동으로 연결됩니다. 다른 곳에서 샀다면 안내되는 CNAME 값을 도메인 업체 DNS에 넣으면 됩니다.
3. **도메인이 확정되면** 사이트 안의 주소 표기(`https://bareunbp.com`, canonical·sitemap·OG 태그)를 실제 도메인으로 바꿔야 검색 엔진에 정확히 잡힙니다. 사이트 동작에는 영향이 없지만 **검색엔진 등록 전에는 꼭 바꿔야** 합니다(sitemap.xml·rss.xml 주소가 이 값으로 만들어집니다). 바꿀 때는 파일 전체에서 `https://bareunbp.com` 을 실제 주소로 치환하면 됩니다(요청 주시면 일괄 교체해 드립니다).

---

## 접수 내역 보는 법

브라우저 주소창에 아래를 입력합니다. `비밀키` 자리에 3-2에서 정한 ADMIN_KEY를 넣습니다.

| 내용 | 주소 |
|---|---|
| 커뮤니티 질문 전체 | `https://bareunbp.pages.dev/api/admin/qna?key=비밀키` |
| 협력·가족기능 신청 | `https://bareunbp.pages.dev/api/admin/leads?key=비밀키` |
| 뉴스레터 구독자 | `https://bareunbp.pages.dev/api/admin/newsletter?key=비밀키` |
| 팩트체크 요청 | `https://bareunbp.pages.dev/api/admin/reports?key=비밀키` |

커뮤니티 질문에 답을 달아 공개하려면 D1 **Console**에서 아래처럼 실행합니다(번호와 답변만 바꾸면 됩니다).

```sql
UPDATE qna SET answer = '여기에 답변', status = 'published', answered_at = datetime('now') WHERE id = 1;
```

공개된 질문은 커뮤니티 페이지 상단 "최근 질문"에 자동으로 표시됩니다. 관리 화면(웹 UI)이 필요하면 다음 단계에서 추가할 수 있습니다.

---

## 폴더 구성

| 경로 | 내용 |
|---|---|
| `index.html` | 홈 |
| `measure/` | 바르게 재기 (측정 전 체크리스트) |
| `check7/` | 7일 혈압 기록 (브라우저 저장) |
| `report/` | 진료 준비 리포트 (A4 인쇄, 복약 체크 요약 포함) |
| `info/` | 건강정보 28편 (진단·기준, 증상·응급, 측정, 생활, 약물, 합병증, 생애주기) |
| `food/` | 음식·식단 8편, 외식 나트륨표, `food/recipes/` 저염 레시피 10개 |
| `factcheck/` | 팩트체크 10건 + 검증 요청 폼 |
| `tools/` | 도구 모음 — 측정 타이머, 나트륨 계산기, 복약 체크, 측정 알림(캘린더 파일), 기록 백업·복원, 인쇄용 기록지 |
| `glossary/`, `faq/`, `search/` | 용어사전 47개, 자주 묻는 질문 30개, 사이트 검색 |
| `community/` | 질문과 답변, 경험 나누기, `community/challenges/` 챌린지 4종 |
| `devices/`, `products/` | 혈압계 가이드, 관리용품 가이드 |
| `clinic/`, `family/`, `partners/` | 진료 준비·병의원, 가족 관리, 기관 협력 |
| `about/`, `policy/` | 소개, 편집·감수·정정 정책, 정정 이력, 개인정보, 약관 |
| `functions/api/` | 접수 API (Cloudflare Pages Functions, D1) |
| `schema.sql` | 데이터베이스 표 정의 |
| `sitemap.xml`, `rss.xml`, `robots.txt` | 검색엔진 제출용 |
| `search-index.json` | 사이트 검색용 색인 |
| `manifest.webmanifest` | 휴대폰 홈 화면에 추가할 때 쓰는 앱 정보 |
| `_headers`, `_redirects` | 보안 헤더, 주소 정리 |

---

## 검색엔진 등록 (오픈 직후 1회)

검색 노출은 등록 후 보통 수일~수주가 걸립니다. 도메인을 확정한 뒤에 하세요.

### 네이버 서치어드바이저
1. https://searchadvisor.naver.com 로그인 → **웹마스터 도구** → 사이트 등록에 `https://도메인` 입력
2. 소유확인 방식에서 **HTML 파일 업로드**를 고르고 파일(예: `naverxxxx.html`)을 내려받습니다.
3. 그 파일을 GitHub 저장소 **맨 위 폴더**에 업로드(Add file → Upload files → Commit) → 1~2분 뒤 네이버에서 **소유확인** 클릭
4. 왼쪽 메뉴 **요청 → 사이트맵 제출**: `https://도메인/sitemap.xml`
5. **요청 → RSS 제출**: `https://도메인/rss.xml`
6. **검증 → 웹 페이지 최적화**로 홈 주소를 한 번 점검합니다.

### 구글 서치 콘솔
1. https://search.google.com/search-console → 속성 추가 → **도메인** 방식에 도메인 입력
2. 안내되는 TXT 레코드를 Cloudflare 대시보드 → 도메인 → **DNS → Add record**(Type: TXT)에 붙여넣기 → 확인
3. **Sitemaps** 메뉴에 `sitemap.xml` 제출

### 다음(카카오)
https://register.search.daum.net 에서 사이트 URL을 등록합니다.

확인 코드를 메타 태그 방식으로 받으셨다면 코드를 알려주세요. 사이트 전체에 넣어 드립니다.

---

## 오픈 전 꼭 확인할 것

- [ ] 의료진 감수: 현재 모든 글이 **"의료진 감수 예정"** 으로 표시돼 있습니다. 감수가 끝난 글부터 감수자 실명·소속으로 바꿔주세요. 감수 없이 "감수 완료"로 바꾸면 안 됩니다.
- [ ] 법률 검토: `check7/`(기록), `report/`(리포트), `family/`(가족 공유 예고), `community/`(Q&A) 기능 단위로 의료법·개인정보보호법 검토를 받으세요.
- [ ] 연락처: 사이트 곳곳의 이메일·전화번호가 실제 운영 연락처인지 확인하세요.
- [ ] 뉴스레터: 구독자가 모이면 발송 도구(예: Stibee, Mailchimp)와 연결이 필요합니다. 구독자 목록은 위 admin 주소에서 내려받을 수 있습니다.

---

## 콘텐츠 수정

각 페이지는 일반 HTML 파일이라 GitHub에서 직접 열어 글을 고치고 저장(Commit)하면 1~2분 뒤 사이트에 반영됩니다. 글을 새로 여러 편 추가하거나 구조를 바꿀 때는 생성기(별도 제공)로 다시 만드는 것이 빠릅니다.
