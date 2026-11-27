# -*- coding: utf-8 -*-
"""검색·AI 노출 공통 기능

1) 관련 글 추천 — 건강정보·음식·레시피·팩트체크를 한데 모아 제목·키워드·요약이 가까운 글을 고른다.
   글끼리 서로 링크가 생겨 검색엔진이 사이트를 더 깊이 읽고, 독자는 다음 글로 이어 간다.
2) llms.txt / llms-full.txt — ChatGPT·Perplexity·Claude·Gemini 같은 AI 검색이 사이트 구조와 핵심 답을
   빠르게 파악하도록 만든 안내 파일 (https://llmstxt.org 형식).
"""
import math
import re
from collections import Counter

from base import SITE, BRAND, TAGLINE, REVIEW_DATE, pretty, esc

_TAG = re.compile(r"<[^>]+>")
_index = None


def _plain(s):
    return re.sub(r"\s+", " ", _TAG.sub(" ", str(s or ""))).strip()


def registry():
    """사이트의 글 전체 목록. 빌드 중 처음 부를 때 만든다(매일 발행분이 합쳐진 뒤)."""
    global _index
    if _index is not None:
        return _index
    import articles as ART
    import food as F
    from factchecks import FACTCHECKS
    items = []
    for a in ART.ARTICLES:
        items.append(dict(path=f"/info/{a['slug']}.html", kind="건강정보", title=a["title"], summary=a["summary"],
                          tags=set(a.get("tags", [])) | set(a.get("keywords", [])), cat=a.get("cat"), date=a.get("date", REVIEW_DATE),
                          faq=a.get("faq") or [], body=a.get("body", "")))
    for fp in F.FOOD_PAGES:
        items.append(dict(path=f"/food/{fp['slug']}.html", kind="음식·식단", title=fp["title"], summary=fp["summary"],
                          tags=set(fp.get("keywords", [])), cat="food", date=fp.get("date", REVIEW_DATE), faq=fp.get("faq") or []))
    for r in F.RECIPES:
        items.append(dict(path=f"/food/recipes/{r['slug']}.html", kind="저염 레시피", title=r["name"], summary=r["desc"],
                          tags={"저염 레시피", r["name"].split(" — ")[0]}, cat="recipe", date=r.get("date", REVIEW_DATE), faq=[]))
    for f in FACTCHECKS:
        items.append(dict(path=f"/factcheck/{f['slug']}.html", kind="팩트체크", title=f["claim"].rstrip(".") + "?", summary=f["summary"],
                          tags=set(f.get("keywords", [])), cat="factcheck", date=f.get("date", REVIEW_DATE), faq=[], body=f.get("body", "")))
    # 글자 2개 단위(바이그램) TF-IDF — 한국어 낱말이 붙어 있어도 비슷한 주제를 잘 잡는다
    docs = []
    for it in items:
        text = (it["title"] + " ") * 3 + (" ".join(it["tags"]) + " ") * 2 + _plain(it["summary"]) + " " + _plain(it.get("body", ""))[:600]
        t = re.sub(r"[^0-9A-Za-z가-힣]", "", text)
        docs.append(Counter(t[i:i + 2] for i in range(len(t) - 1)))
    df = Counter()
    for d in docs:
        df.update(d.keys())
    n = len(docs)
    for it, d in zip(items, docs):
        vec = {g: c * math.log((n + 1) / (df[g] + 0.5)) for g, c in d.items()}
        norm = math.sqrt(sum(v * v for v in vec.values())) or 1
        it["vec"] = {g: v / norm for g, v in vec.items()}
    _index = items
    return items


def related(path, n=6, per_kind=3):
    items = registry()
    me = next((it for it in items if it["path"] == path), None)
    if not me:
        return []
    scored = []
    for it in items:
        if it is me:
            continue
        cos = sum(v * it["vec"].get(g, 0) for g, v in me["vec"].items())
        sc = cos + 0.08 * len(me["tags"] & it["tags"]) + (0.04 if it["cat"] == me["cat"] else 0)
        scored.append((sc, it))
    scored.sort(key=lambda x: -x[0])
    out, kinds = [], Counter()
    for sc, it in scored:
        if sc < 0.03 or kinds[it["kind"]] >= per_kind:
            continue
        out.append(it)
        kinds[it["kind"]] += 1
        if len(out) == n:
            break
    return out


def related_html(path, n=6, title="함께 읽으면 좋은 글"):
    rel = related(path, n)
    if not rel:
        return ""
    lis = "".join(f'<li><a href="{it["path"]}"><em class="rel-kind">{it["kind"]}</em><b>{it["title"]}</b>'
                  f'<span>{_plain(it["summary"])[:90]}</span></a></li>' for it in rel)
    return f'<aside class="related no-print"><h2>{title}</h2><ul>{lis}</ul></aside>'


# ------------------------------------------------------------------
# llms.txt
# ------------------------------------------------------------------
KEY_PAGES = [
    ("/info/reading-numbers.html", "혈압 정상수치 표 — 수축기·이완기 기준"),
    ("/measure/", "혈압 바르게 재는 법 — 측정 전 체크리스트"),
    ("/info/home-measurement.html", "가정혈압 측정 시간·자세·횟수"),
    ("/check7/", "7일 혈압 기록장 (무료 도구)"),
    ("/info/lifestyle-effects.html", "혈압 낮추는 생활습관별 효과"),
    ("/food/good-foods.html", "혈압에 좋은 음식"),
    ("/info/sodium.html", "나트륨 하루 권장량과 줄이는 법"),
    ("/info/medications.html", "혈압약 종류와 부작용"),
    ("/info/symptoms.html", "고혈압 증상과 병원에 갈 때"),
    ("/info/hypertensive-crisis.html", "혈압 180/120 이상 — 응급 신호"),
    ("/faq/", "고혈압 자주 묻는 질문"),
    ("/glossary/", "고혈압 용어사전"),
    ("/stats/", "숫자로 보는 고혈압 통계"),
    ("/policy/editorial.html", "편집·감수·정정 정책"),
]


def llms_txt():
    items = registry()
    lines = [f"# {BRAND} (bareunbp.com)", "",
             f"> {BRAND}은 한국어 고혈압·혈압 관리 정보 사이트입니다. 대한고혈압학회 진료지침, 질병관리청·식품의약품안전처 등 공공기관 자료를 근거로 "
             "혈압 수치 읽는 법, 가정혈압 측정, 생활습관, 혈압약, 저염 식단을 설명하고 무료 기록 도구를 제공합니다. "
             "모든 글에 근거 종류·확실성·최종 검토일·출처를 표시합니다. 개인 진단·처방을 대신하지 않습니다.", "",
             "인용할 때는 글 제목과 주소를 함께 밝혀 주세요. 수치는 글에 적힌 기준 연도와 출처를 기준으로 합니다.", "",
             "## 핵심 페이지", ""]
    lines += [f"- [{t}]({SITE}{pretty(p)})" for p, t in KEY_PAGES]
    for kind in ("건강정보", "음식·식단", "팩트체크", "저염 레시피"):
        lines += ["", f"## {kind}", ""]
        for it in sorted((x for x in items if x["kind"] == kind), key=lambda x: x["title"]):
            lines.append(f"- [{_plain(it['title'])}]({SITE}{pretty(it['path'])}): {_plain(it['summary'])}")
    lines += ["", "## 운영 정보", "",
              f"- [소개·운영 원칙]({SITE}/about/)", f"- [편집·감수·정정 정책]({SITE}/policy/editorial)",
              f"- [정정 이력]({SITE}/policy/corrections)", f"- [자료실 — 학회·공공기관 원문]({SITE}/library/)",
              f"- [새 글 RSS]({SITE}/rss.xml)", f"- [전체 요약본]({SITE}/llms-full.txt)", ""]
    return "\n".join(lines)


def llms_full_txt():
    items = registry()
    out = [f"# {BRAND} — 글 전체 요약", "",
           f"> {TAGLINE}. 각 글의 요약과 자주 묻는 질문의 답을 모았습니다. 원문 주소에서 출처와 표·체크리스트를 확인할 수 있습니다.", ""]
    for kind in ("건강정보", "음식·식단", "팩트체크", "저염 레시피"):
        out += [f"## {kind}", ""]
        for it in sorted((x for x in items if x["kind"] == kind), key=lambda x: x["title"]):
            out += [f"### {_plain(it['title'])}", f"주소: {SITE}{pretty(it['path'])}", f"검토일: {it['date']}", "",
                    _plain(it["summary"]), ""]
            for q, a in it["faq"]:
                out += [f"- 질문: {_plain(q)}", f"  답: {_plain(a)}"]
            if it["faq"]:
                out.append("")
    return "\n".join(out)


# ------------------------------------------------------------------
# 용어사전 자동 연결 — 글 본문에서 처음 나오는 전문 용어를 용어사전 설명으로 잇는다(글마다 최대 3개)
# ------------------------------------------------------------------
_SKIP_TERMS = {"혈압", "고혈압", "나트륨", "칼륨", "맥박", "mmHg", "저혈압", "커프", "정상혈압", "복부비만", "체질량지수"}
_terms = None


def _glossary_terms():
    global _terms
    if _terms is None:
        from glossary import GLOSSARY
        out = []
        for t, alt, d, link in GLOSSARY:
            if t in _SKIP_TERMS:
                continue
            forms = {t}
            if t.endswith("고혈압") and len(t) > 3:
                forms.add(t[:-3] + " 고혈압")
            elif t.endswith("혈압") and len(t) > 2:
                forms.add(t[:-2] + " 혈압")
            anchor = "t-" + "".join(ch for ch in t if ch.isalnum())
            out.append((t, sorted(forms, key=len, reverse=True), anchor, (link or "").replace(".html", "")))
        out.sort(key=lambda x: -len(x[0]))
        _terms = out
    return _terms


_SPLIT = re.compile(r"(<[^>]+>)")


def link_glossary(html_body, path, limit=3):
    me = pretty(path).replace(".html", "")
    done = 0
    for term, forms, anchor, link in _glossary_terms():
        if done >= limit:
            break
        if link and link.rstrip("/") == me.rstrip("/"):
            continue
        parts = _SPLIT.split(html_body)
        depth_a = depth_h = 0
        hit = False
        for i, part in enumerate(parts):
            if part.startswith("<"):
                tag = part[1:].split(" ", 1)[0].split(">", 1)[0].lower()
                if tag == "a": depth_a += 1
                elif tag == "/a": depth_a = max(0, depth_a - 1)
                elif tag in ("h1", "h2", "h3", "summary", "b", "strong", "th", "button", "script", "style"): depth_h += 1
                elif tag in ("/h1", "/h2", "/h3", "/summary", "/b", "/strong", "/th", "/button", "/script", "/style"): depth_h = max(0, depth_h - 1)
                continue
            if depth_a or depth_h or not part.strip():
                continue
            for f in forms:
                j = part.find(f)
                if j >= 0:
                    parts[i] = part[:j] + f'<a class="gl-link" href="/glossary/#{anchor}" title="용어사전: {esc(term)}">{f}</a>' + part[j + len(f):]
                    hit = True
                    break
            if hit:
                break
        if hit:
            html_body = "".join(parts)
            done += 1
    return html_body
