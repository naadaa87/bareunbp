# -*- coding: utf-8 -*-
"""영상으로 배우기 · 자료실 · 숫자로 보는 고혈압 · 고혈압 소식 (2026-11)"""
from base import page, page_head, table, sources, cta_band, ICONS, SITE, NEW_DATE, BRAND
from articles3a import FACT2026, KNHANES2025, KDCA6

# ------------------------------------------------------------------ 영상
# 기관의 공식 누리집(대한고혈압학회, 질병관리청 국가건강정보포털, 서울아산병원·서울대학교병원 건강TV)에
# 실려 있는 것을 확인한 영상만 기본으로 싣는다. 운영자가 관리자 콘솔에서 추가한 영상은 아래에 이어서 표시된다.
AMC = "서울아산병원 건강TV"
SNUH = "서울대학교병원 건강TV"
VCATS = [
    ("measure", "측정", "집에서 혈압을 정확하게 재는 방법입니다. 처음 재기 시작한다면 여기부터 보세요."),
    ("basic", "기본 이해", "고혈압이 무엇이고 왜 관리해야 하는지 설명하는 영상입니다."),
    ("life", "생활습관", "식사, 스트레스, 계절, 검진처럼 매일의 생활과 이어진 주제입니다."),
    ("with", "약과 함께 챙기는 것", "혈압약을 먹는 이유, 그리고 고혈압과 같이 관리하는 일이 많은 콜레스테롤 이야기입니다."),
    ("stroke", "뇌졸중", "증상을 미리 알아 두면 대처가 빨라집니다. 지금 증상이 있다면 영상을 보지 말고 바로 119에 연락하세요."),
    ("heart", "심장", "가슴 통증, 심부전처럼 심장에 생기는 문제를 다룹니다."),
]
# (분류, 유튜브 ID, 제목, 출처, 소개, 길이)
VIDEOS = [
    ("measure", "OQdVrL4-qEI", "가정혈압 측정 교육 영상", "대한고혈압학회", "학회가 환자 교육용으로 만든 영상입니다. 재는 시간, 자세, 커프 감는 법을 순서대로 보여 줍니다.", ""),
    ("measure", "-bJtS7J-ls8", "가정(자가)혈압 측정방법", "대한고혈압학회", "집에서 혈압을 잴 때 지켜야 할 조건을 짧게 정리한 영상입니다.", ""),

    ("basic", "QQ7jxYp5z0o", "고혈압", AMC, "고혈압이 무엇이고 왜 관리해야 하는지 심장내과 의료진이 설명합니다.", ""),
    ("basic", "5T0dUg84XBA", "고혈압 환자가 꼭 알아야 할 9가지", AMC, "약, 생활습관, 측정에 대해 환자가 자주 묻는 내용을 정리한 영상입니다.", ""),
    ("basic", "awl7x29_gJg", "고혈압 종류와 위험요인 및 치료방법", SNUH + " · 순환기내과 김용진 교수", "일차성과 이차성 고혈압의 차이, 합병증, 진단과 치료의 원칙을 대담으로 풀어 설명합니다.", ""),
    ("basic", "waB08-tkjgM", "고혈압 VS 저혈압 바로 알기", AMC, "고혈압과 저혈압을 나란히 놓고 비교하는 영상입니다.", ""),

    ("life", "uPETHTb69E8", "고혈압 환자를 위한 생활습관", AMC + " · 건강플러스", "고혈압이 있을 때 생활에서 챙길 것을 다룬 영상입니다.", ""),
    ("life", "zT_WCJrkQZk", "식습관편 — 위험한 식습관", AMC, "건강을 해치는 식습관을 짚어 보는 영상입니다.", "4:29"),
    ("life", "ULjzlJTYgP0", "찬바람이 불면 심혈관 환자가 급증하는 이유?", AMC + " · 심장내과 이종영 교수", "겨울이 되면 심혈관질환 환자가 늘어나는 까닭을 설명합니다.", ""),
    ("life", "fMGpA-Pptw8", "알쏭다쏭 사우나, 찜질방 상식", AMC, "사우나와 찜질방을 이용할 때 알아 둘 건강 상식입니다.", ""),
    ("life", "jxTbL1Zk91M", "심장 건강을 위한 생활습관 관리", AMC, "20분 남짓한 건강강좌입니다. 시간을 내어 차분히 보기 좋습니다.", "22:52"),
    ("life", "lj0jaDoNct4", "심장 건강을 위한 스트레스 관리법", AMC, "스트레스 관리를 주제로 한 건강강좌입니다.", "26:03"),
    ("life", "Q6rfQoQ2pKY", "2030세대도 건강검진 챙기세요", SNUH + " · 가정의학과 박상민 교수", "20~30대가 받는 국가건강검진 항목과 이 나이대의 건강 위험 요인을 설명합니다.", ""),
    ("life", "zmJvY5jJgSU", "기립성 어지럼증 제대로 알자", SNUH + " · 신경과 주건 교수", "일어설 때 어지럽거나 눈앞이 흐려지는 기립성 저혈압과 기립성 빈맥증후군을 설명합니다.", ""),

    ("with", "Qk0oWcebjtw", "혈압약의 투약 목적", AMC, "협심증이나 심근경색이 있으면 혈압이 정상이어도 혈압약을 먹는 이유를 설명합니다.", "0:58"),
    ("with", "Z888V5tTRA4", "고지혈증이 뭐길래?", AMC, "고혈압과 같이 관리하는 일이 많은 고지혈증(이상지질혈증)을 다룬 영상입니다.", "6:03"),
    ("with", "dvTNJwKakOc", "콜레스테롤 관리 방법", AMC, "1분 남짓한 짧은 문답 영상입니다.", "1:03"),
    ("with", "ho8Fe2VsoZo", "혈관질환의 예방법", AMC, "혈관질환 예방을 주제로 한 영상입니다.", ""),

    ("stroke", "NjvaMG8H4wY", "뇌졸중인지 아닌지 이렇게 체크하세요", AMC, "뇌졸중이 의심될 때 확인할 것을 알려 주는 영상입니다.", "7:20"),
    ("stroke", "8uWIuftsYGM", "겨울철 급증하는 뇌출혈, 이럴 땐 꼭 응급실 가세요!", AMC + " · 건강플러스", "뇌출혈이 늘어나는 겨울, 응급실에 가야 하는 증상을 다룹니다.", "6:11"),
    ("stroke", "wAw96zSBVFQ", "뇌졸중의 증상", AMC, "1분 남짓한 짧은 문답 영상입니다.", "1:10"),
    ("stroke", "_8rZXpajcdE", "뇌졸중 증상 발생 시 대처", AMC, "1분이 안 되는 짧은 문답 영상입니다.", "0:51"),
    ("stroke", "FpqFhQF91vE", "뇌경색의 예방 방법", AMC, "1분 남짓한 짧은 문답 영상입니다.", "1:05"),
    ("stroke", "Of3vOsnGIhg", "뇌졸중의 예방과 치료", AMC, "40분이 넘는 건강강좌입니다. 예방부터 치료까지 한 번에 듣고 싶을 때 봅니다.", "43:50"),

    ("heart", "zNAA7ds73iY", "심장이 보내는 신호, 가슴통증", AMC + " · 건강플러스", "가슴 통증을 주제로 한 짧은 영상입니다.", "3:22"),
    ("heart", "wBx6W1a7p6o", "심장질환자 흉통 시 응급조치", AMC, "1분이 안 되는 짧은 문답 영상입니다.", "0:57"),
    ("heart", "NY1IMwrtW8I", "위장질환? 심장질환? 잘못 구분하면 위험합니다", SNUH + " · 심장혈관흉부외과 강윤진 교수", "소화불량처럼 느껴지는 증상이 심장 문제일 수 있는 경우와 응급실에 가야 하는 때를 설명합니다.", ""),
    ("heart", "fF-VdGyDV8I", "심부전, 이름에서 느껴지는 것과 달리 무서운 질환!", AMC, "심부전을 소개하는 영상입니다.", "7:30"),
    ("heart", "AATiC1c_BMo", "심부전, 심장 질환이 일으키는 또 다른 병", SNUH + " · 순환기내과 이해영 교수", "누우면 숨이 차거나 다리가 붓는 증상과 심부전의 관계를 설명합니다.", ""),
    ("heart", "p5y-Fi-e_og", "가슴이 조이고 아파오는 협심증과 심근경색증, 꼭 병원을 찾으셔야 합니다!", AMC, "40분 분량의 건강강좌입니다.", "40:33"),
]
CHANNELS = [
    ("대한고혈압학회 유튜브", "https://www.youtube.com/channel/UCBW9gtsJ4afAG3bK_Je3tuw", "가정혈압 측정, 고혈압 바로 알기 등 학회가 만든 교육 영상"),
    ("질병관리청 아프지마TV", "https://www.youtube.com/channel/UCa7-3Zvxg-5Rfxgu3RQY_gw", "만성질환 예방관리 수칙과 건강 정보"),
    ("국가건강정보포털 동영상 자료실", "https://health.kdca.go.kr/healthinfo/biz/health/ntcnInfo/mediaRecsroom/mvpRecsroom/mvpRecsroomMain.do", "질병관리청이 운영하는 건강정보 영상 모음"),
    ("국민건강보험 유튜브", "https://www.youtube.com/channel/UC7tsTpx4Ra-oJrjIb9ItBUA", "건강검진, 만성질환 관리 제도, 생활 건강 영상"),
    ("서울아산병원 건강TV", "https://www.amc.seoul.kr/asan/healthtv/video/videoSubmain.do", "질환별 문답 영상과 건강강좌를 병원 누리집에서 찾아볼 수 있습니다"),
    ("서울대학교병원 건강TV — 고혈압약 나눠 먹지 마세요", "https://www.snuh.org/health/tv/view.do?seq_no=106", "순환기내과 의료진이 설명하는 혈압약 복용 이야기"),
    ("서울대학교병원 건강TV — 고혈압 기준(130/80) 변경이 의미하는 것은?", "https://www.snuh.org/health/tv/view.do?seq_no=117", "미국의 고혈압 기준 변경 배경과 의미를 다룬 대담"),
    ("서울대학교병원 유튜브", "https://www.youtube.com/user/chSNUH", "질환별 건강 강좌와 의료진 인터뷰"),
]


def video_card(yid, title, source, note="", dur=""):
    n = f'<p class="vn">{note}</p>' if note else ""
    d = f'<span class="dur">{dur}</span>' if dur else ""
    return (f'<div class="video-card"><button type="button" class="video-thumb" data-yt="{yid}" aria-label="재생: {title}">'
            f'<img src="https://i.ytimg.com/vi/{yid}/hqdefault.jpg" alt="" loading="lazy" width="480" height="360"><span class="play"></span>{d}</button>'
            f'<div class="vb"><b>{title}</b><span class="vs">{source}</span>{n}'
            f'<a class="vl" href="https://www.youtube.com/watch?v={yid}" target="_blank" rel="noopener">유튜브에서 보기</a></div></div>')


def videos_page():
    total = len(VIDEOS)
    chips = "".join(f'<a class="chip" href="#v-{k}">{label} {sum(1 for v in VIDEOS if v[0] == k)}</a>' for k, label, _ in VCATS)
    sections = ""
    for k, label, desc in VCATS:
        cards = "".join(video_card(y, t, s, n, d) for cc, y, t, s, n, d in VIDEOS if cc == k)
        sections += f'<div class="video-sec" id="v-{k}"><h2>{label}</h2><p class="video-desc">{desc}</p><div class="video-grid">{cards}</div></div>'
    chans = "".join(f'<li><a href="{u}" target="_blank" rel="noopener"><b>{t}</b><span>{d}</span></a></li>' for t, u, d in CHANNELS)
    body = page_head("영상으로 배우기", f"글보다 영상이 편한 분을 위해 학회와 대학병원이 만든 영상 {total}편을 주제별로 모았습니다. 재생 버튼을 누르면 이 자리에서 바로 볼 수 있습니다.", [("/", "홈"), ("/info/", "건강정보"), (None, "영상으로 배우기")], "/videos/") + f"""
<section class="section section--tight">
<div class="wrap">
<div class="notice-soft" style="margin-bottom:16px"><b>영상은 각 기관이 만든 것입니다.</b> 바른혈압이 제작하거나 내용을 보증하지 않으며, 개인의 진단과 약 조정은 영상이 아니라 진료에서 정합니다. 만든 시기가 저마다 달라 오래된 영상의 수치 기준은 지금과 다를 수 있습니다. 현재 기준은 <a href="/info/reading-numbers.html">혈압 정상수치 표</a>에서 확인하세요. 영상을 재생하면 유튜브의 서비스 약관과 개인정보 정책이 적용됩니다.</div>
<div class="chips">{chips}</div>
{sections}
<div id="video-more"></div>
</div>
</section>
<section class="section section--sky">
<div class="wrap">
<div class="section-head"><h2>더 많은 영상이 있는 곳</h2><p>기관의 공식 채널과 영상 자료실입니다. 새 창에서 열립니다.</p></div>
<ul class="channel-list">{chans}</ul>
</div>
</section>
<section class="section">
<div class="wrap wrap--narrow">
<h2>건강 영상을 고를 때</h2>
<ul>
<li><b>누가 만들었는지</b> 먼저 봅니다. 공공기관, 학회, 병원의 공식 채널인지 확인합니다.</li>
<li><b>“이것만 먹으면 약을 끊는다”</b>는 식의 영상은 걸러 봅니다. 특정 식품이나 제품 판매로 이어지는지 살핍니다.</li>
<li><b>올린 날짜</b>를 확인합니다. 진료지침은 몇 년마다 바뀝니다.</li>
<li>영상에서 본 내용을 내게 적용해도 되는지는 <b>진료 때 물어봅니다.</b></li>
</ul>
<p>헷갈리는 이야기를 들었다면 <a href="/factcheck/">팩트체크</a>에서 확인하거나 <a href="/factcheck/#report">검증을 요청</a>해 주세요.</p>
</div>
</section>
{cta_band("영상을 봤다면, 이제 직접 재 볼 차례입니다", "5분 안정과 2회 측정을 타이머가 안내합니다.", "/tools/timer/", "측정 타이머 열기")}
"""
    ld = {"@context": "https://schema.org", "@type": "CollectionPage", "name": "고혈압 영상 모음", "url": SITE + "/videos/",
          "description": f"학회와 대학병원이 만든 고혈압 교육 영상 {total}편 모음"}
    return page("영상으로 배우기 — 혈압 재는 법부터 뇌졸중 증상까지", f"대한고혈압학회, 서울아산병원, 서울대학교병원이 만든 고혈압 영상 {total}편. 가정혈압 측정, 고혈압 기본 이해, 생활습관, 혈압약, 뇌졸중과 심장질환 증상을 주제별로 정리했습니다.",
                "/videos/", body, jsonld=ld, extra_js='<script src="/assets/js/videos.js"></script>',
                keywords=["고혈압 영상", "혈압 재는 법 영상", "가정혈압 측정 동영상", "고혈압 강의", "고혈압 유튜브", "뇌졸중 증상 영상"])


# ------------------------------------------------------------------ 자료실
LIBRARY = [
    ("학회와 진료지침", "고혈압 진단과 치료의 기준을 만드는 곳의 자료입니다.", [
        ("대한고혈압학회", "가정혈압측정 교육자료", "https://www.koreanhypertension.org/sense/family", "환자용 교육 책자와 포스터, 교육 영상을 내려받을 수 있습니다. 집에서 재기 시작한다면 가장 먼저 볼 자료입니다.", "환자용"),
        ("대한고혈압학회", "고혈압 수칙", "https://www.koreanhypertension.org/sense/regulations", "학회가 정리한 생활 수칙입니다.", "환자용"),
        ("대한고혈압학회", "고혈압 자가관리", "https://www.koreanhypertension.org/sense/self", "스스로 관리하는 방법에 대한 학회 안내입니다.", "환자용"),
        ("대한고혈압학회", "소아고혈압 계산기", "https://www.koreanhypertension.org/sense/calculator", "나이·성별·키에 따른 소아·청소년 혈압 기준을 확인합니다. 해석은 진료 때 의료진과 합니다.", "보호자용"),
        ("대한고혈압학회", "고혈압 진료지침", "https://www.koreanhypertension.org/reference/guide", "국내 고혈압 진료의 기준이 되는 지침입니다. 의료진을 위한 문서지만 분류표와 권고를 직접 확인할 수 있습니다.", "전문가용"),
        ("Clinical Hypertension", "대한고혈압학회 공식 학술지", "https://clinicalhypertension.org/", "고혈압 팩트시트와 진료지침 요약이 실리는 영문 학술지입니다.", "전문가용"),
        ("대한뇌졸중학회", "뇌졸중 정보와 뇌졸중센터 안내", "https://www.stroke.or.kr", "뇌졸중 증상, 치료, 가까운 뇌졸중센터를 확인할 수 있습니다.", "환자용"),
    ]),
    ("정부와 공공기관", "제도, 통계, 건강정보를 제공하는 공공기관의 자료입니다.", [
        ("질병관리청", "국가건강정보포털 — 고혈압", "https://health.kdca.go.kr/healthinfo/biz/health/gnrlzHealthInfo/gnrlzHealthInfo/gnrlzHealthInfoView.do?cntnts_sn=6765", "정의, 진단, 치료, 합병증, 자주 묻는 질문을 한 문서에 정리한 공공 건강정보입니다.", "환자용"),
        ("질병관리청", "고혈압 예방관리 6대 수칙 (2026)", "https://www.kdca.go.kr/bbs/kdca/41/311083/artclView.do", "세계 고혈압의 날을 앞두고 발표한 수칙과 통계 보도자료입니다.", "보도자료"),
        ("질병관리청", "2025년 국민건강영양조사 결과", "https://www.kdca.go.kr/bbs/kdca/42/312791/artclView.do", "고혈압 유병률, 나트륨 섭취량, 비만, 음주, 운동 실천율의 최신 통계입니다.", "통계"),
        ("국민건강보험공단", "건강검진 안내와 결과 조회", "https://www.nhis.or.kr", "검진 대상 확인, 검진기관 찾기, 지난 검진 결과 조회. 고객센터 1577-1000.", "제도"),
        ("건강보험심사평가원", "병원 평가 정보", "https://www.hira.or.kr", "고혈압 등 만성질환 진료에 대한 의료기관 평가 결과를 지역별로 찾아볼 수 있습니다.", "제도"),
        ("보건복지부", "일차의료 만성질환관리", "https://www.mohw.go.kr/board.es?act=view&bid=0027&list_no=1483237&mid=a10503010100", "동네의원에서 고혈압·당뇨병을 등록해 관리받는 제도의 본사업 전환 안내입니다.", "제도"),
        ("식품의약품안전처", "식품영양성분 데이터베이스", "https://various.foodsafetykorea.go.kr/nutrient/", "식품과 음식의 나트륨·칼륨 함량을 검색할 수 있습니다.", "도구"),
        ("식품안전나라", "혈압 조절 관련 건강기능식품 기능성 정보", "https://www.foodsafetykorea.go.kr/portal/healthyfoodlife/functionalityView.do?viewNo=09", "식약처가 기능성을 인정한 원료와 주의사항입니다.", "환자용"),
        ("보건복지부·한국건강증진개발원", "금연길라잡이", "https://www.nosmokeguide.go.kr", "보건소 금연클리닉과 금연 프로그램 안내. 금연상담전화 1544-9030.", "지원"),
        ("국립중앙의료원", "응급의료포털 E-Gen", "https://www.e-gen.or.kr", "지금 문 여는 병·의원과 약국, 가까운 응급실을 찾습니다. 응급 상황은 119.", "도구"),
        ("중앙치매센터", "치매 정보와 치매안심센터", "https://www.nid.or.kr", "치매 선별검사와 지원 제도 안내. 치매상담콜센터 1899-9988.", "지원"),
    ]),
    ("해외 기관", "국제 권고와 영문 자료입니다. 나라마다 기준이 조금씩 다르다는 점을 감안해 읽으세요.", [
        ("세계보건기구(WHO)", "Hypertension 팩트시트", "https://www.who.int/news-room/fact-sheets/detail/hypertension", "전 세계 고혈압 현황과 예방·관리 권고를 요약한 문서입니다.", "영문"),
        ("미국심장협회(AHA)", "High Blood Pressure", "https://www.heart.org/en/health-topics/high-blood-pressure", "환자를 위한 설명 자료와 측정 방법 안내가 잘 정리되어 있습니다.", "영문"),
        ("미국 국립심장폐혈액연구소(NHLBI)", "DASH Eating Plan", "https://www.nhlbi.nih.gov/education/dash-eating-plan", "DASH 식단의 원래 안내서와 식단 예시입니다.", "영문"),
        ("STRIDE BP", "검증된 혈압계 목록", "https://www.stridebp.org", "국제 학회들이 참여해 정확도 검증을 통과한 혈압계를 정리한 목록입니다.", "도구"),
        ("Validate BP", "미국의사협회 검증 혈압계 목록", "https://www.validatebp.org", "임상 정확도 검증을 통과한 혈압계 목록입니다.", "도구"),
        ("세계고혈압연맹(WHL)", "World Hypertension League", "https://www.whleague.org", "매년 5월 17일 세계 고혈압의 날을 주관하는 단체입니다.", "영문"),
    ]),
]


def library_page():
    secs = ""
    n = 0
    for title, lead, items in LIBRARY:
        cards = "".join(f'<div class="lib-item"><span class="org">{org}</span><b><a href="{u}" target="_blank" rel="noopener">{t}</a></b><span class="tag">{tag}</span><p>{d}</p></div>' for org, t, u, d, tag in items)
        n += len(items)
        secs += f'<h2>{title}</h2><p style="color:var(--muted);margin-top:-6px">{lead}</p><div class="lib-grid">{cards}</div>'
    body = page_head("공신력 있는 자료실", f"고혈압에 관해 믿고 볼 수 있는 학회·공공기관·국제기구의 자료 {n}곳을 모았습니다. 바른혈압의 글도 이 자료들을 근거로 씁니다.", [("/", "홈"), ("/info/", "건강정보"), (None, "자료실")], "/library/") + f"""
<section class="section section--tight">
<div class="wrap">
<div class="notice-soft" style="margin-bottom:6px">모든 링크는 해당 기관의 누리집으로 연결되며 새 창에서 열립니다. 바른혈압은 이 기관들과 제휴 관계가 없고, 링크에 대한 대가를 받지 않습니다.</div>
{secs}
</div>
</section>
<section class="section section--sky">
<div class="wrap wrap--narrow">
<h2>자료를 읽을 때 확인할 것</h2>
<ul>
<li><b>언제 만든 자료인가</b> — 기준과 통계는 바뀝니다. 발행 연도를 먼저 봅니다.</li>
<li><b>누구를 위한 자료인가</b> — 의료진을 위한 지침은 그대로 따라 하는 설명서가 아닙니다.</li>
<li><b>어느 나라 기준인가</b> — 미국과 유럽, 한국의 고혈압 기준과 목표는 조금씩 다릅니다. 내 진료는 국내 지침과 주치의의 판단을 따릅니다.</li>
<li><b>내게 해당하는가</b> — 나이, 동반 질환, 먹는 약에 따라 달라집니다. 궁금한 점은 메모해 진료 때 물어보세요.</li>
</ul>
<p>자료의 숫자를 한눈에 보려면 <a href="/stats/">숫자로 보는 고혈압</a>, 최근 발표는 <a href="/news/">고혈압 소식</a>에 정리했습니다. 빠진 자료나 끊긴 링크를 발견하면 <a href="mailto:spaceblank0100@gmail.com">알려 주세요</a>.</p>
</div>
</section>
"""
    ld = {"@context": "https://schema.org", "@type": "CollectionPage", "name": "고혈압 공신력 있는 자료실", "url": SITE + "/library/"}
    return page("공신력 있는 자료실 — 고혈압 학회·공공기관 자료 모음", "대한고혈압학회, 질병관리청, 국민건강보험공단, 식약처, WHO, 미국심장협회 등 고혈압에 관해 믿을 수 있는 기관의 자료와 도구를 모았습니다.",
                "/library/", body, jsonld=ld, keywords=["고혈압 자료", "고혈압 진료지침", "가정혈압 교육자료", "고혈압 공공기관", "검증된 혈압계 목록"])


# ------------------------------------------------------------------ 통계
def bars(rows, cls=""):
    return "".join(f'<div class="bar-row"><span>{label}</span><span class="bar"><i class="{cls}" style="width:{min(100, v)}%"></i></span><span class="v">{v:g}%</span></div>' for label, v in rows)


def stats_page():
    body = page_head("숫자로 보는 고혈압", "우리나라 고혈압의 현재를 가장 최근 통계로 정리했습니다. 대한고혈압학회 팩트시트 2026과 질병관리청 2025년 국민건강영양조사가 근거입니다.", [("/", "홈"), ("/info/", "건강정보"), (None, "숫자로 보는 고혈압")], "/stats/") + f"""
<section class="section section--tight">
<div class="wrap">
<div class="stat-grid">
<div class="stat"><b>1,361<small>만 명</small></b><span>20세 이상 고혈압 유병자 추정 (2024년)</span></div>
<div class="stat"><b>30.9<small>%</small></b><span>20세 이상 성인의 유병률. 세 명 중 한 명</span></div>
<div class="stat"><b>56.1<small>%</small></b><span>혈압이 140/90 미만으로 조절되는 사람의 비율</span></div>
<div class="stat"><b>3,043<small>mg</small></b><span>하루 나트륨 섭취량 (2025년). WHO 권고는 2,000mg 미만</span></div>
</div>

<h2 style="margin-top:44px">고혈압이 있는 사람 100명 가운데</h2>
<p style="color:var(--muted);max-width:720px">알고, 치료받고, 조절되는 사람이 얼마나 되는지를 보여 주는 세 지표입니다. (팩트시트 2026, 2024년 자료)</p>
<div class="card" style="max-width:820px">
{bars([("자신이 고혈압인 것을 안다 (인지율)", 75.2), ("약을 먹고 있다 (치료율)", 72.0), ("혈압이 조절된다 (조절률)", 56.1)])}
{bars([("치료받는 사람 가운데 조절되는 비율", 77)], "t")}
<p class="fine" style="margin:12px 0 0">약을 먹는 사람은 네 명 중 세 명 이상이 목표에 닿습니다. 조절되지 않는 사람의 상당수는 자신의 상태를 모르거나 치료를 시작하지 않은 경우입니다.</p>
</div>

<div class="grid grid--2" style="margin-top:28px">
<div class="card">
<h3>병·의원 이용 (2024년)</h3>
{table(["구분", "인원"], [["고혈압으로 진료를 받은 사람", "1,225만 명"], ["혈압약을 처방받은 사람", "1,156만 명"], ["꾸준히 치료를 이어 간 사람", "863만 명"]])}
<p class="fine" style="margin:0">처방받은 사람 가운데 약 290만 명은 꾸준한 치료로 이어지지 못했습니다. <a href="/info/taking-meds.html">약을 빠뜨리지 않는 방법</a></p>
</div>
<div class="card">
<h3>몇 가지 약을 쓰나</h3>
{bars([("한 가지", 40.0), ("두 가지", 43.8), ("세 가지 이상", 16.2)], "a")}
<p class="fine" style="margin:12px 0 0">열 명 중 여섯 명이 두 가지 이상을 씁니다. <a href="/info/combination-pills.html">병합요법과 복합제</a></p>
</div>
<div class="card">
<h3>많이 쓰는 약의 계열</h3>
{bars([("ARB", 77.7), ("칼슘차단제", 62.1), ("이뇨제", 21.0), ("베타차단제", 14.8)])}
<p class="fine" style="margin:12px 0 0">여러 약을 함께 쓰는 사람이 있어 합이 100%를 넘습니다. <a href="/info/medications.html">혈압약 종류와 부작용</a></p>
</div>
<div class="card">
<h3>함께 치료받는 질환</h3>
{bars([("이상지질혈증", 42.6), ("당뇨병 + 이상지질혈증", 25.4), ("당뇨병", 4.4), ("고혈압만", 27.6)], "t")}
<p class="fine" style="margin:12px 0 0">치료자의 72.4%가 다른 만성질환 치료를 함께 받습니다. <a href="/info/diabetes-lipids.html">함께 있을 때 달라지는 것</a></p>
</div>
</div>

<h2 style="margin-top:44px">고위험군은 절반만 목표에 닿았습니다</h2>
<p style="color:var(--muted);max-width:720px">심뇌혈관질환, 당뇨병, 만성콩팥병이 있으면 130/80 미만의 더 낮은 목표가 권장됩니다. 이 목표를 달성한 사람의 비율입니다.</p>
<div class="card" style="max-width:820px">
{bars([("당뇨병이 있는 사람", 52), ("만성콩팥병이 있는 사람", 50), ("심뇌혈관질환이 있는 사람", 49), ("심뇌혈관 고위험군 (고혈압·전단계)", 26.6)], "a")}
<p class="fine" style="margin:12px 0 0">학회는 고위험 환자일수록 더 적극적인 혈압 조절이 필요하다고 강조했습니다. 내 목표 혈압이 얼마인지 진료 때 물어보세요. <a href="/info/targets.html">목표 혈압 기준</a></p>
</div>

<h2 style="margin-top:44px">생활습관 지표 (2025년 국민건강영양조사, 19세 이상)</h2>
<div class="grid grid--2">
<div class="card">
<h3>고혈압 유병률</h3>
{bars([("남자", 28.2), ("여자", 17.8)])}
<p class="fine" style="margin:12px 0 0">남자는 전년보다 1.9%p, 여자는 0.1%p 올랐습니다.</p>
</div>
<div class="card">
<h3>비만 유병률</h3>
{bars([("남자", 49.1), ("여자", 28.7)], "a")}
<p class="fine" style="margin:12px 0 0">30~50대 남자는 절반 이상이 비만입니다. <a href="/info/weight.html">체중과 혈압</a></p>
</div>
<div class="card">
<h3>신체활동</h3>
{bars([("유산소 신체활동 실천", 49.5), ("걷기 실천", 41.7), ("근력운동 실천", 26.4)], "t")}
<p class="fine" style="margin:12px 0 0">유산소 신체활동 실천율은 전년보다 낮아졌습니다. <a href="/info/exercise.html">고혈압 운동</a></p>
</div>
<div class="card">
<h3>음주와 흡연</h3>
{bars([("월간 폭음", 35.1), ("고위험 음주", 12.6), ("남자 일반담배 흡연", 28.0), ("여자 일반담배 흡연", 5.5)], "a")}
<p class="fine" style="margin:12px 0 0"><a href="/info/alcohol.html">술과 혈압</a> · <a href="/info/smoking.html">담배와 혈압</a></p>
</div>
</div>
<div class="card card--sky" style="margin-top:20px;max-width:820px">
<h3>나트륨 — 여전히 권고량의 1.5배</h3>
<p style="margin:0">2025년 하루 나트륨 섭취량은 3,043mg으로 전년보다 32mg 줄어 큰 변화가 없었습니다. 30대 이상 남자의 80% 이상이 만성질환 위험을 줄이기 위한 섭취 기준보다 많이 먹고 있습니다. <a href="/info/sodium.html">나트륨 줄이는 법</a> · <a href="/tools/sodium/">나트륨 계산기</a></p>
</div>

<h2 style="margin-top:44px">이 숫자가 말해 주는 것</h2>
<ul style="max-width:760px">
<li><b>아는 것이 시작입니다.</b> 고혈압이 있는 사람 넷 가운데 한 명은 자신의 상태를 모릅니다. 증상이 없기 때문입니다.</li>
<li><b>치료하면 대부분 조절됩니다.</b> 약을 먹는 사람의 77%가 목표에 닿습니다.</li>
<li><b>꾸준함이 어렵습니다.</b> 약을 처방받은 사람과 꾸준히 치료를 이어 간 사람 사이에 약 290만 명의 차이가 있습니다.</li>
<li><b>위험이 큰 사람일수록 목표가 더 낮습니다.</b> 그리고 그 목표에 닿은 사람은 절반입니다.</li>
</ul>
<p class="fine" style="max-width:760px">두 자료는 대상 연령과 계산 방식이 달라 숫자를 서로 그대로 비교할 수 없습니다. 팩트시트는 20세 이상을 대상으로 국민건강영양조사와 건강보험 자료를 함께 분석한 것이고, 국민건강영양조사 발표 수치는 19세 이상 기준입니다. 해마다 기준이 달라질 수 있어 연도 간 비교도 원자료의 설명을 확인해야 합니다.</p>
<h2>출처</h2>
{sources([FACT2026, KNHANES2025, KDCA6])}
<p class="fine">최종 정리 {NEW_DATE}. 새 통계가 발표되면 이 페이지를 고치고 <a href="/policy/corrections.html">정정 이력</a>에 남깁니다.</p>
</div>
</section>
{cta_band("내 숫자부터 확인해 보세요", "통계 속 한 사람이 아니라 내 혈압을 아는 것이 먼저입니다. 7일만 재 보세요.", "/check7/", "7일 혈압 기록 시작")}
"""
    ld = {"@context": "https://schema.org", "@type": ["Article", "MedicalWebPage"], "headline": "숫자로 보는 고혈압 — 유병률, 인지율, 치료율, 조절률", "dateModified": NEW_DATE, "datePublished": NEW_DATE,
          "author": {"@type": "Organization", "name": "바른혈압 편집팀", "url": SITE + "/about/"}, "mainEntityOfPage": SITE + "/stats/",
          "image": [SITE + "/assets/og/stats.png"], "inLanguage": "ko",
          "publisher": {"@type": "Organization", "name": BRAND, "url": SITE, "logo": {"@type": "ImageObject", "url": SITE + "/assets/img/logo@2x.png"}}}
    return page("숫자로 보는 고혈압 — 유병률·인지율·치료율·조절률 최신 통계", "고혈압 환자 1,361만 명, 조절률 56.1%, 하루 나트륨 3,043mg. 대한고혈압학회 팩트시트 2026과 2025년 국민건강영양조사로 본 우리나라 고혈압 통계.",
                "/stats/", body, jsonld=ld, og_type="article", keywords=["고혈압 통계", "고혈압 환자 수", "고혈압 유병률", "고혈압 조절률", "고혈압 팩트시트 2026", "나트륨 섭취량 통계"])


# ------------------------------------------------------------------ 소식
NEWS = [
    ("2026-11-05", "고혈압 팩트시트 2026 발표 — 환자 1,361만 명, 조절률 56%",
     "대한고혈압학회가 2024년 자료를 분석한 팩트시트를 발표했습니다. 20세 이상 성인의 31%가 고혈압이고, 인지율 75%, 치료율 72%, 조절률 56%입니다. 올해는 고위험군 분석이 추가되어, 심뇌혈관질환·당뇨병·만성콩팥병 환자 가운데 130/80 미만 목표를 달성한 사람이 절반가량이라는 점이 확인됐습니다.",
     FACT2026, [("/stats/", "숫자로 보는 고혈압"), ("/info/targets.html", "목표 혈압 기준")]),
    ("2026-09-30", "2025년 국민건강영양조사 — 남자 고혈압 유병률 28.2%, 나트륨 3,043mg",
     "질병관리청 발표에 따르면 19세 이상 고혈압 유병률은 남자 28.2%, 여자 17.8%로 전년보다 올랐습니다. 남자 비만 유병률은 49.1%, 하루 나트륨 섭취량은 3,043mg으로 큰 변화가 없었고, 유산소 신체활동 실천율은 49.5%로 낮아졌습니다.",
     KNHANES2025, [("/info/sodium.html", "나트륨 줄이는 법"), ("/info/weight.html", "체중과 혈압")]),
    ("2026-05-15", "질병관리청, 고혈압 예방관리 6대 수칙 발표",
     "세계 고혈압의 날(5월 17일)을 앞두고 체중 관리, 신체활동, 나트륨 줄이기, 균형 잡힌 식단, 좋은 생활습관, 정기 검진과 목표 혈압 관리의 여섯 수칙을 내놓았습니다. 올해 세계 고혈압의 날 메시지는 ‘함께 고혈압을 관리합시다’였고, 5~7월에는 대한고혈압학회와 함께 혈압 측정 캠페인(K-MMM26)이 진행됐습니다.",
     KDCA6, [("/info/kdca-six-rules.html", "6대 수칙 풀이"), ("/community/challenges/", "혈압 관리 챌린지")]),
    ("2025-10-29", "세계 뇌졸중의 날 — 조기 신호는 ‘이웃손발시선’",
     "대한뇌졸중학회는 얼굴 처짐, 팔다리 힘 빠짐, 어눌한 말, 한쪽으로 쏠린 시선이 나타나면 즉시 119에 연락하도록 알렸습니다. 뇌경색 주사 치료는 증상 발생 후 4.5시간 안에 시작해야 하지만, 3시간 안에 병원에 도착하는 환자는 30%가 되지 않습니다.",
     '대한뇌졸중학회 — 보도: <a href="https://medicaltimes.com/Mobile/News/NewsView.html?ID=1165820" target="_blank" rel="noopener">메디칼타임즈(2025.10.29)</a>', [("/info/stroke-signs.html", "뇌졸중 조기 신호")]),
    ("2025-09-30", "2024년 국민건강영양조사 — 만성질환 유병률은 늘고 치료율은 개선",
     "질병관리청은 2024년 조사에서 고혈압 등 만성질환 유병률이 늘었지만 인지율·치료율·조절률은 이전보다 좋아졌다고 발표했습니다. 2024년 하루 나트륨 섭취량은 3,075mg이었습니다.",
     '질병관리청 「2024년 국민건강영양조사 결과 발표」 — 보도: <a href="https://medigatenews.com/news/47938752" target="_blank" rel="noopener">메디게이트뉴스</a> / 나트륨 섭취량: <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC13228915/" target="_blank" rel="noopener">주간 건강과 질병(2026)</a>', [("/food/hidden-sodium.html", "숨은 나트륨")]),
    ("2025-08", "미국심장협회·미국심장학회, 새 고혈압 지침 발표",
     "미국의 2025년 지침은 모든 환자가 검증된 기기로 가정혈압을 재도록 권하고, 새로 진단받은 환자에게 소변 알부민 검사를 권고했습니다. 가정에서 칼륨이 든 대체 소금을 쓰는 방법과, 혈압 조절이 인지기능 저하 위험을 줄일 수 있다는 내용도 담겼습니다. 미국 기준은 국내 지침과 다르므로 참고 자료로 읽어야 합니다.",
     '미국심장협회·미국심장학회 — 해설: <a href="https://www.ama-assn.org/delivering-care/new-bp-guideline-5-things-physicians-should-know" target="_blank" rel="noopener">미국의사협회(AMA)</a>', [("/food/salt-substitutes.html", "저나트륨 소금"), ("/info/dementia.html", "혈압과 치매")]),
]


def news_page():
    def links(ls):
        return " · ".join(f'<a href="{h}">{t}</a>' for h, t in ls)
    items = "".join(f'<li><time datetime="{d}">{d.replace("-", ".")}</time><b>{t}</b><p>{b}</p><div class="src">출처: {src}<br>관련 글: {links(ls)}</div></li>' for d, t, b, src, ls in NEWS)
    body = page_head("고혈압 소식", "고혈압에 관한 주요 발표와 통계, 지침 변화를 날짜순으로 정리합니다. 기사 제목이 아니라 원자료에서 확인한 내용만 싣습니다.", [("/", "홈"), ("/info/", "건강정보"), (None, "고혈압 소식")], "/news/") + f"""
<section class="section section--tight">
<div class="wrap wrap--narrow">
<ul class="news-list">{items}</ul>
<div class="card card--sky" style="margin-top:24px">
<h3>소식을 받아 보려면</h3>
<p style="margin:0 0 12px">새로운 발표와 그 의미를 주간 혈압 레터로 보내 드립니다. 자유게시판에서 회원들과 이야기를 나눌 수도 있습니다.</p>
<div style="display:flex;gap:8px;flex-wrap:wrap"><a class="btn btn--primary btn--sm" href="/community/#letter">주간 레터 신청</a><a class="btn btn--secondary btn--sm" href="/community/board/">자유게시판</a><a class="btn btn--secondary btn--sm" href="/rss.xml">RSS 구독</a></div>
</div>
<p class="fine" style="margin-top:18px">확인이 필요한 소식이나 놓친 발표가 있다면 <a href="/factcheck/#report">알려 주세요</a>. 최종 정리 {NEW_DATE}.</p>
</div>
</section>
"""
    ld = {"@context": "https://schema.org", "@type": "CollectionPage", "name": "고혈압 소식", "url": SITE + "/news/"}
    return page("고혈압 소식 — 주요 발표·통계·지침 변화", "고혈압 팩트시트 2026, 2025년 국민건강영양조사, 질병관리청 6대 수칙, 미국 2025년 고혈압 지침 등 고혈압 관련 주요 발표를 원자료 기준으로 정리합니다.",
                "/news/", body, jsonld=ld, keywords=["고혈압 뉴스", "고혈압 최신 소식", "고혈압 팩트시트", "고혈압 지침 개정", "세계 고혈압의 날"])
