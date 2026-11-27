# -*- coding: utf-8 -*-
from base import *
from articles import ARTICLES, CATEGORIES, CAT_NAME
from factchecks import FACTCHECKS, VERDICTS
import seo as SEO

# ============================================================
# 홈
# ============================================================
def home():
    import seo_content as _SC
    SC_POP = _SC.popular_html()
    pillars = [
        ("cuff", "바르게 재기", "시간, 자세, 커프 위치. 잘못 잰 숫자는 아무 의미가 없습니다. 재기 전 1분 체크리스트.", "/measure/"),
        ("calendar", "7일 혈압 기록", "회원가입 없이, 이 기기에만 저장됩니다. 아침·저녁 기록과 7일 평균을 봅니다.", "/check7/"),
        ("doc", "진료 준비 리포트", "기록을 A4 한 장으로 정리해 인쇄합니다. 진료 때 물어볼 질문도 함께.", "/report/"),
        ("book", "검증된 정보", "학회 지침과 공공기관 자료만 근거로 씁니다. 모든 글에 출처와 검토일을 표기합니다.", "/info/"),
    ]
    pil = "".join(f'<a class="pillar" href="{h}"><div class="ico">{ICONS[i]}</div><h3>{t}</h3><p>{d}</p><span class="more">바로가기</span></a>' for i, t, d, h in pillars)

    jtbd = [
        ("검진에서 처음 높게 나왔어요", "무엇을 의미하는지, 다음에 무엇을 해야 하는지 알고 싶습니다.", "/info/first-high-reading.html", "72시간 가이드"),
        ("약을 먹으며 집에서 관리 중이에요", "기록을 꾸준히 남기고 진료 때 쉽게 보여주고 싶습니다.", "/check7/", "기록 시작"),
        ("부모님 혈압을 챙기고 있어요", "부담 없이 같이 보고, 병원 갈 때 도와드리고 싶습니다.", "/family/", "가족 가이드"),
        ("임신·젊은 고혈압 등 특별한 상황이에요", "내 상황에서 무엇을 확인해야 하는지 알고 싶습니다.", "/info/#special", "상황별 정보"),
    ]
    jt = "".join(f'<a href="{h}"><div><b>{t}</b><span>{d}</span></div><span class="go">{g}</span></a>' for t, d, h, g in jtbd)

    import daily
    _fresh = daily.recent(6)
    _base = [(f"/info/{a['slug']}.html", CAT_NAME[a["cat"]], a["title"], a["summary"], a.get("date", REVIEW_DATE)) for a in ARTICLES if a['slug'] in ('reading-numbers','first-high-reading','home-measurement','lifestyle-effects','stroke-signs','taking-meds')]
    _seen = {x[0] for x in _fresh}
    latest = "".join(f'<li><a href="{u}"><span class="cat">{c}</span><span><b>{t}</b><span>{s}</span></span><span class="date">{d}</span></a></li>' for u, c, t, s, d in (_fresh + [x for x in _base if x[0] not in _seen])[:6])
    fcs = "".join(f'<li><a href="/factcheck/{f["slug"]}.html"><span><q>{f["claim"]}</q><span>{f["summary"]}</span></span><span class="verdict {VERDICTS[f["verdict"]][1]}">{VERDICTS[f["verdict"]][0]}</span></a></li>' for f in FACTCHECKS[:4])

    body = f"""
<section class="hero">
<div class="wrap">
<div>
<h1>검진에서 혈압이<br>높게 나왔나요?</h1>
<p class="lead">한 번의 숫자로 결론 내리지 마세요. 바르게 다시 재고, 7일을 기록하고, 그 기록을 진료에 가져가는 것. 바른혈압은 그 순서를 돕습니다.</p>
<div class="hero-actions">
<a class="btn btn--primary btn--lg" href="/check7/">7일 혈압 기록 시작</a>
<a class="btn btn--secondary btn--lg" href="/measure/">바르게 재는 법 먼저 보기</a>
</div>
<form id="quick-entry" class="quick-entry" autocomplete="off">
<h3>지금 잰 혈압을 바로 기록</h3>
<p class="hint">회원가입 없이 이 기기에만 저장됩니다. 서버로 보내지 않습니다.</p>
<div class="bp-inputs">
<div class="field"><label for="q-sys">수축기(위)</label><input class="big num" id="q-sys" name="sys" type="number" inputmode="numeric" min="50" max="260" placeholder="120" required><div class="unit">mmHg</div></div>
<div class="slash">/</div>
<div class="field"><label for="q-dia">이완기(아래)</label><input class="big num" id="q-dia" name="dia" type="number" inputmode="numeric" min="30" max="160" placeholder="80" required><div class="unit">mmHg</div></div>
<div class="field pulse"><label for="q-pulse">맥박</label><input class="big num" id="q-pulse" name="pulse" type="number" inputmode="numeric" min="30" max="220" placeholder="72"><div class="unit">bpm · 선택</div></div>
</div>
<div style="margin-top:14px;display:flex;gap:10px;align-items:center;flex-wrap:wrap"><button class="btn btn--primary" type="submit">기록하고 7일 기록으로 가기</button><span style="font-size:.85rem;color:var(--muted)">수치를 판정하지 않습니다. 해석은 진료 때 의료진과.</span></div>
</form>
</div>
<div class="hero-photo"><img src="/assets/img/hero-home.jpg" alt="" width="700" height="1120" fetchpriority="high"></div>
</div>
</section>

<section class="section">
<div class="wrap">
<div class="section-head"><h2>정보를 읽고 끝나지 않도록, 네 가지로 연결합니다</h2><p>고혈압 정보는 이미 많습니다. 부족한 것은 '올바르게 재고 → 이해하고 → 기록하고 → 진료에 연결하는' 흐름입니다.</p></div>
<div class="pillars">{pil}</div>
</div>
</section>

<section class="section section--tight">
<div class="wrap">
<div class="stat-grid">
<div class="stat"><b>1,361<small>만 명</small></b><span>우리나라 20세 이상 고혈압 유병자. 성인 세 명 중 한 명</span></div>
<div class="stat"><b>4<small>명 중 1명</small></b><span>고혈압이 있는데도 자신의 상태를 모르는 사람</span></div>
<div class="stat"><b>56<small>%</small></b><span>혈압이 목표 범위로 조절되는 사람의 비율</span></div>
<div class="stat"><b>77<small>%</small></b><span>치료를 받는 사람 가운데 조절되는 비율</span></div>
</div>
<p class="fine" style="margin:12px 0 0">대한고혈압학회 팩트시트 2026(2024년 자료). 증상이 없어 모르고 지나가지만, 알고 치료하면 대부분 조절됩니다. <a href="/stats/">숫자로 보는 고혈압</a></p>
</div>
</section>

<section class="section section--sky">
<div class="wrap">
<div class="section-head"><h2>지금 상황에서 시작하기</h2><p>같은 고혈압이라도 지금 해결하려는 일은 다릅니다. 가장 가까운 것을 고르세요.</p></div>
<div class="jtbd">{jt}</div>
</div>
</section>

<section class="section">
<div class="wrap">
<div class="split">
<div>
<p class="kicker">진료 준비 리포트</p>
<h2>기록을 A4 한 장으로,<br>진료 때 그대로 보여주세요</h2>
<p>7일 기록의 평균·범위·측정 조건을 인쇄용 한 장으로 정리합니다. "판정"은 없습니다. 의료진이 보기 좋은 형태로 정리하는 것이 목적입니다. 진료 전에 물어볼 질문 목록도 함께 들어갑니다.</p>
<div class="hero-actions"><a class="btn btn--primary" href="/report/">리포트 만들기</a><a class="btn btn--secondary" href="/clinic/">진료 전 준비 보기</a></div>
</div>
<img src="/assets/img/photo-doctor.jpg" alt="의료진이 혈압 기록 리포트를 보며 설명하는 모습" loading="lazy" width="1400" height="787">
</div>
</div>
</section>

{SC_POP}
<section class="section section--sky">
<div class="wrap">
<div class="grid grid--2" style="gap:40px;align-items:start">
<div>
<div class="section-head" style="margin-bottom:20px"><h2>고혈압 건강정보</h2><p>학회 진료지침과 공공기관 자료를 근거로, 사람들이 실제로 묻는 질문 단위로 다시 씁니다.</p></div>
<ul class="post-list">{latest}</ul>
<p style="margin-top:16px"><a class="btn btn--secondary" href="/info/">전체 건강정보 보기</a></p>
</div>
<div>
<div class="section-head" style="margin-bottom:20px"><h2>팩트체크</h2><p>유튜브와 블로그에 도는 이야기를 지침과 대조합니다. 판정은 단정 대신 범위로 설명합니다.</p></div>
<ul class="fc-list">{fcs}</ul>
<p style="margin-top:16px"><a class="btn btn--secondary" href="/factcheck/">전체 팩트체크 보기</a></p>
</div>
</div>
</div>
</section>

<section class="section">
<div class="wrap">
<div class="split" style="align-items:start">
<div>
<p class="kicker">음식·식단</p>
<h2>짬뽕 한 그릇에 나트륨 4,000mg</h2>
<p>하루 권고량(2,000mg)의 두 배입니다. 국물 메뉴가 많은 한국 식단에서는 무엇을 먹느냐만큼 어떻게 먹느냐가 중요합니다. 메뉴별 나트륨을 비교하고, 오늘 먹은 양을 계산하고, 저염 레시피와 일주일 식단으로 바꿔 보세요.</p>
<div class="hero-actions"><a class="btn btn--primary" href="/food/">음식·식단 보기</a><a class="btn btn--secondary" href="/tools/sodium/">나트륨 계산기</a></div>
<div class="chips"><a class="chip" href="/food/good-foods.html">혈압에 좋은 음식</a><a class="chip" href="/food/sodium-table.html">외식 나트륨표</a><a class="chip" href="/food/dash.html">DASH 식단</a><a class="chip" href="/food/meal-plan.html">7일 저염 식단</a><a class="chip" href="/food/recipes/">저염 레시피</a><a class="chip" href="/food/potassium.html">칼륨 주의</a></div>
</div>
<div class="card">
<h3>도구 모음</h3>
<ul class="tool-list">
<li><a href="/tools/timer/">{ICONS["timer"]}<span><b>측정 타이머</b>5분 안정부터 2회 측정까지 안내</span></a></li>
<li><a href="/tools/sodium/">{ICONS["bowl"]}<span><b>나트륨 계산기</b>오늘 먹은 메뉴의 나트륨 합계</span></a></li>
<li><a href="/tools/meds/">{ICONS["pill"]}<span><b>복약 체크</b>아침·저녁 약 복용 기록</span></a></li>
<li><a href="/tools/reminder/">{ICONS["bell"]}<span><b>측정 알림</b>휴대폰 캘린더에 알림 추가</span></a></li>
<li><a href="/tools/log-sheet/">{ICONS["print"]}<span><b>종이 기록지</b>인쇄해서 냉장고에</span></a></li>
</ul>
</div>
</div>
</div>
</section>

<section class="section">
<div class="wrap">
<div class="section-head"><h2>바른혈압이 지키는 네 가지 약속</h2></div>
<div class="grid grid--4">
<div class="card"><div class="ico" style="color:var(--teal);width:36px;height:36px;margin-bottom:10px">{ICONS["shield"]}</div><h3>근거를 보여줍니다</h3><p style="margin:0;color:var(--muted);font-size:.95rem">모든 글에 근거 유형, 확실성, 적용 대상, 최종 검토일, 이해상충 여부를 표시합니다.</p></div>
<div class="card"><div class="ico" style="color:var(--teal);width:36px;height:36px;margin-bottom:10px">{ICONS["cuff"]}</div><h3>재는 법부터 정확히</h3><p style="margin:0;color:var(--muted);font-size:.95rem">잘못 잰 값을 기록하는 것보다 바르게 재는 것이 먼저입니다. 측정 조건을 기록에 남깁니다.</p></div>
<div class="card"><div class="ico" style="color:var(--teal);width:36px;height:36px;margin-bottom:10px">{ICONS["check"]}</div><h3>판정하지 않습니다</h3><p style="margin:0;color:var(--muted);font-size:.95rem">개인의 위험도, 진단, 약 변경을 사이트가 판단하지 않습니다. 그것은 의료진의 영역입니다.</p></div>
<div class="card"><div class="ico" style="color:var(--teal);width:36px;height:36px;margin-bottom:10px">{ICONS["doc"]}</div><h3>기록은 내 기기에</h3><p style="margin:0;color:var(--muted);font-size:.95rem">혈압 기록은 브라우저에만 저장되며 서버로 전송되지 않습니다. 내보내기와 삭제는 언제든 가능합니다.</p></div>
</div>
</div>
</section>

<section class="section section--sky">
<div class="wrap">
<div class="grid grid--3">
<a class="pillar" href="/devices/"><div class="ico">{ICONS["device"]}</div><h3>혈압계 가이드</h3><p>상완형·손목형·스마트워치·커프리스. 순위 대신 검증 수준과 조건을 비교합니다.</p><span class="more">유형별 비교</span></a>
<a class="pillar" href="/family/"><div class="ico">{ICONS["family"]}</div><h3>가족과 함께</h3><p>부모님 혈압을 자녀가 함께 챙기는 방법. 리포트 공유부터 시작합니다.</p><span class="more">가족 가이드</span></a>
<a class="pillar" href="/community/board/"><div class="ico">{ICONS["board"]}</div><h3>자유게시판</h3><p>혈압을 관리하는 사람들이 경험과 정보를 나누는 곳. 질문과 답변, 챌린지도 함께.</p><span class="more">이야기 나누기</span></a>
<a class="pillar" href="/videos/"><div class="ico">{ICONS["video"]}</div><h3>영상으로 배우기</h3><p>학회와 대학병원이 만든 영상 30편. 혈압 재는 법부터 뇌졸중 증상까지.</p><span class="more">영상 보기</span></a>
<a class="pillar" href="/library/"><div class="ico">{ICONS["library"]}</div><h3>공신력 있는 자료실</h3><p>학회·공공기관·국제기구의 자료와 검증된 혈압계 목록을 한곳에.</p><span class="more">자료 찾기</span></a>
<a class="pillar" href="/news/"><div class="ico">{ICONS["chart"]}</div><h3>고혈압 소식과 통계</h3><p>팩트시트, 국민건강영양조사, 지침 변화를 원자료 기준으로 정리합니다.</p><span class="more">소식 보기</span></a>
</div>
<a class="mall-band" href="/mall/"><span class="ico">{ICONS["bag"]}</span><span><b>바른혈압몰</b><span>혈압 수첩·약통·줄자·염도계·계량 스푼·홈트레이닝 용품. 글과 함께 쓰기 좋은 생활 관리 물건을 모았습니다.</span></span><span class="mall-band__tag">제휴 · 쿠팡 파트너스</span></a>
</div>
</section>

<section class="section">
<div class="wrap">
<div class="split split--rev">
<img src="/assets/img/photo-flatlay.jpg" alt="혈압계, 채소 식단, 운동화가 놓인 테이블" loading="lazy" width="1400" height="787">
<div>
<p class="kicker">주간 혈압 레터</p>
<h2>매주 한 번, 이번 주에 확인할 것 하나</h2>
<p>검색 알고리즘과 상관없이 직접 닿는 연결을 만듭니다. 지침이 바뀌면 무엇이 달라졌는지, 계절이 바뀌면 무엇을 확인할지 짧게 보냅니다. 광고 없이 운영합니다.</p>
{newsletter_form()}
</div>
</div>
</div>
</section>
"""
    ld = [
        {"@context": "https://schema.org", "@type": "Organization", "@id": SITE + "/#organization", "name": BRAND,
         "alternateName": ["bareunbp", "바른혈압 bareunbp.com"], "url": SITE, "logo": SITE + "/assets/img/logo@2x.png",
         "description": "대한고혈압학회 진료지침과 공공기관 자료를 근거로 고혈압·혈압 관리 정보와 무료 가정혈압 기록 도구를 제공하는 한국어 사이트",
         "slogan": TAGLINE, "areaServed": {"@type": "Country", "name": "대한민국"},
         "knowsAbout": ["고혈압", "가정혈압 측정", "혈압 정상수치", "저염 식단", "나트륨", "혈압약", "백의고혈압", "DASH 식단"],
         "email": "spaceblank0100@gmail.com", "parentOrganization": {"@type": "Organization", "name": "주식회사 블랭크"}},
    ]
    ld.append({"@context": "https://schema.org", "@type": "WebSite", "@id": SITE + "/#website", "name": BRAND, "alternateName": "bareunbp", "url": SITE,
               "inLanguage": "ko", "publisher": {"@id": SITE + "/#organization"}, "potentialAction": {"@type": "SearchAction", "target": {"@type": "EntryPoint", "urlTemplate": SITE + "/search/?q={search_term_string}"}, "query-input": "required name=search_term_string"}})
    return page(BRAND, "혈압 정상수치, 혈압 재는 법, 혈압에 좋은 음식과 저염 식단, 7일 가정혈압 기록과 진료 준비 리포트까지. 진료지침 근거로 고혈압 관리를 돕는 무료 플랫폼.", "/", body, jsonld=ld,
                keywords=["고혈압", "혈압", "혈압 정상수치", "혈압 재는 법", "혈압에 좋은 음식", "혈압 기록", "가정혈압", "저염식", "고혈압 관리"])


# ============================================================
# 바르게 재기
# ============================================================
def measure():
    body = page_head("바르게 재기", "잘못 잰 숫자는 아무 의미가 없습니다. 대한고혈압학회 진료지침이 권고하는 가정혈압 측정법을 재기 전 1분 체크리스트로 만들었습니다.", [("/", "홈"), (None, "바르게 재기")], "/measure/") + f"""
<section class="section">
<div class="wrap">
<div class="split" style="align-items:start">
<div>
<h2>재기 전 1분 체크</h2>
<p style="color:var(--muted)">모두 체크되면 지금 재도 됩니다. 하나라도 빠지면 조건을 맞춘 뒤 재세요. 체크 결과는 7일 기록의 '측정 조건'에 함께 남길 수 있습니다.</p>
<div class="check-tool" id="mcheck">
<label><input type="checkbox" data-k="rest5"><span><b>5분 이상 앉아서 안정했다</b><small>계단, 집안일, 대화 직후는 아닙니다. 조용히 앉아 기다립니다.</small></span></label>
<label><input type="checkbox" data-k="noCaffeine"><span><b>30분 안에 커피·담배가 없었다</b><small>카페인과 흡연은 일시적으로 혈압을 올립니다.</small></span></label>
<label><input type="checkbox" data-k="noExercise"><span><b>30분 안에 운동하지 않았다</b><small>운동 직후 값은 평소 값과 다릅니다.</small></span></label>
<label><input type="checkbox" data-k="posture"><span><b>등받이 의자에 앉아 발은 바닥, 다리는 꼬지 않았다</b><small>소파에 반쯤 눕거나 침대에 앉은 자세는 피합니다.</small></span></label>
<label><input type="checkbox" data-k="cuff"><span><b>커프가 위팔 심장 높이에, 맨살 또는 얇은 옷 위에 감겼다</b><small>팔꿈치 안쪽 접히는 곳에서 2~3cm 위. 팔은 책상에 올립니다.</small></span></label>
<label><input type="checkbox" data-k="bladder"><span><b>화장실은 다녀왔고, 춥거나 아프지 않다</b><small>소변이 급하거나 통증이 있으면 값이 올라갑니다.</small></span></label>
<label><input type="checkbox" data-k="timing"><span><b>아침이면 약·식사 전, 저녁이면 잠들기 전이다</b><small>아침 측정은 기상 후 1시간 이내, 약 복용 전이 기준입니다.</small></span></label>
<div class="check-result" id="mresult">0 / 7 — 조건을 확인해 주세요.</div>
</div>
<div style="margin-top:16px;display:flex;gap:10px;flex-wrap:wrap"><a class="btn btn--primary" href="/tools/timer/">측정 타이머로 재기</a><a class="btn btn--secondary" href="/check7/">바로 기록하기</a><a class="btn btn--secondary" href="/devices/">내 혈압계가 맞는 기기인지 확인</a></div>
</div>
<div>
<img src="/assets/img/photo-monitor.jpg" alt="상완형 자동혈압계" width="672" height="791" style="border-radius:16px">
</div>
</div>
</div>
</section>

<section class="section section--sky">
<div class="wrap">
<div class="section-head"><h2>언제, 몇 번, 며칠</h2></div>
{table(["항목", "지침 권고"], [
    ["아침", "기상 후 1시간 이내 · 소변을 본 뒤 · 아침 식사 전 · 고혈압약 복용 전"],
    ["저녁", "잠자리에 들기 전"],
    ["횟수", "각 시점에 1~2분 간격으로 2회 이상. 두 값 모두 기록"],
    ["기간", "진료 전 최소 5일, 가능하면 7일. 첫날은 제외하고 평균"],
    ["기기", "검증된 상완형(위팔) 자동혈압계. 커프는 팔 둘레에 맞는 크기"],
    ["기준", "가정혈압 평균 135/85 mmHg 이상이면 고혈압에 해당(개인 목표는 의료진과 확인)"],
])}
</div>
</section>

<section class="section">
<div class="wrap">
<div class="section-head"><h2>자세, 그림 대신 말로</h2><p>실제로 오차를 만드는 순서대로 정리했습니다.</p></div>
<ol class="steps">
<li><span><b>등받이 의자에 앉아 등을 기댑니다.</b>발은 바닥에 평평하게, 다리는 꼬지 않습니다.</span></li>
<li><span><b>팔을 책상 위에 올립니다.</b>커프 중앙이 심장 높이에 오도록 합니다. 팔이 아래로 처지면 값이 높게, 위로 올라가면 낮게 나옵니다.</span></li>
<li><span><b>커프를 맨살 또는 얇은 옷 위에 감습니다.</b>팔꿈치 안쪽 접히는 곳에서 2~3cm 위. 손가락 하나가 들어갈 정도로 감습니다. 두꺼운 옷을 걷어 올려 팔을 조이면 안 됩니다.</span></li>
<li><span><b>5분간 조용히 기다립니다.</b>휴대전화도 내려놓습니다.</span></li>
<li><span><b>재는 동안 말하지 않고 움직이지 않습니다.</b>말하면 수축기가 10 mmHg 이상 오를 수 있습니다.</span></li>
<li><span><b>1~2분 뒤 한 번 더 잽니다.</b>두 값을 모두 기록합니다. 크게 다르면 한 번 더 잽니다.</span></li>
</ol>
</div>
</section>

<section class="section section--sky">
<div class="wrap">
<div class="section-head"><h2>흔한 실수와 그 결과</h2></div>
{table(["실수", "값에 미치는 영향(대략)"], [
    ["커프가 팔 둘레보다 작음", "실제보다 높게 나옴"],
    ["팔을 아래로 늘어뜨림", "실제보다 높게 나옴"],
    ["등을 기대지 않고 앉음", "수축기 몇 mmHg 상승"],
    ["다리를 꼼", "수축기 상승"],
    ["재는 동안 말함", "수축기 10 mmHg 이상 상승 가능"],
    ["소변이 급한 상태", "수축기 상승"],
    ["커피·흡연·운동 직후", "일시적 상승"],
    ["약 복용 후 아침 측정", "약 효과가 반영되어 '기준 값'과 다름"],
])}
<p style="font-size:.9rem;color:var(--muted)">영향의 크기는 사람과 상황에 따라 다릅니다. 방향(높게/낮게)을 기억하는 것이 목적입니다.</p>
{caution("가정혈압 기록은 진단과 치료의 참고자료이며, 사이트는 수치를 판정하지 않습니다. 수축기 180 이상 또는 이완기 120 이상이 반복되거나 증상이 있으면 기다리지 말고 진료를 받으세요.")}
{emergency()}
</div>
</section>
"""
    js = """<script>
(function(){var box=document.getElementById('mcheck');if(!box)return;var cbs=box.querySelectorAll('input');var res=document.getElementById('mresult');
function upd(){var n=0;cbs.forEach(function(c){if(c.checked)n++});res.textContent=n+' / '+cbs.length+(n===cbs.length?' — 조건이 갖춰졌습니다. 지금 재도 됩니다.':(n>=5?' — 거의 됐습니다. 남은 항목을 맞춘 뒤 재세요.':' — 조건을 확인해 주세요.'));}
cbs.forEach(function(c){c.addEventListener('change',upd)});upd();})();
</script>"""
    ld = {"@context": "https://schema.org", "@type": "HowTo", "name": "집에서 혈압 바르게 재는 법", "step": [{"@type": "HowToStep", "text": t} for t in ["등받이 의자에 앉아 발은 바닥에 두고 다리를 꼬지 않는다", "팔을 책상에 올려 커프가 심장 높이에 오게 한다", "커프를 맨살에 팔꿈치 위 2~3cm에 감는다", "5분간 안정한다", "말하지 않고 잰다", "1~2분 후 다시 재고 두 값을 기록한다"]]}
    return page("혈압 바르게 재는 법 — 측정 전 1분 체크리스트", "대한고혈압학회 진료지침이 권고하는 가정혈압 측정법. 재기 전 1분 체크리스트, 시간·횟수·자세, 흔한 실수.", "/measure/", body, jsonld=ld, extra_js=js, keywords=["혈압 재는 법", "혈압 측정 방법", "혈압 측정 자세", "혈압 재는 시간", "가정혈압 측정"])


# ============================================================
# 7일 기록
# ============================================================
def check7():
    body = page_head("7일 혈압 기록", "회원가입 없이 이 브라우저에만 저장됩니다. 아침·저녁으로 7일을 재면 평균과 추이가 보이고, 진료 준비 리포트로 바로 만들 수 있습니다.", [("/", "홈"), (None, "7일 혈압 기록")], "/check7/") + f"""
<section class="section section--tight">
<div class="wrap">
<div class="tool-layout">
<div class="tool-panel">
<h2>기록 입력</h2>
<form id="bp-form" autocomplete="off">
<div class="segmented" id="slot" role="group" aria-label="측정 시점"><button type="button" data-slot="am" aria-pressed="false">아침</button><button type="button" data-slot="pm" aria-pressed="false">저녁</button></div>
<div class="bp-inputs" style="margin-top:14px">
<div class="field"><label for="f-sys">수축기(위)</label><input class="big num" id="f-sys" name="sys" type="number" inputmode="numeric" min="50" max="260" placeholder="120" required><div class="unit">mmHg</div></div>
<div class="slash">/</div>
<div class="field"><label for="f-dia">이완기(아래)</label><input class="big num" id="f-dia" name="dia" type="number" inputmode="numeric" min="30" max="160" placeholder="80" required><div class="unit">mmHg</div></div>
<div class="field pulse"><label for="f-pulse">맥박</label><input class="big num" id="f-pulse" name="pulse" type="number" inputmode="numeric" min="30" max="220" placeholder="72"><div class="unit">bpm · 선택</div></div>
</div>
<div class="field" style="margin-top:12px"><label for="f-when">측정 시각 <span style="font-weight:400">(비우면 지금)</span></label><input id="f-when" name="when" type="datetime-local"></div>
<p style="font-size:.85rem;color:var(--muted);margin:12px 0 4px;font-weight:600">측정 조건 (해당하는 것만)</p>
<div class="quality">
<label><input type="checkbox" name="rest5"> 5분 이상 앉아 안정했다</label>
<label><input type="checkbox" name="posture"> 등받이 의자, 발은 바닥, 다리 안 꼼</label>
<label><input type="checkbox" name="cuff"> 커프가 위팔 심장 높이에 맞게 감김</label>
<label><input type="checkbox" name="noCaffeine"> 30분 안에 커피·담배 없음</label>
<label><input type="checkbox" name="noExercise"> 30분 안에 운동 없음</label>
</div>
<div class="field"><label for="f-memo">메모 <span style="font-weight:400">(선택 · 예: 전날 음주, 두통, 약 복용 후)</span></label><input id="f-memo" name="memo" type="text" maxlength="80" placeholder="예: 어제 회식"></div>
<button class="btn btn--primary btn--block" type="submit" style="margin-top:14px">기록하기</button>
</form>
<div class="tool-note">기록은 이 브라우저에만 저장됩니다. 다른 기기에서는 보이지 않으며, 브라우저 데이터를 지우면 함께 삭제됩니다. 기기를 바꾸거나 보관하려면 <a href="/tools/backup/">백업 파일</a>로 저장하세요.</div>
<div class="tool-links"><a href="/tools/timer/">측정 타이머</a><a href="/tools/reminder/">측정 알림 만들기</a><a href="/tools/meds/">복약 체크</a><a href="/tools/log-sheet/">종이 기록지</a></div>
</div>

<div>
<div class="empty" id="empty">
<p style="font-size:1.1rem;color:var(--navy);font-weight:700;margin-bottom:6px">아직 기록이 없습니다</p>
<p style="margin-bottom:14px">왼쪽에서 첫 기록을 남겨보세요. 아침·저녁 하루 2회, 7일이 목표입니다.</p>
<a class="btn btn--secondary btn--sm" href="/measure/">재기 전 1분 체크 먼저 보기</a>
</div>
<div id="has-data" style="display:none">
<div class="stat-grid" id="stats"></div>
<div class="days" id="days" aria-label="최근 7일"></div>
<div class="chart" id="chart"></div>
<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px;align-items:center">
<a class="btn btn--primary" href="/report/">진료 준비 리포트 만들기</a>
<button class="btn btn--secondary" type="button" id="btn-csv">CSV 내보내기</button>
<button class="btn btn--ghost" type="button" id="btn-clear">전체 삭제</button>
<span style="font-size:.85rem;color:var(--muted);margin-left:auto">전체 <b id="count-all">0</b>건</span>
</div>
<div class="log"><table><thead><tr><th>일시</th><th>구분</th><th>혈압</th><th>맥박</th><th>조건</th><th>메모</th><th></th></tr></thead><tbody id="log-body"></tbody></table></div>
</div>
<div class="tool-note" style="margin-top:20px"><b>이 도구는 수치를 판정하지 않습니다.</b> 평균과 범위만 계산합니다. 가정혈압의 일반 기준(평균 135/85 이상은 고혈압에 해당)은 <a href="/info/reading-numbers.html">숫자 읽는 법</a>에서 설명하며, 본인의 목표와 해석은 진료 때 의료진과 확인하세요. 수축기 180 이상 또는 이완기 120 이상이 반복되거나 증상이 있으면 기다리지 말고 진료를 받으세요.</div>
</div>
</div>
</div>
</section>
"""
    import seo_content as SC
    body += SC.guide_html("/check7/")
    return page("7일 혈압 기록 — 무료 가정혈압 기록장", "회원가입 없이 브라우저에만 저장되는 7일 가정혈압 기록 도구. 아침·저녁 기록, 7일 평균, 추이 그래프, 진료 준비 리포트 연결. 언제·몇 번 재는지도 안내합니다.", "/check7/", body, jsonld=SC.guide_ld("/check7/"), extra_js='<script src="/assets/js/check7.js"></script>', keywords=["혈압 기록", "혈압 기록장", "혈압 기록 앱", "가정혈압 기록", "혈압 평균 계산"])


# ============================================================
# 진료 준비 리포트
# ============================================================
def report():
    body = page_head("진료 준비 리포트", "7일 기록을 A4 한 장으로 정리합니다. 판정 없이 측정 조건·값·기간·메모만 담아, 의료진이 보기 좋은 형태로 만듭니다.", [("/", "홈"), (None, "진료 준비 리포트")], "/report/") + f"""
<section class="section section--tight">
<div class="wrap">
<div class="no-print" style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-bottom:20px">
<div class="field" style="min-width:180px"><label for="range">기간</label><select id="range"><option value="7">최근 7일</option><option value="14">최근 14일</option><option value="30">최근 30일</option></select></div>
<button class="btn btn--primary" type="button" id="btn-print" style="align-self:end">인쇄 / PDF로 저장</button>
<a class="btn btn--secondary" href="/check7/" style="align-self:end">기록 추가하기</a>
<span style="font-size:.85rem;color:var(--muted);align-self:end">인쇄 창에서 'PDF로 저장'을 고르면 파일로 저장됩니다.</span>
</div>

<div class="empty no-print" id="report-empty" style="display:none">
<p style="font-size:1.1rem;color:var(--navy);font-weight:700;margin-bottom:6px">선택한 기간에 기록이 없습니다</p>
<p style="margin-bottom:14px">7일 기록 도구에서 먼저 기록을 남겨주세요.</p>
<a class="btn btn--primary btn--sm" href="/check7/">7일 기록으로 가기</a>
</div>

<div class="report-sheet" id="sheet">
<header><div><p class="sheet-title">가정혈압 기록 요약</p><div class="meta" id="r-period"></div></div><div style="text-align:right"><img src="/assets/img/logo.png" alt="바른혈압"><div class="meta" id="r-made"></div></div></header>
<div class="rs-grid" id="r-stats"></div>
<h2>측정 기록</h2>
<table><thead><tr><th>일시</th><th>구분</th><th>수축기</th><th>이완기</th><th>맥박</th><th>측정 조건</th><th>메모</th></tr></thead><tbody id="r-rows"></tbody></table>
<h2>측정 방법</h2>
<p class="q" id="r-meds" style="margin:0 0 6px;display:none"></p>
<p class="q" style="margin:0 0 8px">상완형 자동혈압계 · 아침(기상 후 1시간 이내, 약·식사 전)과 저녁(취침 전) · 등받이 의자에 앉아 5분 안정 후 측정. 측정 조건란의 '안정·자세·커프·무카페인·운동전'은 이용자가 체크한 항목입니다.</p>
<h2>진료 때 확인하고 싶은 것</h2>
<ol class="q">
<li>이 기록의 평균이 제 목표 혈압 기준으로 어느 범위에 해당하나요?</li>
<li>추가 검사(소변·혈액·심전도 등)가 필요한가요?</li>
<li>생활습관에서 우선 바꿀 것은 무엇인가요?</li>
<li>약이 있다면 현재 용량·복용 시간은 적절한가요?</li>
<li>다음 진료까지 어떻게 재고 기록할까요?</li>
</ol>
<h2>메모 (복용 약, 증상, 궁금한 점)</h2>
<textarea class="no-print-border" placeholder="예: 로사르탄 50mg 아침 1회 / 지난주 두 번 어지러움 / 운동 시작해도 되는지"></textarea>
<div class="foot">이 문서는 이용자가 가정에서 측정한 값을 정리한 것으로 진단 자료가 아닙니다. 수치의 해석과 치료 판단은 의료진이 합니다. 바른혈압(주식회사 블랭크)은 의료기관이 아니며 개인 건강정보를 서버에 저장하지 않습니다.</div>
</div>
</div>
</section>
"""
    return page("진료 준비 리포트 — 혈압 기록 A4 인쇄", "7일 가정혈압 기록을 A4 한 장으로 정리해 인쇄하는 도구. 평균·범위·측정 조건과 진료 때 물어볼 질문.", "/report/", body, extra_js='<script src="/assets/js/report.js"></script>')


# ============================================================
# 검증된 정보 허브
# ============================================================
def info_index():
    tabs = '<div class="tabs" id="tabs"><button aria-pressed="true" data-cat="all">전체</button>' + "".join(f'<button aria-pressed="false" data-cat="{k}">{v}</button>' for k, v in CATEGORIES) + "</div>"
    items = "".join(f'<li data-cat="{a["cat"]}"><a href="/info/{a["slug"]}.html"><span class="cat">{CAT_NAME[a["cat"]]}</span><span><b>{a["title"]}</b><span>{a["summary"]}</span></span><span class="date">{REVIEW_DATE}</span></a></li>' for a in ARTICLES)
    body = page_head("검증된 정보", "학회 진료지침과 공공기관 자료를 근거로, 사람들이 실제로 묻는 질문 단위로 다시 씁니다. 모든 글은 한 줄 답 → 핵심 근거 → 행동 체크리스트 → 출처 → 최종 검토일의 구조를 따릅니다.", [("/", "홈"), (None, "검증된 정보")]) + f"""
<section class="section section--tight">
<div class="wrap">
<div class="evidence" style="margin-top:0"><dl>
<div><dt>근거 유형</dt><dd>진료지침 / 공공기관 / 체계적 문헌고찰 / 단일 연구 / 전문가 해설 / 근거 부족</dd></div>
<div><dt>근거 확실성</dt><dd>높음 / 중간 / 낮음 / 판단 어려움</dd></div>
<div><dt>적용 대상</dt><dd>일반 성인 / 임신 / 고령 / 동반질환 등</dd></div>
<div><dt>최종 검토일</dt><dd>글마다 표기</dd></div>
<div><dt>이해상충</dt><dd>광고·제휴 여부 표기</dd></div>
</dl><p class="evidence-note">이 표시는 바른혈압이 정한 편집 기준이며, 학회의 권고 등급이나 논문의 근거 수준 체계와 다릅니다. 자세한 기준은 <a href="/policy/editorial.html">편집·감수 정책</a>에 있습니다.</p></div>
{tabs}
<ul class="post-list" id="posts">{items}</ul>
<div id="special"></div>
</div>
</section>
{cta_band()}
"""
    js = """<script>
(function(){var tabs=document.querySelectorAll('#tabs button');var items=document.querySelectorAll('#posts li');
function go(c){tabs.forEach(function(b){b.setAttribute('aria-pressed',b.dataset.cat===c?'true':'false')});items.forEach(function(li){li.style.display=(c==='all'||li.dataset.cat===c)?'':'none'});}
tabs.forEach(function(b){b.addEventListener('click',function(){go(b.dataset.cat)})});
if(location.hash==='#special')go('special');})();
</script>"""
    return page("검증된 정보", "대한고혈압학회 진료지침과 공공기관 자료를 근거로 쓴 고혈압 정보. 진단·기준, 측정, 생활 관리, 약물, 합병증, 생애주기별 정보.", "/info/", body, extra_js=js)


def info_article(a):
    ld = {"@context": "https://schema.org", "@type": "Article", "headline": a["title"], "description": a["summary"], "datePublished": REVIEW_DATE, "dateModified": REVIEW_DATE, "author": {"@type": "Organization", "name": BRAND}, "publisher": {"@type": "Organization", "name": "주식회사 블랭크"}, "mainEntityOfPage": f"{SITE}/info/{a['slug']}.html", "inLanguage": "ko"}
    body = page_head(a["title"], a["summary"], [("/", "홈"), ("/info/", "검증된 정보"), (None, CAT_NAME[a["cat"]])]) + f"""
<section class="section section--tight">
<div class="wrap">
<article class="article">
<div class="article-meta"><span>작성 바른혈압 편집팀</span><span>{review_badge()}</span><span>최종 검토 {REVIEW_DATE}</span></div>
{evidence(a["kind"], a["certainty"], a["target"])}
{a["body"]}
{article_cta()}
<p style="font-size:.85rem;color:var(--muted);margin-top:24px">이 글에서 잘못된 내용을 발견하셨나요? <a href="/factcheck/#report">정정 요청</a>을 보내주시면 확인 후 <a href="/policy/corrections.html">정정 이력</a>에 공개합니다.</p>
</article>
</div>
</section>
"""
    return page(a["title"], a["summary"], f"/info/{a['slug']}.html", body, jsonld=ld)


# ============================================================
# 팩트체크 허브
# ============================================================
def factcheck_index():
    key = "".join(f'<div><span class="verdict {c}">{n}</span><div>{d}</div></div>' for k, (n, c, d) in VERDICTS.items())
    items = "".join(f'<li><a href="/factcheck/{f["slug"]}.html"><span><q>{f["claim"]}</q><span>{f["summary"]}</span></span><span class="verdict {VERDICTS[f["verdict"]][1]}">{VERDICTS[f["verdict"]][0]}</span></a></li>' for f in FACTCHECKS)
    body = page_head("팩트체크", "유튜브·블로그·주변에서 들은 이야기를 대한고혈압학회 진료지침과 공공기관 자료에 대조합니다. 판정은 '사실/거짓'로 단정하지 않고 어떤 조건에서 맞고 어디부터 다른지 범위로 설명합니다.", [("/", "홈"), (None, "팩트체크")], "/factcheck/") + f"""
<section class="section section--tight">
<div class="wrap">
<div class="verdict-key">{key}</div>
<ul class="fc-list">{items}</ul>
</div>
</section>
<section class="section section--sky" id="report">
<div class="wrap wrap--narrow">
<div class="section-head"><h2>검증을 요청하세요</h2><p>어디서 본 이야기인지, 가능하면 링크와 함께 보내주세요. 접수된 주장은 근거를 확인해 순차적으로 발행합니다. 개인 건강정보(본인의 수치, 병력)는 적지 마세요.</p></div>
<form class="form" data-api="report" data-success="접수됐습니다. 확인 후 발행되면 이 페이지에 올라갑니다." data-subject="팩트체크 요청">
<input class="hp" type="text" name="website" tabindex="-1" autocomplete="off">
<div class="field"><label for="fc-claim">검증하고 싶은 주장</label><textarea id="fc-claim" name="claim" required maxlength="500" placeholder='예: "혈압약을 저녁에 먹으면 효과가 두 배"'></textarea></div>
<div class="row"><div class="field"><label for="fc-src">출처 링크 (선택)</label><input id="fc-src" name="source_url" type="url" placeholder="https://"></div><div class="field"><label for="fc-contact">회신받을 이메일 (선택)</label><input id="fc-contact" name="contact" type="email" placeholder="you@example.com"></div></div>
<label class="agree"><input type="checkbox" name="agree" value="y"> 입력한 내용은 팩트체크 발행 목적에만 사용합니다. <a href="/policy/privacy.html">개인정보 처리방침</a></label>
<button class="btn btn--primary" type="submit">검증 요청 보내기</button>
<div class="form-msg" role="status"></div>
</form>
</div>
</section>
"""
    return page("고혈압 팩트체크 — 혈압 속설, 근거로 확인", "고혈압에 관한 통설을 대한고혈압학회 진료지침과 공공기관 자료에 대조한 팩트체크. 혈압약 평생 복용, 뒷목 뻣뻣함, 소금 끊기 등.", "/factcheck/", body)


def factcheck_page(f):
    n, c, d = VERDICTS[f["verdict"]]
    cond = f'<p style="font-size:.92rem;color:var(--muted)"><b style="color:var(--navy)">조건</b> — {f["conditions"]}</p>' if f.get("conditions") else ""
    ld = {"@context": "https://schema.org", "@type": "ClaimReview", "url": f"{SITE}/factcheck/{f['slug']}", "claimReviewed": f["claim"], "datePublished": f.get("date", REVIEW_DATE), "author": {"@type": "Organization", "name": BRAND}, "reviewRating": {"@type": "Rating", "alternateName": n, "bestRating": 5, "worstRating": 1, "ratingValue": {"ok": 5, "partial": 3, "insuff": 2, "contra": 1, "doctor": 3}[f["verdict"]]}, "itemReviewed": {"@type": "Claim", "text": f["claim"]}, "dateModified": item_dates(f)[1]}
    body = page_head(f'“{f["claim"]}”', f["summary"], [("/", "홈"), ("/factcheck/", "팩트체크"), (None, "판정")], f"/factcheck/{f['slug']}.html") + f"""
<section class="section section--tight">
<div class="wrap">
<article class="article">
<div class="article-meta"><span>작성 바른혈압 편집팀</span><span>{review_badge()}</span><span>최종 검토 {f.get("date", REVIEW_DATE)}</span></div>
<div class="verdict-hero"><span class="verdict {c}">{n}</span><p>{d}</p></div>
{cond}
{evidence("진료지침 · 공공기관", "높음" if f["verdict"] in ("ok", "contra") else "중간", "일반 성인", date=f.get("date", REVIEW_DATE))}
{SEO.link_glossary(f["body"], f"/factcheck/{f['slug']}.html")}
<h2>출처</h2>
{sources(f["srcs"])}
{article_cta("궁금한 이야기를 들었다면, 먼저 내 혈압부터 정확히", "통설보다 내 숫자가 먼저입니다. 7일 기록으로 시작하세요.")}
</article>
{SEO.related_html(f"/factcheck/{f['slug']}.html")}
</div>
</section>
"""
    import og
    path = f"/factcheck/{f['slug']}.html"
    q = f["claim"].rstrip(".") + "?"
    pub, mod = item_dates(f)
    img = og.ensure(OUT, path, q, label=f"팩트체크 · {n}", sub=d)
    return page(f"{q} — 팩트체크", f["summary"], path, body, jsonld=ld, og_type="article", og_image=img,
                keywords=f.get("keywords") or [f["claim"], "고혈압 팩트체크", "혈압 상식"], published=pub, modified=mod)
