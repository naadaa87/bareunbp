# -*- coding: utf-8 -*-
"""바른혈압몰 — 쿠팡 파트너스 제휴 상품

상품 링크는 쿠팡 파트너스(partners.coupang.com)의 '링크 생성'으로 만든 단축 주소다.
이미지는 쿠팡 파트너스가 링크와 함께 제공하는 상품 이미지 주소를 그대로 쓴다.
가격·배송 조건은 수시로 바뀌므로 표시하지 않는다.

선정 기준 (페이지에도 공개)
- 바른혈압 글에서 다룬 생활 관리(기록·복약, 허리둘레·걷기, 덜 짜게 요리, 집 운동)와 바로 이어지는 물건
- 쿠팡 구매 후기가 충분히 쌓인 제품 위주
- 효능을 내세우는 제품, 의료기기(혈압계 등), 건강기능식품·영양제는 넣지 않는다
- 순위가 아니다. 같은 분류 안의 순서는 의미가 없다
"""
from base import *  # noqa

DISCLOSURE = "이 페이지는 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다."


def _img(host, path):
    return f"https://{host}/thumbnails/remote/492x492ex/image/{path}"


CATS = [
    ("record", "기록·복약 관리", "매일 같은 시간에 재고 적는 습관, 약을 빠뜨리지 않는 습관을 돕는 물건입니다.",
     [("/check7/", "7일 혈압 기록"), ("/tools/log-sheet/", "인쇄용 혈압 기록지(무료)"), ("/tools/meds/", "복약 체크"), ("/info/taking-meds.html", "혈압약 복용 시간과 잊었을 때"), ("/family/", "가족과 함께 관리")],
     "기록지는 바른혈압에서 무료로 인쇄할 수 있습니다. 수첩이 편한 분, 부모님께 드릴 분을 위해 골랐습니다."),
    ("body", "허리둘레·걷기", "체중과 허리둘레, 걸음 수처럼 혈압과 함께 적어 두면 좋은 숫자를 재는 물건입니다.",
     [("/info/weight.html", "체중과 혈압"), ("/info/exercise.html", "고혈압 운동"), ("/info/lifestyle-effects.html", "생활습관별 혈압 효과")],
     "허리둘레는 숨을 편하게 내쉰 상태에서 갈비뼈 아래와 골반 위 사이 가운데를 잽니다."),
    ("kitchen", "덜 짜게 요리하기", "간을 눈대중 대신 숫자로 맞추는 도구와, 염도를 낮춘 간장입니다.",
     [("/info/sodium.html", "나트륨 줄이는 법"), ("/food/winter-soup-sodium.html", "찌개 나트륨"), ("/food/nutrition-label.html", "영양성분표 읽는 법"), ("/tools/sodium/", "나트륨 계산기")],
     "염도를 낮춘 간장도 나트륨이 들어 있습니다. 넣는 양을 계량하는 것이 먼저입니다. 칼륨으로 소금을 대신한 ‘저나트륨 소금’은 콩팥 질환이 있거나 일부 혈압약을 먹는 분에게 맞지 않을 수 있어 넣지 않았습니다."),
    ("exercise", "집에서 하는 운동", "춥거나 미세먼지가 심한 날에도 집에서 이어 갈 수 있는 근력·유산소 운동 도구입니다.",
     [("/info/exercise.html", "고혈압 운동"), ("/info/strength-training.html", "근력운동과 혈압"), ("/info/older-adults.html", "어르신 혈압 관리")],
     "근력운동을 할 때는 숨을 참지 말고 천천히 움직이세요. 혈압이 조절되지 않거나 심장 질환이 있다면 운동 강도를 먼저 의료진과 상의하고, 운동 중 가슴 통증·심한 숨참·어지럼이 있으면 바로 멈추세요."),
]

# (쿠팡 상품번호, 분류, 표시 이름, 쿠팡 상품명, 파트너스 링크, 이미지, 설명)
PRODUCTS = [
    ("8078775018", "record", "큰글씨 혈압·혈당 건강일지", "큰글씨 당뇨수첩 혈압 혈당 건강일지, 1권, 청색", "https://link.coupang.com/a/iMmXFRRBW8",
     _img("thumbnail8.coupangcdn.com", "vendor_inventory/dad2/6377279b05e8dfa9e252ae7843412aaf53af87df8f663c7535660ed80340.JPG"),
     "날짜별로 혈압과 혈당을 손으로 적는 수첩입니다. 글씨가 커서 어르신이 직접 쓰기 편합니다."),
    ("8115849649", "record", "A5 건강 일지", "인디고 기본 A5 건강 일지, 그린, 1개", "https://link.coupang.com/a/iMmXMGeJu8",
     _img("t2c.coupangcdn.com", "vendor_inventory/cfe3/7c27bfc409979d5cea22f006071f3706c9c1776a6ebaf217aa103fa5d106.jpg"),
     "혈압과 함께 체중·복약·메모를 한 권에 적고 싶을 때. 진료 때 들고 가기 좋은 크기입니다."),
    ("7054527545", "record", "원터치 7일 알약 케이스", "생기당 원터치 7일 알약케이스 일주일 알약통 1+1특가, 1세트", "https://link.coupang.com/a/iMmXR4Pp8K",
     _img("thumbnail3.coupangcdn.com", "vendor_inventory/1df6/cd399346469b99d645bc7fb9f16036f4f5df55c2d62681f80820d353f9ba.jpg"),
     "요일별 칸을 한 손으로 여닫는 약통입니다. 하루 한 번 먹는 약을 일주일 단위로 정리하기 쉽습니다."),
    ("7427988697", "record", "요일별 휴대용 약통", "조빈니타 프리미엄 요일별 휴대용 약통, 블랙, 1개", "https://link.coupang.com/a/iMmXYymxoG",
     _img("thumbnail2.coupangcdn.com", "vendor_inventory/ffb5/a611f42c354b7fa10d86258c29c5a033e4ddab17d66b90b5bea7dcb38ba6.png"),
     "요일별로 나뉜 휴대용 약통입니다. 출근이나 여행 때 약을 챙겨 다니기 좋습니다."),
    ("7667582073", "record", "주간 약 달력", "티스메아 주간 약 달력, 1개, 베이지", "https://link.coupang.com/a/iMmYqgmcou",
     _img("thumbnail13.coupangcdn.com", "vendor_inventory/9866/71d60d9d7fae6b83a8987dd009c8f1a23bcb543acbd8222a22b56a0fe830.png"),
     "요일별 주머니에 약을 넣어 두는 약 달력입니다. 먹었는지 한눈에 보여 가족이 함께 확인하기 좋습니다."),
    ("207097404", "record", "주간 약 달력 ‘엄마 약 드셨어요’", "오시리약달력 주간 일반형, 그린/엄마 약 드셨어요", "https://link.coupang.com/a/iMmYwym268",
     _img("thumbnail8.coupangcdn.com", "vendor_inventory/1ed1/8b1b955b6ae3a9f9918d5d07f2e9a065c6f9040f810b4f03000f5b85f845.jpg"),
     "부모님 댁에 두는 주간 약 달력입니다. 떨어져 사는 자녀가 전화로 ‘오늘 칸 비었어요?’ 하고 확인하기 쉽습니다."),

    ("6542689085", "body", "원터치 줄자", "아케이 리빙 원터치 줄자, 1개", "https://link.coupang.com/a/iMmYCq0jsH",
     _img("t5c.coupangcdn.com", "retail/images/2022/12/13/10/6/d06d19f7-ccc1-4ace-a831-7859dfeaf798.jpg"),
     "버튼을 누르면 감기는 줄자입니다. 허리둘레를 재고 체중과 함께 한 달에 한 번 적어 두세요."),
    ("8939086773", "body", "부드러운 줄자 1.5m", "생활양식 마카롱 줄자 1.5m, 라벤더, 1개", "https://link.coupang.com/a/iMmYIm37x6",
     _img("thumbnail3.coupangcdn.com", "retail/images/186127437766819-c769099a-0635-4fe8-ad3f-7633d0bae10b.png"),
     "부드러운 재질이라 몸에 감기 쉬운 줄자입니다. 팔 둘레를 재서 혈압계 커프 크기를 고를 때도 씁니다."),
    ("7654594024", "body", "디지털 클립 만보기", "하네르 디지털 클립 만보기, 1개, 노블화이트", "https://link.coupang.com/a/iMmYPr9tL2",
     _img("thumbnail1.coupangcdn.com", "vendor_inventory/0b55/2a8a540bf2bc48dd57ff9dfac6cc75030faea2652f7868d6ddde89be5097.jpg"),
     "허리띠나 주머니에 끼우는 만보기입니다. 휴대폰 없이 걸음 수만 간단히 보고 싶을 때 씁니다."),

    ("4348906144", "kitchen", "디지털 염도계", "스타베이커리 디지털 염도계, 혼합색상, 1개", "https://link.coupang.com/a/iMmYVZ1z3I",
     _img("thumbnail3.coupangcdn.com", "retail/images/1218657464147401-6db88add-1e13-41d8-8ec0-9651b1d4e16e.jpg"),
     "국·찌개 국물에 담가 염도를 숫자로 봅니다. 기계마다 오차가 있으니 ‘지난번보다 낮게’를 확인하는 용도로 쓰세요."),
    ("7368809850", "kitchen", "식품용 디지털 염도측정기", "수라칸 식품용 디지털 염도측정기 SM01, 혼합색상, 1개", "https://link.coupang.com/a/iMmY16GtzM",
     _img("thumbnail13.coupangcdn.com", "retail/images/1605658545931153-883c28f7-2175-49b5-aaba-b2b818ae86ce.jpg"),
     "자주 끓이는 찌개나 국의 염도를 기록해 두면, 간을 조금씩 줄여 가는 과정이 눈에 보입니다."),
    ("6848571044", "kitchen", "양면 계량 스푼", "칼딘 양면 스테인리스 계량 스푼, 2개", "https://link.coupang.com/a/iMmY7R5J3A",
     _img("thumbnail9.coupangcdn.com", "retail/images/2025/06/10/13/5/1c194cbd-44de-4b18-882b-7ba3b5c9a379.jpg"),
     "양쪽 크기가 다른 계량 스푼입니다. 간장·된장을 숟가락으로 대충 넣던 습관을 계량하는 습관으로 바꿔 줍니다."),
    ("5387722235", "kitchen", "스텐 계량 스푼 4종", "이홈베이킹 스텐 계량 스푼 4종 세트, 1개", "https://link.coupang.com/a/iMmZdV9XGu",
     _img("thumbnail6.coupangcdn.com", "vendor_inventory/1e9e/c4f642e3539dc313f806b2f63abedc086d456b6f221a232893282aaa93a6.jpg"),
     "작은 단위까지 나뉜 계량 스푼 세트입니다. 바른혈압 저염 레시피의 양념 양을 그대로 따라 하기 좋습니다."),
    ("19167582", "kitchen", "염도 낮춘 다시마 간장", "햇살담은 염도낮춘 발효 다시마 간장, 840ml, 1개", "https://link.coupang.com/a/iMmZHrlnAO",
     _img("t3a.coupangcdn.com", "retail/images/989090699863774-ea1212b4-0efb-4b52-a688-882691dde2ad.jpg"),
     "일반 간장보다 염도를 낮춘 제품입니다. 나트륨이 없는 것은 아니니 계량해서 쓰고, 영양성분표로 비교해 보세요."),
    ("6159377257", "kitchen", "염도 낮은 양조간장", "샘표 맛있게 염도낮은 양조간장, 500ml, 1개", "https://link.coupang.com/a/iMmZOqlGzk",
     _img("t1a.coupangcdn.com", "retail/images/4400021213854-6d292b13-1eca-4606-abc8-2ebca64fdf0d.jpg"),
     "염도를 낮춘 양조간장입니다. 바꾸는 것만으로 끝나지 않도록, 넣는 양도 평소의 절반부터 시작해 보세요."),

    ("172134026", "exercise", "NBR 요가매트 10mm", "코멧 NBR 10mm 요가매트, 네이비, 1개", "https://link.coupang.com/a/iMmZZXEQlU",
     _img("thumbnail2.coupangcdn.com", "retail/images/1347256611565016-c346523f-f6a8-43b3-9810-f690524d1a26.jpg"),
     "스트레칭과 맨몸 근력운동을 할 때 바닥에 까는 매트입니다. 무릎과 허리가 덜 배깁니다."),
    ("194679479", "exercise", "논슬립 아령 2kg 2개", "코멧 클래식 논슬립 아령 2kg, 2개, 그린", "https://link.coupang.com/a/iMmZ6Ouqse",
     _img("t3a.coupangcdn.com", "retail/images/10504987182189-81f753d2-878f-4fcd-ba5b-64b08eb6c6b4.jpg"),
     "가벼운 무게부터 시작하는 근력운동용 아령입니다. 숨을 참지 말고 천천히 들어 올리세요."),
    ("8508788760", "exercise", "탄성 밴드 2m", "세라밴드 탄성저항 밴드 2M, 레드, 1개", "https://link.coupang.com/a/iMm0dtKhQi",
     _img("thumbnail3.coupangcdn.com", "retail/images/81183687501002-a7bbe5c1-9bdb-4eef-a05b-d1803b139aa9.jpg"),
     "당기는 힘으로 운동하는 고무 밴드입니다. 의자에 앉아서도 할 수 있어 어르신 운동에도 많이 씁니다."),
    ("306146810", "exercise", "루프밴드 5종 세트", "코멧 스포츠 라텍스 루프밴드 5종 세트, 1개", "https://link.coupang.com/a/iMm0jIDx8e",
     _img("thumbnail3.coupangcdn.com", "1025_amir_coupang_oct_80k/dab6/82e7338098ca3d70e839d4a08b53ebb0ef756d1bd2be85e07ba6724bdea1.jpg"),
     "강도가 다른 고리형 밴드 다섯 개입니다. 약한 것부터 시작해 익숙해지면 한 단계씩 올립니다."),
    ("7144403308", "exercise", "악력기 13~45kg", "GD 그립 프로 악력기 13-45kg, 랜덤 발송, 1개", "https://link.coupang.com/a/iMm0prHr8m",
     _img("thumbnail3.coupangcdn.com", "1025_amir_coupang_oct_80k/74cc/8bd8ded4e704ffe5b6e2bd74be926bc745aabf9d9d5df2e4a606ff9fd31c.jpg"),
     "쥐는 힘을 조절할 수 있는 악력기입니다. 손을 쥘 때도 숨을 참지 않고 일정하게 쉬는 것이 중요합니다."),
    ("1079386660", "exercise", "실내 스텝퍼", "이고진 스텝퍼 8320, 블랙핑크", "https://link.coupang.com/a/iMm0waXNlc",
     _img("thumbnail14.coupangcdn.com", "retail/images/184702374734658-d50a1a27-c172-4bac-8683-85c2473bb040.jpg"),
     "날씨가 춥거나 미세먼지가 심한 날, 실내에서 걷기 대신 하는 유산소 운동 기구입니다."),
]

CAT_NAME = {k: n for k, n, *_ in CATS}

# 글 끝 '관련 제품' 상자 — 글 주소(확장자 없는 경로) → 분류
RELATED = {
    "/info/taking-meds": "record", "/info/combination-pills": "record", "/info/medications": "record", "/info/older-adults": "record",
    "/info/home-measurement": "record", "/info/morning-bp": "record", "/info/bp-variability": "record", "/info/white-coat-masked": "record",
    "/info/weight": "body", "/info/lifestyle-effects": "body", "/info/diabetes-lipids": "body",
    "/info/sodium": "kitchen", "/food/salt-substitutes": "kitchen", "/food/hidden-sodium": "kitchen", "/food/nutrition-label": "kitchen",
    "/food/sodium-table": "kitchen", "/food/eating-out": "kitchen", "/food/dash": "kitchen", "/food/winter-soup-sodium": "kitchen",
    "/info/exercise": "exercise", "/info/strength-training": "exercise", "/info/seasons": "exercise",
    "/info/travel": "record", "/info/holidays": "kitchen", "/food/meal-plan": "kitchen",
}
# 제목·키워드가 맞아도 상자를 붙이지 않을 글(기존 글 중 물건 안내가 맞지 않는 것)
RELATED_NONE = {"/info/low-bp", "/info/summer", "/info/kidney", "/info/children", "/food/potassium"}
BOX_TEXT = {
    "record": ("기록과 복약을 돕는 물건", "혈압 수첩, 요일별 약통, 약 달력"),
    "body": ("허리둘레·걸음 수를 재는 물건", "줄자, 만보기"),
    "kitchen": ("덜 짜게 요리하는 도구", "염도계, 계량 스푼, 염도 낮춘 간장"),
    "exercise": ("집에서 하는 운동 도구", "요가매트, 가벼운 아령, 탄성 밴드, 스텝퍼"),
}


# 매일 발행 글처럼 RELATED에 없는 글은 제목·키워드로 분류를 고른다(위에서부터 먼저 맞는 것)
KEYWORD_RULES = [
    ("kitchen", ("나트륨", "소금", "짜게", "저염", "염분", "국물", "찌개", "간장", "젓갈", "김치")),
    ("exercise", ("운동", "걷기", "근력", "스트레칭", "유산소", "계단")),
    ("body", ("체중", "허리둘레", "뱃살", "비만", "살 빼", "다이어트")),
    ("record", ("혈압약", "복약", "약 먹", "기록", "가정혈압", "혈압 측정", "재는 법", "아침 혈압")),
]
# 상자를 붙이지 않을 글 — 응급·증상 글처럼 물건 안내가 어울리지 않는 주제
NO_BOX_WORDS = ("응급", "119", "뇌졸중 증상", "흉통", "임신")


def _cat_from_hint(hint):
    if not hint or any(w in hint for w in NO_BOX_WORDS):
        return None
    for cat, words in KEYWORD_RULES:
        if any(w in hint for w in words):
            return cat
    return None


def related_box(path, hint=""):
    """글 끝에 붙는 작은 안내 상자. 쿠팡 링크가 아니라 바른혈압몰의 해당 분류로 연결한다."""
    p = path.replace(".html", "").rstrip("/")
    cat = RELATED.get(p) or (None if p in RELATED_NONE else _cat_from_hint(hint))
    if not cat:
        return ""
    t, items = BOX_TEXT[cat]
    return (f'<aside class="mall-box no-print" aria-label="제휴 영역"><span class="mall-box__tag">제휴 · 쿠팡 파트너스</span>'
            f'<div><b>바른혈압몰 — {t}</b><span>{items}. 글과 함께 쓰기 좋은 물건을 따로 모아 두었습니다.</span></div>'
            f'<a class="btn btn--ghost btn--sm" href="/mall/#{cat}" data-mall-box="{cat}">보러 가기</a></aside>')


def card(pid, name, url, img, note):
    return (f'<li class="mall-card" data-pid="{pid}"><a class="mall-card__img" href="{url}" target="_blank" rel="sponsored nofollow noopener" data-mall="{pid}" tabindex="-1" aria-hidden="true">'
            f'<img src="{img}" alt="{name}" loading="lazy" width="246" height="246" referrerpolicy="no-referrer"></a>'
            f'<div class="mall-card__body"><b>{name}</b><p>{note}</p>'
            f'<a class="btn btn--primary btn--sm mall-card__go" href="{url}" target="_blank" rel="sponsored nofollow noopener" data-mall="{pid}">쿠팡에서 보기</a></div></li>')


def mall_page():
    chips = "".join(f'<a class="chip" href="#{k}">{n}</a>' for k, n, *_ in CATS)
    secs = ""
    for k, n, desc, links, note in CATS:
        cards = "".join(card(pid, name, url, img, nt) for pid, c, name, _t, url, img, nt in PRODUCTS if c == k)
        rel = " · ".join(f'<a href="{h}">{t}</a>' for h, t in links)
        secs += f"""<div class="mall-sec" id="{k}">
<div class="mall-sec__head"><h2>{n}</h2><p>{desc}</p><p class="mall-sec__links">함께 읽기: {rel}</p></div>
<ul class="mall-grid" data-cat="{k}">{cards}</ul>
<p class="mall-note">{note}</p>
</div>"""
    n_items = len(PRODUCTS)
    body = page_head("바른혈압몰", f"바른혈압 글에서 다룬 생활 관리에 바로 쓰는 물건 {n_items}가지를 모았습니다. 기록·복약, 허리둘레·걷기, 덜 짜게 요리하기, 집에서 하는 운동으로 나눴습니다.", [("/", "홈"), (None, "바른혈압몰")], "/mall/") + f"""
<section class="section section--tight">
<div class="wrap">
<div class="mall-disclosure"><b>제휴 안내</b> {DISCLOSURE} 링크를 통해 구매해도 가격은 같고, 주문·배송·교환·환불은 쿠팡에서 처리합니다. 가격과 배송 조건은 쿠팡 상품 페이지에서 확인하세요.</div>
<div class="chips" aria-label="분류">{chips}</div>
{secs}
<div id="mall-more"></div>
<div class="grid grid--2 mall-why">
<div class="card"><h3>이렇게 골랐습니다</h3><ul>
<li>바른혈압 글에서 다룬 생활 관리와 바로 이어지는 물건만 골랐습니다.</li>
<li>쿠팡 구매 후기가 충분히 쌓인 제품을 위주로 담았습니다.</li>
<li>순위가 아닙니다. 같은 분류 안의 순서에는 의미가 없습니다.</li>
<li>수수료율에 따라 고르거나 순서를 바꾸지 않습니다. 건강정보 글의 내용도 제휴와 상관없이 씁니다.</li>
</ul></div>
<div class="card"><h3>여기에 없는 것</h3><ul>
<li><b>혈압계</b> — 의료기기라 판매 링크를 두지 않습니다. 고르는 기준과 식약처 허가 확인 방법은 <a href="/devices/">혈압계 가이드</a>에 정리했습니다.</li>
<li><b>건강기능식품·영양제</b> — 효과를 내세우는 광고가 많고, 혈압약과 함께 먹을 때 확인이 필요한 경우가 있어 다루지 않습니다. <a href="/food/supplements.html">영양제 이야기</a></li>
<li><b>칼륨 대체 소금</b> — 콩팥 질환이 있거나 일부 혈압약을 먹는 분에게 맞지 않을 수 있습니다. <a href="/food/salt-substitutes.html">저나트륨 소금, 써도 될까</a></li>
</ul></div>
</div>
<div class="callout" style="margin-top:22px"><b>물건보다 습관이 먼저입니다.</b> 약통이 약을 먹어 주지 않고, 염도계가 국을 싱겁게 만들어 주지 않습니다. 무엇부터 할지는 <a href="/info/lifestyle-effects.html">생활습관별 혈압 효과</a>와 <a href="/check7/">7일 혈압 기록</a>에서 시작해 보세요.</div>
</div>
</section>
"""
    ld = {"@context": "https://schema.org", "@type": "CollectionPage", "name": "바른혈압몰", "url": SITE + "/mall/",
          "description": "혈압 관리 생활용품 모음 (쿠팡 파트너스 제휴)"}
    return page("바른혈압몰 — 혈압 기록·복약·저염 요리·홈트레이닝 용품", "혈압 수첩, 요일별 약통, 약 달력, 줄자, 만보기, 염도계, 계량 스푼, 염도 낮춘 간장, 요가매트, 탄성 밴드까지. 바른혈압 글과 이어지는 생활 관리 용품을 모았습니다. 쿠팡 파트너스 제휴 페이지입니다.",
                "/mall/", body, jsonld=ld, extra_js='<script src="/assets/js/mall.js"></script>',
                keywords=["혈압 관리 용품", "요일별 약통", "약 달력", "염도계", "계량스푼", "저염 간장", "홈트레이닝 용품"])


def products_json():
    """관리자 화면에서 상품 이름을 보여 줄 때 쓰는 목록"""
    import json
    return json.dumps([{"id": pid, "cat": c, "cat_name": CAT_NAME[c], "name": name, "title": t, "url": url, "img": img}
                       for pid, c, name, t, url, img, _ in PRODUCTS], ensure_ascii=False)
