# -*- coding: utf-8 -*-
"""바른혈압 정적 사이트 생성기 — 공통 레이아웃"""
import os, re, json, html

SITE = "https://bareunbp.com"   # 실제 도메인 확정 후 README 안내대로 일괄 치환
BRAND = "바른혈압"
TAGLINE = "올바른 정보, 건강한 오늘"
REVIEW_DATE = "2026-11-07"
FIRST_PUBLISHED = "2026-09-04"
NEW_DATE = "2026-11-14"
MALL_DATE = "2026-11-18"     # 바른혈압몰·KPI 추가일
LAUNCH_DATE = "2026-11-16"   # 정식 오픈일      # 3차 확충분의 작성·검토일
# 검색엔진 소유확인 코드 — 발급받으면 따옴표 안에 넣고 다시 빌드 (README 참고)
NAVER_VERIFY = "c319690d7b48cb8034329f4bbce2c30dcc63eab2"   # 네이버 서치어드바이저 (https://bareunbp.com)
GOOGLE_VERIFY = ""
# 빌드 결과는 저장소 루트(= Cloudflare Pages 배포 폴더)에 기록
OUT = os.environ.get("BP_OUT") or os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))

NAV = [
    ("/measure/", "바르게 재기"),
    ("/check7/", "7일 기록"),
    ("/info/", "건강정보"),
    ("/food/", "음식·식단"),
    ("/factcheck/", "팩트체크"),
    ("/tools/", "도구"),
    ("/community/", "커뮤니티"),
    ("/clinic/", "진료 준비"),
    ("/mall/", "바른혈압몰"),
]

ICONS = {
    "check": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
    "cuff": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M7 12h2l1.5-3 3 6 1.5-3h2"/></svg>',
    "calendar": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M8 2v4M16 2v4M3 10h18"/><path d="M8 14h3M13 14h3M8 18h3"/></svg>',
    "doc": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h6"/></svg>',
    "book": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
    "shield": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>',
    "family": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.5"/><circle cx="17" cy="9" r="2.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M15 20a5 5 0 0 1 6.5-4.8"/></svg>',
    "pin": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg>',
    "chat": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    "search": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>',
    "bowl": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11h18a9 9 0 0 1-18 0z"/><path d="M8 7c0-1.5 1-2 1-3.5M12 7c0-1.5 1-2 1-3.5M16 7c0-1.5 1-2 1-3.5"/></svg>',
    "timer": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M9 2h6"/></svg>',
    "bell": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>',
    "pill": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7z"/><path d="m8.5 8.5 7 7"/></svg>',
    "save": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5M12 15V3"/></svg>',
    "flag": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><path d="M4 22v-7"/></svg>',
    "print": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9V2h12v7"/><rect x="6" y="14" width="12" height="8"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/></svg>',
    "leaf": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6"/></svg>',
    "user": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
    "video": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="m10 9 5 3-5 3z"/></svg>',
    "library": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4v16M9 4v16M14 5l5 15"/><path d="M4 8h5M4 16h5"/></svg>',
    "bag": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 8h14l-1 12H6L5 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>',
    "chart": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V4M4 20h16"/><path d="M8 16v-5M12 16V8M16 16v-8"/></svg>',
    "board": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>',
    "device": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="3" width="14" height="18" rx="3"/><path d="M9 8h6M9 12h6M12 16h.01"/></svg>',
}


def esc(s):
    return html.escape(s, quote=True)


def pretty(p):
    """Cloudflare Pages는 .html 주소를 확장자 없는 주소로 308 이동시키므로, 표준 주소도 확장자 없이 쓴다."""
    if p.endswith("/index.html"):
        return p[: -len("index.html")]
    if p.endswith(".html"):
        return p[: -len(".html")]
    return p


_ASSET_REF = re.compile(r'((?:src|href)="/assets/(?:js|css)/[\w.\-]+\.(?:js|css))"')
_asset_v = {}


def _versioned(m):
    """정적 파일이 바뀌면 주소가 바뀌도록 내용 해시를 붙인다 (/assets는 7일 캐시)."""
    ref = m.group(1)
    rel = ref.split('"', 1)[1].lstrip("/")
    if rel not in _asset_v:
        import hashlib
        try:
            with open(os.path.join(OUT, rel), "rb") as f:
                _asset_v[rel] = hashlib.md5(f.read()).hexdigest()[:8]
        except OSError:
            _asset_v[rel] = ""
    v = _asset_v[rel]
    return ref + ("?v=" + v if v else "") + '"'


_HREF_HTML = re.compile(r'href="(/[^"#?]*?\.html)((?:[#?][^"]*)?)"')


def head(title, desc, path, og_image="/assets/img/og.jpg", jsonld=None, noindex=False, keywords=None, og_type="website", modified=None):
    full = f"{title} | {BRAND}" if title != BRAND else f"{BRAND} — 고혈압·혈압 관리 정보와 7일 기록"
    ld = ""
    if jsonld:
        ld = "\n".join(f'<script type="application/ld+json">{json.dumps(j, ensure_ascii=False)}</script>' for j in (jsonld if isinstance(jsonld, list) else [jsonld]))
    kw = ", ".join(keywords) if keywords else "고혈압, 혈압, 혈압 정상수치, 가정혈압, 혈압 재는 법, 혈압 낮추는 법, 저염식, 바른혈압"
    verify = ""
    if NAVER_VERIFY:
        verify += f'<meta name="naver-site-verification" content="{esc(NAVER_VERIFY)}">\n'
    if GOOGLE_VERIFY:
        verify += f'<meta name="google-site-verification" content="{esc(GOOGLE_VERIFY)}">\n'
    art = ""
    if og_type == "article":
        art = f'<meta property="article:published_time" content="{FIRST_PUBLISHED}T09:00:00+09:00">\n<meta property="article:modified_time" content="{modified or REVIEW_DATE}T09:00:00+09:00">\n<meta property="article:section" content="건강">\n'
    robots = '<meta name="robots" content="noindex, follow">' if noindex else '<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">'
    return f"""<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(full)}</title>
<meta name="description" content="{esc(desc)}">
<meta name="keywords" content="{esc(kw)}">
{robots}
{verify}<link rel="canonical" href="{SITE}{pretty(path)}">
<link rel="alternate" type="application/rss+xml" title="{BRAND} 새 글" href="{SITE}/rss.xml">
<meta property="og:type" content="{og_type}">
<meta property="og:locale" content="ko_KR">
<meta property="og:site_name" content="{BRAND}">
<meta property="og:title" content="{esc(full)}">
<meta property="og:description" content="{esc(desc)}">
<meta property="og:image" content="{SITE}{og_image}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:url" content="{SITE}{pretty(path)}">
{art}<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{esc(full)}">
<meta name="twitter:description" content="{esc(desc)}">
<meta name="twitter:image" content="{SITE}{og_image}">
<meta name="theme-color" content="#0e2a47">
<meta name="format-detection" content="telephone=no">
<link rel="icon" type="image/png" href="/assets/img/favicon.png">
<link rel="apple-touch-icon" href="/assets/img/apple-touch-icon.png">
<link rel="manifest" href="/manifest.webmanifest">
<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css">
<link rel="stylesheet" href="/assets/css/site.css">
{ld}
</head>"""


def header():
    items = "".join(f'<a href="{h}">{t}</a>' for h, t in NAV)
    return f"""<div class="notice-bar"><div class="wrap"><span>글마다 근거와 최종 검토일을 밝히고, 의료진 감수가 끝난 글에는 감수자를 표기합니다. <a href="/about/#review">운영 원칙 보기</a></span><span class="no-print">이 사이트는 의료기관이 아닙니다</span></div></div>
<header class="site-header">
<div class="wrap">
<a class="brand" href="/" aria-label="{BRAND} 홈"><img src="/assets/img/logo.png" srcset="/assets/img/logo@2x.png 2x" alt="{BRAND}" width="109" height="40"></a>
<nav class="nav" aria-label="주요 메뉴">{items}</nav>
<div class="header-cta">
<a class="icon-btn" href="/search/" aria-label="사이트 검색">{ICONS['search']}</a>
<a class="user-link" href="/account/login/" data-user-link aria-label="로그인">{ICONS['user']}<span>로그인</span></a>
<a class="btn btn--primary btn--sm" href="/check7/">7일 기록 시작</a>
<button class="menu-btn" aria-label="메뉴 열기" aria-expanded="false"><span></span></button>
</div>
</div>
</header>"""


def footer(extra_js=""):
    return f"""<footer class="site-footer">
<div class="wrap">
<div class="footer-notice">
<div><b>이 사이트는 의료기관이 아닙니다.</b> 바른혈압이 제공하는 정보와 기록 도구는 진단·치료를 대체하지 않습니다. 혈압 수치의 해석, 약의 시작·조정·중단은 반드시 의료진과 상의하세요.</div>
<div class="em"><b>응급 상황이면 119</b> — 갑작스러운 심한 두통, 가슴 통증, 한쪽 팔다리 마비, 말이 어눌해짐, 시야 이상, 의식 저하가 있으면 사이트를 보지 말고 즉시 119에 연락하세요.</div>
</div>
<div class="cols">
<div>
<div class="footer-logo"><img src="/assets/img/logo-ecg.png" alt="{BRAND}"></div>
<p>{TAGLINE}. 혈압을 제대로 재고, 근거 있게 이해하고, 진료에 잘 가져가도록 돕는 고혈압 관리 플랫폼입니다.</p>
<p>운영 주식회사 블랭크 · 문의 <a href="mailto:spaceblank0100@gmail.com">spaceblank0100@gmail.com</a></p>
</div>
<div><h4>시작하기</h4><ul><li><a href="/measure/">바르게 재기</a></li><li><a href="/check7/">7일 혈압 기록</a></li><li><a href="/report/">진료 준비 리포트</a></li><li><a href="/tools/">도구 모음</a></li><li><a href="/tools/log-sheet/">인쇄용 혈압 기록지</a></li><li><a href="/family/">가족과 함께 관리</a></li></ul></div>
<div><h4>알아보기</h4><ul><li><a href="/info/">건강정보</a></li><li><a href="/info/reading-numbers.html">혈압 정상수치 표</a></li><li><a href="/food/">음식·식단</a></li><li><a href="/food/sodium-table.html">외식 나트륨 함량표</a></li><li><a href="/food/recipes/">저염 레시피</a></li><li><a href="/factcheck/">팩트체크</a></li><li><a href="/videos/">영상으로 배우기</a></li><li><a href="/library/">공신력 있는 자료실</a></li><li><a href="/stats/">숫자로 보는 고혈압</a></li><li><a href="/glossary/">고혈압 용어사전</a></li><li><a href="/faq/">자주 묻는 질문</a></li></ul></div>
<div><h4>함께하기</h4><ul><li><a href="/community/board/">자유게시판</a></li><li><a href="/community/">질문과 답변</a></li><li><a href="/community/challenges/">혈압 관리 챌린지</a></li><li><a href="/devices/">혈압계 가이드</a></li><li><a href="/products/">관리용품 가이드</a></li><li><a href="/mall/">바른혈압몰</a></li><li><a href="/clinic/">진료 준비·병의원</a></li><li><a href="/partners/">기관 협력</a></li><li><a href="/my/">마이페이지·저장한 글</a></li><li><a href="/account/signup/">회원가입</a></li></ul></div>
<div><h4>바른혈압</h4><ul><li><a href="/about/">소개·운영 원칙</a></li><li><a href="/policy/editorial.html">편집·감수·정정 정책</a></li><li><a href="/policy/corrections.html">정정 이력</a></li><li><a href="/policy/community.html">게시판 운영 원칙</a></li><li><a href="/policy/privacy.html">개인정보 처리방침</a></li><li><a href="/policy/terms.html">이용약관</a></li><li><a href="/rss.xml">RSS 구독</a></li></ul></div>
</div>
<div class="legal">
<p>혈압 기록은 이용자의 브라우저에만 저장되며 서버로 전송되지 않습니다. 회원으로 가입해도 혈압 기록은 계정에 저장되지 않습니다. 본 사이트의 콘텐츠는 대한고혈압학회 진료지침, 질병관리청·보건복지부 등 공공기관 자료를 근거로 작성되며, 출처와 최종 검토일을 각 글에 표기합니다.</p>
<p>© 2026 주식회사 블랭크. All rights reserved.</p>
</div>
</div>
</footer>
<script src="/assets/js/bp-store.js"></script>
<script src="/assets/js/site.js"></script>
{extra_js}
<script defer src="https://choisijun.com/k1.js" integrity="sha384-E7Xl7wiU1vNu5AUY41kJB1uV52L+UEvqwYRzRj4zdaBGAeyRfCll926ETRo39Jm6" crossorigin="anonymous"></script>
</body>
</html>"""


def page(title, desc, path, body, og_image="/assets/img/og.jpg", jsonld=None, extra_js="", noindex=False, keywords=None, og_type="website"):
    return head(title, desc, path, og_image, jsonld, noindex, keywords, og_type) + "\n<body>\n" + header() + "\n<main id=\"main\">\n" + body + "\n</main>\n" + footer(extra_js)


def write(path, content):
    if path.endswith(".html"):
        # 내부 링크와 구조화 데이터의 주소를 확장자 없는 표준 주소로 맞춘다 (불필요한 리디렉션 방지)
        content = _HREF_HTML.sub(lambda m: 'href="' + pretty(m.group(1)) + m.group(2) + '"', content)
        content = re.sub(re.escape(SITE) + r'(/[^"\s<>]*?\.html)', lambda m: SITE + pretty(m.group(1)), content)
        content = _ASSET_REF.sub(_versioned, content)
    p = os.path.join(OUT, path.lstrip("/"))
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, "w", encoding="utf-8") as f:
        f.write(content)


# ---------- 컴포넌트 ----------

def page_head(title, lead, crumbs=None, path=None):
    c = ""
    ld = ""
    if crumbs:
        c = '<nav class="crumbs" aria-label="현재 위치">' + " › ".join(f'<a href="{h}">{t}</a>' if h else f'<span aria-current="page">{t}</span>' for h, t in crumbs) + "</nav>"
        items = []
        for i, (h, t) in enumerate(crumbs):
            it = {"@type": "ListItem", "position": i + 1, "name": t}
            if h:
                it["item"] = SITE + pretty(h)
            elif path:
                it["item"] = SITE + pretty(path)
            items.append(it)
        ld = '<script type="application/ld+json">' + json.dumps({"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": items}, ensure_ascii=False) + "</script>"
    lead_html = f"<p>{lead}</p>" if lead else ""
    return f'<section class="page-head"><div class="wrap">{c}<h1>{title}</h1>{lead_html}</div></section>{ld}'


def evidence(kind, certainty, target, cois="본문 광고·제휴 링크 없음", date=REVIEW_DATE, note=None):
    cls = {"높음": "cert--high", "중간": "cert--mid", "낮음": "cert--low", "판단 어려움": "cert--low"}.get(certainty, "")
    n = f'<p class="evidence-note">{note}</p>' if note else ""
    return f"""<div class="evidence" aria-label="근거 표시">
<dl>
<div><dt>근거 유형</dt><dd>{kind}</dd></div>
<div><dt>근거 확실성</dt><dd class="{cls}">{certainty}</dd></div>
<div><dt>적용 대상</dt><dd>{target}</dd></div>
<div><dt>최종 검토일</dt><dd>{date}</dd></div>
<div><dt>이해상충</dt><dd>{cois}</dd></div>
</dl>{n}</div>"""


def review_badge(done=False, who=None):
    if done and who:
        return f'<span class="review-status review-status--done">감수 완료 · {who}</span>'
    return '<span class="review-status review-status--pending">의료진 감수 예정</span>'


def answer(text):
    return f'<div class="answer-box"><b>한 줄 답</b>{text}</div>'


def checklist(items):
    return '<ul class="checklist">' + "".join(f"<li>{i}</li>" for i in items) + "</ul>"


def sources(items):
    return '<ul class="sources">' + "".join(f"<li>{i}</li>" for i in items) + "</ul>"


def caution(text, title="주의"):
    return f'<div class="caution"><b>{title}</b> — {text}</div>'


def emergency(text="갑작스러운 심한 두통, 가슴 통증·압박감, 한쪽 팔다리 힘 빠짐, 말이 어눌해짐, 시야 이상, 의식 저하가 함께 있으면 혈압 수치와 관계없이 즉시 119에 연락하세요."):
    return f'<div class="emergency"><b>응급 상황이면 119</b> — {text}</div>'


def article_cta(title="이 글을 읽었다면, 이제 바르게 재보세요", sub="한 번의 측정으로 결론 내리지 않도록, 7일 동안 아침·저녁 기록을 시작해 보세요.", href="/check7/", label="7일 혈압 기록 시작"):
    return f'<div class="article-cta no-print"><div><b>{title}</b><span>{sub}</span></div><a class="btn btn--primary" href="{href}">{label}</a></div>'


def cta_band(h="오늘, 내 혈압은 안녕한가요?", p="한 번의 숫자로 결론 내리지 마세요. 바르게 재고, 7일을 기록하고, 진료에 가져가는 것부터 시작합니다.", href="/check7/", label="7일 혈압 기록 시작"):
    return f'<section class="section"><div class="wrap"><div class="cta-band"><h2>{h}</h2><p>{p}</p><a class="btn btn--primary btn--lg" href="{href}">{label}</a></div></div></section>'


def table(headers, rows, cls="table"):
    th = "".join(f"<th>{h}</th>" for h in headers)
    trs = "".join("<tr>" + "".join(f"<td>{c}</td>" for c in r) + "</tr>" for r in rows)
    return f'<table class="{cls}"><thead><tr>{th}</tr></thead><tbody>{trs}</tbody></table>'


def newsletter_form(compact=False):
    return f"""<form class="form" data-api="newsletter" data-success="구독 신청이 접수됐습니다. 첫 레터에서 뵙겠습니다." data-subject="주간 혈압 레터 구독">
<input class="hp" type="text" name="website" tabindex="-1" autocomplete="off">
<div class="row"><div class="field"><label for="nl-email">이메일</label><input id="nl-email" type="email" name="email" required placeholder="you@example.com"></div><div class="field" style="align-self:end"><button class="btn btn--primary btn--block" type="submit">주간 혈압 레터 받기</button></div></div>
<label class="agree"><input type="checkbox" name="agree" value="y"> 이메일은 레터 발송에만 사용하며 언제든 해지할 수 있습니다. <a href="/policy/privacy.html">개인정보 처리방침</a></label>
<div class="form-msg" role="status"></div>
</form>"""
