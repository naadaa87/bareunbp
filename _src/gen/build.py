# -*- coding: utf-8 -*-
import os, sys, re, json, html as H
from email.utils import format_datetime
from datetime import datetime, timezone, timedelta
sys.path.insert(0, os.path.dirname(__file__))
import content  # noqa: F401  (기존 글에 2차 확충분 병합)
from base import write, pretty, SITE, BRAND, REVIEW_DATE, NEW_DATE, MALL_DATE, OUT
import mall as MALL
import recipe_sd as RSD
from articles import ARTICLES, CAT_NAME
from factchecks import FACTCHECKS
import food as F
from glossary import GLOSSARY
from faq import FAQ
import pages_a as A
import pages_b as B
import pages_c as C
import pages_d as D
import pages_e as E

pages = {
    "/index.html": A.home(),
    "/measure/index.html": A.measure(),
    "/check7/index.html": A.check7(),
    "/report/index.html": A.report(),
    "/info/index.html": C.info_index(),
    "/factcheck/index.html": A.factcheck_index(),
    "/devices/index.html": B.devices(),
    "/products/index.html": C.products(),
    "/clinic/index.html": B.clinic(),
    "/family/index.html": B.family(),
    "/community/index.html": C.community(),
    "/community/challenges/index.html": C.challenges_page(),
    "/partners/index.html": B.partners(),
    "/about/index.html": B.about(),
    "/food/index.html": C.food_index(),
    "/food/recipes/index.html": C.recipes_index(),
    "/tools/index.html": C.tools_index(),
    "/tools/sodium/index.html": C.tool_sodium(),
    "/tools/timer/index.html": C.tool_timer(),
    "/tools/meds/index.html": C.tool_meds(),
    "/tools/reminder/index.html": C.tool_reminder(),
    "/tools/backup/index.html": C.tool_backup(),
    "/tools/log-sheet/index.html": C.tool_logsheet(),
    "/glossary/index.html": C.glossary_page(),
    "/faq/index.html": C.faq_page(),
    "/search/index.html": C.search_page(),
    "/policy/editorial.html": B.editorial(),
    "/policy/corrections.html": B.corrections(),
    "/policy/privacy.html": B.privacy(),
    "/policy/terms.html": B.terms(),
    "/404.html": B.notfound(),
    "/account/login/index.html": D.login_page(),
    "/account/signup/index.html": D.signup_page(),
    "/account/reset/index.html": D.reset_page(),
    "/my/index.html": D.my_page(),
    "/community/board/index.html": D.board_index(),
    "/community/board/write/index.html": D.board_write(),
    "/community/board/post/index.html": D.board_post(),
    "/policy/community.html": D.community_policy(),
    "/videos/index.html": E.videos_page(),
    "/mall/index.html": MALL.mall_page(),
    "/library/index.html": E.library_page(),
    "/stats/index.html": E.stats_page(),
    "/news/index.html": E.news_page(),
}
for a in ARTICLES:
    pages[f"/info/{a['slug']}.html"] = C.info_article(a)
for f in FACTCHECKS:
    pages[f"/factcheck/{f['slug']}.html"] = A.factcheck_page(f)
for fp in F.FOOD_PAGES:
    pages[f"/food/{fp['slug']}.html"] = C.food_page(fp)
for r in F.RECIPES:
    pages[f"/food/recipes/{r['slug']}.html"] = C.recipe_page(r)

for p, c in pages.items():
    write(p, c)


def loc(p):
    return pretty(p)


# ---------- sitemap.xml ----------
NOINDEX = {"/404.html", "/search/index.html", "/account/login/index.html", "/account/signup/index.html", "/account/reset/index.html", "/my/index.html", "/community/board/write/index.html", "/community/board/post/index.html"}
def prio(p):
    if p == "/index.html":
        return "1.0", "weekly"
    if p in ("/check7/index.html", "/measure/index.html", "/info/index.html", "/food/index.html", "/info/reading-numbers.html", "/food/sodium-table.html", "/tools/index.html", "/stats/index.html", "/community/board/index.html"):
        return "0.9", "weekly"
    if p.startswith(("/info/", "/food/", "/factcheck/", "/tools/")):
        return "0.8", "monthly"
    if p.startswith("/policy/"):
        return "0.3", "yearly"
    return "0.6", "monthly"
# lastmod — 글은 마지막으로 내용을 고친 날, 목록 페이지는 그 안의 가장 최근 글 날짜
from base import item_dates
import seo_content as SC
DATES = {"/mall/index.html": MALL_DATE}
for a in ARTICLES:
    DATES[f"/info/{a['slug']}.html"] = item_dates(a)[1]
for f in FACTCHECKS:
    DATES[f"/factcheck/{f['slug']}.html"] = item_dates(f)[1]
for fp in F.FOOD_PAGES:
    DATES[f"/food/{fp['slug']}.html"] = item_dates(fp)[1]
for r in F.RECIPES:
    DATES[f"/food/recipes/{r['slug']}.html"] = item_dates(r)[1]
for p in SC.TOOL_GUIDES:
    DATES[p + "index.html"] = SC.UPDATED
_hub = lambda pre: max([d for k, d in DATES.items() if k.startswith(pre)] or [NEW_DATE])
for hub, pre in (("/info/index.html", "/info/"), ("/factcheck/index.html", "/factcheck/"), ("/food/recipes/index.html", "/food/recipes/"),
                 ("/food/index.html", "/food/"), ("/tools/index.html", "/tools/")):
    DATES[hub] = max(_hub(pre), NEW_DATE)
DATES["/index.html"] = max(DATES.values())
urls = [p for p in pages if p not in NOINDEX]
sm = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
for p in urls:
    pr, cf = prio(p)
    sm.append(f"  <url><loc>{SITE}{loc(p)}</loc><lastmod>{DATES.get(p, NEW_DATE)}</lastmod><changefreq>{cf}</changefreq><priority>{pr}</priority></url>")
sm.append("</urlset>")
write("/sitemap.xml", "\n".join(sm) + "\n")

write("/mall/products.json", MALL.products_json())

# ---------- rss.xml ----------
KST = timezone(timedelta(hours=9))
def rfc(d):
    return format_datetime(datetime.strptime(d, "%Y-%m-%d").replace(hour=9, minute=30, tzinfo=KST))
pub = rfc(NEW_DATE)
feed = []
for a in ARTICLES:
    feed.append((a["title"], f"/info/{a['slug']}.html", a["summary"], "건강정보"))
for fp in F.FOOD_PAGES:
    feed.append((fp["title"], f"/food/{fp['slug']}.html", fp["summary"], "음식·식단"))
for f in FACTCHECKS:
    feed.append((f"팩트체크: {f['claim']}", f"/factcheck/{f['slug']}.html", f["summary"], "팩트체크"))
for r in F.RECIPES:
    feed.append((f"{r['name']} — 저염 레시피", f"/food/recipes/{r['slug']}.html", r["desc"], "레시피"))
items = "".join(f"<item><title>{H.escape(t)}</title><link>{SITE}{pretty(u)}</link><guid isPermaLink=\"true\">{SITE}{pretty(u)}</guid><description>{H.escape(d)}</description><category>{c}</category><pubDate>{rfc(DATES.get(u, REVIEW_DATE))}</pubDate></item>\n" for t, u, d, c in sorted(feed, key=lambda x: DATES.get(x[1], REVIEW_DATE), reverse=True))
rss = f"""<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
<title>{BRAND} — 고혈압 관리 정보</title>
<link>{SITE}/</link>
<atom:link href="{SITE}/rss.xml" rel="self" type="application/rss+xml"/>
<description>혈압 정상수치, 혈압 재는 법, 저염 식단, 팩트체크까지. 진료지침 근거의 고혈압 관리 정보.</description>
<language>ko</language>
<lastBuildDate>{pub}</lastBuildDate>
{items}</channel>
</rss>
"""
write("/rss.xml", rss)

# ---------- search-index.json ----------
def text(h):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", h)).strip()
idx = []
for a in ARTICLES:
    idx.append({"t": a["title"], "s": a["summary"], "k": " ".join(a.get("keywords", [])), "c": "건강정보 · " + CAT_NAME[a["cat"]], "u": f"/info/{a['slug']}.html", "b": text(a["body"])[:900]})
for fp in F.FOOD_PAGES:
    idx.append({"t": fp["title"], "s": fp["summary"], "k": " ".join(fp.get("keywords", [])), "c": "음식·식단", "u": f"/food/{fp['slug']}.html", "b": text(C.food_body(fp["slug"]))[:900]})
for f in FACTCHECKS:
    idx.append({"t": "팩트체크: " + f["claim"], "s": f["summary"], "k": "팩트체크", "c": "팩트체크", "u": f"/factcheck/{f['slug']}.html", "b": text(f["body"])[:600]})
for r in F.RECIPES:
    idx.append({"t": r["name"], "s": r["desc"], "k": "레시피 저염 " + " ".join(r["ingredients"]), "c": "레시피", "u": f"/food/recipes/{r['slug']}.html", "b": RSD.step_text(r)})
for n, c, s, mg in F.SODIUM_DISHES:
    idx.append({"t": f"{n} 나트륨 {mg:,}mg", "s": f"1인분({s}) 기준 나트륨 약 {mg:,}mg — 외식 나트륨 함량표", "k": f"{n} 나트륨 {c}", "c": "외식 나트륨표", "u": "/food/sodium-table.html", "b": ""})
for t, alt, d, l in GLOSSARY:
    idx.append({"t": f"{t} — 용어사전", "s": d, "k": alt, "c": "용어사전", "u": "/glossary/#t-" + "".join(ch for ch in t if ch.isalnum()), "b": ""})
for cat, q, a in FAQ:
    idx.append({"t": q, "s": text(a), "k": cat, "c": "자주 묻는 질문", "u": "/faq/#" + cat, "b": ""})
TOOLPAGES = [("7일 혈압 기록", "/check7/", "혈압 기록장 가정혈압 기록 평균"), ("측정 타이머", "/tools/timer/", "혈압 재는 법 5분 안정 측정"), ("나트륨 계산기", "/tools/sodium/", "나트륨 소금 계산"),
             ("복약 체크", "/tools/meds/", "혈압약 복용 체크"), ("측정 알림 만들기", "/tools/reminder/", "알람 캘린더"), ("진료 준비 리포트", "/report/", "인쇄 PDF 진료"),
             ("인쇄용 혈압 기록지", "/tools/log-sheet/", "기록지 기록표 양식 인쇄"), ("기록 백업·복원", "/tools/backup/", "백업 기기 이동"), ("혈압계 가이드", "/devices/", "혈압계 고르는 법 커프 손목 스마트워치"),
             ("관리용품 가이드", "/products/", "염도계 약통 커프"), ("바른혈압몰", "/mall/", "쇼핑 몰 약통 약달력 줄자 만보기 염도계 계량스푼 저염간장 요가매트 아령 밴드 스텝퍼 쿠팡"), ("진료 준비·병의원 안내", "/clinic/", "병원 내과 만성질환관리"), ("가족과 함께 관리하기", "/family/", "부모님 혈압"),
             ("혈압 관리 챌린지", "/community/challenges/", "챌린지 걷기 국물 금주"), ("커뮤니티 질문과 답변", "/community/", "질문 상담 커뮤니티"), ("자유게시판", "/community/board/", "게시판 커뮤니티 후기 경험담 카페"), ("영상으로 배우기", "/videos/", "영상 동영상 유튜브 강의 혈압 재는 법"),
             ("공신력 있는 자료실", "/library/", "자료 진료지침 학회 공공기관 링크 검증 혈압계"), ("숫자로 보는 고혈압", "/stats/", "통계 유병률 인지율 치료율 조절률 환자 수 팩트시트"),
             ("고혈압 소식", "/news/", "뉴스 소식 발표 지침 개정 세계 고혈압의 날"),
             ("회원가입", "/account/signup/", "가입 로그인 회원"), ("마이페이지 · 저장한 글", "/my/", "저장 찜 스크랩 내 글")]
for t, u, k in TOOLPAGES:
    idx.append({"t": t, "s": "", "k": k, "c": "도구·안내", "u": u, "b": ""})
for d in idx:
    d["u"] = pretty(d["u"].split("#")[0]) + ("#" + d["u"].split("#", 1)[1] if "#" in d["u"] else "")
write("/search-index.json", json.dumps(idx, ensure_ascii=False, separators=(",", ":")))

# ---------- content-index.json (관리자 콘솔: 감수 대상 목록, 링크 고르기, 통계 제목 표시) ----------
ART_BY = {f"/info/{a['slug']}.html": a for a in ARTICLES}
FC_BY = {f"/factcheck/{f['slug']}.html": f for f in FACTCHECKS}
FOOD_BY = {f"/food/{fp['slug']}.html": fp for fp in F.FOOD_PAGES}
REC_BY = {f"/food/recipes/{r['slug']}.html": r for r in F.RECIPES}
cidx = []
for p, h in pages.items():
    if p in NOINDEX:
        continue
    m = re.search(r"<title>(.*?)</title>", h, re.S)
    t = H.unescape(m.group(1)).replace(f" | {BRAND}", "").strip() if m else p
    e = {"p": pretty(p), "t": t, "k": "guide", "c": "", "r": 0}
    if p in ART_BY:
        e.update(t=ART_BY[p]["title"], k="info", c=CAT_NAME[ART_BY[p]["cat"]], r=1)
    elif p in FC_BY:
        e.update(t="팩트체크: " + FC_BY[p]["claim"], k="factcheck", c="팩트체크", r=1)
    elif p in FOOD_BY:
        e.update(t=FOOD_BY[p]["title"], k="food", c="음식·식단", r=1)
    elif p in REC_BY:
        e.update(t=REC_BY[p]["name"] + " — 저염 레시피", k="recipe", c="레시피")
    elif p.startswith("/policy/"):
        e.update(k="policy")
    cidx.append(e)
order = {"info": 0, "food": 1, "factcheck": 2, "recipe": 3, "guide": 4, "policy": 5}
cidx.sort(key=lambda e: (order[e["k"]], e["p"]))
write("/content-index.json", json.dumps(cidx, ensure_ascii=False, separators=(",", ":")))

# ---------- manifest ----------
write("/manifest.webmanifest", json.dumps({
    "name": "바른혈압", "short_name": "바른혈압", "description": "혈압을 바르게 재고, 기록하고, 진료에 가져가는 고혈압 관리 플랫폼",
    "start_url": "/check7/", "scope": "/", "display": "standalone", "background_color": "#ffffff", "theme_color": "#0e2a47", "lang": "ko",
    "icons": [{"src": "/assets/img/apple-touch-icon.png", "sizes": "180x180", "type": "image/png"}, {"src": "/assets/img/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any"}]
}, ensure_ascii=False, indent=1))

# ---------- robots.txt ----------
# ---------- AI 검색 안내 (llms.txt) ----------
import seo as SEO
write("/llms.txt", SEO.llms_txt())
write("/llms-full.txt", SEO.llms_full_txt())
write("/robots.txt", f"# AI 검색 안내: {SITE}/llms.txt\nUser-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /search/\nDisallow: /admin/\nDisallow: /_src/\nDisallow: /account/\nDisallow: /my/\nDisallow: /cdn-cgi/\n\nUser-agent: Yeti\nAllow: /\nDisallow: /api/\nDisallow: /admin/\nDisallow: /_src/\nDisallow: /account/\nDisallow: /my/\n\nSitemap: {SITE}/sitemap.xml\nSitemap: {SITE}/rss.xml\n")

print(f"생성 완료: {len(pages)}개 페이지, 검색 색인 {len(idx)}건, RSS {len(feed)}건 → {os.path.abspath(OUT)}")
