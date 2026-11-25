# -*- coding: utf-8 -*-
"""레시피 구조화 데이터(schema.org Recipe) — 생성과 검사를 한곳에서 한다.

Google 레시피 구조화 데이터 기준
  필수      name, image
  권장(채움) description, author, datePublished, recipeYield, totalTime,
            recipeIngredient, recipeInstructions(HowToStep: text + name + url),
            recipeCategory, recipeCuisine, keywords
  권장(실제 값이 있을 때만)
            nutrition   — 영양성분을 실제로 계산하고 출처를 적었을 때만. 화면에도 함께 보여 준다.
            image(단계) — 그 단계를 실제로 찍은 사진이 있을 때만.
            video       — 레시피를 실제로 촬영한 영상이 있을 때만. (아직 없음)
            aggregateRating — 사이트에 실제 평점 기능이 생겨 화면에 보일 때만. (아직 없음)
  값을 꾸며 넣지 않는다. Search Console의 '심각하지 않은 문제'로 남아도 노출에는 지장이 없다.

조리 단계 형식 (레시피 데이터의 steps)
  steps=[("육수 내기", "찬물에 멸치와 다시마를 넣고 10분 끓입니다."), ...]
  - 앞은 단계 제목(name): 그 단계에서 하는 일을 2~20자로. 번호·'1단계' 같은 말은 넣지 않는다.
  - 뒤는 설명(text): 실제 조리 방법만. HTML 태그 없이.
  - 사진이 있으면 dict(name=..., text=..., image="/assets/img/recipes/<slug>-step1.jpg")로 쓴다.
"""
import json
import os
import re

from base import SITE, BRAND, REVIEW_DATE, pretty, esc

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
FALLBACK_IMAGE = "/assets/img/photo-flatlay.jpg"   # 완성 요리 사진이 없을 때만 쓰는 공용 사진
PHOTO_DIR = "/assets/img/recipes"                   # 여기에 <slug>.jpg를 올리면 자동으로 쓴다
CATEGORY, CUISINE = "저염식", "한식"
KEYWORDS = ["고혈압 식단", "나트륨 줄이기", "싱겁게 먹기"]   # recipeCategory·recipeCuisine과 겹치지 않게

REQUIRED = ("name", "image")
RECOMMENDED = ("description", "author", "datePublished", "recipeYield", "totalTime", "recipeIngredient",
               "recipeInstructions", "recipeCategory", "recipeCuisine", "keywords")
REAL_ONLY = ("nutrition", "video", "aggregateRating")

_TAG = re.compile(r"<[^>]+>")
_BAD_NAME = re.compile(r"^\s*(\d|step|단계|[①-⑳])|\d+\s*단계", re.I)


class RecipeDataError(ValueError):
    pass


def steps(r):
    """레시피의 조리 단계를 [{'name', 'text', 'image'?}] 로 돌려준다. 제목이 없으면 빌드를 멈춘다."""
    out = []
    for i, s in enumerate(r.get("steps") or [], 1):
        if isinstance(s, (tuple, list)) and len(s) == 2:
            d = {"name": s[0], "text": s[1]}
        elif isinstance(s, dict):
            d = dict(s)
        else:
            raise RecipeDataError(f"{r.get('slug')}: {i}번째 조리 단계에 제목이 없습니다. "
                                  f'("단계 제목", "설명") 형식으로 쓰세요 — 지금 값: {str(s)[:40]}')
        d["name"], d["text"] = str(d.get("name", "")).strip(), str(d.get("text", "")).strip()
        out.append(d)
    return out


def step_problems(r):
    """조리 단계 형식 점검. 문제 문장 목록을 돌려준다(빈 목록이면 통과)."""
    try:
        st = steps(r)
    except RecipeDataError as e:
        return [str(e)]
    errs = []
    seen = set()
    for i, d in enumerate(st, 1):
        n, t = d["name"], d["text"]
        if not (2 <= len(n) <= 20):
            errs.append(f"{i}번째 단계 제목은 2~20자 (지금 {len(n)}자: {n})")
        if _BAD_NAME.search(n):
            errs.append(f"{i}번째 단계 제목에 번호·'단계'를 넣지 마세요: {n}")
        if n in seen:
            errs.append(f"단계 제목이 겹칩니다: {n}")
        seen.add(n)
        if len(t) < 8:
            errs.append(f"{i}번째 단계 설명이 너무 짧습니다: {t}")
        if n == t:
            errs.append(f"{i}번째 단계 제목과 설명이 같습니다")
        if _TAG.search(n) or _TAG.search(t):
            errs.append(f"{i}번째 단계에 HTML 태그가 있습니다")
        if d.get("image") and not str(d["image"]).startswith("/assets/img/"):
            errs.append(f"{i}번째 단계 사진은 /assets/img/ 아래 파일만 씁니다")
    return errs


def step_text(r):
    return " ".join(d["name"] + " " + d["text"] for d in steps(r))


def page_url(r):
    return SITE + pretty(f"/food/recipes/{r['slug']}.html")


def photo(r):
    """완성 요리 사진 경로. 데이터의 image, 또는 /assets/img/recipes/<slug>.jpg|.webp|.png 가 있으면 그것을 쓴다."""
    if r.get("image"):
        return r["image"]
    for ext in ("jpg", "webp", "png"):
        p = f"{PHOTO_DIR}/{r['slug']}.{ext}"
        if os.path.exists(os.path.join(ROOT, p.lstrip("/"))):
            return p
    return None


def minutes(r):
    m = re.search(r"(\d+)\s*분", str(r.get("time", "")))
    h = re.search(r"(\d+)\s*시간", str(r.get("time", "")))
    total = (int(h.group(1)) * 60 if h else 0) + (int(m.group(1)) if m else 0)
    return total or 20


def nutrition(r):
    """실제로 계산한 영양성분이 있을 때만. 예) nutrition=dict(calories="320 kcal", sodiumContent="610 mg",
    source="식품의약품안전처 식품영양성분 데이터베이스 기준 계산(1인분)")"""
    n = r.get("nutrition")
    if not n or not n.get("calories") or not n.get("source"):
        return None
    return n


def recipe_ld(r):
    url = page_url(r)
    img = photo(r) or FALLBACK_IMAGE
    ld = {
        "@context": "https://schema.org", "@type": "Recipe",
        "name": r["name"], "description": r["desc"], "url": url,
        "image": [SITE + img],
        "author": {"@type": "Organization", "name": BRAND, "url": SITE + "/"},
        "datePublished": r.get("date", REVIEW_DATE),
        "recipeYield": [str(r["serves"]), f"{r['serves']}인분"],
        "totalTime": f"PT{minutes(r)}M",
        "recipeIngredient": [_TAG.sub("", x) for x in r["ingredients"]],
        "recipeInstructions": [],
        "recipeCategory": CATEGORY, "recipeCuisine": CUISINE,
        "keywords": ", ".join(KEYWORDS + [k for k in r.get("keywords", []) if k not in (CATEGORY, CUISINE)]),
    }
    for i, d in enumerate(steps(r), 1):
        st = {"@type": "HowToStep", "name": d["name"], "text": d["text"], "url": f"{url}#step-{i}"}
        if d.get("image"):
            st["image"] = SITE + d["image"]
        ld["recipeInstructions"].append(st)
    n = nutrition(r)
    if n:
        ld["nutrition"] = {"@type": "NutritionInformation", **{k: v for k, v in n.items() if k != "source"}}
    return ld


def steps_html(r):
    out = []
    for i, d in enumerate(steps(r), 1):
        pic = f'<img src="{esc(d["image"])}" alt="{esc(d["name"])}" loading="lazy">' if d.get("image") else ""
        out.append(f'<li id="step-{i}"><span><b>{esc(d["name"])}</b>{esc(d["text"])}</span>{pic}</li>')
    return "".join(out)


def nutrition_html(r):
    n = nutrition(r)
    if not n:
        return ""
    names = {"calories": "열량", "sodiumContent": "나트륨", "potassiumContent": "칼륨", "carbohydrateContent": "탄수화물",
             "proteinContent": "단백질", "fatContent": "지방", "sugarContent": "당류", "fiberContent": "식이섬유"}
    rows = "".join(f"<tr><th>{names.get(k, k)}</th><td>{esc(str(v))}</td></tr>" for k, v in n.items() if k not in ("source", "servingSize"))
    return (f'<div class="card"><h2>영양 정보 <small>({esc(n.get("servingSize", "1인분"))})</small></h2>'
            f'<table class="table">{rows}</table><p class="fine">{esc(n["source"])}</p></div>')


# ------------------------------------------------------------------
# 생성된 페이지 검사 (check_site.py에서 사용)
# ------------------------------------------------------------------
def check_page(html, canonical):
    """레시피 페이지 HTML을 검사해 (오류, 경고) 목록을 돌려준다."""
    errs, warns = [], []
    rec = None
    for b in re.findall(r'<script type="application/ld\+json">(.*?)</script>', html, re.S):
        try:
            d = json.loads(b)
        except ValueError:
            errs.append("JSON-LD를 읽을 수 없습니다")
            continue
        for it in (d if isinstance(d, list) else d.get("@graph", [d])):
            if it.get("@type") == "Recipe":
                rec = it
    if not rec:
        return ["Recipe 구조화 데이터가 없습니다"], warns
    for k in REQUIRED:
        if not rec.get(k):
            errs.append(f"필수 속성 {k} 없음")
    for k in RECOMMENDED:
        if not rec.get(k):
            errs.append(f"권장 속성 {k} 없음")
    kw = [x.strip() for x in str(rec.get("keywords", "")).split(",")]
    if rec.get("recipeCategory") in kw or rec.get("recipeCuisine") in kw:
        errs.append("keywords에 recipeCategory·recipeCuisine 값을 반복하지 마세요")
    if rec.get("url") != canonical:
        errs.append(f"Recipe url이 대표 주소와 다릅니다: {rec.get('url')}")
    ids = set(re.findall(r'<li id="(step-\d+)"', html))
    visible = re.sub(r"<script\b.*?</script>", "", html, flags=re.S)
    for i, st in enumerate(rec.get("recipeInstructions") or [], 1):
        if st.get("@type") != "HowToStep":
            errs.append(f"{i}번째 단계가 HowToStep이 아닙니다")
        for k in ("name", "text", "url"):
            if not st.get(k):
                errs.append(f"{i}번째 단계에 {k} 없음")
        if st.get("name") and _BAD_NAME.search(st["name"]):
            errs.append(f"{i}번째 단계 name에 번호가 들어 있습니다: {st['name']}")
        u = st.get("url", "")
        if u and (not u.startswith(canonical + "#") or u.split("#", 1)[1] not in ids):
            errs.append(f"{i}번째 단계 url이 페이지 안 위치와 맞지 않습니다: {u}")
        if st.get("name") and f"<b>{esc(st['name'])}</b>" not in visible:
            errs.append(f"{i}번째 단계 제목이 화면에 보이지 않습니다: {st['name']}")
    if "nutrition" in rec and not rec["nutrition"].get("calories"):
        errs.append("nutrition을 넣었다면 calories가 있어야 합니다")
    if "nutrition" in rec and "영양 정보" not in visible:
        errs.append("nutrition 값이 화면에 표시되지 않았습니다")
    for k in ("video", "aggregateRating"):
        if k in rec:
            warns.append(f"{k}가 들어 있습니다 — 실제 영상·평점인지 확인하세요")
    imgs = rec.get("image") if isinstance(rec.get("image"), list) else [rec.get("image")]
    if any(str(x).endswith(FALLBACK_IMAGE) for x in imgs):
        warns.append("완성 요리 사진이 없어 공용 사진을 쓰고 있습니다")
    return errs, warns
