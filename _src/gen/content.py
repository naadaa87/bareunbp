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
