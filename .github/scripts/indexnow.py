# -*- coding: utf-8 -*-
"""sitemap.xml에서 새로 생겼거나 lastmod가 바뀐 주소를 IndexNow(네이버·빙 등)에 알린다."""
import json, re, subprocess, sys, urllib.request

KEY = "8c8ac57610110c4bd3b762f728c2c8bc"
HOST = "bareunbp.com"


def entries(xml):
    return dict(re.findall(r"<loc>([^<]+)</loc><lastmod>([^<]+)</lastmod>", xml))


def main():
    now = entries(open("sitemap.xml", encoding="utf-8").read())
    try:
        before = entries(subprocess.run(["git", "show", "HEAD~1:sitemap.xml"], capture_output=True, text=True, check=True).stdout)
    except subprocess.CalledProcessError:
        before = {}
    urls = [u for u, d in now.items() if before.get(u) != d]
    if not urls:
        print("알릴 주소 없음")
        return 0
    urls = sorted(set(urls + [f"https://{HOST}/"]))[:10000]
    body = json.dumps({"host": HOST, "key": KEY, "keyLocation": f"https://{HOST}/{KEY}.txt", "urlList": urls}).encode()
    ok = 0
    for ep in ("https://searchadvisor.naver.com/indexnow", "https://api.indexnow.org/indexnow"):
        req = urllib.request.Request(ep, data=body, headers={"Content-Type": "application/json; charset=utf-8"})
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                print(ep, r.status)
                ok += 1
        except Exception as e:  # 한 곳이 실패해도 다른 곳은 보낸다
            print(ep, "실패", e)
    print(f"{len(urls)}개 주소:", *urls[:20], sep="\n  ")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
