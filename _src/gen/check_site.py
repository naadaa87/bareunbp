# -*- coding: utf-8 -*-
"""생성된 사이트 점검 — 깨진 내부 링크·앵커, 필수 메타, 금지 문구

사용: python3 _src/gen/check_site.py   (저장소 맨 위 폴더 기준으로 동작)
문제가 있으면 종료 코드 1
"""
import os, re, glob, sys, html, json

ROOT = os.environ.get("BP_OUT") or os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))


def main():
    os.chdir(ROOT)
    files = [f for f in glob.glob("**/*.html", recursive=True) if not f.startswith(("_src", "node_modules", ".wrangler"))]
    ids = {}

    def page_ids(f):
        if f not in ids:
            s = open(f, encoding="utf-8").read()
            ids[f] = set(re.findall(r'\sid="([^"]+)"', s)) | set(re.findall(r'\sdata-cat="([^"]+)"', s))
        return ids[f]

    def resolve(path):
        p = path.lstrip("/")
        for c in (p, p + ".html", os.path.join(p, "index.html")):
            if c and os.path.isfile(c):
                return c
        return None

    bad, anchors, meta = [], [], []
    n = 0
    for f in files:
        s = open(f, encoding="utf-8").read()
        if f not in ("404.html",) and not f.startswith("admin/") and 'content="noindex' not in s:
            if '<link rel="canonical"' not in s:
                meta.append((f, "canonical 없음"))
            if not re.search(r'<meta name="description" content="[^"]{20,}"', s):
                meta.append((f, "description 없음·짧음"))
        for m in re.finditer(r'(?:href|src)="([^"]+)"', s):
            u = html.unescape(m.group(1))
            if u.startswith(("http", "mailto:", "tel:", "data:", "javascript:", "//", "?")):
                continue
            n += 1
            if u.startswith("#"):
                if len(u) > 1 and u[1:] not in page_ids(f) and u[1:] != "main":
                    anchors.append((f, u))
                continue
            if not u.startswith("/"):
                bad.append((f, u, "상대 경로"))
                continue
            if u.startswith("/api/"):
                continue
            path = u.split("#")[0].split("?")[0]
            t = resolve(path) if path not in ("", "/") else "index.html"
            if not t:
                bad.append((f, u, "없는 페이지"))
                continue
            if "#" in u:
                a = u.split("#", 1)[1]
                if a and t.endswith(".html") and a not in page_ids(t):
                    anchors.append((f, u))
    # 사이트맵·RSS가 올바른 XML 모양인지 간단히
    for x in ("sitemap.xml", "rss.xml"):
        s = open(x, encoding="utf-8").read()
        if not s.startswith("<?xml") or s.count("<loc>" if x == "sitemap.xml" else "<item>") < 10:
            meta.append((x, "형식 이상"))
    json.load(open("search-index.json", encoding="utf-8"))

    print(f"페이지 {len(files)}개, 링크 {n}개 확인 — 깨진 링크 {len(bad)}, 깨진 앵커 {len(anchors)}, 메타 문제 {len(meta)}")
    for b in bad[:30]:
        print("  링크", b)
    for a in anchors[:30]:
        print("  앵커", a)
    for m in meta[:30]:
        print("  메타", m)
    return 1 if (bad or meta) else 0


if __name__ == "__main__":
    sys.exit(main())
