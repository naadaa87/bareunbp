# -*- coding: utf-8 -*-
"""매일 발행 콘텐츠 — 불러오기, 주제 고르기, 품질 점검

글 한 편 = _src/daily/posts/YYYY-MM-DD-slug.py 파일 하나.
파일 안에 ITEM = dict(type="article"|"factcheck"|"food"|"recipe", ...)을 둔다.
선택: GLOSSARY = [(용어, 영문, 설명, 링크)], FAQ = [(분류, 질문, 답)], NEWS = [(날짜, 제목, 내용, 출처, [(링크, 이름)])]

파일 이름의 날짜가 발행일이다. 오늘(한국 시간)보다 뒤 날짜인 파일은 사이트에 넣지 않는다(예약 발행).

명령
  python3 daily.py next            오늘 쓸 주제와 파일 경로 (JSON)
  python3 daily.py next --date 2026-11-18   특정 날짜에 쓸 주제
  python3 daily.py status          발행·예약·남은 주제 수
  python3 daily.py check FILE...   품질 점검 (통과 못 하면 종료 코드 1)
  python3 daily.py check --all     모든 매일 발행 글 점검
  python3 daily.py preview --date 2026-11-18
                                   그날 기준으로 사이트 전체를 임시 폴더에 만들어 보고 점검 (실제 사이트 파일은 건드리지 않음)
"""
import os, re, sys, json, glob, importlib.util
from datetime import datetime, timedelta, timezone, date as _date

HERE = os.path.dirname(os.path.abspath(__file__))
DAILY = os.path.normpath(os.path.join(HERE, "..", "daily"))
POSTS = os.path.join(DAILY, "posts")
PLAN = os.path.join(DAILY, "plan.json")
KST = timezone(timedelta(hours=9))
NAME_RE = re.compile(r"^(\d{4}-\d{2}-\d{2})-([a-z0-9]+(?:-[a-z0-9]+)*)\.py$")
TYPES = ("article", "factcheck", "food", "recipe")
# 요일별 우선 유형 (월=0)
ROTATION = {0: "article", 1: "food", 2: "factcheck", 3: "article", 4: "article", 5: "recipe", 6: "article"}
WEEKDAY_KO = "월화수목금토일"


def today():
    """한국 날짜. 시험할 때는 BP_TODAY=2026-11-17 처럼 바꿀 수 있다."""
    v = os.environ.get("BP_TODAY")
    if v:
        return v
    return datetime.now(KST).strftime("%Y-%m-%d")


def files():
    out = []
    for p in sorted(glob.glob(os.path.join(POSTS, "*.py"))):
        m = NAME_RE.match(os.path.basename(p))
        if m:
            out.append((m.group(1), m.group(2), p))
    return out


def _load(path):
    name = "daily_" + re.sub(r"\W", "_", os.path.basename(path)[:-3])
    spec = importlib.util.spec_from_file_location(name, path)
    mod = importlib.util.module_from_spec(spec)
    if HERE not in sys.path:
        sys.path.insert(0, HERE)
    spec.loader.exec_module(mod)
    return mod


def loaded(upto=None):
    """발행일이 upto(기본 오늘) 이하인 글 모듈 [(날짜, slug, module)] — 오래된 것부터"""
    upto = upto or today()
    return [(d, s, _load(p)) for d, s, p in files() if d <= upto]


def apply():
    """content.py에서 호출 — 매일 발행 글을 기존 목록에 넣는다 (최신 글이 앞으로)"""
    import articles, factchecks, food, glossary, faq
    target = {"article": articles.ARTICLES, "factcheck": factchecks.FACTCHECKS, "food": food.FOOD_PAGES, "recipe": food.RECIPES}
    news = []
    for d, slug, mod in loaded():               # 오래된 것부터 앞에 끼우므로 결국 최신 글이 맨 앞
        it = dict(mod.ITEM)
        it.setdefault("slug", slug)
        it["date"] = d
        it["daily"] = True
        lst = target[it.get("type", "article")]
        if any(x.get("slug") == it["slug"] for x in lst):
            continue
        lst.insert(0, it)
        for g in getattr(mod, "GLOSSARY", []):
            if all(x[0] != g[0] for x in glossary.GLOSSARY):
                glossary.GLOSSARY.append(g)
        for q in getattr(mod, "FAQ", []):
            if all(x[1] != q[1] for x in faq.FAQ):
                faq.FAQ.append(q)
        news.extend(getattr(mod, "NEWS", []))
    if news:
        import pages_e
        have = {n[1] for n in pages_e.NEWS}
        pages_e.NEWS[:0] = [n for n in news if n[1] not in have]
        pages_e.NEWS.sort(key=lambda n: n[0], reverse=True)


def recent(n=6):
    """사이트에 들어간 매일 발행 글을 최신순으로 [(주소, 분류 이름, 제목, 요약, 날짜)]"""
    import articles, factchecks, food
    out = []
    for a in articles.ARTICLES:
        if a.get("daily"):
            out.append((f"/info/{a['slug']}.html", articles.CAT_NAME.get(a["cat"], "건강정보"), a["title"], a["summary"], a["date"]))
    for f in factchecks.FACTCHECKS:
        if f.get("daily"):
            out.append((f"/factcheck/{f['slug']}.html", "팩트체크", "팩트체크: " + f["claim"], f["summary"], f["date"]))
    for f in food.FOOD_PAGES:
        if f.get("daily"):
            out.append((f"/food/{f['slug']}.html", "음식·식단", f["title"], f["summary"], f["date"]))
    for r in food.RECIPES:
        if r.get("daily"):
            out.append((f"/food/recipes/{r['slug']}.html", "저염 레시피", r["name"] + " — 저염 레시피", r["desc"], r["date"]))
    out.sort(key=lambda x: x[4], reverse=True)
    return out[:n]


# ------------------------------------------------------------------ 주제 고르기
def plan():
    with open(PLAN, encoding="utf-8") as f:
        return json.load(f)


def used_slugs():
    return {s for _, s, _ in files()}


def all_content_slugs():
    """사이트에 이미 있는 모든 글 주소 (매일 발행 글 제외)"""
    sys.path.insert(0, HERE)
    import articles, factchecks, food
    import articles2, articles3a, articles3b, extras3  # noqa
    nd = lambda xs: [x for x in xs if not x.get("daily")]
    s = {"info:" + a["slug"] for a in nd(articles.ARTICLES + articles2.ARTICLES2 + articles3a.ARTICLES3A + articles3b.ARTICLES3B)}
    s |= {"factcheck:" + f["slug"] for f in nd(factchecks.FACTCHECKS + extras3.FACTCHECKS3)}
    s |= {"food:" + f["slug"] for f in nd(food.FOOD_PAGES + extras3.FOOD3)}
    s |= {"recipe:" + r["slug"] for r in nd(food.RECIPES + extras3.RECIPES3)}
    return s


def pick(day=None):
    day = day or today()
    d = datetime.strptime(day, "%Y-%m-%d").date()
    want = ROTATION[d.weekday()]
    done = used_slugs()
    topics = [t for t in plan()["topics"] if t["slug"] not in done and t.get("status") != "skip"]

    def ok(t):
        return t.get("after", "0000") <= day and (not t.get("before") or day <= t["before"])

    live = [t for t in topics if ok(t)]
    # 기한이 3주 안에 끝나는 계절 주제를 먼저
    soon = [t for t in live if t.get("before") and (datetime.strptime(t["before"], "%Y-%m-%d").date() - d).days <= 21]
    for pool in (
        [t for t in soon if t["type"] == want],
        [t for t in live if t["type"] == want],
        soon,
        live,
    ):
        if pool:
            return pool[0], want
    return None, want


def path_for(day, slug):
    return os.path.join(POSTS, f"{day}-{slug}.py")


def page_url(t_or_item):
    t = t_or_item.get("type", "article")
    s = t_or_item["slug"]
    return {"article": f"/info/{s}", "factcheck": f"/factcheck/{s}", "food": f"/food/{s}", "recipe": f"/food/recipes/{s}"}[t]


# ------------------------------------------------------------------ 품질 점검
# 의료 광고·과장·개별 처방으로 읽힐 수 있는 표현. 부정문("끊지 마세요")은 걸리지 않게 짰다.
BANNED = [
    (r"완치(?!(?:되는|하는)?\s*병이\s*아니|가\s*아니|되지\s*않|는\s*어렵|하기\s*어렵|라는\s*(?:말|표현))", "완치 — 고혈압은 조절하는 병입니다"),
    (r"특효|즉효|만병통치|(?<![가-힣])기적|획기적", "과장 표현"),
    (r"100\s*%(?!\s*(?:과즙|주스|통밀|현미))", "100% 단정"),
    (r"무조건(?![^.]{0,14}(?:아닙니다|아니에요|않습니다|끊지))", "무조건 단정"),
    (r"혈관\s*청소|피를\s*맑게|해독\s*(?:주스|효과|에\s*좋)|디톡스|독소\s*배출", "근거 없는 효능 표현"),
    (r"약(?:을)?\s*끊(?:으세요|어도\s*(?:됩니다|돼요|괜찮)|을\s*수\s*있습니다)", "약 중단 권유"),
    (r"약\s*없이\s*(?:낫|혈압을\s*정상)|혈압약\s*대신(?!할 수 없)", "약 대체 암시"),
    (r"(?:처방|진단)해\s*(?:드립|드려)", "진단·처방 제공 표현"),
    (r"부작용(?:이)?\s*(?:전혀\s*)?없는", "부작용 없음 단정"),
    (r"최고의\s*(?:음식|식품|운동|방법|약|치료)|명의(?:가|를|에게|의\s*비법)", "최상급·권위 과장 표현"),
    (r"먹기만\s*하면|이것만\s*(?:먹|하)면", "단일 해법 과장"),
    (r"\d+\s*mg\s*(?:을|를)?\s*(?:드세요|복용하세요|먹으세요)", "용량 지시"),
    (r"(?:전문의|교수|의사)\s*감수|감수\s*(?:완료|:)", "감수 표기는 시스템이 붙입니다 — 본문에 쓰지 않음"),
]
# 기계가 쓴 티가 나는 문장 습관
STYLE = [
    (r"알아보겠습니다|살펴보겠습니다|알아볼까요|살펴볼까요", "‘알아보겠습니다’류 도입"),
    (r"결론적으로|요약하자면|종합하면", "요약 상투어"),
    (r"여러분", "‘여러분’ 호칭"),
    (r"[\U0001F300-\U0001FAFF☀-➿]", "이모지"),
    (r"매우\s*중요합니다|아주\s*중요합니다", "‘매우 중요합니다’"),
]


def _text(html):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", html or "")).strip()


def _site_paths(root=None):
    """사이트 안 주소 목록 (확장자 없는 형태와 .html 형태 모두)"""
    root = root or os.environ.get("BP_OUT") or os.path.normpath(os.path.join(HERE, "..", ".."))
    out = set()
    for p in glob.glob(os.path.join(root, "**", "*.html"), recursive=True):
        rel = "/" + os.path.relpath(p, root).replace(os.sep, "/")
        if rel.startswith("/_src/"):
            continue
        out.add(rel)
        if rel.endswith("/index.html"):
            out.add(rel[:-10])
        elif rel.endswith(".html"):
            out.add(rel[:-5])
    return out


def check(path, site=None, existing=None):
    """문제 목록을 돌려준다. 빈 목록이면 통과."""
    errs, warns = [], []
    base = os.path.basename(path)
    m = NAME_RE.match(base)
    if not m:
        return ["파일 이름은 YYYY-MM-DD-slug.py 형식이어야 합니다 (slug는 영문 소문자·숫자·하이픈)"], []
    day, slug = m.group(1), m.group(2)
    try:
        datetime.strptime(day, "%Y-%m-%d")
    except ValueError:
        return ["파일 이름의 날짜가 올바르지 않습니다"], []
    try:
        mod = _load(path)
    except Exception as e:  # 문법 오류 등
        return [f"파일을 읽지 못했습니다: {type(e).__name__}: {e}"], []
    it = getattr(mod, "ITEM", None)
    if not isinstance(it, dict):
        return ["ITEM = dict(...) 이 없습니다"], []
    t = it.get("type", "article")
    if t not in TYPES:
        errs.append(f"type은 {TYPES} 가운데 하나여야 합니다")
    if it.get("slug", slug) != slug:
        errs.append("ITEM의 slug와 파일 이름의 slug가 다릅니다")
    key = {"article": "info", "factcheck": "factcheck", "food": "food", "recipe": "recipe"}.get(t, "info")
    if existing is not None and f"{key}:{slug}" in existing:
        errs.append(f"이미 같은 주소의 글이 있습니다: {slug}")
    others = [s for d, s, p in files() if s == slug and os.path.abspath(p) != os.path.abspath(path)]
    if others:
        errs.append(f"같은 slug의 매일 발행 글이 이미 있습니다: {slug}")

    def need(*keys):
        for k in keys:
            if not it.get(k):
                errs.append(f"{k} 항목이 비어 있습니다")

    html = ""
    if t == "article":
        need("cat", "title", "summary", "keywords", "tags", "kind", "certainty", "target", "body", "faq")
        import articles
        if it.get("cat") and it["cat"] not in dict(articles.CATEGORIES) and it["cat"] not in ("symptom", "care"):
            errs.append(f"cat은 {[k for k, _ in articles.CATEGORIES]} 가운데 하나")
        html = it.get("body", "")
    elif t == "food":
        need("title", "summary", "keywords", "kind", "certainty", "target", "body", "faq")
        html = it.get("body", "")
    elif t == "factcheck":
        need("claim", "verdict", "summary", "conditions", "body", "srcs")
        from factchecks import VERDICTS
        if it.get("verdict") not in VERDICTS:
            errs.append(f"verdict는 {list(VERDICTS)} 가운데 하나")
        html = it.get("body", "") + " ".join(it.get("srcs") or [])
    elif t == "recipe":
        need("name", "time", "serves", "desc", "ingredients", "steps", "tips")
        if len(it.get("ingredients") or []) < 4:
            errs.append("재료는 4개 이상")
        if len(it.get("steps") or []) < 3:
            errs.append("조리 순서는 3단계 이상")
        if len(it.get("tips") or []) < 2:
            errs.append("팁은 2개 이상")
        if not re.search(r"\d+\s*분", str(it.get("time", ""))):
            errs.append("time은 '20분'처럼 분 단위")
        html = " ".join([it.get("desc", "")] + list(it.get("ingredients") or []) + list(it.get("steps") or []) + list(it.get("tips") or []) + [it.get("intro", "")])

    # 제목·요약 길이 (검색 결과에 잘리지 않게)
    title = it.get("title") or it.get("claim") or it.get("name") or ""
    summary = it.get("summary") or it.get("desc") or ""
    if t in ("article", "food"):
        if not (16 <= len(title) <= 60):
            errs.append(f"title은 16~60자 (지금 {len(title)}자)")
        if " — " not in title:
            warns.append("title은 '핵심 키워드 — 부제' 형태를 권장")
        if not (60 <= len(summary) <= 170):
            errs.append(f"summary는 60~170자 (지금 {len(summary)}자)")
        kws = it.get("keywords") or []
        if not (4 <= len(kws) <= 8):
            errs.append("keywords는 4~8개")
        elif kws[0] not in title and kws[0].replace(" ", "") not in title.replace(" ", ""):
            warns.append(f"첫 번째 키워드 '{kws[0]}'가 제목에 없습니다")
        faq = it.get("faq") or []
        if len(faq) < 3:
            errs.append("faq는 3개 이상 (검색에서 자주 묻는 질문)")
        for q in faq:
            if not (isinstance(q, (tuple, list)) and len(q) == 2 and q[0].strip().endswith("?")):
                errs.append("faq 항목은 (질문?, 답) 형태")
                break
        body = it.get("body", "")
        if "<h2>출처</h2>" not in body:
            errs.append("본문 끝에 <h2>출처</h2>와 sources([...])가 있어야 합니다")
        else:
            src = body[body.index("<h2>출처</h2>"):]
            n = len(re.findall(r'href="https://', src))
            if n < 2:
                errs.append(f"출처 링크가 2개 이상이어야 합니다 (지금 {n}개)")
        n_text = len(_text(body)) + sum(len(_text(a)) for _, a in faq)
        if n_text < 1800:
            errs.append(f"본문이 너무 짧습니다: {n_text}자 (FAQ 포함 1,800자 이상)")
        if len(re.findall(r"<h2", body)) < 4:
            errs.append("소제목(<h2>)이 4개 이상이어야 합니다 (출처 포함)")
        html += " " + " ".join(a for _, a in faq)
    elif t == "factcheck":
        if not (8 <= len(title) <= 45):
            errs.append(f"claim은 8~45자 (지금 {len(title)}자)")
        if not (50 <= len(summary) <= 170):
            errs.append(f"summary는 50~170자 (지금 {len(summary)}자)")
        n_text = len(_text(it.get("body", "")))
        if n_text < 900:
            errs.append(f"본문이 너무 짧습니다: {n_text}자 (900자 이상)")
        n = len(re.findall(r'href="https://', " ".join(it.get("srcs") or [])))
        if n < 2:
            errs.append(f"srcs 출처 링크가 2개 이상이어야 합니다 (지금 {n}개)")
    elif t == "recipe":
        if not (5 <= len(title) <= 24):
            errs.append(f"name은 5~24자 (지금 {len(title)}자)")
        if not (30 <= len(summary) <= 120):
            errs.append(f"desc는 30~120자 (지금 {len(summary)}자)")

    # 사이트 안 링크
    internal = re.findall(r'href="(/[^"#?]*)', html)
    if t in ("article", "food", "factcheck") and len(set(internal)) < 3:
        errs.append(f"사이트 안 다른 글로 가는 링크가 3개 이상이어야 합니다 (지금 {len(set(internal))}개)")
    if site is not None:
        for u in sorted(set(internal)):
            if u.startswith("/api/"):
                continue
            if u not in site and u.rstrip("/") not in site and (u.rstrip("/") + "/") not in site:
                errs.append(f"없는 페이지로 가는 링크: {u}")
    for u in re.findall(r'href="(http://[^"]+)"', html):
        errs.append(f"http 링크는 https로: {u}")
    if re.search(r"<script|on\w+=\"", html, re.I):
        errs.append("본문에 스크립트·이벤트 속성을 넣을 수 없습니다")
    for a in re.findall(r'<a [^>]*href="https://[^"]+"[^>]*>', html):
        if 'target="_blank"' not in a or 'rel="noopener"' not in a:
            errs.append('외부 링크에는 target="_blank" rel="noopener"를 붙입니다')
            break

    plain = _text(html) + " " + title + " " + summary
    for pat, why in BANNED:
        mm = re.search(pat, plain)
        if mm:
            s = max(0, mm.start() - 15)
            errs.append(f"금지 표현({why}): …{plain[s:mm.end() + 15]}…")
    for pat, why in STYLE:
        mm = re.search(pat, plain)
        if mm:
            s = max(0, mm.start() - 15)
            errs.append(f"문체({why}): …{plain[s:mm.end() + 15]}…")
    for g in getattr(mod, "GLOSSARY", []):
        if not (isinstance(g, tuple) and len(g) == 4):
            errs.append("GLOSSARY 항목은 (용어, 영문, 설명, 링크)")
    for q in getattr(mod, "FAQ", []):
        if not (isinstance(q, tuple) and len(q) == 3):
            errs.append("FAQ 항목은 (분류, 질문, 답)")
    return errs, warns


# ------------------------------------------------------------------ 명령
def _main(argv):
    if not argv or argv[0] in ("-h", "--help"):
        print(__doc__)
        return 0
    cmd = argv[0]
    if cmd == "next":
        day = today()
        if "--date" in argv:
            day = argv[argv.index("--date") + 1]
        exist = [p for d, s, p in files() if d == day]
        t, want = pick(day)
        wd = WEEKDAY_KO[datetime.strptime(day, "%Y-%m-%d").weekday()]
        out = {"date": day, "weekday": wd, "slot": want, "already_written": exist}
        if t:
            out["topic"] = t
            out["file"] = os.path.relpath(path_for(day, t["slug"]), os.path.join(HERE, "..", ".."))
            out["url"] = "https://bareunbp.com" + page_url(t)
        else:
            out["topic"] = None
            out["note"] = "계획표의 주제를 모두 썼습니다. plan.json에 주제를 더하세요."
        print(json.dumps(out, ensure_ascii=False, indent=2))
        return 0
    if cmd == "status":
        day = today()
        fs = files()
        pub = [x for x in fs if x[0] <= day]
        sch = [x for x in fs if x[0] > day]
        done = used_slugs()
        todo = [t for t in plan()["topics"] if t["slug"] not in done and t.get("status") != "skip"]
        print(json.dumps({"today": day, "published": len(pub), "scheduled": [f"{d} {s}" for d, s, _ in sch],
                          "last": pub[-1][0] + " " + pub[-1][1] if pub else None, "topics_left": len(todo),
                          "topics_left_by_type": {k: sum(1 for t in todo if t["type"] == k) for k in TYPES}}, ensure_ascii=False, indent=2))
        return 0
    if cmd == "preview":
        import shutil, subprocess, tempfile
        day = argv[argv.index("--date") + 1] if "--date" in argv else today()
        repo = os.path.normpath(os.path.join(HERE, "..", ".."))
        tmp = os.path.join(tempfile.gettempdir(), "bp-preview-" + day)
        shutil.rmtree(tmp, ignore_errors=True)
        shutil.copytree(repo, tmp, ignore=shutil.ignore_patterns(".git", "__pycache__", "_src", "node_modules", ".wrangler"))
        env = dict(os.environ, BP_OUT=tmp, BP_TODAY=day)
        r1 = subprocess.run([sys.executable, "build.py"], cwd=HERE, env=env, capture_output=True, text=True)
        print(r1.stdout.strip() or r1.stderr.strip()[-2000:])
        if r1.returncode:
            print("생성 실패")
            return 1
        r2 = subprocess.run([sys.executable, "check_site.py"], cwd=HERE, env=env, capture_output=True, text=True)
        print(r2.stdout.strip())
        mine = [p for d, s, p in files() if d == day]
        bad = 0
        site = _site_paths(tmp)
        existing = all_content_slugs()
        for p in mine:
            errs, warns = check(p, site, existing)
            print(("통과  " if not errs else "실패  ") + os.path.basename(p))
            for e in errs:
                print("  ✗ " + e)
            for w in warns:
                print("  · " + w)
            bad += bool(errs)
            it = _load(p).ITEM
            print("  미리보기 파일:", os.path.join(tmp, page_url(dict(it, slug=it.get("slug") or os.path.basename(p)[11:-3])).lstrip("/") + ".html"))
        return 1 if (bad or r2.returncode) else 0
    if cmd == "check":
        targets = [p for _, _, p in files()] if "--all" in argv else [a for a in argv[1:] if not a.startswith("--")]
        if not targets:
            print("점검할 파일이 없습니다")
            return 0
        site = _site_paths()
        existing = all_content_slugs()
        bad = 0
        for p in targets:
            errs, warns = check(p, site, existing)
            print(("통과  " if not errs else "실패  ") + os.path.basename(p))
            for e in errs:
                print("  ✗ " + e)
            for w in warns:
                print("  · " + w)
            bad += bool(errs)
        return 1 if bad else 0
    print("알 수 없는 명령:", cmd)
    return 2


if __name__ == "__main__":
    sys.path.insert(0, HERE)
    sys.exit(_main(sys.argv[1:]))
