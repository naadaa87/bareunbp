# -*- coding: utf-8 -*-
"""2차 확충 페이지: 건강정보 글(개선), 음식·식단, 레시피, 관리용품, 도구, 용어사전, FAQ, 검색, 챌린지, 커뮤니티"""
import json
from base import *
import articles as ART
from content import related
from articles import KSH2026, KDCA, WHO_NA, MFDS_HF
from articles2 import KSH2018_LIFE, LIFE_TABLE
import food as F
from glossary import GLOSSARY
from faq import FAQ

MEDCOND = {"@type": "MedicalCondition", "name": "고혈압", "alternateName": "Hypertension", "code": {"@type": "MedicalCode", "code": "I10", "codingSystem": "ICD-10"}}
PUBLISHER = {"@type": "Organization", "name": BRAND, "url": SITE, "logo": {"@type": "ImageObject", "url": SITE + "/assets/img/logo@2x.png"}}


def faq_block(faq):
    if not faq:
        return ""
    items = "".join(f'<details class="faq-item"><summary>{q}</summary><div>{a}</div></details>' for q, a in faq)
    return f'<h2 id="faq">자주 묻는 질문</h2><div class="faq-list">{items}</div>'


def faq_ld(faq):
    import re
    strip = lambda s: re.sub(r"<[^>]+>", "", s)
    return {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": strip(q), "acceptedAnswer": {"@type": "Answer", "text": strip(a)}} for q, a in faq]}


def related_block(items, base="/info/", title="함께 읽으면 좋은 글"):
    if not items:
        return ""
    lis = "".join(f'<li><a href="{base}{b["slug"]}.html"><b>{b["title"]}</b><span>{b["summary"]}</span></a></li>' for b in items)
    return f'<aside class="related no-print"><h2>{title}</h2><ul>{lis}</ul></aside>'


def article_ld(title, desc, path, kw=None, date=None):
    date = date or REVIEW_DATE
    return {"@context": "https://schema.org", "@type": ["Article", "MedicalWebPage"], "headline": title[:110], "description": desc,
            "datePublished": FIRST_PUBLISHED if date == REVIEW_DATE else date, "dateModified": date, "inLanguage": "ko",
            "author": {"@type": "Organization", "name": BRAND + " 편집팀", "url": SITE + "/about/"}, "publisher": PUBLISHER,
            "mainEntityOfPage": SITE + path, "about": MEDCOND, "keywords": ", ".join(kw or []),
            "image": SITE + "/assets/img/og.jpg", "lastReviewed": date}


# ============================================================
# 건강정보 글 (기존+신규 공통 렌더러)
# ============================================================
def info_article(a):
    path = f"/info/{a['slug']}.html"
    toc_items = []
    import re
    for m in re.finditer(r"<h2[^>]*>(.*?)</h2>", a["body"]):
        toc_items.append(re.sub(r"<[^>]+>", "", m.group(1)))
    date = a.get("date", REVIEW_DATE)
    ld = [article_ld(a["title"], a["summary"], path, a.get("keywords"), date)]
    if a.get("faq"):
        ld.append(faq_ld(a["faq"]))
    body = page_head(a["title"], a["summary"], [("/", "홈"), ("/info/", "건강정보"), (f"/info/#{a['cat']}", ART.CAT_NAME[a["cat"]]), (None, "본문")], path) + f"""
<section class="section section--tight">
<div class="wrap">
<div class="article-layout">
<article class="article">
<div class="article-meta"><span>작성 바른혈압 편집팀</span><span>{review_badge()}</span><span>최종 검토 <time datetime="{date}">{date}</time></span></div>
{evidence(a["kind"], a["certainty"], a["target"], date=date)}
{a["body"]}
{faq_block(a.get("faq"))}
{article_cta()}
<p class="fine">이 글에서 잘못된 내용을 발견하셨나요? <a href="/factcheck/#report">정정 요청</a>을 보내주시면 확인 후 <a href="/policy/corrections.html">정정 이력</a>에 공개합니다.</p>
</article>
<aside class="article-side no-print">
<div class="side-box"><b>이 글의 순서</b><ol>{"".join(f"<li>{t}</li>" for t in toc_items[:10])}</ol></div>
<div class="side-box"><b>바로 쓰는 도구</b><ul><li><a href="/check7/">7일 혈압 기록</a></li><li><a href="/tools/timer/">측정 타이머</a></li><li><a href="/tools/sodium/">나트륨 계산기</a></li><li><a href="/report/">진료 준비 리포트</a></li></ul></div>
</aside>
</div>
{related_block(related(a))}
</div>
</section>
"""
    return page(a["title"], a["summary"], path, body, jsonld=ld, keywords=a.get("keywords"), og_type="article")


def info_index():
    tabs = '<div class="tabs" id="tabs"><button aria-pressed="true" data-cat="all">전체</button>' + "".join(f'<button aria-pressed="false" data-cat="{k}">{v}</button>' for k, v in ART.CATEGORIES) + "</div>"
    items = "".join(f'<li data-cat="{a["cat"]}"><a href="/info/{a["slug"]}.html"><span class="cat">{ART.CAT_NAME[a["cat"]]}</span><span><b>{a["title"]}</b><span>{a["summary"]}</span></span><span class="date">{a.get("date", REVIEW_DATE)}</span></a></li>' for a in ART.ARTICLES)
    popular = [("reading-numbers", "혈압 정상수치 표"), ("home-measurement", "혈압 재는 법"), ("lifestyle-effects", "혈압 낮추는 방법"), ("symptoms", "고혈압 증상"), ("medications", "혈압약 종류·부작용"), ("hypertensive-crisis", "혈압 180 이상일 때")]
    pop = "".join(f'<a class="chip" href="/info/{s}.html">{t}</a>' for s, t in popular)
    fresh = [a for a in ART.ARTICLES if a.get("daily")][:5]
    fresh_html = ('<div class="fresh-box"><h2>새로 올라온 글</h2><ul class="post-list">' + "".join(f'<li><a href="/info/{a["slug"]}.html"><span class="cat">{ART.CAT_NAME[a["cat"]]}</span><span><b>{a["title"]}</b><span>{a["summary"]}</span></span><span class="date">{a["date"]}</span></a></li>' for a in fresh) + '</ul></div>') if fresh else ""
    ld = {"@context": "https://schema.org", "@type": "ItemList", "name": "바른혈압 건강정보", "itemListElement": [{"@type": "ListItem", "position": i + 1, "url": f"{SITE}/info/{a['slug']}.html", "name": a["title"]} for i, a in enumerate(ART.ARTICLES)]}
    body = page_head("고혈압 건강정보", "학회 진료지침과 공공기관 자료를 근거로, 사람들이 실제로 묻는 질문 단위로 다시 씁니다. 모든 글은 한 줄 답 → 핵심 근거 → 행동 체크리스트 → 출처 → 최종 검토일 구조를 따릅니다.", [("/", "홈"), (None, "건강정보")], "/info/") + f"""
<section class="section section--tight">
<div class="wrap">
<div class="chips" aria-label="많이 찾는 주제">{pop}</div>
{fresh_html}
<div class="evidence"><dl>
<div><dt>근거 유형</dt><dd>진료지침 / 공공기관 / 체계적 문헌고찰 / 단일 연구 / 전문가 해설 / 근거 부족</dd></div>
<div><dt>근거 확실성</dt><dd>높음 / 중간 / 낮음 / 판단 어려움</dd></div>
<div><dt>적용 대상</dt><dd>일반 성인 / 임신 / 고령 / 동반질환 등</dd></div>
<div><dt>최종 검토일</dt><dd>글마다 표기</dd></div>
<div><dt>이해상충</dt><dd>광고·제휴 여부 표기</dd></div>
</dl><p class="evidence-note">이 표시는 바른혈압의 편집 기준이며 학회의 권고 등급 체계와 다릅니다. <a href="/policy/editorial.html">편집·감수 정책</a></p></div>
{tabs}
<ul class="post-list" id="posts">{items}</ul>
<p style="margin-top:20px">음식과 식단은 <a href="/food/">음식·식단</a>, 용어가 낯설다면 <a href="/glossary/">용어사전</a>, 짧은 답이 필요하면 <a href="/faq/">자주 묻는 질문</a>을 보세요.</p>
<div class="grid grid--4" style="margin-top:22px">
<a class="pillar" href="/videos/"><div class="ico">{ICONS["video"]}</div><h3>영상으로 배우기</h3><p>학회·대학병원이 만든 영상 30편을 주제별로</p></a>
<a class="pillar" href="/stats/"><div class="ico">{ICONS["chart"]}</div><h3>숫자로 보는 고혈압</h3><p>유병률, 조절률, 나트륨 섭취량 최신 통계</p></a>
<a class="pillar" href="/news/"><div class="ico">{ICONS["doc"]}</div><h3>고혈압 소식</h3><p>주요 발표와 지침 변화를 날짜순으로</p></a>
<a class="pillar" href="/library/"><div class="ico">{ICONS["library"]}</div><h3>공신력 있는 자료실</h3><p>학회·공공기관·국제기구 자료 모음</p></a>
</div>
</div>
</section>
{cta_band()}
"""
    js = """<script>
(function(){var tabs=document.querySelectorAll('#tabs button');var items=document.querySelectorAll('#posts li');
function go(c){tabs.forEach(function(b){b.setAttribute('aria-pressed',b.dataset.cat===c?'true':'false')});items.forEach(function(li){li.style.display=(c==='all'||li.dataset.cat===c)?'':'none'});}
tabs.forEach(function(b){b.addEventListener('click',function(){go(b.dataset.cat);history.replaceState(null,'','#'+b.dataset.cat)})});
var h=location.hash.slice(1);if(h){for(var i=0;i<tabs.length;i++){if(tabs[i].dataset.cat===h){go(h);break}}}})();
</script>"""
    return page("고혈압 건강정보 — 진료지침 기반 정보 모음", "혈압 정상수치, 혈압 재는 법, 고혈압 증상, 혈압약, 합병증, 생활습관까지. 대한고혈압학회 진료지침과 공공기관 자료를 근거로 쓴 고혈압 정보.", "/info/", body, jsonld=ld, extra_js=js,
                keywords=["고혈압", "고혈압 정보", "혈압 정상수치", "혈압 재는 법", "고혈압 증상", "혈압약", "혈압 낮추는 방법"])


# ============================================================
# 음식·식단
# ============================================================
def food_body(slug):
    if slug == "good-foods":
        groups = ""
        for g in F.GOOD_FOOD_GROUPS:
            rows = "".join(f"<tr><td><b>{n}</b></td><td>{h}</td></tr>" for n, h in g["items"])
            groups += f"""<section class="food-group"><h2>{g["name"]}</h2><p>{g["why"]} <span class="badge">권장 {g["howmuch"]}</span></p>
<table class="table"><thead><tr><th>음식</th><th>먹는 법</th></tr></thead><tbody>{rows}</tbody></table>
<p class="fine"><b>주의</b> — {g["caution"]}</p></section>"""
        limit = table(["줄일 음식", "이유와 방법"], F.LIMIT_FOODS)
        return answer("혈압에 좋은 음식 하나를 찾기보다 채소·과일·통곡물·저지방 유제품·생선·콩·견과를 늘리고 나트륨을 줄이는 식단 전체를 바꾸는 것이 효과적입니다. 지침이 정리한 식단 개선 효과는 평균 약 11/5 mmHg로, 생활요법 중 가장 큰 편입니다.") + f"""
<h2>먼저, '혈압 낮추는 음식'이라는 말에 대해</h2>
<p>검색하면 양파, 마늘, 비트, 바나나, 녹차 같은 '혈압 낮추는 음식' 목록이 많이 나옵니다. 이런 음식이 식단에 도움이 되는 것은 맞지만, 한 가지를 많이 먹는다고 혈압이 내려가지는 않습니다. 짠 국물과 가공식품을 그대로 두고 좋은 음식만 더하면 효과가 거의 없습니다. 아래 식품군을 '늘릴 것'과 '줄일 것' 두 방향으로 함께 보세요.</p>
{groups}
<h2>줄일 음식</h2>
{limit}
<p>메뉴별 실제 나트륨은 <a href="/food/sodium-table.html">외식 나트륨 함량표</a>에서, 오늘 먹은 양은 <a href="/tools/sodium/">나트륨 계산기</a>로 확인할 수 있습니다.</p>
{caution("만성콩팥병이 있으면 칼륨·인·단백질 제한이 필요할 수 있고, 당뇨병이 있으면 과일과 곡물의 양을 조절해야 합니다. 이 글은 일반적인 원칙이며, 식이 제한을 받고 있다면 의료진·영양사의 지시를 우선하세요.")}
<h2>출처</h2>{sources([KSH2018_LIFE, KSH2026, F.NHLBI_DASH, WHO_NA])}"""
    if slug == "dash":
        return answer("DASH 식단은 채소·과일·통곡물·저지방 유제품·생선·콩·견과를 늘리고 붉은 고기·단 음식·포화지방·나트륨을 줄이는 식사법입니다. 한식으로는 '잡곡밥 + 채소 반찬 2~3가지 + 생선·두부 + 국은 적게'로 옮길 수 있습니다.") + f"""
<h2>DASH의 원칙</h2>
{table(["늘릴 것", "줄일 것"], [
    ["채소·과일", "나트륨(짠 국물, 장류, 가공식품)"],
    ["통곡물", "포화지방(기름진 고기, 버터, 튀김)"],
    ["저지방 유제품", "단 음료, 단 간식"],
    ["생선·가금류·콩", "붉은 고기·가공육"],
    ["견과·씨앗·식물성 기름", "술"],
])}
<h2>하루 구성 예 (일반 성인, 약 2,000kcal 기준의 대략적 비율)</h2>
{table(["식품군", "하루 대략량", "한식으로 바꾸면"], [
    ["곡류(통곡물 위주)", "6~8회 분량", "잡곡밥 2~3공기에 해당하는 양을 하루 세 끼에 나눔"],
    ["채소", "4~5회 분량", "끼니마다 나물·쌈채소·샐러드 2가지 이상"],
    ["과일", "4~5회 분량", "간식으로 사과·바나나·귤 등 2~3번"],
    ["저지방 유제품", "2~3회 분량", "우유 1잔, 무가당 요거트 1개"],
    ["살코기·생선·달걀", "6회 분량 이하(소량씩)", "끼니마다 손바닥 크기의 생선·두부·닭고기"],
    ["견과·콩·씨앗", "주 4~5회", "무염 견과 한 줌, 두부·콩자반(저염)"],
    ["단 음식", "주 5회 이하", "디저트·단 음료는 가끔"],
])}
<p class="fine">'회 분량'은 미국 NHLBI 안내의 분량 개념을 옮긴 것으로, 정확한 양보다 비율을 참고하세요.</p>
<h2>한식 밥상에 적용하기</h2>
{checklist([
    "흰쌀밥을 잡곡밥으로 — 처음엔 잡곡 1/3부터 (<a href='/food/recipes/multigrain-rice.html'>잡곡밥 짓는 법</a>)",
    "국·찌개는 작은 그릇에, 건더기 위주로",
    "김치는 한 번 먹을 양만 덜어서",
    "나물은 간장 대신 참기름·깨로 (<a href='/food/recipes/namul.html'>레시피</a>)",
    "고기 반찬 대신 주 2회 이상 생선, 자주 두부",
    "후식은 과일, 간식은 무가당 요거트나 무염 견과",
])}
<p>실제 일주일 메뉴는 <a href="/food/meal-plan.html">7일 저염 식단 예시</a>를 참고하세요.</p>
<h2>얼마나 효과가 있나</h2>
<p>대한고혈압학회 지침 해설은 식사 조절(DASH 등)의 혈압 감소 효과를 평균 수축기 약 11.4 mmHg, 이완기 약 5.5 mmHg로 정리합니다. 나트륨 제한을 함께하면 효과가 더해집니다.</p>
{LIFE_TABLE}
{caution("만성콩팥병이 있으면 DASH 식단의 칼륨·인·단백질 양이 맞지 않을 수 있습니다. 의료진·영양사와 상의하세요.")}
<h2>출처</h2>{sources([F.NHLBI_DASH, KSH2018_LIFE, KSH2026])}"""
    if slug == "sodium-table":
        cats = sorted({c for _, c, _, _ in F.SODIUM_DISHES})
        rows = "".join(f'<tr data-cat="{c}"><td>{n}</td><td>{c}</td><td>{s}</td><td class="num"><b>{mg:,}</b></td><td><span class="bar" style="--w:{min(100, mg/40):.0f}"></span><span class="pct">{mg/20:.0f}%</span></td></tr>' for n, c, s, mg in sorted(F.SODIUM_DISHES, key=lambda x: -x[3]))
        chips = '<button aria-pressed="true" data-cat="all">전체</button>' + "".join(f'<button aria-pressed="false" data-cat="{c}">{c}</button>' for c in cats)
        return answer("식약처 분석 자료 기준으로 짬뽕 1인분 약 4,000mg, 냉면·해장국·육개장 등은 2,500~3,000mg대로, 한 그릇이 하루 권고량(2,000mg)을 넘는 메뉴가 많습니다. 국물을 남기면 상당 부분을 줄일 수 있습니다.") + f"""
<div class="table-tools no-print">
<div class="field"><label for="dish-q">메뉴 검색</label><input id="dish-q" type="search" placeholder="예: 냉면, 찌개"></div>
<div class="tabs" id="dish-cat" style="margin:0">{chips}</div>
</div>
<div class="table-scroll"><table class="table sodium-table" id="dish-table">
<thead><tr><th>메뉴</th><th>분류</th><th>1인분 기준</th><th>나트륨(mg)</th><th>하루 권고량(2,000mg) 대비</th></tr></thead>
<tbody>{rows}</tbody></table></div>
<p class="fine">출처: 식품의약품안전처 외식 영양성분 자료집의 1인분 분석치(보도 인용). 조사 시점이 오래되었고 식당·조리법·양에 따라 차이가 크므로 메뉴 간 상대 비교용으로 보세요. 최신 수치는 <a href="https://various.foodsafetykorea.go.kr/nutrient/" target="_blank" rel="noopener">식품영양성분 데이터베이스</a>에서 확인할 수 있습니다.</p>
<div class="article-cta no-print"><div><b>오늘 먹은 메뉴를 더해 보세요</b><span>이 표의 메뉴를 골라 하루 나트륨을 대략 계산합니다.</span></div><a class="btn btn--primary" href="/tools/sodium/">나트륨 계산기</a></div>
<h2>이 표를 읽는 법</h2>
<ul>
<li><b>국물 메뉴가 상위권</b> — 면·탕·찌개의 나트륨은 대부분 국물에 녹아 있습니다. 건더기 위주로 먹고 국물을 남기면 섭취량이 크게 줄어듭니다.</li>
<li><b>반찬도 계산에 넣기</b> — 김치·장아찌·젓갈은 적은 양에도 나트륨이 많아, 한 끼 합계를 끌어올립니다.</li>
<li><b>중식은 소스와 국물</b> — 짬뽕·우동·간짜장처럼 소스가 진한 메뉴가 높습니다.</li>
<li><b>봉지라면</b> — 제품마다 다르며 포장지 영양성분표에 1봉 기준으로 표시됩니다. 스프를 절반만 넣고 국물을 남기세요.</li>
</ul>
<h2>소금과 나트륨 환산</h2>
{table(["소금(g)", "나트륨(mg)", "참고"], [["1g", "약 400mg", "소금 1작은술은 약 5g → 나트륨 약 2,000mg"], ["5g", "약 2,000mg", "WHO 하루 권고 상한"], ["6g", "약 2,400mg", "대한고혈압학회 지침 권고(소금 6g 이하)"]])}
<h2>출처</h2>{sources([F.MFDS_EATOUT, F.MFDS_DB, WHO_NA, KSH2018_LIFE])}"""
    if slug == "nutrition-label":
        return answer("영양성분표에서 '나트륨 ○○mg'과 옆의 '%'를 봅니다. %는 하루 기준치 2,000mg 대비 비율입니다. 같은 종류의 제품끼리 1회 섭취량이 아니라 '총 내용량' 또는 '100g당'으로 맞춰 비교하세요.") + f"""
<h2>10초 읽기 순서</h2>
<ol class="steps">
<li><span><b>기준량 확인</b>'총 내용량', '1회 섭취참고량', '100g당' 중 무엇 기준인지 봅니다. 봉지 하나를 다 먹는다면 총 내용량 기준으로 계산합니다.</span></li>
<li><span><b>나트륨 mg 확인</b>숫자를 그대로 봅니다.</span></li>
<li><span><b>% 기준치 확인</b>2,000mg 대비 비율입니다. 한 끼에 30%(약 600mg)를 넘으면 그날 다른 끼니를 가볍게 합니다.</span></li>
<li><span><b>같은 기준으로 비교</b>두 제품을 비교할 때는 100g당 값끼리, 또는 실제 먹는 양끼리 비교합니다.</span></li>
</ol>
<h2>표시 문구의 의미</h2>
{table(["표시", "의미", "주의"], [
    ["무염·무나트륨", "나트륨이 거의 없음", "다른 성분(당·지방)도 확인"],
    ["저나트륨", "기준 이하로 나트륨이 적음", "먹는 양이 많으면 합계는 커짐"],
    ["나트륨 ○○% 줄임", "기존 제품 대비 줄였다는 뜻", "기존 제품이 매우 짰다면 여전히 높을 수 있음"],
    ["저염", "소금을 적게 넣었다는 일반 표현", "실제 mg을 반드시 확인"],
])}
<h2>자주 놓치는 제품</h2>
<ul>
<li><b>빵·시리얼</b> — 짠맛이 잘 느껴지지 않지만 나트륨이 들어 있습니다.</li>
<li><b>소스·드레싱</b> — 1~2큰술 기준으로 표시된 경우가 많아, 실제로 뿌리는 양을 생각해야 합니다.</li>
<li><b>즉석국·컵밥·냉동식품</b> — 1팩에 1,000mg 이상인 제품이 흔합니다.</li>
<li><b>음료</b> — 일부 스포츠음료·토마토주스에도 나트륨이 들어 있습니다.</li>
</ul>
<h2>출처</h2>{sources([F.MFDS_LABEL, F.MFDS_DB, WHO_NA])}"""
    if slug == "potassium":
        return answer("칼륨은 나트륨 배출을 도와 혈압 관리에 도움이 됩니다. 채소·과일·감자·콩류에 많습니다. 하지만 만성콩팥병이 있거나 ACE억제제·ARB·칼륨보존 이뇨제를 먹는 사람은 칼륨이 몸에 쌓여 위험할 수 있어, 칼륨이 든 저나트륨 소금이나 보충제는 의료진과 먼저 상의해야 합니다.") + f"""
<h2>칼륨이 많은 음식</h2>
{table(["분류", "음식 예"], [
    ["과일", "바나나, 키위, 오렌지, 참외, 멜론, 아보카도, 말린 과일"],
    ["채소", "시금치, 근대, 아욱, 토마토, 브로콜리, 버섯"],
    ["감자류", "감자, 고구마, 토란"],
    ["콩류", "대두, 팥, 검은콩, 두유"],
    ["기타", "우유, 요거트, 생선, 견과"],
])}
<p class="fine">함량은 품종·조리법에 따라 다릅니다. 데치거나 물에 담그면 일부 칼륨이 빠집니다.</p>
<h2>주의가 필요한 사람</h2>
{checklist([
    "<b>만성콩팥병</b> — 콩팥이 칼륨을 충분히 배출하지 못해 혈중 칼륨이 오를 수 있습니다.",
    "<b>ACE억제제·ARB(이름이 '-프릴', '-사르탄'으로 끝나는 경우가 많음) 복용자</b> — 칼륨을 몸에 남기는 작용이 있습니다.",
    "<b>칼륨보존 이뇨제(스피로노락톤 등) 복용자</b>",
    "<b>칼륨 보충제를 처방받은 경우</b> — 식품·대체염과 합쳐 과다해질 수 있습니다.",
])}
<h2>저나트륨 소금(대체염)</h2>
<p>마트의 '저나트륨 소금'은 염화나트륨 일부를 염화칼륨으로 바꾼 제품이 많습니다. 일반 성인에게는 나트륨을 줄이는 데 도움이 될 수 있지만, 위에 해당하는 분은 고칼륨혈증 위험이 있어 사용 전 의료진과 상의하세요. 고칼륨혈증은 초기 증상이 뚜렷하지 않을 수 있고 심하면 심장 리듬에 영향을 줍니다.</p>
{caution("칼륨 보충제를 스스로 먹지 마세요. 혈압약을 먹고 있다면 정기 혈액검사에서 칼륨 수치를 확인받습니다.")}
<h2>출처</h2>{sources([KSH2018_LIFE, KSH2026, '한양대학교병원 건강정보, 「소금 대체제와 신장질환」 — <a href="https://seoul.hyumc.com/board/commBoardHealthRepoView.do?no=3911" target="_blank" rel="noopener">seoul.hyumc.com</a>'])}"""
    if slug == "eating-out":
        return answer("국물이 적고 채소가 많은 메뉴를 고르고, 소스·양념은 따로 받고, 국물은 남기는 세 가지가 핵심입니다. 같은 가게에서도 메뉴 선택과 먹는 방법으로 나트륨을 크게 줄일 수 있습니다.") + f"""
<h2>주문할 때 쓸 수 있는 말</h2>
{checklist(["\"싱겁게 해 주세요\"", "\"소스(양념)는 따로 주세요\"", "\"국물은 적게 주세요\"", "\"김치·단무지는 괜찮습니다\"", "\"밥 반 공기만 주세요\""])}
<h2>메뉴별 고르는 법</h2>
{table(["종류", "더 나은 선택", "주의할 메뉴", "먹는 법"], [
    ["한식", "비빔밥(고추장 절반), 생선구이 정식, 보쌈(쌈채소 많이), 쌈밥", "찌개·탕·해장국, 젓갈·장아찌", "국물 남기기, 김치는 덜어서"],
    ["중식", "볶음 요리 + 밥(소스 적게), 마파두부 소량", "짬뽕·우동·간짜장", "국물·소스 남기기"],
    ["분식", "김밥(단무지·햄 빼고), 순대(소금 대신)", "라면, 떡볶이 국물, 어묵 국물", "라면 스프 절반"],
    ["일식", "회, 초밥(간장 찍는 양 줄이기), 생선구이", "라멘·우동 국물, 장어덮밥 소스", "간장은 살짝 찍기"],
    ["양식", "샐러드(드레싱 따로), 구운 고기·생선", "피자, 크림·치즈 파스타, 햄 샌드위치", "드레싱 절반"],
    ["치킨·패스트푸드", "구운 치킨, 단품 버거", "양념치킨, 세트(감자튀김+탄산)", "소스 찍지 않기"],
    ["쌀국수·샤브샤브", "채소 추가", "국물을 다 마시는 것", "국물 남기기, 소스 적게"],
])}
<h2>편의점</h2>
{checklist([
    "도시락·컵라면·즉석국은 영양성분표의 나트륨 mg부터 봅니다. 1개에 1,000mg 넘는 제품이 흔합니다.",
    "삼각김밥·샌드위치는 비교적 낮은 편이지만 햄·참치마요는 확인합니다.",
    "샐러드·삶은 달걀·무가당 요거트·바나나·무염 견과를 조합하면 가볍습니다.",
    "컵라면은 스프를 절반만 넣고 국물을 남깁니다.",
    "음료는 물·무가당 차로.",
])}
<p>메뉴별 수치는 <a href="/food/sodium-table.html">외식 나트륨 함량표</a>에서 비교하세요.</p>
<h2>출처</h2>{sources([F.MFDS_EATOUT, WHO_NA])}"""
    if slug == "meal-plan":
        rows = "".join(f"<tr><th>{d}</th><td>{a}</td><td>{b}</td><td>{c}</td><td>{s}</td></tr>" for d, a, b, c, s in F.MEAL_PLAN)
        shop = "".join(f"<tr><td><b>{k}</b></td><td>{v}</td></tr>" for k, v in F.SHOPPING)
        return answer("아래는 잡곡밥·채소 반찬·생선·두부를 중심으로 국물과 장류를 줄인 일반적인 일주일 식단 예시입니다. 그대로 따르기보다 집에 있는 재료로 바꿔 가며 원칙을 익히는 용도로 쓰세요.") + f"""
<div class="no-print" style="margin:0 0 14px"><button class="btn btn--secondary btn--sm" onclick="window.bpTrack&amp;&amp;bpTrack('mealplan_print');window.print()">식단표 인쇄</button></div>
<div class="table-scroll"><table class="table meal-table"><thead><tr><th>요일</th><th>아침</th><th>점심</th><th>저녁</th><th>간식</th></tr></thead><tbody>{rows}</tbody></table></div>
<h2>이 식단의 원칙</h2>
{checklist(["매 끼니 채소 반찬 2가지 이상", "밥은 잡곡, 양은 평소보다 조금 적게", "국·찌개는 하루 한 번, 작은 그릇에 건더기 위주", "생선 주 2회 이상, 두부·콩 자주", "외식은 국물·소스를 줄일 수 있는 메뉴로", "간식은 과일·무가당 요거트·무염 견과"])}
<h2>장보기 목록</h2>
<table class="table"><tbody>{shop}</tbody></table>
<h2>레시피</h2>
<p>식단에 나온 요리의 만드는 법은 <a href="/food/recipes/">저염 레시피</a>에 있습니다.</p>
{caution("당뇨병, 만성콩팥병, 심부전, 통풍 등으로 식이 제한을 받고 있다면 이 예시보다 의료진·영양사의 개별 지시를 우선하세요. 이 식단은 개인에게 맞춘 처방이 아닙니다.")}
<h2>출처</h2>{sources([F.NHLBI_DASH, KSH2018_LIFE])}"""
    if slug == "supplements":
        rows = "".join(f"<tr><td>{n}</td><td>{t}</td></tr>" for n, t in [
            ("코엔자임Q10", "고시형 원료 — 항산화·높은 혈압 감소에 도움을 줄 수 있음"),
            ("정어리펩타이드", "개별인정형"), ("올리브잎추출물", "개별인정형"), ("카제인가수분해물", "개별인정형"),
            ("가쯔오부시올리고펩타이드", "개별인정형"), ("나토균배양분말", "개별인정형"), ("서목태(쥐눈이콩) 펩타이드 복합물", "개별인정형"),
            ("연어 펩타이드", "개별인정형"), ("포도씨효소분해추출분말", "개별인정형"), ("해태올리고펩티드", "개별인정형"), ("L-글루타민산유래 GABA함유분말", "개별인정형")])
        return answer("식약처가 '높은 혈압 감소에 도움을 줄 수 있음'으로 인정한 원료가 있지만, 이는 건강 유지 수준의 기능성이며 질병 치료나 혈압약 대체를 뜻하지 않습니다. 혈압약을 먹고 있다면 상호작용 가능성이 있어 의료진·약사에게 먼저 확인하세요.") + f"""
<h2>'기능성 인정'의 의미</h2>
<p>건강기능식품의 기능성은 식품의약품안전처가 인정한 범위 안에서만 표시할 수 있습니다. 혈압 관련 문구는 대개 "높은 혈압 감소에 도움을 줄 수 있음" 수준이며, "혈압을 치료한다", "약을 끊을 수 있다" 같은 표현은 허용되지 않습니다. 이런 광고를 보면 허위·과대광고를 의심하세요.</p>
<h2>혈압 관련 기능성 원료 예시</h2>
<table class="table"><thead><tr><th>원료</th><th>구분</th></tr></thead><tbody>{rows}</tbody></table>
<p class="fine">출처: 한국건강기능식품협회 「건강기능식품 기능성 원료 인정 현황」(2016) 혈압조절 항목. 인정 현황은 계속 바뀌므로 최신 정보는 식품안전나라에서 확인하세요. 농림축산식품부는 마늘이 혈압조절 기능성 고시형 원료로 인정받았다고 발표한 바 있습니다. 바른혈압은 특정 제품을 추천하지 않으며 이 페이지에 제휴·광고가 없습니다.</p>
<h2>고르기 전에 확인할 것</h2>
{checklist([
    "포장에 '건강기능식품' 인증 마크와 기능성 문구가 있는지",
    "기능성 원료명과 1일 섭취량이 표시되어 있는지",
    "'치료', '약 대신', '완치' 같은 표현이 있는지 — 있다면 신뢰하지 않습니다",
    "복용 중인 혈압약·항응고제 등과 함께 먹어도 되는지 약사에게 확인",
    "콩팥·간 질환이 있으면 의료진과 상의",
])}
<h2>건강기능식품보다 먼저</h2>
<p>지침이 정리한 생활요법(식단, 소금 제한, 운동, 절주, 체중 감량)의 효과가 더 크고 근거도 확실합니다. <a href="/info/lifestyle-effects.html">생활요법 효과 비교</a>를 먼저 보세요.</p>
<h2>출처</h2>{sources([F.KHFF_2016, MFDS_HF, '농림축산식품부, 「‘혈압조절’에 도움을 주는 마늘, 고시형원료 기능성 인정받아」 — <a href="https://www.mafra.go.kr/bbs/mafra/68/331023/artclView.do" target="_blank" rel="noopener">mafra.go.kr</a>'])}"""
    fp = next((x for x in F.FOOD_PAGES if x["slug"] == slug), None)
    return (fp or {}).get("body") or ""


def food_page(fp):
    path = f"/food/{fp['slug']}.html"
    body_html = food_body(fp["slug"])
    date = fp.get("date", REVIEW_DATE)
    ld = [article_ld(fp["title"], fp["summary"], path, fp.get("keywords"), date)]
    if fp.get("faq"):
        ld.append(faq_ld(fp["faq"]))
    others = [x for x in F.FOOD_PAGES if x["slug"] != fp["slug"]][:4]
    rel = "".join(f'<li><a href="/food/{x["slug"]}.html"><b>{x["title"]}</b><span>{x["summary"]}</span></a></li>' for x in others)
    js = '<script src="/assets/js/food-table.js"></script>' if fp["slug"] == "sodium-table" else ""
    body = page_head(fp["title"], fp["summary"], [("/", "홈"), ("/food/", "음식·식단"), (None, "본문")], path) + f"""
<section class="section section--tight">
<div class="wrap">
<article class="article {'article--wide' if fp['slug'] in ('sodium-table', 'meal-plan', 'good-foods') else ''}">
<div class="article-meta"><span>작성 바른혈압 편집팀</span><span>{review_badge()}</span><span>최종 검토 <time datetime="{date}">{date}</time></span></div>
{evidence(fp["kind"], fp["certainty"], fp["target"], date=date)}
{body_html}
{faq_block(fp.get("faq"))}
</article>
<aside class="related no-print"><h2>음식·식단 더 보기</h2><ul>{rel}</ul></aside>
</div>
</section>
"""
    return page(fp["title"], fp["summary"], path, body, jsonld=ld, keywords=fp.get("keywords"), og_type="article", extra_js=js)


def food_index():
    cards = "".join(f'<a class="pillar" href="/food/{x["slug"]}.html"><h3>{x["title"].split(" — ")[0]}</h3><p>{x["summary"]}</p><span class="more">읽기</span></a>' for x in F.FOOD_PAGES)
    rec = "".join(f'<li><a href="/food/recipes/{r["slug"]}.html"><b>{r["name"]}</b><span>{r["time"]} · {r["serves"]}인분 — {r["desc"]}</span></a></li>' for r in F.RECIPES[:6])
    top = sorted(F.SODIUM_DISHES, key=lambda x: -x[3])[:8]
    toprows = "".join(f'<tr><td>{n}</td><td class="num"><b>{mg:,}mg</b></td><td><span class="bar" style="--w:{min(100, mg/40):.0f}"></span></td></tr>' for n, _, _, mg in top)
    ld = {"@context": "https://schema.org", "@type": "CollectionPage", "name": "혈압 관리 음식·식단", "url": SITE + "/food/", "about": MEDCOND}
    body = page_head("음식·식단", "혈압에 좋은 음식, 줄여야 할 음식, 외식 메뉴 나트륨, 저염 레시피와 일주일 식단까지. 음식 하나보다 식단 전체를 바꾸는 방법을 정리했습니다.", [("/", "홈"), (None, "음식·식단")], "/food/") + f"""
<section class="section section--tight">
<div class="wrap">
<div class="split" style="align-items:start">
<div>
<h2>식단의 세 가지 원칙</h2>
<ol class="steps">
<li><span><b>나트륨을 줄입니다</b>하루 2,000mg 미만(소금 약 5g)이 WHO 권고입니다. 국물·장류·김치·가공식품이 주된 공급원입니다.</span></li>
<li><span><b>채소·과일·통곡물을 늘립니다</b>칼륨과 식이섬유가 나트륨의 영향을 줄입니다. 콩팥 질환이 있으면 칼륨은 상의가 필요합니다.</span></li>
<li><span><b>단백질은 생선·콩·살코기로</b>가공육과 기름진 고기를 줄이고, 등푸른생선을 주 2회 이상.</span></li>
</ol>
<div class="hero-actions" style="margin-top:18px"><a class="btn btn--primary" href="/tools/sodium/">오늘 나트륨 계산하기</a><a class="btn btn--secondary" href="/food/meal-plan.html">7일 식단 예시</a></div>
</div>
<div class="card">
<h3>외식 메뉴 나트륨 상위</h3>
<table class="table mini-bars"><tbody>{toprows}</tbody></table>
<p class="fine" style="margin:0">식약처 외식 영양성분 자료, 1인분 기준. <a href="/food/sodium-table.html">전체 37개 메뉴 보기</a></p>
</div>
</div>
</div>
</section>
<section class="section section--sky">
<div class="wrap">
<div class="section-head"><h2>음식·식단 가이드</h2></div>
<div class="grid grid--4 food-cards">{cards}</div>
</div>
</section>
<section class="section">
<div class="wrap">
<div class="split split--rev">
<img src="/assets/img/photo-flatlay.jpg" alt="채소 식단과 혈압계가 놓인 식탁" loading="lazy" width="1400" height="787">
<div>
<h2>저염 레시피</h2>
<p>간장과 소금을 줄이고 다시마·버섯·들깨·식초·레몬으로 맛을 채운 집밥 레시피입니다.</p>
<ul class="post-list compact">{rec}</ul>
<p style="margin-top:14px"><a class="btn btn--secondary" href="/food/recipes/">레시피 전체 보기</a></p>
</div>
</div>
</div>
</section>
{cta_band("한 끼에서 국물만 남겨도 달라집니다", "오늘 먹은 메뉴를 골라 하루 나트륨을 대략 계산해 보세요.", "/tools/sodium/", "나트륨 계산기")}
"""
    return page("혈압 관리 음식·식단 — 혈압에 좋은 음식부터 저염 레시피까지", "혈압에 좋은 음식과 줄일 음식, 외식 메뉴 나트륨 함량표, DASH 식단, 7일 저염 식단, 저염 레시피, 칼륨 주의사항, 건강기능식품 가이드.", "/food/", body, jsonld=ld,
                keywords=["혈압에 좋은 음식", "고혈압 식단", "저염식", "나트륨 많은 음식", "DASH 식단", "저염 레시피", "혈압 낮추는 음식"])


def recipe_page(r):
    path = f"/food/recipes/{r['slug']}.html"
    ing = "".join(f"<li>{i}</li>" for i in r["ingredients"])
    steps = "".join(f"<li><span>{s}</span></li>" for s in r["steps"])
    tips = "".join(f"<li>{t}</li>" for t in r["tips"])
    mins = "".join(ch for ch in r["time"].split("분")[0] if ch.isdigit()) or "20"
    ld = {"@context": "https://schema.org", "@type": "Recipe", "name": r["name"], "description": r["desc"], "recipeYield": f"{r['serves']}인분",
          "totalTime": f"PT{mins}M", "recipeIngredient": r["ingredients"], "recipeInstructions": [{"@type": "HowToStep", "text": s} for s in r["steps"]],
          "recipeCategory": "저염식", "recipeCuisine": "한식", "keywords": "저염, 고혈압 식단, " + r["name"], "author": {"@type": "Organization", "name": BRAND},
          "image": SITE + "/assets/img/photo-flatlay.jpg", "datePublished": r.get("date", REVIEW_DATE)}
    others = "".join(f'<li><a href="/food/recipes/{x["slug"]}.html"><b>{x["name"]}</b><span>{x["desc"]}</span></a></li>' for x in F.RECIPES if x["slug"] != r["slug"])
    body = page_head(r["name"], r["desc"], [("/", "홈"), ("/food/", "음식·식단"), ("/food/recipes/", "저염 레시피"), (None, r["name"])], path) + f"""
<section class="section section--tight">
<div class="wrap">
<div class="recipe">
<div class="recipe-meta"><span class="badge">조리 {r["time"]}</span><span class="badge">{r["serves"]}인분</span><span class="badge">저염 한식</span><button class="btn btn--ghost btn--sm no-print" onclick="window.bpTrack&amp;&amp;bpTrack('recipe_print');window.print()">레시피 인쇄</button></div>
<div class="recipe-grid">
<div class="card"><h2>재료</h2><ul class="checklist">{ing}</ul></div>
<div><h2>만드는 법</h2><ol class="steps">{steps}</ol>
<h2>덜 짜게 먹는 요령</h2><ul>{tips}</ul></div>
</div>
<p class="fine">레시피의 양념 양은 일반적인 예시입니다. 식이 제한을 받고 있다면 의료진·영양사의 지시를 우선하세요.</p>
</div>
<aside class="related no-print"><h2>다른 레시피</h2><ul>{others}</ul></aside>
</div>
</section>
"""
    return page(f"{r['name']} — 저염 레시피", r["desc"] + " 고혈압 식단에 맞춘 저염 레시피.", path, body, jsonld=ld, keywords=["저염 레시피", "고혈압 레시피", r["name"], "저염식"], og_type="article")


def recipes_index():
    items = "".join(f'<li><a href="/food/recipes/{r["slug"]}.html"><span class="cat">{r["time"]}</span><span><b>{r["name"]}</b><span>{r["desc"]}</span></span><span class="date">{r["serves"]}인분</span></a></li>' for r in F.RECIPES)
    ld = {"@context": "https://schema.org", "@type": "ItemList", "name": "저염 레시피", "itemListElement": [{"@type": "ListItem", "position": i + 1, "url": f"{SITE}/food/recipes/{r['slug']}.html"} for i, r in enumerate(F.RECIPES)]}
    body = page_head("저염 레시피", "간장과 소금을 줄이고 다시마·버섯·들깨·식초·레몬·허브로 맛을 채운 집밥 레시피입니다.", [("/", "홈"), ("/food/", "음식·식단"), (None, "저염 레시피")], "/food/recipes/") + f"""
<section class="section section--tight"><div class="wrap">
<div class="card card--sky" style="margin-bottom:22px"><h3>짠맛을 대신하는 맛 다섯 가지</h3><p style="margin:0"><b>감칠맛</b> 다시마·멸치·표고버섯 국물 · <b>고소함</b> 참깨·들깨·들기름 · <b>신맛</b> 식초·레몬 · <b>매운맛·향</b> 후추·마늘·생강·고춧가루 · <b>단맛</b> 양파·배·당근</p></div>
<ul class="post-list">{items}</ul>
</div></section>
{cta_band("레시피로 일주일을 채워 보세요", "아침·점심·저녁 예시와 장보기 목록이 있는 7일 식단입니다.", "/food/meal-plan.html", "7일 저염 식단 보기")}
"""
    return page("저염 레시피 — 고혈압 식단에 맞춘 집밥", f"저염 된장국, 간장 없는 나물, 생선구이, 두부조림, 잡곡밥 등 고혈압 식단에 맞춘 저염 레시피 {len(F.RECIPES)}가지.", "/food/recipes/", body, jsonld=ld, keywords=["저염 레시피", "고혈압 레시피", "저염식 반찬", "싱겁게 맛있게"])


# ============================================================
# 관리용품
# ============================================================
def products():
    items = [
        ("상완형 자동혈압계", "가정혈압 측정의 기본 도구", "국내 의료기기 허가·검증 여부, 커프 적용 범위, 2회 평균 기능", "/devices/"),
        ("큰 커프·작은 커프", "팔 둘레가 표준 범위를 벗어나는 경우 필수", "제품 호환 여부. 팔 둘레를 줄자로 재서 선택", "/devices/"),
        ("혈압 기록 수첩·기록지", "스마트폰이 불편한 분, 냉장고에 붙여 두는 용도", "아침·저녁 칸, 맥박·메모 칸이 있는지", "/tools/log-sheet/"),
        ("요일별 약 정리함", "복약을 잊거나 중복 복용하는 것을 방지", "아침·저녁 칸 구분, 여닫기 쉬운지", "/tools/meds/"),
        ("계량스푼·주방저울", "간장·된장·소금 양을 눈대중에서 숫자로", "1작은술(5ml)·1큰술(15ml) 구성", "/food/recipes/"),
        ("염도계", "국·찌개의 염도를 숫자로 확인해 싱겁게 맞추는 연습", "측정 방식·온도 보정 여부. 숫자보다 '전보다 낮게'가 목적", "/food/sodium-table.html"),
        ("저나트륨 조미료", "소금·간장의 나트륨을 줄인 제품", "칼륨 함유 여부 — 콩팥 질환·일부 혈압약 복용자는 상의 필요", "/food/potassium.html"),
        ("체중계·줄자", "체중과 허리둘레를 혈압과 함께 기록", "같은 시간·조건으로 측정", "/info/weight.html"),
        ("만보계·스마트워치", "걷기 습관을 숫자로 확인", "혈압 측정 기능은 보정이 필요한 참고용", "/info/exercise.html"),
        ("등받이 의자·팔 받침", "바른 자세로 재기 위한 측정 자리", "커프가 심장 높이에 오는 책상 높이", "/measure/"),
    ]
    rows = "".join(f'<tr><td><b>{n}</b></td><td>{w}</td><td>{c}</td><td><a href="{l}">관련 정보</a></td></tr>' for n, w, c, l in items)
    body = page_head("혈압 관리용품 가이드", "혈압계부터 약 정리함, 계량스푼, 염도계까지. 무엇이 왜 필요한지, 고를 때 무엇을 확인할지 정리했습니다. 특정 제품을 추천하거나 판매하지 않습니다.", [("/", "홈"), (None, "관리용품")], "/products/") + f"""
<section class="section section--tight"><div class="wrap">
<div class="evidence" style="margin-top:0"><dl>
<div><dt>근거 유형</dt><dd>진료지침 · 전문가 해설</dd></div><div><dt>근거 확실성</dt><dd class="cert--mid">중간</dd></div>
<div><dt>적용 대상</dt><dd>가정에서 혈압을 관리하는 성인</dd></div><div><dt>최종 검토일</dt><dd>{REVIEW_DATE}</dd></div><div><dt>이해상충</dt><dd>광고·제휴 없음</dd></div>
</dl></div>
<div class="table-scroll"><table class="table"><thead><tr><th>용품</th><th>왜 필요한가</th><th>고를 때 확인할 것</th><th></th></tr></thead><tbody>{rows}</tbody></table></div>
<h2>우선순위</h2>
<ol class="steps">
<li><span><b>검증된 상완형 혈압계와 맞는 커프</b>이것 하나로 가정혈압 관리가 시작됩니다. <a href="/devices/">혈압계 가이드</a></span></li>
<li><span><b>기록 수단</b>스마트폰이면 <a href="/check7/">7일 기록</a>, 종이가 편하면 <a href="/tools/log-sheet/">인쇄용 기록지</a>.</span></li>
<li><span><b>약을 먹는다면 약 정리함</b>복약 확인은 <a href="/tools/meds/">복약 체크</a>로도 할 수 있습니다.</span></li>
<li><span><b>주방 계량 도구</b>간을 숫자로 줄이는 연습에 도움이 됩니다.</span></li>
</ol>
{caution("바른혈압은 이 페이지에서 특정 제품을 추천하거나 판매하지 않으며 제휴 링크가 없습니다. 향후 제휴가 생기면 해당 위치에 명시하고 편집 평가와 분리합니다.", "독립성 원칙")}
</div></section>
"""
    return page("혈압 관리용품 가이드 — 혈압계, 커프, 기록지, 약 정리함, 염도계", "혈압 관리에 필요한 용품과 고를 때 확인할 점. 상완형 혈압계, 커프 크기, 기록지, 약 정리함, 계량스푼, 염도계, 저나트륨 조미료 주의사항.", "/products/", body,
                keywords=["혈압계 추천 기준", "혈압 관리 용품", "염도계", "약 정리함", "혈압 기록지", "커프 크기"])


# ============================================================
# 도구
# ============================================================
TOOLS = [
    ("calendar", "7일 혈압 기록", "아침·저녁 기록, 7일 평균과 추이 그래프", "/check7/"),
    ("timer", "측정 타이머", "5분 안정 → 1회 측정 → 1분 휴식 → 2회 측정을 안내", "/tools/timer/"),
    ("bowl", "나트륨 계산기", "오늘 먹은 메뉴를 골라 하루 나트륨을 대략 계산", "/tools/sodium/"),
    ("pill", "복약 체크", "아침·저녁 약 복용을 일주일 단위로 체크", "/tools/meds/"),
    ("bell", "측정 알림 만들기", "휴대폰 캘린더에 아침·저녁 측정 알림을 추가", "/tools/reminder/"),
    ("doc", "진료 준비 리포트", "기록을 A4 한 장으로 인쇄·PDF 저장", "/report/"),
    ("print", "인쇄용 혈압 기록지", "종이에 적는 2주 기록지. 냉장고에 붙여 두세요", "/tools/log-sheet/"),
    ("save", "기록 백업·복원", "다른 기기로 옮기거나 파일로 보관", "/tools/backup/"),
]


def tools_index():
    cards = "".join(f'<a class="pillar" href="{h}"><div class="ico">{ICONS[i]}</div><h3>{t}</h3><p>{d}</p><span class="more">열기</span></a>' for i, t, d, h in TOOLS)
    body = page_head("혈압 관리 도구", "회원가입 없이 바로 쓰는 도구입니다. 입력한 기록은 이 브라우저에만 저장되고 서버로 보내지 않습니다.", [("/", "홈"), (None, "도구")], "/tools/") + f"""
<section class="section section--tight"><div class="wrap">
<div class="pillars">{cards}</div>
<div class="tool-note" style="margin-top:24px"><b>모든 도구는 판정하지 않습니다.</b> 평균·합계 같은 계산만 하며, 개인의 건강 상태를 평가하거나 약을 권하지 않습니다. 해석은 진료 때 의료진과 하세요.</div>
</div></section>
"""
    ld = {"@context": "https://schema.org", "@type": "ItemList", "name": "혈압 관리 도구", "itemListElement": [{"@type": "ListItem", "position": i + 1, "url": SITE + h, "name": t} for i, (_, t, _, h) in enumerate(TOOLS)]}
    return page("혈압 관리 도구 — 기록, 타이머, 나트륨 계산기, 복약 체크", "가입 없이 쓰는 혈압 관리 도구 모음. 7일 혈압 기록, 측정 타이머, 나트륨 계산기, 복약 체크, 측정 알림, 진료 리포트, 인쇄용 기록지.", "/tools/", body, jsonld=ld,
                keywords=["혈압 기록", "혈압 기록지", "나트륨 계산기", "혈압 측정 타이머", "복약 체크", "혈압 앱"])


def tool_sodium():
    data = json.dumps([{"n": n, "c": c, "s": s, "mg": mg} for n, c, s, mg in F.SODIUM_DISHES], ensure_ascii=False)
    body = page_head("나트륨 계산기", "오늘 먹은 메뉴를 골라 하루 나트륨을 대략 계산합니다. 외식 메뉴는 식약처 분석 자료의 1인분 값을, 포장 식품은 영양성분표의 mg을 직접 입력하세요.", [("/", "홈"), ("/tools/", "도구"), (None, "나트륨 계산기")], "/tools/sodium/") + f"""
<section class="section section--tight"><div class="wrap">
<div class="tool-layout">
<div class="tool-panel">
<h2>메뉴 더하기</h2>
<div class="field"><label for="sd-q">메뉴 검색</label><input id="sd-q" type="search" placeholder="예: 김치찌개"></div>
<ul class="pick-list" id="sd-list" aria-label="메뉴 목록"></ul>
<h3 style="margin-top:18px;font-size:1rem">직접 입력 (포장 식품 등)</h3>
<form id="sd-custom" class="bp-inputs" style="grid-template-columns:1fr 110px auto" autocomplete="off">
<div class="field"><label for="sd-name">이름</label><input id="sd-name" required maxlength="30" placeholder="컵라면"></div>
<div class="field"><label for="sd-mg">나트륨 mg</label><input id="sd-mg" type="number" inputmode="numeric" min="0" max="10000" required placeholder="1500"></div>
<div class="field" style="align-self:end"><button class="btn btn--secondary" type="submit">추가</button></div>
</form>
</div>
<div>
<div class="sodium-total card">
<small>오늘 합계(대략)</small>
<b id="sd-total" class="num">0</b><span> mg</span>
<div class="meter" aria-hidden="true"><span id="sd-bar"></span><i style="left:50%"></i></div>
<p id="sd-msg" class="fine" style="margin:8px 0 0">WHO 하루 권고 상한 2,000mg(소금 약 5g) 대비 비율을 표시합니다.</p>
</div>
<div class="log" style="margin-top:16px"><table><thead><tr><th>메뉴</th><th>나트륨</th><th>국물</th><th></th></tr></thead><tbody id="sd-today"></tbody></table></div>
<div style="display:flex;gap:10px;margin-top:12px;flex-wrap:wrap"><button class="btn btn--ghost" id="sd-clear" type="button">오늘 목록 비우기</button><a class="btn btn--secondary" href="/food/sodium-table.html">메뉴별 나트륨표</a></div>
<div class="tool-note">'국물 남김'을 체크하면 해당 메뉴를 절반으로 계산합니다. 실제로 줄어드는 양은 메뉴와 남긴 양에 따라 다르며, 이 값은 습관을 비교하기 위한 대략치입니다. 오늘 목록은 이 브라우저에만 저장되고 날짜가 바뀌면 새로 시작합니다.</div>
</div>
</div>
</div></section>
<script id="sd-data" type="application/json">{data}</script>
"""
    ld = {"@context": "https://schema.org", "@type": "WebApplication", "name": "나트륨 계산기", "applicationCategory": "HealthApplication", "operatingSystem": "Web", "url": SITE + "/tools/sodium/", "offers": {"@type": "Offer", "price": "0", "priceCurrency": "KRW"}}
    return page("나트륨 계산기 — 오늘 먹은 음식 나트륨 합계", "외식 메뉴 37가지와 직접 입력으로 하루 나트륨을 계산합니다. WHO 권고 2,000mg 대비 비율, 국물 남김 반영.", "/tools/sodium/", body, jsonld=ld, extra_js='<script src="/assets/js/sodium.js"></script>',
                keywords=["나트륨 계산기", "하루 나트륨", "나트륨 섭취량 계산", "소금 섭취량"])


def tool_timer():
    body = page_head("혈압 측정 타이머", "5분 안정, 1회 측정, 1분 휴식, 2회 측정을 순서대로 안내하고 두 값을 바로 7일 기록에 저장합니다.", [("/", "홈"), ("/tools/", "도구"), (None, "측정 타이머")], "/tools/timer/") + """
<section class="section section--tight"><div class="wrap wrap--narrow">
<div class="timer card" id="timer">
<div class="timer-step" id="tm-step">준비</div>
<div class="timer-clock num" id="tm-clock">5:00</div>
<p class="timer-guide" id="tm-guide">등받이 의자에 앉아 발을 바닥에 두고, 커프를 위팔 심장 높이에 감으세요. 준비되면 시작을 누릅니다.</p>
<div class="timer-entry" id="tm-entry" hidden>
<div class="bp-inputs">
<div class="field"><label for="tm-sys">수축기</label><input class="big num" id="tm-sys" type="number" inputmode="numeric" min="50" max="260"></div>
<div class="slash">/</div>
<div class="field"><label for="tm-dia">이완기</label><input class="big num" id="tm-dia" type="number" inputmode="numeric" min="30" max="160"></div>
<div class="field pulse"><label for="tm-pulse">맥박</label><input class="big num" id="tm-pulse" type="number" inputmode="numeric" min="30" max="220"></div>
</div>
</div>
<div class="hero-actions" style="justify-content:center;margin:18px 0 0">
<button class="btn btn--primary btn--lg" id="tm-go" type="button">5분 안정 시작</button>
<button class="btn btn--ghost" id="tm-skip" type="button" hidden>건너뛰기</button>
</div>
<div id="tm-result" class="check-result" hidden></div>
</div>
<div class="tool-note">안정 시간 동안 말하거나 휴대폰을 보지 않는 것이 좋습니다. 화면이 꺼지지 않게 하려면 기기 설정을 확인하세요. 측정값은 7일 기록에 아침·저녁이 자동으로 구분되어 저장됩니다.</div>
</div></section>
"""
    return page("혈압 측정 타이머 — 5분 안정부터 2회 측정까지", "지침이 권고하는 순서대로 5분 안정, 1~2분 간격 2회 측정을 안내하는 혈압 측정 타이머. 측정값은 바로 7일 기록에 저장.", "/tools/timer/", body, extra_js='<script src="/assets/js/timer.js"></script>',
                keywords=["혈압 측정 방법", "혈압 측정 타이머", "혈압 재는 법", "5분 안정"])


def tool_meds():
    body = page_head("복약 체크", "아침·저녁 약을 먹었는지 일주일 단위로 체크합니다. 기록은 이 브라우저에만 저장되고 진료 준비 리포트에 요약됩니다.", [("/", "홈"), ("/tools/", "도구"), (None, "복약 체크")], "/tools/meds/") + """
<section class="section section--tight"><div class="wrap">
<div class="card" style="margin-bottom:16px">
<div class="field" style="max-width:420px"><label for="md-name">약 이름 메모 (선택 · 이 기기에만 저장)</label><input id="md-name" maxlength="60" placeholder="예: 아침 혈압약 1알"></div>
<div class="segmented" id="md-slots" role="group" aria-label="복용 횟수" style="max-width:320px;margin-top:12px"><button type="button" data-v="1" aria-pressed="true">하루 1번</button><button type="button" data-v="2" aria-pressed="false">하루 2번</button></div>
</div>
<div class="meds-grid" id="md-grid"></div>
<p class="fine" id="md-sum"></p>
<div class="tool-note">빠뜨린 날이 많다면 진료 때 솔직하게 알려주세요. 복용 시간을 바꾸거나 복합제로 단순화하는 방법이 있습니다. 약을 빠뜨렸을 때 어떻게 할지는 <a href="/info/medications.html">혈압약 자주 묻는 질문</a>과 약사의 안내를 따르세요.</div>
</div></section>
"""
    return page("복약 체크 — 혈압약 복용 기록", "아침·저녁 혈압약 복용 여부를 일주일 단위로 체크하는 도구. 브라우저에만 저장, 진료 준비 리포트에 요약.", "/tools/meds/", body, extra_js='<script src="/assets/js/meds.js"></script>',
                keywords=["혈압약 복용 체크", "복약 기록", "약 먹었는지 체크", "혈압약 깜빡"])


def tool_reminder():
    body = page_head("측정 알림 만들기", "휴대폰 기본 캘린더에 아침·저녁 혈압 측정 알림을 추가합니다. 파일을 내려받아 열면 일정이 등록됩니다. 앱 설치나 가입이 필요 없습니다.", [("/", "홈"), ("/tools/", "도구"), (None, "측정 알림")], "/tools/reminder/") + """
<section class="section section--tight"><div class="wrap wrap--narrow">
<form class="card form" id="rm-form">
<div class="row"><div class="field"><label for="rm-am">아침 측정 시각</label><input id="rm-am" type="time" value="07:00"></div><div class="field"><label for="rm-pm">저녁 측정 시각</label><input id="rm-pm" type="time" value="22:00"></div></div>
<div class="row"><div class="field"><label for="rm-len">기간</label><select id="rm-len"><option value="7">7일 (진료 전 기록용)</option><option value="14">14일</option><option value="30">30일</option><option value="0">계속 반복</option></select></div>
<div class="field"><label for="rm-start">시작일</label><input id="rm-start" type="date"></div></div>
<div class="quality" style="margin:0"><label><input type="checkbox" id="rm-use-am" checked> 아침 알림</label><label><input type="checkbox" id="rm-use-pm" checked> 저녁 알림</label><label><input type="checkbox" id="rm-meds"> 알림에 '약 복용 전 측정' 문구 넣기</label></div>
<button class="btn btn--primary" type="submit">캘린더 파일 내려받기</button>
</form>
<h2 style="margin-top:28px">등록하는 법</h2>
<ul>
<li><b>아이폰</b> — 내려받은 파일을 열고 '모두 추가'를 누릅니다.</li>
<li><b>안드로이드</b> — 파일을 열면 캘린더 앱이 열립니다. 열리지 않으면 구글 캘린더 웹(설정 → 가져오기)에서 파일을 가져옵니다.</li>
<li><b>PC</b> — 아웃룩·구글 캘린더에서 가져오기로 추가합니다.</li>
</ul>
<p class="fine">알림 파일은 이 브라우저에서 만들어지며 서버로 보내는 정보가 없습니다.</p>
</div></section>
"""
    return page("혈압 측정 알림 만들기 — 휴대폰 캘린더에 아침·저녁 알림", "아침·저녁 혈압 측정 알림을 휴대폰 캘린더에 추가하는 무료 도구. 7일·14일·30일·계속 반복.", "/tools/reminder/", body, extra_js='<script src="/assets/js/reminder.js"></script>',
                keywords=["혈압 측정 알림", "혈압 재는 시간 알림", "혈압 기록 알람"])


def tool_backup():
    body = page_head("기록 백업·복원", "이 브라우저에 저장된 혈압 기록·복약 체크·챌린지 기록을 파일로 저장하거나, 다른 기기에서 불러옵니다.", [("/", "홈"), ("/tools/", "도구"), (None, "백업·복원")], "/tools/backup/") + """
<section class="section section--tight"><div class="wrap wrap--narrow">
<div class="grid grid--2">
<div class="card"><h3>백업 파일 저장</h3><p style="color:var(--muted)">지금 기기의 기록을 파일 하나로 내려받습니다. 파일에는 혈압 수치가 들어 있으니 안전한 곳에 보관하세요.</p><p id="bk-count" class="fine"></p><button class="btn btn--primary" id="bk-export" type="button">백업 파일 내려받기</button></div>
<div class="card"><h3>백업 파일 불러오기</h3><p style="color:var(--muted)">다른 기기에서 저장한 파일을 선택합니다. 기존 기록과 합쳐지며 같은 기록은 중복되지 않습니다.</p><input type="file" id="bk-file" accept="application/json,.json" style="margin-bottom:10px"><button class="btn btn--secondary" id="bk-import" type="button">불러오기</button></div>
</div>
<div id="bk-msg" class="check-result" hidden></div>
<div class="tool-note">기기 이동 순서: ① 기존 기기에서 백업 파일 저장 → ② 파일을 카카오톡 '나에게 보내기'·이메일 등으로 새 기기에 전달 → ③ 새 기기에서 불러오기. 바른혈압 서버를 거치지 않습니다.</div>
</div></section>
"""
    return page("혈압 기록 백업·복원", "브라우저에 저장된 혈압 기록을 파일로 백업하고 다른 기기에서 복원합니다. 서버를 거치지 않습니다.", "/tools/backup/", body, extra_js='<script src="/assets/js/backup.js"></script>', noindex=False)


def tool_logsheet():
    rows = "".join(f'<tr><td class="ls-day">{i+1}일차<br><span>&nbsp;&nbsp;/&nbsp;&nbsp;</span></td><td></td><td></td><td></td><td></td><td></td></tr>' for i in range(14))
    body = page_head("인쇄용 혈압 기록지", "종이에 적는 2주 기록지입니다. 인쇄해서 혈압계 옆이나 냉장고에 붙여 두세요. 진료 때 그대로 가져가면 됩니다.", [("/", "홈"), ("/tools/", "도구"), (None, "인쇄용 기록지")], "/tools/log-sheet/") + f"""
<section class="section section--tight"><div class="wrap">
<div class="no-print" style="margin-bottom:16px;display:flex;gap:10px;flex-wrap:wrap"><button class="btn btn--primary" onclick="window.bpTrack&amp;&amp;bpTrack('logsheet_print');window.print()">기록지 인쇄</button><a class="btn btn--secondary" href="/measure/">재는 법 확인</a></div>
<div class="report-sheet logsheet">
<header><div><h1>가정혈압 기록지</h1><div class="meta">이름 ____________ &nbsp; 혈압계 ____________ &nbsp; 측정 팔 □ 왼팔 □ 오른팔</div></div><img src="/assets/img/logo.png" alt="바른혈압"></header>
<p class="q" style="margin:0 0 8px">아침: 기상 후 1시간 이내, 소변 후, 약·식사 전 · 저녁: 잠들기 전 · 등받이 의자에 앉아 5분 안정 후 1~2분 간격으로 2번</p>
<table><thead><tr><th style="width:12%">날짜</th><th>아침 1회<br><small>수축기/이완기 · 맥박</small></th><th>아침 2회</th><th>저녁 1회</th><th>저녁 2회</th><th style="width:22%">메모<br><small>약 복용·음주·수면·증상</small></th></tr></thead><tbody>{rows}</tbody></table>
<div class="foot">이 기록지는 이용자가 가정에서 측정한 값을 적는 양식이며 진단 자료가 아닙니다. 수치의 해석과 치료 판단은 의료진이 합니다. 바른혈압 bareunbp.com</div>
</div>
</div></section>
"""
    return page("인쇄용 혈압 기록지 — 2주 가정혈압 기록표", "아침·저녁 2회씩 적는 2주 가정혈압 기록지. 무료로 인쇄해 혈압계 옆이나 냉장고에 붙여 두세요.", "/tools/log-sheet/", body,
                keywords=["혈압 기록지", "혈압 기록표", "혈압 기록지 양식", "가정혈압 기록지 인쇄", "혈압 수첩"])


# ============================================================
# 용어사전·FAQ·검색·챌린지
# ============================================================
def glossary_page():
    def slug(t):
        return "t-" + "".join(ch for ch in t if ch.isalnum())
    items = "".join(f'<div class="term" id="{slug(t)}"><dt>{t} <span>{alt}</span></dt><dd>{d}{f" <a href=\"{l}\">관련 글</a>" if l else ""}</dd></div>' for t, alt, d, l in GLOSSARY)
    ld = {"@context": "https://schema.org", "@type": "DefinedTermSet", "name": "고혈압 용어사전", "url": SITE + "/glossary/", "hasDefinedTerm": [{"@type": "DefinedTerm", "name": t, "alternateName": alt, "description": d, "url": f"{SITE}/glossary/#{slug(t)}"} for t, alt, d, _ in GLOSSARY]}
    body = page_head("고혈압 용어사전", f"진료실과 검사지에서 듣는 고혈압 용어 {len(GLOSSARY)}개를 쉬운 말로 풀었습니다.", [("/", "홈"), (None, "용어사전")], "/glossary/") + f"""
<section class="section section--tight"><div class="wrap wrap--narrow">
<div class="field no-print" style="margin-bottom:18px"><label for="gl-q">용어 찾기</label><input id="gl-q" type="search" placeholder="예: 이완기, ARB, 백의"></div>
<dl class="glossary" id="gl-list">{items}</dl>
</div></section>
"""
    js = """<script>(function(){var q=document.getElementById('gl-q');var t=document.querySelectorAll('#gl-list .term');q.addEventListener('input',function(){var v=q.value.trim().toLowerCase();t.forEach(function(el){el.style.display=!v||el.textContent.toLowerCase().indexOf(v)>-1?'':'none'})})})();</script>"""
    return page("고혈압 용어사전 — 수축기·이완기부터 ARB·DASH까지", "고혈압 진료와 검사에서 쓰는 용어를 쉬운 말로 정리했습니다. 수축기·이완기, 백의고혈압, 가면고혈압, 활동혈압, ARB, 칼슘차단제, DASH, eGFR 등.", "/glossary/", body, jsonld=ld, extra_js=js,
                keywords=["고혈압 용어", "수축기 이완기 뜻", "백의고혈압 뜻", "ARB 뜻", "혈압약 이름"])


def faq_page():
    cats = []
    for c, _, _ in FAQ:
        if c not in cats:
            cats.append(c)
    sections = ""
    for c in cats:
        items = "".join(f'<details class="faq-item"><summary>{q}</summary><div>{a}</div></details>' for cc, q, a in FAQ if cc == c)
        sections += f'<h2 id="{c}">{c}</h2><div class="faq-list">{items}</div>'
    toc = "".join(f'<a class="chip" href="#{c}">{c}</a>' for c in cats)
    ld = faq_ld([(q, a) for _, q, a in FAQ])
    body = page_head("자주 묻는 질문", "혈압 수치, 측정, 생활, 약, 응급 상황, 서비스 이용에 대해 가장 많이 묻는 질문에 짧게 답합니다. 자세한 내용은 연결된 글을 보세요.", [("/", "홈"), (None, "자주 묻는 질문")], "/faq/") + f"""
<section class="section section--tight"><div class="wrap wrap--narrow">
<div class="chips">{toc}</div>
{sections}
<div class="article-cta no-print"><div><b>찾는 답이 없나요?</b><span>질문을 남기면 근거를 붙여 답변합니다.</span></div><a class="btn btn--primary" href="/community/#ask">질문 남기기</a></div>
</div></section>
"""
    return page("고혈압 자주 묻는 질문 — 혈압 수치·측정·약·생활", "혈압 정상수치, 혈압 재는 시간, 나트륨 권장량, 혈압약 복용, 혈압 180 이상일 때 등 고혈압에 관해 자주 묻는 질문과 답.", "/faq/", body, jsonld=ld,
                keywords=["고혈압 질문", "혈압 궁금증", "혈압 정상수치", "혈압약 질문", "고혈압 FAQ"])


def search_page():
    body = page_head("사이트 검색", "건강정보, 음식·식단, 팩트체크, 레시피, 용어사전에서 찾습니다.", [("/", "홈"), (None, "검색")], "/search/") + """
<section class="section section--tight"><div class="wrap wrap--narrow">
<form id="sr-form" role="search" class="search-form"><label class="sr-only" for="sr-q">검색어</label><input id="sr-q" name="q" type="search" placeholder="예: 혈압 정상수치, 짬뽕 나트륨, 혈압약 부작용" autocomplete="off"><button class="btn btn--primary" type="submit">검색</button></form>
<div class="chips" style="margin-top:14px"><a class="chip" href="?q=정상수치">정상수치</a><a class="chip" href="?q=재는 법">재는 법</a><a class="chip" href="?q=나트륨">나트륨</a><a class="chip" href="?q=혈압약">혈압약</a><a class="chip" href="?q=증상">증상</a><a class="chip" href="?q=음식">음식</a></div>
<p id="sr-info" class="fine"></p>
<ul class="post-list" id="sr-results"></ul>
</div></section>
"""
    return page("사이트 검색", "바른혈압 사이트 검색", "/search/", body, noindex=True, extra_js='<script src="/assets/js/search.js"></script>')


CHALLENGES = [
    dict(id="bp7", title="7일 바르게 재기", days=7, icon="cuff", desc="7일 동안 아침·저녁 바른 자세로 재고 기록합니다. 진료 전에 하기 좋은 첫 챌린지.", how="오늘 아침·저녁 측정을 마쳤으면 체크", link="/check7/"),
    dict(id="soup14", title="국물 남기기 14일", days=14, icon="bowl", desc="국·찌개·면 국물을 절반 이상 남깁니다. 나트륨을 줄이는 가장 쉬운 방법.", how="오늘 모든 국물을 절반 이상 남겼으면 체크", link="/food/sodium-table.html"),
    dict(id="walk30", title="30분 걷기 30일", days=30, icon="leaf", desc="하루 30분 빠르게 걷기. 10분씩 세 번도 인정합니다.", how="오늘 합계 30분 이상 걸었으면 체크", link="/info/exercise.html"),
    dict(id="dry7", title="술 없는 7일", days=7, icon="flag", desc="일주일 동안 술을 마시지 않고, 다음 주 아침 혈압과 비교해 봅니다.", how="오늘 술을 마시지 않았으면 체크", link="/info/alcohol.html"),
]


def challenges_page():
    cards = "".join(f'''<article class="challenge card" data-id="{c["id"]}" data-days="{c["days"]}">
<div class="ch-head"><div class="ico">{ICONS[c["icon"]]}</div><div><h3>{c["title"]}</h3><p>{c["desc"]}</p></div></div>
<div class="ch-grid" aria-label="진행 현황"></div>
<p class="fine ch-how">{c["how"]}</p>
<div class="ch-actions"><button class="btn btn--primary btn--sm ch-done" type="button">오늘 완료</button><button class="btn btn--ghost btn--sm ch-reset" type="button">처음부터</button><a class="btn btn--ghost btn--sm" href="{c["link"]}">관련 정보</a></div>
<p class="ch-status"></p></article>''' for c in CHALLENGES)
    body = page_head("혈압 관리 챌린지", "작은 습관 하나를 정해 며칠 동안 이어가 보세요. 진행 기록은 이 브라우저에만 저장됩니다.", [("/", "홈"), ("/community/", "커뮤니티"), (None, "챌린지")], "/community/challenges/") + f"""
<section class="section section--tight"><div class="wrap">
<div class="grid grid--2 challenges">{cards}</div>
<div class="card card--sky" style="margin-top:24px"><h3>챌린지를 마쳤다면</h3><p style="margin:0">기록 전후의 가정혈압 평균을 비교해 보고, 경험을 <a href="/community/#story">커뮤니티</a>에 나눠 주세요. 같은 고민을 가진 분들에게 가장 큰 도움이 됩니다. 수치 해석은 진료 때 의료진과 하세요.</p></div>
</div></section>
"""
    return page("혈압 관리 챌린지 — 7일 재기, 국물 남기기, 30분 걷기", "혼자서도 이어가기 쉬운 혈압 관리 챌린지. 7일 바르게 재기, 국물 남기기 14일, 30분 걷기 30일, 술 없는 7일.", "/community/challenges/", body, extra_js='<script src="/assets/js/challenge.js"></script>',
                keywords=["혈압 챌린지", "걷기 챌린지", "저염 챌린지", "금주 챌린지"])


# ============================================================
# 커뮤니티 (확장)
# ============================================================
SEED_QNA = [
    ("검진에서 처음", "건강검진에서 138/88이 나왔는데 병원에 가야 하나요, 아니면 지켜봐도 되나요?", "한 번의 검진 값으로는 판단하지 않습니다. 집에서 5~7일 아침·저녁으로 재서 평균을 내고, 그 기록을 가지고 내과·가정의학과에서 상의하는 것이 표준 흐름입니다. 관련 글: <a href=\"/info/first-high-reading.html\">검진에서 처음 높게 나왔을 때</a>"),
    ("측정", "아침에 재면 높고 저녁에 재면 낮은데, 어느 쪽이 진짜인가요?", "둘 다 진짜입니다. 혈압은 하루 중 변하며 아침에 높은 형태가 흔합니다. 아침·저녁 값을 나눠 기록하면 의료진이 양상을 볼 수 있습니다. 관련 글: <a href=\"/info/morning-bp.html\">아침 혈압이 높은 이유</a>"),
    ("약", "혈압약을 먹고 있는데 집에서 재면 125/80으로 잘 나옵니다. 약을 줄여도 되나요?", "커뮤니티가 답할 수 없는 영역입니다. 약의 조정은 기록과 검사 결과를 본 의료진이 결정합니다. 2~4주 기록을 <a href=\"/report/\">리포트</a>로 정리해 진료 때 물어보세요."),
    ("젊은 혈압", "32살인데 아래 혈압만 92~95로 나옵니다. 위는 125 정도예요.", "수축기 140 미만·이완기 90 이상이 반복되면 이완기단독고혈압(IDH)에 해당할 수 있습니다. 5~7일 바르게 재서 확인하고 기록을 가지고 진료를 받아보세요. 관련 글: <a href=\"/info/idh.html\">이완기단독고혈압</a>"),
    ("생활", "라면을 좋아하는데 끊어야 하나요?", "끊기보다 먹는 방법을 바꾸는 것부터 시작하세요. 스프 절반, 채소 추가, 국물 남기기만 해도 나트륨이 크게 줄어듭니다. <a href=\"/food/eating-out.html\">외식·편의점 가이드</a>"),
    ("생활", "저나트륨 소금으로 바꾸려는데 괜찮을까요?", "칼륨이 들어 있는 제품이 많습니다. 콩팥 질환이 있거나 ACE억제제·ARB·칼륨보존 이뇨제를 드신다면 먼저 의료진과 상의하세요. <a href=\"/food/potassium.html\">칼륨과 주의사항</a>"),
    ("측정", "혈압계로 연속해서 재면 매번 숫자가 달라요.", "혈압은 원래 박동마다 변합니다. 1~2분 간격으로 2번 재서 둘 다 기록하고 평균을 보세요. 지나치게 차이가 크면 커프 크기와 자세를 확인하세요. <a href=\"/info/monitor-accuracy.html\">혈압계 정확도</a>"),
    ("가족", "어머니가 혈압약을 드시고 자꾸 어지럽다고 하세요.", "앉은 자세와 선 자세의 혈압을 재서 기록하고 처방 의료진과 상의하세요. 약을 임의로 줄이지 마세요. 낙상 예방도 중요합니다. <a href=\"/info/low-bp.html\">기립성 저혈압</a>"),
    ("생활", "커피를 하루 3잔 마시는데 줄여야 하나요?", "적당한 커피는 대부분 문제가 되지 않는다는 근거가 많습니다. 다만 측정 전 30분은 피하고, 잠을 방해한다면 오후 커피를 줄여 보세요. <a href=\"/info/caffeine.html\">커피와 혈압</a>"),
    ("약", "혈압 영양제를 먹으면 약을 줄일 수 있나요?", "건강기능식품은 약을 대신하지 않습니다. 상호작용이 있을 수 있으니 복용 전 약사·의료진과 확인하세요. <a href=\"/food/supplements.html\">건강기능식품 가이드</a>"),
]


def community():
    seed = "".join(f'<li data-cat="{c}"><div class="qh"><b>{c}</b><span>바른혈압 편집팀 답변</span></div><div class="q">{q}</div><div class="a"><b>답변</b>{a}</div></li>' for c, q, a in SEED_QNA)
    cats = ["전체"] + sorted({c for c, _, _ in SEED_QNA})
    chips = "".join(f'<button aria-pressed="{"true" if i == 0 else "false"}" data-cat="{"all" if i == 0 else c}">{c}</button>' for i, c in enumerate(cats))
    ld = {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": __import__("re").sub(r"<[^>]+>", "", a)}} for _, q, a in SEED_QNA]}
    body = page_head("커뮤니티", "자유게시판에서 경험과 정보를 나누고, 질문에는 편집팀이 근거를 붙여 답하고, 작은 습관을 함께 이어가는 공간입니다. 개인의 진단·약 조정은 답하지 않습니다.", [("/", "홈"), (None, "커뮤니티")], "/community/") + f"""
<section class="section section--tight">
<div class="wrap">
<div class="grid grid--4 community-entry">
<a class="pillar" href="/community/board/"><div class="ico">{ICONS["board"]}</div><h3>자유게시판</h3><p>경험과 정보를 편하게 나누는 곳. 회원이면 누구나 씁니다.</p></a>
<a class="pillar" href="#qna"><div class="ico">{ICONS["chat"]}</div><h3>질문과 답변</h3><p>근거를 붙인 답변. 의료 조언은 하지 않습니다.</p></a>
<a class="pillar" href="/community/challenges/"><div class="ico">{ICONS["flag"]}</div><h3>챌린지</h3><p>7일 재기, 국물 남기기, 30분 걷기, 술 없는 7일.</p></a>
<a class="pillar" href="#story"><div class="ico">{ICONS["family"]}</div><h3>경험 나누기</h3><p>바꿔 본 습관과 그 과정을 나눕니다.</p></a>
</div>
<div class="card" style="margin-top:20px">
<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:6px"><h2 style="margin:0;font-size:1.2rem">자유게시판 새 글</h2><div style="display:flex;gap:8px"><a class="btn btn--secondary btn--sm" href="/community/board/">전체 보기</a><a class="btn btn--primary btn--sm" href="/community/board/write/">글쓰기</a></div></div>
<ul class="board-latest" id="board-latest"><li style="padding:14px 4px;color:var(--muted)">불러오는 중…</li></ul>
</div>
</div>
</section>
<section class="section section--tight" id="qna">
<div class="wrap">
<div class="qna-layout">
<div>
<h2>질문과 답변</h2>
<div class="tabs" id="qna-cat">{chips}</div>
<ul class="qna-list" id="qna-live" style="margin-bottom:12px"></ul>
<ul class="qna-list" id="qna-seed">{seed}</ul>
</div>
<div>
<div class="rules">
<h3 style="margin-bottom:8px">이 공간의 규칙</h3>
<ol>
<li><b>의료 조언을 하지 않습니다.</b> 약을 시작·중단·변경하라는 답변은 올리지 않으며, 올라오면 삭제합니다.</li>
<li><b>본인 수치와 병력을 자세히 적지 마세요.</b> 공개되는 공간입니다.</li>
<li><b>응급 증상은 여기서 묻지 마세요.</b> 심한 두통, 가슴 통증, 마비, 말 어눌함은 119입니다.</li>
<li><b>제품·병원 홍보는 삭제합니다.</b></li>
<li><b>경험과 근거를 구분합니다.</b> 경험담에는 '경험' 표시를, 정보에는 출처를 붙입니다.</li>
</ol>
</div>
<div class="card" style="margin-top:16px" id="ask">
<h3>질문 남기기</h3>
<p style="color:var(--muted);font-size:.92rem">접수된 질문은 확인 후 근거를 붙여 답변과 함께 게시합니다. 닉네임과 질문만 공개됩니다.</p>
<form class="form" data-api="qna" data-success="질문이 접수됐습니다. 확인 후 답변과 함께 게시됩니다." data-subject="커뮤니티 질문">
<input class="hp" type="text" name="website" tabindex="-1" autocomplete="off">
<div class="row"><div class="field"><label for="q-nick">닉네임</label><input id="q-nick" name="nickname" type="text" required maxlength="20" placeholder="예: 새벽걷기"></div><div class="field"><label for="q-cat">주제</label><select id="q-cat" name="category"><option>검진에서 처음</option><option>측정</option><option>생활</option><option>음식</option><option>약</option><option>젊은 혈압</option><option>가족</option><option>기타</option></select></div></div>
<div class="field"><label for="q-text">질문</label><textarea id="q-text" name="question" required maxlength="600" placeholder="상황을 중심으로 적어주세요. 본인의 정확한 수치나 병력은 적지 않아도 됩니다."></textarea></div>
<label class="agree"><input type="checkbox" name="agree" value="y"> 질문은 닉네임과 함께 공개 게시될 수 있으며, 개인 건강정보를 포함하지 않았습니다. <a href="/policy/privacy.html">개인정보 처리방침</a></label>
<button class="btn btn--primary" type="submit">질문 보내기</button>
<div class="form-msg" role="status"></div>
</form>
</div>
</div>
</div>
</div>
</section>
<section class="section section--sky" id="story">
<div class="wrap wrap--narrow">
<div class="section-head"><h2>경험 나누기</h2><p>국물을 남기기 시작한 일, 걷기를 이어간 방법, 부모님 혈압을 함께 챙긴 이야기. 무엇을 바꿨고 무엇이 어려웠는지 나눠 주세요. 검토 후 '경험' 표시와 함께 게시합니다.</p></div>
<form class="form card" data-api="qna" data-success="이야기가 접수됐습니다. 검토 후 게시됩니다." data-subject="경험 나누기">
<input class="hp" type="text" name="website" tabindex="-1" autocomplete="off">
<input type="hidden" name="category" value="경험담">
<div class="row"><div class="field"><label for="s-nick">닉네임</label><input id="s-nick" name="nickname" required maxlength="20"></div><div class="field"><label for="s-topic">주제</label><input id="s-topic" name="topic" maxlength="40" placeholder="예: 국물 남기기 한 달"></div></div>
<div class="field"><label for="s-text">이야기</label><textarea id="s-text" name="question" required maxlength="600" placeholder="무엇을 바꿨는지, 어떻게 이어갔는지, 어려웠던 점. 약 이름이나 수치보다 과정 위주로 적어주세요."></textarea></div>
<label class="agree"><input type="checkbox" name="agree" value="y"> 닉네임과 함께 공개 게시될 수 있으며 개인 건강정보를 포함하지 않았습니다. 의료 조언으로 읽힐 수 있는 부분은 편집될 수 있습니다.</label>
<button class="btn btn--primary" type="submit">이야기 보내기</button>
<div class="form-msg" role="status"></div>
</form>
</div>
</section>
<section class="section" id="letter">
<div class="wrap">
<div class="split">
<div><h2>주간 혈압 레터</h2><p>이번 주에 확인할 것 하나를 짧게 보냅니다. 새로 올라온 질문과 답변, 팩트체크, 계절별 관리 포인트를 담습니다.</p>{newsletter_form()}</div>
<img src="/assets/img/photo-family.jpg" alt="가족이 함께 혈압 기록을 보며 이야기하는 모습" loading="lazy" width="1400" height="787">
</div>
</div>
</section>
"""
    js = """<script>
(function(){var ul=document.getElementById('qna-live');
fetch('/api/qna').then(function(r){return r.ok?r.json():null}).then(function(j){if(!j||!j.ok||!j.items||!j.items.length)return;
ul.innerHTML=j.items.map(function(q){var story=q.category==='경험담';return '<li data-cat="'+esc(q.category||'')+'"><div class="qh"><b>'+(story?'경험':esc(q.category||''))+'</b><span>'+esc(q.nickname||'')+' · '+(q.created_at||'').slice(0,10)+'</span></div><div class="q">'+esc(q.question)+'</div>'+(q.answer?'<div class="a"><b>답변'+(q.reviewed?' <span class="review-status review-status--done" style="font-size:.72rem;padding:1px 8px;margin-left:4px">감수자 검토</span>':'')+'</b>'+(window.bpRenderAnswer?bpRenderAnswer(q.answer):esc(q.answer))+'</div>':'')+'</li>'}).join('');}).catch(function(){});
var tabs=document.querySelectorAll('#qna-cat button');tabs.forEach(function(b){b.addEventListener('click',function(){var c=b.dataset.cat;tabs.forEach(function(x){x.setAttribute('aria-pressed',x===b?'true':'false')});document.querySelectorAll('#qna-seed li,#qna-live li').forEach(function(li){li.style.display=(c==='all'||li.dataset.cat===c)?'':'none'})})});
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}})();
</script><script src="/assets/js/board.js"></script>"""
    return page("커뮤니티 — 고혈압 질문과 답변, 챌린지, 경험 나누기", "고혈압 관리에 관한 질문에 근거를 붙여 답하고, 혈압 관리 챌린지와 경험을 나누는 공간. 의료 조언 없이 진료 때 무엇을 물어볼지 안내합니다.", "/community/", body, jsonld=ld, extra_js=js,
                keywords=["고혈압 커뮤니티", "혈압 질문", "고혈압 카페", "혈압 관리 후기", "고혈압 상담"])
