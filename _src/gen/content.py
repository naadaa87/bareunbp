# -*- coding: utf-8 -*-
"""콘텐츠 통합 — 기존 글에 2차 확충분과 SEO 메타를 합친다 (리스트·딕셔너리를 제자리에서 갱신)"""
import articles
from articles2 import ARTICLES2, SEO_META

if ("symptom", "증상·응급") not in articles.CATEGORIES:
    articles.CATEGORIES.insert(1, ("symptom", "증상·응급"))
    articles.CAT_NAME["symptom"] = "증상·응급"

_existing = {a["slug"] for a in articles.ARTICLES}
for a in ARTICLES2:
    if a["slug"] not in _existing:
        articles.ARTICLES.append(a)

for a in articles.ARTICLES:
    m = SEO_META.get(a["slug"])
    if not m:
        continue
    if m.get("title"):
        a["title"] = m["title"]
    for k in ("keywords", "faq", "tags"):
        if m.get(k):
            a[k] = m[k]
    if m.get("append") and not a.get("_appended"):
        i = a["body"].rfind("<h2>출처</h2>")
        a["body"] = (a["body"][:i] + m["append"] + a["body"][i:]) if i > -1 else a["body"] + m["append"]
        a["_appended"] = True

# ---- 3차 확충 (2026-11): 새 분류 '진료·제도'와 건강정보·팩트체크·음식·레시피·용어·FAQ 추가
import factchecks, food, glossary, faq
from articles3a import ARTICLES3A
from articles3b import ARTICLES3B
from extras3 import FACTCHECKS3, FOOD3, RECIPES3, GLOSSARY3, FAQ3

if ("care", "진료·제도") not in articles.CATEGORIES:
    articles.CATEGORIES.append(("care", "진료·제도"))
    articles.CAT_NAME["care"] = "진료·제도"


def _extend(target, items, key):
    have = {key(x) for x in target}
    for it in items:
        if key(it) not in have:
            target.append(it)
            have.add(key(it))


_extend(articles.ARTICLES, ARTICLES3A + ARTICLES3B, lambda a: a["slug"])
_extend(factchecks.FACTCHECKS, FACTCHECKS3, lambda f: f["slug"])
_extend(food.FOOD_PAGES, FOOD3, lambda f: f["slug"])
_extend(food.RECIPES, RECIPES3, lambda r: r["slug"])
_extend(glossary.GLOSSARY, GLOSSARY3, lambda g: g[0])
_extend(faq.FAQ, FAQ3, lambda q: q[1])
# 새로 쓴 글에는 실제 작성·검토일을 붙인다 (기존 글의 검토일은 그대로 둔다)
from base import NEW_DATE
for _it in ARTICLES3A + ARTICLES3B + FACTCHECKS3 + FOOD3 + RECIPES3:
    _it.setdefault("date", NEW_DATE)

# ---- 매일 발행 (_src/daily/posts) — 발행일이 오늘 이하인 글만, 최신 글이 앞으로
import daily
daily.apply()

# FAQ는 분류별로 모아 보여 주므로 같은 분류끼리 붙여 정렬한다
_faq_order = []
for c, _, _ in faq.FAQ:
    if c not in _faq_order:
        _faq_order.append(c)
faq.FAQ.sort(key=lambda q: _faq_order.index(q[0]))

# 카테고리 순서로 정렬(같은 카테고리 안에서는 기존 순서 유지)
_order = {k: i for i, (k, _) in enumerate(articles.CATEGORIES)}
articles.ARTICLES.sort(key=lambda a: _order.get(a["cat"], 99))


def related(a, n=4):
    """같은 카테고리·태그를 공유하는 글을 점수순으로"""
    tags = set(a.get("tags", []))
    scored = []
    for b in articles.ARTICLES:
        if b["slug"] == a["slug"]:
            continue
        sc = (2 if b["cat"] == a["cat"] else 0) + len(tags & set(b.get("tags", [])))
        if sc:
            scored.append((sc, b))
    scored.sort(key=lambda x: -x[0])
    return [b for _, b in scored[:n]]
