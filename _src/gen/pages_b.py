# -*- coding: utf-8 -*-
from base import *
from base import NEW_DATE, LAUNCH_DATE
from articles import KSH2026, MOHW_CDM, KDCA, MFDS_HF

# ============================================================
# 혈압계 가이드
# ============================================================
def devices():
    body = page_head("혈압계 가이드", "어떤 제품이 1등인지 대신, 어떤 유형이 어떤 근거로 어디까지 쓰일 수 있는지를 정리합니다. 제휴·광고비를 받은 제품을 상위에 올리지 않는 것이 이 페이지의 원칙입니다.", [("/", "홈"), (None, "혈압계 가이드")], "/devices/") + f"""
<section class="section section--tight">
<div class="wrap">
<div class="evidence" style="margin-top:0"><dl>
<div><dt>근거 유형</dt><dd>진료지침 · 제조사 허가정보</dd></div>
<div><dt>근거 확실성</dt><dd class="cert--high">높음</dd></div>
<div><dt>적용 대상</dt><dd>가정혈압을 재는 성인</dd></div>
<div><dt>최종 검토일</dt><dd>{REVIEW_DATE}</dd></div>
<div><dt>이해상충</dt><dd>광고·제휴 없음</dd></div>
</dl><p class="evidence-note">현재 이 페이지에는 제휴 링크가 없습니다. 향후 제휴가 생기면 해당 문단에 명시하고, 편집 평가와 상업 노출을 시각적으로 분리합니다. <a href="/policy/editorial.html#coi">커머스 독립성 원칙</a></p></div>

<div class="section-head"><h2>유형별 비교</h2><p>지침은 검증된 상완형 자동혈압계를 기본으로 권장합니다. 나머지는 조건과 검증 수준을 알고 쓰는 보조 수단입니다.</p></div>
{table(["유형", "측정 방식", "지침·허가 관점", "적합한 경우", "주의"], [
    ["상완형(위팔) 자동혈압계", "위팔에 커프를 감아 측정", "지침이 가정혈압 측정에 권장하는 기본 유형", "대부분의 성인. 진료 참고용 기록의 기준", "커프 크기가 팔 둘레에 맞아야 함. 팔이 굵으면 큰 커프 별도 구매"],
    ["손목형 자동혈압계", "손목에 커프", "상완형 대비 오차 가능성. 조건을 맞추면 참고 가능", "위팔 측정이 어렵거나 팔이 매우 굵은 경우", "손목을 반드시 심장 높이에. 팔꿈치를 책상에 대고 측정"],
    ["스마트워치 혈압 앱", "손목 광학센서(PPG) 기반 추정", "일부 제품은 의료기기 소프트웨어 허가. 커프 혈압계로 주기적 보정 필요, 진단 목적 아님", "자주 재서 추세를 보고 싶은 경우의 보조", "보정을 거르면 값이 벗어남. 진료 근거는 커프 기록으로"],
    ["커프리스·반지형 등 연속 측정기", "광학센서 기반 24시간 감시", "2026년 지침이 임상 혈압 감시에 처음 포함. 권고 등급 '고려할 수 있음'(Class IIb, 근거수준 B). 기기별 정확도 차이·검증·보정 표준 필요 명시", "의료기관에서 처방·안내한 경우, 야간·활동 중 혈압 감시", "검증된 기기에 한함. 일반 소비자가 진단 목적으로 쓰는 단계는 아님"],
    ["수동 혈압계(청진기)", "커프 + 청진", "의료진 사용 기준", "일반 가정 사용에는 권장하지 않음", "숙련 필요"],
])}
</div>
</section>

<section class="section section--sky">
<div class="wrap">
<div class="split" style="align-items:start">
<div>
<h2>고를 때 확인할 것</h2>
<p style="color:var(--muted)">브랜드보다 아래 항목이 결과를 좌우합니다. 순서대로 확인하세요.</p>
{checklist([
    "<b>검증 여부</b> — 국제 검증 프로토콜(예: ISO 81060-2, ESH 등)을 통과했다는 표시나 제조사 자료가 있는지 확인합니다. 검증 기기 목록을 제공하는 해외 사이트도 참고할 수 있습니다.",
    "<b>국내 허가</b> — 식품의약품안전처 의료기기 허가(인증) 번호가 제품 또는 설명서에 있는지 봅니다.",
    "<b>커프 크기</b> — 위팔 둘레를 줄자로 재고, 제품의 커프 적용 범위(예: 22~32cm, 32~42cm)에 맞는지 확인합니다. 이것이 가장 흔한 오차 원인입니다.",
    "<b>2회 평균·기록 기능</b> — 두 번 재서 평균을 내주거나, 기록을 저장·내보내기 할 수 있으면 편합니다. 필수는 아닙니다.",
    "<b>보정 조건</b> — 스마트워치·커프리스는 얼마나 자주, 어떻게 보정해야 하는지 설명서를 먼저 읽습니다.",
    "<b>제한 사항</b> — 부정맥, 임신, 투석 등 제조사가 명시한 사용 제한이 있는지 확인합니다.",
])}
</div>
<div>
<h2>커프 크기 가이드</h2>
{table(["위팔 둘레", "일반적인 커프 구분"], [
    ["22cm 미만", "소형(S) — 별도 커프가 필요한 경우가 많음"],
    ["22~32cm", "표준(M) — 대부분의 기본 구성 커프"],
    ["32~42cm", "대형(L) — 별도 구매 필요한 제품이 많음"],
    ["42cm 이상", "특대형(XL) 또는 손목형 검토"],
])}
<p style="font-size:.88rem;color:var(--muted)">구분과 범위는 제조사마다 다릅니다. 반드시 제품 설명서의 적용 범위를 따르세요. 커프가 작으면 실제보다 높게, 크면 낮게 나오는 경향이 있습니다.</p>
<img src="/assets/img/photo-monitor.jpg" alt="상완형 자동혈압계" loading="lazy" width="672" height="791" style="border-radius:16px;margin-top:10px">
</div>
</div>
</div>
</section>

<section class="section">
<div class="wrap">
<div class="section-head"><h2>스마트워치·커프리스에 대해 알아둘 것</h2></div>
<div class="grid grid--2">
<div class="card"><h3>스마트워치 혈압 앱</h3><p>국내에서 일부 스마트워치의 혈압 측정 앱은 의료기기 소프트웨어로 허가를 받았습니다. 편하게 자주 잴 수 있는 것이 장점이지만, 커프 혈압계로 잰 값으로 주기적으로 보정해야 하고 허가 범위는 진단이 아닌 참고에 가깝습니다. 진료 근거가 되는 기록은 커프 혈압계로 남기세요. <a href="/factcheck/smartwatch-equals-cuff.html">팩트체크</a></p></div>
<div class="card"><h3>커프리스·반지형 연속 측정기</h3><p>2026년 개정 지침은 커프리스 기기를 임상 혈압 감시 장치로 처음 포함했습니다. 다만 권고는 "사용을 고려할 수 있다" 수준이고, 기기마다 정확도가 다르며 검증·보정·해석 표준이 더 필요하다고 지적합니다. 새로운 대세라기보다 의료기관의 안내 아래 쓰는 도구로 이해하는 것이 맞습니다.</p></div>
</div>
{caution("바른혈압은 특정 제품을 추천하거나 순위를 매기지 않습니다. 이 페이지의 정보는 유형별 일반 특성이며, 개별 제품의 성능은 제조사 자료와 검증 정보를 직접 확인하세요.")}
<h2 style="margin-top:32px">출처</h2>
<p>혈압계 외에 기록지·약 정리함·계량스푼·염도계 같은 용품은 <a href="/products/">관리용품 가이드</a>에 정리했습니다.</p>
{sources([KSH2026, '식품의약품안전처, 「디지털의료기기소프트웨어 허가·심사 가이드라인」(2025) — <a href="https://www.mfds.go.kr/law/board/boardDetail.do?brdId=data0011&menuKey=29&seq=15653" target="_blank" rel="noopener">mfds.go.kr</a>'])}
</div>
</section>
{cta_band("혈압계를 골랐다면, 이제 바르게 재세요", "기기보다 측정 조건이 값을 더 크게 바꿉니다. 재기 전 1분 체크리스트를 확인하세요.", "/measure/", "바르게 재는 법 보기")}
"""
    return page("혈압계 고르는 법 — 상완형·손목형·스마트워치·커프리스 비교", "혈압계 유형별 검증 수준과 조건 비교. 커프 크기 가이드, 스마트워치·커프리스 기기의 2026 지침 위치. 제휴·광고 없이 정리.", "/devices/", body)


# ============================================================
# 진료 준비 · 병의원
# ============================================================
def clinic():
    body = page_head("진료 준비 · 병의원 안내", "어느 병원이 좋은지 대신, 무엇을 가져가고 무엇을 물어볼지를 정리합니다. 바른혈압은 특정 의료기관을 추천하거나 소개 대가를 받지 않습니다.", [("/", "홈"), (None, "진료 준비")], "/clinic/") + f"""
<section class="section section--tight">
<div class="wrap">
<div class="split" style="align-items:start">
<div>
<h2>진료 전에 준비할 것</h2>
{checklist([
    "<b>가정혈압 기록</b> — 최소 5~7일, 아침·저녁. <a href=\"/report/\">진료 준비 리포트</a>로 A4 한 장에 정리합니다.",
    "<b>검진 결과지</b> — 혈압뿐 아니라 혈당, 콜레스테롤, 콩팥 수치가 함께 있으면 판단에 도움이 됩니다.",
    "<b>복용 중인 약·보충제 목록</b> — 혈압약 외에 진통제, 피임약, 한약, 건강기능식품까지. 약 봉투 사진이면 충분합니다.",
    "<b>가족력</b> — 부모·형제의 고혈압, 뇌졸중, 심장병, 콩팥병 여부.",
    "<b>생활 메모</b> — 음주 횟수, 흡연, 수면 시간, 코골이, 운동 여부.",
    "<b>질문 목록</b> — 아래 질문지를 인쇄하거나 사진으로 남깁니다.",
])}
<h2 style="margin-top:28px">진료 때 물어볼 질문</h2>
<div class="card">
<ol style="margin:0">
<li>제 가정혈압 평균이 어느 범위에 해당하나요? 제 목표 혈압은 얼마인가요?</li>
<li>추가 검사(소변, 혈액, 심전도, 필요 시 활동혈압)가 필요한가요?</li>
<li>생활습관 개선으로 먼저 볼 수 있는 상황인가요, 약이 필요한가요?</li>
<li>약이 있다면 언제, 어떻게 먹나요? 빠뜨렸을 때는요?</li>
<li>어떤 증상이 있으면 다음 진료 전에 와야 하나요?</li>
<li>다음 진료까지 집에서 어떻게 재고 기록하면 되나요?</li>
<li>일차의료 만성질환관리 사업에 등록할 수 있나요?</li>
</ol>
</div>
</div>
<div>
<img src="/assets/img/photo-doctor.jpg" alt="진료실에서 혈압 기록을 함께 보는 모습" width="1400" height="787" style="border-radius:16px">
<div class="card card--sky" style="margin-top:16px"><h3>어느 과로 가나요</h3><p style="margin:0">처음이라면 가까운 <b>내과</b> 또는 <b>가정의학과</b> 의원이면 충분합니다. 심장 질환이 있거나 조절이 어려운 경우 심장내과·신장내과 등 세부 전문과로 안내받을 수 있습니다. 대학병원부터 갈 필요는 없습니다.</p></div>
</div>
</div>
</div>
</section>

<section class="section section--sky">
<div class="wrap">
<div class="split split--rev" style="align-items:start">
<img src="/assets/img/photo-map.jpg" alt="휴대전화로 가까운 의원을 찾는 모습" loading="lazy" width="1400" height="787">
<div>
<h2>일차의료 만성질환관리 참여 의원 찾기</h2>
<p>보건복지부의 일차의료 만성질환관리 사업은 동네의원에서 고혈압·당뇨병 환자에게 관리계획 수립, 교육·상담, 생활습관 개선 지원을 제공하는 제도입니다. 약 5년의 시범사업을 거쳐 전국 본사업으로 전환됐고, 참여 시 본인부담률이 30%에서 20%로 낮아집니다.</p>
<p>참여 의원은 국민건강보험공단의 조회 서비스에서 지역별로 찾을 수 있습니다. 바른혈압은 특정 의원을 우선 노출하거나 예약을 대행하지 않으며, 공공기관의 조회 경로만 안내합니다.</p>
<div class="hero-actions">
<a class="btn btn--primary" href="https://www.nhis.or.kr" target="_blank" rel="noopener">국민건강보험공단에서 참여 의원 조회</a>
<a class="btn btn--secondary" href="https://www.mohw.go.kr/board.es?act=view&bid=0027&list_no=1483237&mid=a10503010100" target="_blank" rel="noopener">사업 안내(보건복지부)</a>
</div>
<p style="font-size:.85rem;color:var(--muted)">외부 사이트로 이동합니다. 조회 메뉴 위치는 기관 사이트 개편에 따라 달라질 수 있습니다.</p>
</div>
</div>
</div>
</section>

<section class="section">
<div class="wrap wrap--narrow">
<h2>이런 경우는 기다리지 마세요</h2>
<div class="card">
<ul style="margin:0">
<li>수축기 180 이상 또는 이완기 120 이상이 안정 후에도 반복될 때 — 당일 진료</li>
<li>혈압이 높으면서 심한 두통, 가슴 통증, 숨참, 시야 이상, 한쪽 마비, 말 어눌함이 함께 있을 때 — 즉시 119</li>
<li>임신 중 혈압 140/90 이상이거나 두통·시야 이상·윗배 통증이 있을 때 — 즉시 산부인과 또는 응급실</li>
<li>약을 먹고 있는데 어지럽고 쓰러질 것 같을 때 — 앉아서 혈압을 재고 진료</li>
</ul>
</div>
{emergency()}
<h2 style="margin-top:32px">출처</h2>
{sources([MOHW_CDM, KSH2026])}
</div>
</section>
"""
    return page("진료 준비 · 병의원 안내", "고혈압 진료 전에 준비할 것과 물어볼 질문, 일차의료 만성질환관리 참여 의원 조회 안내. 특정 의료기관 추천 없음.", "/clinic/", body)


# ============================================================
# 가족
# ============================================================
def family():
    body = page_head("가족과 함께 관리하기", "부모님 혈압을 자녀가 챙길 때, 대신 판단하지 않으면서 도울 수 있는 방법을 정리했습니다. 기록 공유 기능은 개인정보 설계를 마친 뒤 단계적으로 엽니다.", [("/", "홈"), (None, "가족")], "/family/") + f"""
<section class="section section--tight">
<div class="wrap">
<div class="split">
<div>
<h2>지금 바로 할 수 있는 것</h2>
{checklist([
    "<b>혈압계 커프가 부모님 팔에 맞는지 확인</b> — 팔 둘레를 재드리고 <a href=\"/devices/\">커프 크기</a>를 맞춥니다. 오래된 기기는 병원 혈압계와 한 번 비교해 봅니다.",
    "<b>재는 법을 함께 한 번 해보기</b> — 말로 설명하기보다 <a href=\"/measure/\">체크리스트</a>를 같이 보며 한 번 재드립니다.",
    "<b>부모님 기기에서 7일 기록 도구 열어드리기</b> — 회원가입이 없어 어르신도 쓰기 쉽습니다. 홈 화면에 추가해 드리면 더 편합니다.",
    "<b>진료 전날 리포트 인쇄해 드리기</b> — 부모님 기기에서 <a href=\"/report/\">리포트</a>를 열어 인쇄하거나 PDF로 저장해 전달합니다.",
    "<b>진료에 동행하거나 질문지를 챙겨드리기</b> — <a href=\"/clinic/\">진료 준비</a>의 질문 목록을 함께 봅니다.",
])}
</div>
<img src="/assets/img/photo-family2.jpg" alt="가족이 함께 혈압을 재고 기록을 보는 모습" width="1400" height="787">
</div>
</div>
</section>

<section class="section section--sky">
<div class="wrap">
<div class="section-head"><h2>도울 때 지킬 것</h2><p>가족이 대신 판단하는 구조가 되지 않도록, 바른혈압은 가족 기능을 이렇게 설계합니다.</p></div>
<div class="grid grid--3">
<div class="card"><h3>당사자가 초대합니다</h3><p style="margin:0;color:var(--muted)">기록 공유는 부모님(기록 당사자)이 자녀를 초대하는 방식이 기본입니다. 자녀가 일방적으로 부모님 기록을 등록하는 구조는 만들지 않습니다.</p></div>
<div class="card"><h3>권한을 나누고 철회할 수 있습니다</h3><p style="margin:0;color:var(--muted)">보기 전용과 입력 허용을 구분하고, 언제든 공유를 끊을 수 있게 합니다. 공유 링크는 유효기간을 둡니다.</p></div>
<div class="card"><h3>판단은 당사자와 의료진에게</h3><p style="margin:0;color:var(--muted)">자녀가 볼 수 있는 것은 기록과 리포트입니다. "약을 바꿔야 한다", "괜찮다" 같은 판단을 앱이 가족에게 제시하지 않습니다.</p></div>
</div>
</div>
</section>

<section class="section">
<div class="wrap wrap--narrow">
<h2>가족 기록 공유 기능, 준비 중입니다 <span class="badge badge--beta">사전 신청</span></h2>
<p>혈압은 민감한 건강정보라, 클라우드 저장과 가족 공유는 별도 동의 절차와 보안 설계를 마친 뒤 엽니다. 먼저 써보고 싶으시면 이메일을 남겨주세요. 준비되면 안내드리고, 다른 용도로는 쓰지 않습니다.</p>
<form class="form" data-api="lead" data-success="신청이 접수됐습니다. 기능이 준비되면 안내드리겠습니다." data-subject="가족 공유 기능 사전 신청">
<input class="hp" type="text" name="website" tabindex="-1" autocomplete="off">
<input type="hidden" name="type" value="family">
<div class="row"><div class="field"><label for="fm-email">이메일</label><input id="fm-email" name="contact" type="email" required placeholder="you@example.com"></div><div class="field"><label for="fm-role">누구의 기록을 함께 보고 싶으신가요</label><select id="fm-role" name="message"><option>부모님</option><option>배우자</option><option>본인 기록을 가족과 공유</option><option>기타</option></select></div></div>
<label class="agree"><input type="checkbox" name="agree" value="y"> 이메일은 기능 안내 목적에만 사용합니다. <a href="/policy/privacy.html">개인정보 처리방침</a></label>
<button class="btn btn--primary" type="submit">사전 신청</button>
<div class="form-msg" role="status"></div>
</form>
</div>
</section>
{cta_band("오늘 부모님 혈압, 같이 재보세요", "재는 법 한 번, 7일 기록 한 번이면 진료가 달라집니다.", "/measure/", "재는 법 함께 보기")}
"""
    return page("가족과 함께 관리하기", "부모님 혈압을 자녀가 챙기는 방법. 커프 확인, 재는 법, 7일 기록, 리포트 인쇄, 진료 동행. 가족 기록 공유 기능 사전 신청.", "/family/", body)


# ============================================================
# 커뮤니티 (Q&A)
# ============================================================
SEED_QNA = [
    ("검진에서 처음", "건강검진에서 138/88이 나왔는데 병원에 가야 하나요, 아니면 지켜봐도 되나요?", "한 번의 검진 값으로는 판단하지 않습니다. 지침은 진료실 재측정이나 가정혈압으로 확인할 것을 권고합니다. 집에서 5~7일 아침·저녁으로 재서 평균을 내고, 그 기록을 가지고 내과·가정의학과에서 상의하는 것이 표준 흐름입니다. 이 수치가 어떤 단계에 해당하는지는 반복 측정 후 의료진이 판단합니다. 관련 글: <a href=\"/info/first-high-reading.html\">검진에서 처음 높게 나왔을 때</a>"),
    ("측정", "아침에 재면 높고 저녁에 재면 낮은데, 어느 쪽이 진짜인가요?", "둘 다 진짜입니다. 혈압은 하루 중 변하며 아침에 높은 형태가 흔합니다. 그래서 지침은 아침·저녁을 나눠 기록하도록 합니다. 아침은 기상 후 1시간 이내·약 복용 전, 저녁은 취침 전 값을 각각 남기면 의료진이 양상을 볼 수 있습니다. 관련 글: <a href=\"/info/home-measurement.html\">집에서 재는 올바른 방법</a>"),
    ("약", "혈압약을 먹고 있는데 집에서 재면 125/80으로 잘 나옵니다. 약을 줄여도 되나요?", "이 질문은 커뮤니티가 답할 수 없는 영역입니다. 약의 조정은 기록과 검사 결과를 본 의료진이 결정합니다. 지금 하실 수 있는 것은 2~4주 기록을 <a href=\"/report/\">리포트</a>로 정리해 진료 때 '약을 줄일 수 있는 상황인지' 물어보는 것입니다. 스스로 줄이거나 끊으면 혈압이 반등할 수 있습니다."),
    ("젊은 혈압", "32살인데 아래 혈압만 92~95로 나옵니다. 위는 125 정도예요. 이게 고혈압인가요?", "수축기 140 미만·이완기 90 이상이 반복되면 2026년 지침의 이완기단독고혈압(IDH)에 해당할 수 있습니다. 젊은 층에 흔한 형태이고, 지침은 이를 무시하지 말 것을 강조합니다. 5~7일 바르게 재서 반복되는지 확인하고, 기록을 가지고 진료를 받아보세요. 관련 글: <a href=\"/info/idh.html\">이완기단독고혈압</a>"),
]

def community():
    seed = "".join(f'<li><div class="qh"><b>{c}</b><span>바른혈압 편집팀 답변</span></div><div class="q">{q}</div><div class="a"><b>답변</b>{a}</div></li>' for c, q, a in SEED_QNA)
    body = page_head("질문과 답변", "같은 고민을 가진 사람들의 질문에 근거를 붙여 답합니다. 개인의 진단·약 조정은 답하지 않으며, 그런 질문에는 '진료 때 무엇을 물어볼지'로 안내합니다.", [("/", "홈"), (None, "커뮤니티")]) + f"""
<section class="section section--tight">
<div class="wrap">
<div class="qna-layout">
<div>
<h2>최근 질문</h2>
<ul class="qna-list" id="qna-live" style="margin-bottom:12px"></ul>
<ul class="qna-list">{seed}</ul>
</div>
<div>
<div class="rules">
<h3 style="margin-bottom:8px">이 공간의 규칙</h3>
<ol>
<li><b>의료 조언을 하지 않습니다.</b> 약을 시작·중단·변경하라는 답변은 올리지 않으며, 올라오면 삭제합니다.</li>
<li><b>본인 수치와 병력을 자세히 적지 마세요.</b> 공개되는 공간입니다. 질문은 상황 중심으로 적어주세요.</li>
<li><b>응급 증상은 여기서 묻지 마세요.</b> 심한 두통, 가슴 통증, 마비, 말 어눌함은 119입니다.</li>
<li><b>제품·병원 홍보는 삭제합니다.</b></li>
<li><b>답변에는 출처를 붙입니다.</b> 경험담과 근거 있는 정보를 구분해 표기합니다.</li>
</ol>
</div>
<div class="card" style="margin-top:16px">
<h3>질문 남기기</h3>
<p style="color:var(--muted);font-size:.92rem">접수된 질문은 확인 후 근거를 붙여 답변과 함께 게시합니다. 닉네임과 질문만 공개됩니다.</p>
<form class="form" data-api="qna" data-success="질문이 접수됐습니다. 확인 후 답변과 함께 게시됩니다." data-subject="커뮤니티 질문">
<input class="hp" type="text" name="website" tabindex="-1" autocomplete="off">
<div class="row"><div class="field"><label for="q-nick">닉네임</label><input id="q-nick" name="nickname" type="text" required maxlength="20" placeholder="예: 새벽걷기"></div><div class="field"><label for="q-cat">주제</label><select id="q-cat" name="category"><option>검진에서 처음</option><option>측정</option><option>생활</option><option>약</option><option>젊은 혈압</option><option>가족</option><option>기타</option></select></div></div>
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
"""
    js = """<script>
(function(){var ul=document.getElementById('qna-live');if(!ul)return;
fetch('/api/qna').then(function(r){return r.ok?r.json():null}).then(function(j){if(!j||!j.ok||!j.items||!j.items.length)return;
ul.innerHTML=j.items.map(function(q){return '<li><div class="qh"><b>'+esc(q.category||'')+'</b><span>'+esc(q.nickname||'')+' · '+(q.created_at||'').slice(0,10)+'</span></div><div class="q">'+esc(q.question)+'</div>'+(q.answer?'<div class="a"><b>답변</b>'+esc(q.answer)+'</div>':'')+'</li>'}).join('');}).catch(function(){});
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}})();
</script>"""
    return page("질문과 답변 — 커뮤니티", "고혈압 관리에 관한 질문에 근거를 붙여 답하는 공간. 의료 조언 없이, 진료 때 무엇을 물어볼지 안내합니다.", "/community/", body, extra_js=js)


# ============================================================
# 협력 (B2B)
# ============================================================
def partners():
    body = page_head("의원·검진센터·기업 협력", "환자 소개 수수료를 받지 않습니다. 대신 진료 전후의 '표준 자료'를 공급합니다. 측정 가이드, 진료 전 질문지, 진료 후 생활 교육, 가정혈압 리포트 포맷을 기관에 맞게 제공합니다.", [("/", "홈"), (None, "협력")], "/partners/") + f"""
<section class="section section--tight">
<div class="wrap">
<div class="grid grid--3">
<div class="card"><span class="badge">의원</span><h3 style="margin-top:10px">Clinic Pack</h3><p style="color:var(--muted)">월별 고혈압 환자 교육자료, 대기실 측정 안내 포스터, 진료용 가정혈압 기록지, QR로 연결되는 7일 기록 도구. 일차의료 만성질환관리 사업의 교육·상담 흐름에 맞춥니다.</p><p style="font-size:.88rem;margin:0"><b>기관에 남는 것</b> — 환자 설명 시간 절감, 표준화된 기록 포맷, 진료 전후 자료 사용량</p></div>
<div class="card"><span class="badge">검진센터</span><h3 style="margin-top:10px">Check-up Follow-up</h3><p style="color:var(--muted)">검진에서 혈압 이상이 나온 수검자에게 결과 안내문과 함께 '올바른 재측정 → 7일 기록 → 리포트' 경로를 제공합니다. 검진 후 관리 공백을 채웁니다.</p><p style="font-size:.88rem;margin:0"><b>기관에 남는 것</b> — 참여율, 7일 완료율, 리포트 생성률(비의료 운영지표)</p></div>
<div class="card"><span class="badge">기업</span><h3 style="margin-top:10px">BP Week for Work</h3><p style="color:var(--muted)">임직원 혈압 측정 캠페인. 측정 교육, 7일 챌린지, 익명 집계 리포트. 세계 고혈압의 날(5월) 시즌에 맞춰 운영할 수 있습니다.</p><p style="font-size:.88rem;margin:0"><b>기관에 남는 것</b> — 참여율, 교육 이수율, 자발적 재측정률</p></div>
</div>
{caution("바른혈압은 의료행위를 하지 않으며 임상 성과(혈압 개선 등)를 보장하지 않습니다. 협력 프로그램의 성과 지표는 참여율·완료율·만족도 같은 운영 지표로 설정합니다. 특정 의료기관을 이용자에게 우선 노출하거나 소개 대가를 주고받는 구조는 채택하지 않습니다.", "협력 원칙")}
</div>
</section>

<section class="section section--sky">
<div class="wrap wrap--narrow">
<div class="section-head"><h2>파일럿 문의</h2><p>초기 파일럿은 소수 기관과 무료 또는 실비로 진행하며, 실제 사용 데이터를 함께 봅니다. 아래 양식으로 연락 주시면 자료를 보내드립니다.</p></div>
<form class="form" data-api="lead" data-success="문의가 접수됐습니다. 영업일 기준 2일 안에 회신드리겠습니다." data-subject="협력 문의">
<input class="hp" type="text" name="website" tabindex="-1" autocomplete="off">
<div class="row"><div class="field"><label for="p-type">기관 유형</label><select id="p-type" name="type"><option value="clinic">의원·병원</option><option value="checkup">검진센터·검진대행</option><option value="corporate">기업·단체</option><option value="public">보건소·공공기관</option><option value="device">의료기기·헬스케어 기업</option><option value="other">기타</option></select></div><div class="field"><label for="p-org">기관명</label><input id="p-org" name="org" type="text" required></div></div>
<div class="row"><div class="field"><label for="p-name">담당자</label><input id="p-name" name="name" type="text" required></div><div class="field"><label for="p-contact">이메일 또는 전화</label><input id="p-contact" name="contact" type="text" required></div></div>
<div class="field"><label for="p-msg">문의 내용</label><textarea id="p-msg" name="message" placeholder="관심 있는 프로그램, 규모, 시기 등"></textarea></div>
<label class="agree"><input type="checkbox" name="agree" value="y"> 입력 정보는 협력 문의 회신 목적에만 사용합니다. <a href="/policy/privacy.html">개인정보 처리방침</a></label>
<button class="btn btn--primary" type="submit">문의 보내기</button>
<div class="form-msg" role="status"></div>
</form>
<p style="font-size:.9rem;color:var(--muted);margin-top:16px">직접 연락: 주식회사 블랭크 · <a href="mailto:spaceblank0100@gmail.com">spaceblank0100@gmail.com</a> · 010-2384-9580</p>
</div>
</section>
"""
    return page("의원·검진센터·기업 협력", "Clinic Pack, Check-up Follow-up, BP Week for Work. 환자 소개 수수료 없이 진료 전후 표준 자료를 공급하는 협력 프로그램.", "/partners/", body)


# ============================================================
# 소개
# ============================================================
def about():
    body = page_head("바른혈압 소개", "혈압을 제대로 재고, 근거 있게 이해하고, 진료에 잘 가져가도록 돕는 고혈압 관리 플랫폼입니다. 정보를 많이 모으는 사이트가 아니라, 정보가 행동으로 이어지게 만드는 것이 목표입니다.", [("/", "홈"), (None, "소개")], "/about/") + f"""
<section class="section section--tight">
<div class="wrap">
<div class="split">
<div>
<h2>왜 만들었나</h2>
<p>고혈압 정보는 이미 많습니다. 공공기관 페이지는 정확하지만 읽히지 않고, 기록 앱은 숫자만 쌓이며, 유튜브는 근거 없는 이야기가 더 많이 재생됩니다. 그 사이에서 사람들은 검진 결과지를 들고 무엇부터 해야 할지 모릅니다.</p>
<p>바른혈압은 그 빈칸을 채웁니다. 학회 진료지침을 사람의 언어로 옮기고, 재는 법부터 정확히 안내하고, 기록을 진료에 가져갈 수 있는 형태로 만듭니다. 판정은 하지 않습니다. 그것은 의료진의 일입니다.</p>
<h2 style="margin-top:28px">무엇을 연구하는가</h2>
<p>저희는 새로운 의학 연구를 하지 않습니다. 이미 나온 근거를 모으고, 대조하고, 읽을 수 있게 정리합니다. 대한고혈압학회 진료지침, 질병관리청·보건복지부 등 공공기관 자료, 동료심사 연구를 우선 근거로 삼고, 근거가 약하면 약하다고 표시합니다.</p>
</div>
<img src="/assets/img/banner-morning.jpg" alt="" loading="lazy" width="1400" height="753">
</div>
</div>
</section>

<section class="section section--sky" id="review">
<div class="wrap">
<div class="section-head"><h2>운영 원칙</h2></div>
<div class="grid grid--2">
<div class="card"><h3>근거 표시</h3><p style="margin:0;color:var(--muted)">모든 글에 근거 유형(진료지침/공공기관/문헌고찰/단일 연구/전문가 해설/근거 부족), 근거 확실성, 적용 대상, 최종 검토일, 이해상충 여부를 표시합니다. 이 표시는 바른혈압의 편집 기준이며 학회의 권고 등급 체계와 다릅니다.</p></div>
<div class="card"><h3>의료진 감수</h3><p style="margin:0;color:var(--muted)">자문 의료진을 모시는 대로 글마다 순서대로 감수를 받습니다. 감수가 끝난 글에는 감수자의 실명·소속을 표기하고, 그 전까지는 '의료진 감수 예정'으로 표시합니다. 감수되지 않은 글을 감수된 것처럼 표기하지 않습니다.</p></div>
<div class="card"><h3>정정 공개</h3><p style="margin:0;color:var(--muted)">잘못된 내용이 확인되면 수정하고, 무엇을 언제 왜 고쳤는지 <a href="/policy/corrections.html">정정 이력</a>에 공개합니다. 지침 개정이나 안전성 이슈가 생기면 관련 글을 수시로 갱신합니다.</p></div>
<div class="card"><h3>상업 노출 분리</h3><p style="margin:0;color:var(--muted)">광고비나 제휴수수료를 낸 제품을 편집 평가 상위에 올리지 않습니다. 제휴 링크가 있으면 해당 문단에 명시하고, 편집 영역과 상업 영역을 시각적으로 분리합니다. <a href="/policy/editorial.html#coi">자세히</a></p></div>
</div>
</div>
</section>

<section class="section">
<div class="wrap wrap--narrow">
<h2>하지 않는 것</h2>
<ul>
<li>개인의 혈압 수치를 판정하거나 위험도·질환 확률을 계산하지 않습니다.</li>
<li>약의 시작·변경·중단을 권하지 않습니다.</li>
<li>특정 병의원을 추천하거나 소개 대가를 받지 않습니다.</li>
<li>혈압 기록을 이용자 동의 없이 서버에 저장하거나 외부에 제공하지 않습니다.</li>
<li>"국내 최초", "유일"과 같은 절대 표현을 쓰지 않습니다. 검증 가능한 것만 말합니다.</li>
</ul>
<h2 style="margin-top:32px">운영</h2>
<p>바른혈압은 <b>주식회사 블랭크</b>가 운영합니다. 블랭크는 공간 개발·운영 사업을 기반으로 무인·자동화 운영 체계를 만들어 온 회사이며, 바른혈압은 그 운영 원칙을 건강정보 영역에 적용한 첫 서비스입니다.</p>
<p>대표 최시준 · 문의 <a href="mailto:spaceblank0100@gmail.com">spaceblank0100@gmail.com</a> · 010-2384-9580</p>
<div class="card card--sky" style="margin-top:24px"><b style="color:var(--navy)">이 사이트는 의료기관이 아닙니다.</b> 제공되는 정보와 도구는 진단·치료를 대체하지 않으며, 의료법상 의료행위에 해당하는 서비스를 제공하지 않습니다. 건강에 관한 결정은 의료진과 상의하세요.</div>
</div>
</section>
"""
    return page("소개 · 운영 원칙", "바른혈압은 혈압을 제대로 재고, 근거 있게 이해하고, 진료에 잘 가져가도록 돕는 고혈압 관리 플랫폼입니다. 근거 표시, 의료진 감수, 정정 공개, 상업 노출 분리 원칙.", "/about/", body)


# ============================================================
# 정책 문서
# ============================================================
def editorial():
    body = page_head("편집·감수·정정·이해상충 정책", "바른혈압이 콘텐츠를 만들고 고치는 기준입니다.", [("/", "홈"), ("/about/", "소개"), (None, "정책")]) + f"""
<section class="section section--tight"><div class="wrap"><article class="article">
<h2 id="evidence">1. 근거 표시 기준</h2>
{table(["표시 항목", "값", "운영 원칙"], [
    ["근거 유형", "진료지침 / 공공기관 / 체계적 문헌고찰 / 단일 연구 / 전문가 해설 / 근거 부족", "원문 링크 필수"],
    ["근거 확실성", "높음 / 중간 / 낮음 / 판단 어려움", "편집팀이 내부 기준으로 평가하고, 감수 의료진이 확인"],
    ["적용 대상", "일반 성인 / 임신 / 고령 / 동반질환 / 특정 기기 등", "대상 범위를 눈에 띄게 표시"],
    ["최종 검토일", "날짜", "지침 개정·안전성 이슈 시 수시 갱신"],
    ["이해상충", "광고·제휴 없음 / 파트너 명시", "편집 판단과 영업을 분리"],
])}
<p>이 표시는 바른혈압이 정한 편집 기준이며, 대한고혈압학회의 권고 등급(Class)이나 근거 수준(LOE), 논문의 근거 체계와 다른 개념입니다. 혼동을 피하기 위해 A/B/C/D 같은 등급 문자를 쓰지 않습니다.</p>
<h2 id="pipeline">2. 콘텐츠 제작 절차</h2>
<ol>
<li><b>질문 수집</b> — 검색어, 커뮤니티 질문, 의료진 질문에서 실제 질문을 모읍니다.</li>
<li><b>원문 수집</b> — 최신 진료지침 → 공공기관 자료 → 동료심사 연구 순으로 원문을 찾고 출처·판·발행일을 기록합니다.</li>
<li><b>초안</b> — 조사와 구조화에 AI 도구를 보조로 씁니다. 사실과 해설을 분리합니다.</li>
<li><b>사실 검증</b> — 편집자가 수치·단위·대상·연도를 원문과 대조합니다.</li>
<li><b>의료 감수</b> — 자문 의료진이 의학적 정확성, 누락, 위험 표현을 검토합니다. 감수가 끝난 글에만 감수자를 표기합니다.</li>
<li><b>법규 확인</b> — 광고·표현·개인화 기능이 관련되면 별도로 검토합니다.</li>
<li><b>발행·갱신</b> — 출처, 감수, 검토일, 이해상충을 표기하고, 변경 이력을 남깁니다.</li>
</ol>
<h2 id="factcheck">3. 팩트체크 판정 기준</h2>
{table(["판정", "사용 예", "주의"], [
    ["근거가 충분함", "현재 진료지침과 일치합니다.", "적용 대상·조건을 함께 표기"],
    ["일부만 맞음", "일부 상황에서는 맞지만 모든 사람에게 적용되지는 않습니다.", "핵심 조건을 분리해 설명"],
    ["근거가 불충분함", "현재 근거만으로 효과를 판단하기 어렵습니다.", "'효과 없음'과 '근거 부족'을 구분"],
    ["현재 근거와 다름", "현재 진료지침·공공자료와 일치하지 않습니다.", "출처를 명시하고 과도한 비난은 피함"],
    ["의료진 판단 필요", "개인의 약 조정·진단은 의료진과 상의할 영역입니다.", "개별 치료 판단으로 넘어가지 않음"],
])}
<h2 id="correction">4. 정정 정책</h2>
<p>오류가 확인되면 해당 글을 수정하고 <a href="/policy/corrections.html">정정 이력</a>에 날짜, 대상 글, 수정 내용, 사유를 공개합니다. 정정 요청은 <a href="/factcheck/#report">팩트체크 요청 양식</a> 또는 이메일로 받습니다. 정정 이력은 삭제하지 않습니다.</p>
<h2 id="coi">5. 이해상충·커머스 독립성</h2>
<ul>
<li>광고비나 제휴수수료를 낸 제품·기관을 편집 평가나 목록 상위에 올리지 않습니다.</li>
<li>제휴 링크가 있는 경우 해당 문단에 명시합니다. 현재(최종 검토일 기준) 사이트에 제휴 링크는 없습니다.</li>
<li>편집 평가 영역과 상업 노출 영역을 시각적으로 분리합니다.</li>
<li>의료기관 소개 대가를 받지 않으며, 특정 기관을 우선 노출하지 않습니다.</li>
<li>기관·기업 협력(Clinic Pack 등)은 자료 공급 계약이며 콘텐츠의 편집 판단에 영향을 주지 않습니다.</li>
</ul>
<h2 id="ai">6. AI 사용 원칙</h2>
<p>조사, 구조화, 초안 작성에 AI 도구를 보조로 사용합니다. 발행되는 모든 글은 사람이 원문과 대조해 검증하고, 의료진 감수를 거치는 것을 원칙으로 합니다. 이미 인터넷에 있는 내용을 대량으로 재서술하는 방식은 쓰지 않습니다.</p>
<h2 id="ugc">7. 회원이 쓴 글과 외부 영상</h2>
<ul>
<li><a href="/community/board/">자유게시판</a>의 글과 댓글은 회원 개인의 경험과 의견이며, 위의 제작 절차(사실 검증·의료 감수)를 거치지 않습니다. 편집팀이 쓴 글과 섞이지 않도록 게시판은 별도 영역으로 운영하고, 개별 게시글은 검색엔진에 수집되지 않게 설정했습니다.</li>
<li>게시판에서 약 조정을 권하거나 근거 없는 치료 효과를 내세우는 글은 <a href="/policy/community.html">게시판 운영 원칙</a>에 따라 숨깁니다. 자주 나오는 주장은 팩트체크 주제로 가져와 근거를 확인합니다.</li>
<li><a href="/videos/">영상으로 배우기</a>에는 학회·공공기관·대학병원의 공식 누리집에 실린 영상만 싣습니다. 영상은 각 기관이 만든 것으로, 바른혈압이 내용을 고치거나 보증하지 않습니다. 만든 지 오래되어 현재 기준과 다른 수치가 나올 수 있다는 점을 페이지에 밝혀 둡니다.</li>
</ul>
<p style="font-size:.85rem;color:var(--muted)">최종 검토일 {NEW_DATE}</p>
</article></div></section>
"""
    return page("편집·감수·정정·이해상충 정책", "바른혈압의 근거 표시 기준, 콘텐츠 제작 절차, 팩트체크 판정 기준, 정정 정책, 이해상충·커머스 독립성 원칙.", "/policy/editorial.html", body)


def corrections():
    body = page_head("정정 이력", "무엇을 언제 왜 고쳤는지 공개합니다. 이력은 삭제하지 않습니다.", [("/", "홈"), ("/about/", "소개"), (None, "정정 이력")]) + f"""
<section class="section section--tight"><div class="wrap"><article class="article">
<div id="corr-table">{table(["날짜", "대상", "내용", "사유"], [
    [LAUNCH_DATE, "사이트 전체", "정식 오픈. bareunbp.com 주소로 서비스를 시작하고 네이버 검색 등록을 진행", "정식 오픈"],
    [NEW_DATE, "건강정보 24편, 팩트체크 10건, 음식·식단 5편, 레시피 8개 추가", "이차성 고혈압, 맥압·맥박, 검진 뒤 확진검사, 24시간 활동혈압, 혈압 변동, 양팔 차이, 질병관리청 6대 수칙, 근력운동, 여름·목욕·여행·명절, 혈압을 올리는 약, 복용 시간, 복합제, 뇌졸중 신호, 콩팥·심장·치매, 당뇨·이상지질혈증, 폐경기, 소아·청소년, 가족력, 만성질환관리 제도. 용어 30개와 자주 묻는 질문 25개 추가", "콘텐츠 확충"],
    [NEW_DATE, "영상·자료실·통계·소식 신설", "영상으로 배우기(학회·대학병원 영상 30편), 공신력 있는 자료실, 숫자로 보는 고혈압(팩트시트 2026, 2025년 국민건강영양조사), 고혈압 소식", "신규 발행"],
    [NEW_DATE, "회원·자유게시판 시작", "회원가입, 글 저장·공유, 자유게시판과 게시판 운영 원칙. 개인정보 처리방침과 이용약관 개정", "서비스 추가"],
    [REVIEW_DATE, "건강정보 13편 추가, 기존 15편 보강", "증상·응급, 아침 혈압, 생활요법 효과, 체중·커피·수면·스트레스·흡연, 노인·직장인 고혈압, 혈압계 정확도 추가. 혈압 정상수치 글에 수치대별 안내와 '나이별 정상수치' 설명 추가. 각 글에 자주 묻는 질문 추가", "콘텐츠 확충"],
    [REVIEW_DATE, "음식·식단 신설", "혈압에 좋은 음식, DASH 식단, 외식 나트륨표(식약처 분석 자료 37개 메뉴), 영양성분표 읽기, 칼륨 주의, 외식·편의점, 7일 식단, 건강기능식품, 저염 레시피 10개", "신설"],
    [REVIEW_DATE, "도구·커뮤니티", "측정 타이머, 나트륨 계산기, 복약 체크, 측정 알림, 기록 백업, 인쇄용 기록지, 용어사전, 자주 묻는 질문, 챌린지, 경험 나누기 추가", "기능 추가"],
    [FIRST_PUBLISHED, "사이트 전체", "사이트 첫 공개. 초기 콘텐츠 발행 (검증된 정보 15편, 팩트체크 10편)", "최초 발행"],
])}</div>
<p>정정할 내용을 발견하셨다면 <a href="/factcheck/#report">여기</a>로 알려주세요. 확인 후 이 페이지에 기록합니다.</p>
</article></div></section>
"""
    js = """<script>
(function(){fetch('/api/corrections').then(function(r){return r.ok?r.json():null}).then(function(j){
if(!j||!j.ok||!j.items||!j.items.length)return;var tb=document.querySelector('#corr-table tbody');if(!tb)return;var frag=document.createDocumentFragment();
j.items.forEach(function(c){var tr=document.createElement('tr'),cells=[document.createElement('td'),document.createElement('td'),document.createElement('td'),document.createElement('td')];
cells[0].textContent=c.date;
if(c.target_path&&/^\\/[A-Za-z0-9\\-_\\/.#]*$/.test(c.target_path)){var a=document.createElement('a');a.href=c.target_path;a.textContent=c.target_title||c.target_path;cells[1].appendChild(a)}else{cells[1].textContent=c.target_title||'사이트 전체'}
cells[2].textContent=c.content;cells[3].textContent=c.reason||'';cells.forEach(function(td){tr.appendChild(td)});frag.appendChild(tr)});
tb.insertBefore(frag,tb.firstChild)}).catch(function(){})})();
</script>"""
    return page("정정 이력", "바른혈압 콘텐츠 정정 이력. 무엇을 언제 왜 고쳤는지 공개합니다.", "/policy/corrections.html", body, extra_js=js)


def privacy():
    body = page_head("개인정보 처리방침", "바른혈압(주식회사 블랭크)은 개인정보를 최소로 수집하고, 혈압 기록은 이용자의 기기에만 저장하는 것을 기본으로 합니다.", [("/", "홈"), (None, "개인정보 처리방침")]) + f"""
<section class="section section--tight"><div class="wrap"><article class="article">
<h2>1. 혈압 기록의 저장</h2>
<p>7일 혈압 기록, 진료 준비 리포트 등 도구에 입력한 혈압·맥박·메모는 <b>이용자의 브라우저(localStorage)에만 저장</b>되며, 회사 서버로 전송되거나 저장되지 않습니다. <b>회원으로 가입하고 로그인해도 마찬가지입니다.</b> 이용자가 브라우저 데이터를 삭제하거나 도구의 '전체 삭제'를 누르면 즉시 삭제됩니다. 회사는 이 기록에 접근할 수 없습니다.</p>
<p>향후 클라우드 저장·가족 공유 기능을 제공하는 경우, 이는 이용자의 별도 명시적 동의를 받은 뒤에만 활성화되며, 건강정보는 개인정보 보호법상 민감정보로서 암호화·접근통제·보유기간·파기 규칙을 갖춘 뒤에 운영합니다. 해당 시점에 본 방침을 개정해 고지합니다.</p>
<h2>2. 수집하는 개인정보</h2>
{table(["구분", "항목", "목적", "보유 기간"], [
    ["회원가입 (선택)", "아이디, 비밀번호, 닉네임, 이메일(선택)", "회원 식별, 로그인, 게시판 글쓴이 표시, 비밀번호 분실 시 본인 확인", "탈퇴 시 즉시 삭제"],
    ["자유게시판", "글·댓글 내용과 작성 일시, 공감·신고 기록", "게시판 운영, 신고 처리", "삭제한 글·댓글은 30일 보관 후 파기. 처리가 끝난 신고 기록은 1년 후 파기"],
    ["저장한 글", "저장한 글의 주소와 제목", "저장 목록을 여러 기기에서 보기", "저장 해제 또는 탈퇴 시 즉시 삭제"],
    ["주간 혈압 레터 구독", "이메일", "레터 발송", "수신거부 후 30일 이내 파기"],
    ["커뮤니티 질문·경험 나누기", "닉네임, 질문·경험 내용", "게시 및 답변", "게시 삭제 요청 시까지"],
    ["팩트체크 요청", "주장 내용, 출처 링크, 이메일(선택)", "검증 및 회신", "처리 완료 후 1년"],
    ["협력·기능 신청", "기관명, 담당자명, 연락처, 문의 내용", "문의 회신", "처리 완료 후 1년"],
])}
<p>회원가입은 선택입니다. 가입하지 않아도 모든 글과 도구를 그대로 쓸 수 있고, 가입이 필요한 것은 자유게시판에 글을 쓰는 일과 저장한 글을 여러 기기에서 보는 일뿐입니다. 가입할 때 이름, 전화번호, 생년월일, 주민등록번호, 질환명·약물명은 받지 않습니다. 만 14세 미만은 가입할 수 없습니다.</p>
<p>게시판과 커뮤니티 질문에는 본인이나 다른 사람을 알아볼 수 있는 정보(실명, 연락처, 병원 진료 기록 등)를 적지 않도록 안내하며, 포함된 경우 운영자가 가리거나 숨길 수 있습니다.</p>
<p>위 항목을 접수하거나 글·댓글을 쓸 때 반복 등록과 스팸을 막기 위해 접속 IP를 되돌릴 수 없게 변환한 값을 함께 저장하며(질문·신청 접수에는 브라우저 정보 포함), 해당 기록과 같은 기간 보관합니다. 로그인과 가입 시도 횟수를 세는 기록은 2시간이 지나면 지웁니다. 주간 혈압 레터는 메일 하단의 수신거부 링크로 언제든 즉시 해지할 수 있습니다.</p>
<h2>2-1. 회원 정보의 보호와 탈퇴</h2>
<ul>
<li><b>비밀번호</b>는 이용자의 브라우저에서 되돌릴 수 없는 값으로 바꾼 뒤에 전송하고, 서버는 그 값을 한 번 더 변환해 저장합니다. 비밀번호 원문은 서버에 전달되지도, 저장되지도 않으며 운영자도 알 수 없습니다. 가입할 때 발급하는 복구 코드도 같은 방식으로 저장합니다.</li>
<li><b>이메일</b>은 비밀번호를 잊었을 때 본인임을 확인하고, 약관 변경처럼 꼭 알려야 하는 안내를 보내는 데에만 씁니다. 가입할 때 주간 혈압 레터 수신을 따로 선택한 경우에만 레터를 보냅니다.</li>
<li><b>탈퇴</b>는 <a href="/my/">마이페이지</a>에서 바로 할 수 있습니다. 탈퇴하면 아이디, 닉네임, 이메일, 비밀번호 정보와 저장 목록, 공감 기록을 즉시 지웁니다. 탈퇴할 때 선택하면 내가 쓴 글과 댓글도 함께 삭제하고, 선택하지 않으면 글쓴이가 ‘탈퇴한 회원’으로 표시된 채 남습니다.</li>
<li>게시판 운영 원칙을 반복해 어겨 이용이 제한된 경우에도 위 보유 기간은 같습니다.</li>
</ul>
<h2>3. 자동 수집 정보 (익명 이용 통계)</h2>
<p>사이트를 개선하기 위해 다음 정보를 <b>날짜별 합계로만</b> 저장합니다.</p>
<ul><li>방문한 페이지 주소</li><li>다른 사이트에서 들어온 경우 그 사이트의 도메인 (예: search.naver.com)</li><li>사이트 검색창에 입력한 검색어 (40자까지)</li><li>도구 이용 여부 — ‘기록 저장’, ‘리포트 인쇄’, ‘글 공유’, ‘영상 재생’처럼 어떤 기능을 썼는지의 이름</li></ul>
<p>IP 주소, 쿠키 ID, 회원 아이디 같은 개인 식별자는 통계에 저장하지 않으며, <b>혈압·맥박 수치는 전송하지 않습니다.</b> 첫 방문 여부를 세기 위해 브라우저에 ‘방문함’ 표시 하나만 저장합니다. 브라우저의 추적 거부(Do Not Track) 또는 GPC 설정을 켜면 통계를 보내지 않습니다. 일별 통계는 400일이 지나면 삭제합니다.</p>
<h2>3-1. 쿠키와 브라우저 저장소</h2>
{table(["이름", "종류", "용도", "유지 기간"], [
    ["bp_user", "쿠키 (필수)", "로그인 상태 유지. 스크립트가 읽을 수 없게 설정하며 광고·추적에 쓰지 않습니다.", "30일 또는 로그아웃할 때까지"],
    ["혈압 기록, 복약 체크 등 도구 데이터", "브라우저 저장소", "입력한 기록을 이 기기에 보관", "이용자가 지울 때까지"],
    ["저장한 글 목록, 게시판 임시 저장 글, 로그인 표시용 닉네임", "브라우저 저장소", "로그인하지 않은 상태의 저장 목록, 쓰던 글 보관, 화면 위쪽에 닉네임 표시", "이용자가 지우거나 로그아웃할 때까지"],
])}
<p>광고용 쿠키나 외부 분석 도구는 쓰지 않습니다. 로그인 쿠키는 브라우저 설정에서 지울 수 있으며, 지우면 로그아웃됩니다.</p>
<h2>4. 제3자 제공·위탁</h2>
<p>이용자의 개인정보를 제3자에게 제공하거나 판매하지 않습니다. 서비스 운영을 위해 다음과 같이 처리를 위탁합니다.</p>
{table(["수탁자", "위탁 업무"], [["Cloudflare, Inc.", "웹사이트 호스팅, 회원 정보·게시글·접수 정보·통계 저장(데이터베이스)"]])}
<p>Cloudflare의 데이터센터는 국외에 있을 수 있어, 위 2항의 정보가 가입·작성·접수 시점에 네트워크를 통해 국외 서버에 저장될 수 있습니다. 보유 기간은 위 2항과 같습니다. 이메일 발송 대행사를 이용하게 되면 수탁자와 업무 내용을 이 방침에 추가해 알립니다.</p>
<h2>4-1. 외부 서비스 연결</h2>
<ul>
<li><b>영상</b> — <a href="/videos/">영상으로 배우기</a>의 영상은 유튜브(Google LLC)가 제공합니다. 이 페이지를 열면 영상 미리보기 그림을 유튜브 서버에서 불러오고, 재생 버튼을 누르면 유튜브 플레이어가 실행되어 접속 정보가 유튜브에 전달됩니다. 재생에는 유튜브의 개인정보 보호 강화 모드를 사용하며, 이후 처리는 Google의 개인정보처리방침을 따릅니다. 다른 페이지에서는 유튜브에 연결하지 않습니다.</li>
<li><b>공유</b> — 밴드, 페이스북, X, 이메일 공유 버튼은 누를 때에만 해당 서비스의 공유 화면을 엽니다. 전달되는 것은 글의 주소와 제목뿐이고, 회원 정보는 보내지 않습니다.</li>
<li><b>글꼴</b> — 화면 글꼴을 jsDelivr(글꼴 배포 서버)에서 불러옵니다.</li>
</ul>
<h2>4-2. 운영자의 접근 관리</h2>
<p>회원 정보와 접수된 정보는 접속 키로 인증한 운영자만 볼 수 있고, 조회·게시·숨김·삭제·내보내기 등 모든 처리 내역이 기록됩니다. 운영자 화면에도 비밀번호는 표시되지 않습니다. 보유 기간이 지난 정보는 정기적으로 파기합니다.</p>
<h2>5. 이용자의 권리</h2>
<p>이용자는 언제든 개인정보 열람·정정·삭제·처리정지를 요청할 수 있습니다. 회원은 <a href="/my/">마이페이지</a>에서 닉네임·이메일 변경, 글·댓글 삭제, 탈퇴를 직접 할 수 있고, 그 밖의 요청은 아래 연락처로 보내주시면 지체 없이 처리합니다.</p>
<h2>6. 개인정보 보호책임자</h2>
<p>주식회사 블랭크 · 최시준 · <a href="mailto:spaceblank0100@gmail.com">spaceblank0100@gmail.com</a> · 010-2384-9580</p>
<p style="font-size:.85rem;color:var(--muted)">시행일 {NEW_DATE} (회원·자유게시판·영상 관련 내용 추가). 이전 시행일 {REVIEW_DATE}. 본 방침은 법령·서비스 변경 시 개정되며, 개정 시 사이트에 공지합니다.</p>
</article></div></section>
"""
    return page("개인정보 처리방침", "바른혈압 개인정보 처리방침. 혈압 기록은 브라우저에만 저장, 회원가입은 선택, 최소 수집 원칙.", "/policy/privacy.html", body)


def terms():
    body = page_head("이용약관", "", [("/", "홈"), (None, "이용약관")]) + f"""
<section class="section section--tight"><div class="wrap"><article class="article">
<h2>제1조 (목적)</h2><p>이 약관은 주식회사 블랭크(이하 "회사")가 운영하는 바른혈압 웹사이트(이하 "서비스")의 이용 조건을 정합니다.</p>
<h2>제2조 (서비스의 성격)</h2>
<ol>
<li>서비스는 고혈압에 관한 일반적인 건강정보와 이용자가 스스로 측정한 혈압을 기록·정리하는 도구를 제공하는 비의료 건강관리 서비스입니다.</li>
<li>회사는 의료기관이 아니며, 서비스는 의료행위(진단, 처방, 치료)를 제공하지 않습니다. 서비스가 제공하는 정보와 도구는 의료진의 진단·치료를 대체하지 않습니다.</li>
<li>기록 도구는 이용자가 입력한 수치의 평균·범위를 계산하여 표시할 뿐, 개인의 건강 상태를 판정하거나 위험도를 평가하지 않습니다.</li>
</ol>
<h2>제3조 (이용자의 책임)</h2>
<ol>
<li>이용자는 서비스의 정보를 참고자료로만 사용하며, 건강에 관한 결정은 의료진과 상의해야 합니다.</li>
<li>응급 상황에서는 서비스를 이용하지 말고 119 등 응급의료체계를 이용해야 합니다.</li>
<li>이용자는 커뮤니티에 타인의 권리를 침해하거나, 의료 조언에 해당하거나, 상업적 홍보에 해당하는 내용을 게시할 수 없습니다.</li>
</ol>
<h2>제4조 (기록 데이터)</h2>
<ol>
<li>기록 도구의 데이터는 이용자의 브라우저에 저장되며 회사가 보관하지 않습니다. 회원으로 로그인한 경우에도 같습니다. 브라우저 데이터 삭제, 기기 변경 등으로 인한 기록 소실에 대해 회사는 책임지지 않습니다.</li>
<li>이용자는 CSV 내보내기, 리포트 인쇄 등으로 스스로 기록을 보관할 수 있습니다.</li>
</ol>
<h2>제5조 (회원 가입과 탈퇴)</h2>
<ol>
<li>회원가입은 선택이며 무료입니다. 만 14세 이상이면 아이디, 비밀번호, 닉네임을 정하고 이 약관과 개인정보 수집·이용에 동의해 가입할 수 있습니다.</li>
<li>회원은 아이디와 비밀번호, 복구 코드를 스스로 관리해야 하며 다른 사람에게 알려 주거나 계정을 넘겨줄 수 없습니다. 비밀번호를 잊은 경우 복구 코드로 직접 다시 설정하거나, 가입할 때 등록한 이메일로 회사에 본인 확인을 요청할 수 있습니다. 이메일을 등록하지 않았고 복구 코드도 없으면 계정을 되찾지 못할 수 있습니다.</li>
<li>회원은 마이페이지에서 언제든 탈퇴할 수 있고, 탈퇴 즉시 회원 정보가 삭제됩니다.</li>
<li>다른 사람의 정보를 도용했거나, 운영자·의료인을 사칭했거나, <a href="/policy/community.html">게시판 운영 원칙</a>을 반복해서 어긴 회원에 대해 회사는 글쓰기를 제한하거나 회원 자격을 정지·상실시킬 수 있습니다. 이 경우 사유를 알리며, 회원은 이메일로 이의를 제기할 수 있습니다.</li>
</ol>
<h2>제6조 (게시물)</h2>
<ol>
<li>자유게시판의 글과 댓글(이하 "게시물")의 저작권은 작성한 회원에게 있습니다. 회사는 서비스 안에서 게시물을 보여 주고 검색되게 하는 범위에서 이용하며, 그 밖의 목적으로 쓰려면 미리 회원의 동의를 받습니다.</li>
<li>게시물은 회원 개인의 경험과 의견이며, 회사가 그 내용을 검증하거나 보증하지 않습니다. 게시물을 근거로 약을 바꾸거나 치료를 미루어서는 안 됩니다.</li>
<li>회원은 다음에 해당하는 게시물을 올릴 수 없습니다. 특정인에게 약의 시작·변경·중단을 권하거나 진단을 내리는 내용, 근거 없이 질병의 예방·치료 효과를 내세우는 내용, 제품·병의원·서비스의 광고와 홍보, 본인 또는 타인의 개인정보, 욕설·비방·차별, 저작권 등 타인의 권리를 침해하는 내용, 그 밖에 법령에 어긋나는 내용.</li>
<li>회사는 제3항에 해당하거나 신고가 접수된 게시물을 <a href="/policy/community.html">게시판 운영 원칙</a>에 따라 숨기거나 삭제할 수 있습니다. 자신의 권리가 침해되었다고 생각하는 사람은 회사에 게시 중단을 요청할 수 있고, 회사는 관련 법령에 따라 조치한 뒤 결과를 알립니다.</li>
<li>회원은 자신의 게시물을 언제든 삭제할 수 있습니다. 삭제한 게시물은 분쟁 대응을 위해 30일 보관한 뒤 파기합니다.</li>
</ol>
<h2>제7조 (지식재산권)</h2><p>서비스의 콘텐츠, 디자인, 도구에 대한 권리는 회사에 있습니다. 공공기관·학회 자료의 인용은 출처를 표기하며, 해당 자료의 권리는 원저작자에게 있습니다. 영상으로 배우기에 실린 영상의 권리는 각 영상을 만든 기관에 있고, 회사는 유튜브의 공유 기능으로 연결해 보여 줄 뿐입니다.</p>
<h2>제8조 (면책)</h2><p>회사는 서비스 정보의 정확성을 위해 노력하지만, 의학 지식과 지침은 변경될 수 있습니다. 이용자가 서비스 정보 또는 다른 회원의 게시물에 기초하여 내린 결정과 그 결과에 대해 회사는 법령이 허용하는 범위에서 책임을 지지 않습니다.</p>
<h2>제9조 (약관의 변경)</h2><p>회사는 필요 시 약관을 개정할 수 있으며, 개정 시 사이트에 공지합니다. 회원에게 불리한 변경은 시행 30일 전부터 공지합니다.</p>
<p style="font-size:.85rem;color:var(--muted)">시행일 {NEW_DATE} (회원·게시물 조항 신설). 이전 시행일 {REVIEW_DATE}</p>
</article></div></section>
"""
    return page("이용약관", "바른혈압 이용약관. 서비스의 성격, 회원 가입과 탈퇴, 게시물, 면책.", "/policy/terms.html", body)


def notfound():
    body = f"""<section class="section"><div class="wrap wrap--narrow" style="text-align:center;padding:60px 24px">
<h1>페이지를 찾을 수 없습니다</h1>
<p style="color:var(--muted)">주소가 바뀌었거나 잘못 입력됐을 수 있습니다.</p>
<div class="hero-actions" style="justify-content:center"><a class="btn btn--primary" href="/">홈으로</a><a class="btn btn--secondary" href="/info/">검증된 정보</a><a class="btn btn--secondary" href="/check7/">7일 기록</a></div>
</div></section>"""
    return page("페이지를 찾을 수 없습니다", "", "/404.html", body, noindex=True)
