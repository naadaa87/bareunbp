# -*- coding: utf-8 -*-
"""페이지별 공유 이미지(Open Graph, 1200×630) 생성

카카오톡·밴드·네이버·구글이 링크 미리보기와 검색 결과 썸네일로 쓰는 이미지.
밝은 바탕에 포인트 색(파랑)을 쓰고, 페이지 제목과 분류를 크게 넣는다.
- 결과: /assets/og/<주소>.png  (내용이 같으면 파일을 다시 쓰지 않아 저장소 변경이 생기지 않는다)
- 글꼴: _src/fonts/Pretendard (SIL Open Font License)
- Pillow가 없거나 글꼴을 못 읽으면 공용 이미지(/assets/og/default.png)로 대신한다.
"""
import hashlib
import io
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
FONTS = os.path.join(HERE, "..", "fonts")
W, H = 1200, 630
NAVY, BLUE, BLUE_SOFT, TEAL, MUTED, LINE, BG = (14, 42, 71), (43, 111, 194), (228, 238, 251), (46, 143, 140), (91, 107, 125), (221, 228, 236), (247, 249, 252)
VERSION = "1"   # 디자인을 바꾸면 올린다

LABELS = [
    ("/info/", "건강정보"), ("/food/recipes/", "저염 레시피"), ("/food/", "음식·식단"), ("/factcheck/", "팩트체크"),
    ("/tools/", "혈압 관리 도구"), ("/community/", "커뮤니티"), ("/policy/", "운영 정책"), ("/measure/", "바르게 재기"),
    ("/check7/", "7일 혈압 기록"), ("/clinic/", "진료 준비"), ("/mall/", "바른혈압몰"), ("/glossary/", "용어사전"),
    ("/faq/", "자주 묻는 질문"), ("/stats/", "통계"), ("/news/", "고혈압 소식"), ("/videos/", "영상"), ("/library/", "자료실"),
    ("/devices/", "혈압계 가이드"), ("/products/", "관리용품 가이드"), ("/family/", "가족 관리"), ("/report/", "진료 준비"),
]

try:
    from PIL import Image, ImageDraw, ImageFont
    _OK = True
except Exception:  # pragma: no cover
    _OK = False

_font_cache = {}


def _font(weight, size):
    key = (weight, size)
    if key not in _font_cache:
        _font_cache[key] = ImageFont.truetype(os.path.join(FONTS, f"Pretendard-{weight}.otf"), size)
    return _font_cache[key]


def label_for(path):
    for pre, name in LABELS:
        if path.startswith(pre):
            return name
    return "바른혈압"


def file_for(path):
    """/info/bp-140-90.html → /assets/og/info-bp-140-90.png"""
    p = re.sub(r"(index)?\.html$", "", path).strip("/")
    return "/assets/og/" + (p.replace("/", "-") or "home") + ".png"


def _wrap(draw, text, font, width, max_lines):
    words, lines, cur = text.split(" "), [], ""
    for w in words:
        trial = (cur + " " + w).strip()
        if draw.textlength(trial, font=font) <= width:
            cur = trial
            continue
        if cur:
            lines.append(cur)
        cur = w
        while draw.textlength(cur, font=font) > width:          # 띄어쓰기 없이 긴 낱말은 글자 단위로 자른다
            for i in range(len(cur), 0, -1):
                if draw.textlength(cur[:i], font=font) <= width:
                    lines.append(cur[:i]); cur = cur[i:]; break
    if cur:
        lines.append(cur)
    if len(lines) > max_lines:
        lines = lines[:max_lines]
        last = lines[-1]
        while last and draw.textlength(last + "…", font=font) > width:
            last = last[:-1]
        lines[-1] = last.rstrip(" ,·—") + "…"
    return lines


def _logo():
    p = os.path.join(HERE, "..", "..", "assets", "img", "logo@2x.png")
    im = Image.open(p).convert("RGBA")
    h = 64
    return im.resize((round(im.width * h / im.height), h), Image.LANCZOS)


def render(title, sub="", label="바른혈압"):
    im = Image.new("RGB", (W, H), "white")
    d = ImageDraw.Draw(im)
    # 바탕: 흰색 + 오른쪽 아래 옅은 하늘색 면, 왼쪽 포인트 막대
    d.rectangle([0, 0, 14, H], fill=BLUE)
    d.rounded_rectangle([760, 430, W + 40, H + 40], radius=40, fill=BG)
    # 심전도 모양 포인트 선
    y = 520
    pts = [(800, y), (900, y), (925, y - 34), (955, y + 40), (985, y - 70), (1012, y + 18), (1035, y), (1160, y)]
    d.line(pts, fill=TEAL, width=6, joint="curve")
    # 로고
    lg = _logo()
    im.paste(lg, (72, 52), lg)
    # 분류 칩
    f_chip = _font("Bold", 28)
    tw = d.textlength(label, font=f_chip)
    d.rounded_rectangle([72, 150, 72 + tw + 44, 150 + 52], radius=26, fill=BLUE_SOFT)
    d.text((72 + 22, 150 + 26), label, font=f_chip, fill=BLUE, anchor="lm")
    # 제목 (길이에 따라 글자 크기 조정)
    x, maxw = 72, W - 72 * 2
    for size in (68, 62, 56, 50):
        f_t = _font("Bold", size)
        lines = _wrap(d, title, f_t, maxw, 3)
        if len(lines) <= 2 or size == 50:
            break
    ty = 238
    for ln in lines:
        d.text((x, ty), ln, font=f_t, fill=NAVY)
        ty += int(size * 1.28)
    if sub:
        f_s = _font("Medium", 32)
        for ln in _wrap(d, sub, f_s, 640 if ty > 400 else maxw - 60, 2):
            if ty + 44 > 560:
                break
            d.text((x, ty + 10), ln, font=f_s, fill=MUTED)
            ty += 46
    # 아래 줄: 주소
    d.line([(72, 566), (700, 566)], fill=LINE, width=2)
    d.text((72, 590), "bareunbp.com", font=_font("Bold", 26), fill=NAVY, anchor="lm")
    d.text((262, 590), "올바른 정보, 건강한 오늘", font=_font("Medium", 24), fill=MUTED, anchor="lm")
    buf = io.BytesIO()
    im.quantize(colors=96, method=Image.MEDIANCUT, dither=Image.NONE).save(buf, "PNG", optimize=True)
    return buf.getvalue()


def split_title(title):
    """'혈압 140/90 — 고혈압일까, 다시 재야 할까' → ('혈압 140/90', '고혈압일까, 다시 재야 할까')"""
    t = re.sub(r"<[^>]+>", "", title).strip()
    if " — " in t:
        a, b = t.split(" — ", 1)
        return a.strip(), b.strip()
    return t, ""


_written = {}


def ensure(out_root, path, title, label=None, sub=None):
    """공유 이미지 파일을 만들고 사이트 경로를 돌려준다. 실패하면 공용 이미지 경로."""
    rel = file_for(path)
    if not _OK:
        return "/assets/og/default.png"
    main, s = split_title(title)
    if sub is not None:
        s = sub
    try:
        data = render(main, s, label or label_for(path))
    except Exception as e:  # 글꼴 문제 등 — 빌드는 계속
        print("  [og] 이미지 생성 실패:", path, e)
        return "/assets/og/default.png"
    dest = os.path.join(out_root, rel.lstrip("/"))
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    old = open(dest, "rb").read() if os.path.exists(dest) else None
    if old != data:
        with open(dest, "wb") as f:
            f.write(data)
    _written[rel] = hashlib.md5(data).hexdigest()[:8]
    return rel


def ensure_default(out_root):
    dest = os.path.join(out_root, "assets", "og", "default.png")
    if _OK:
        data = render("고혈압·혈압 관리 정보와 7일 기록", "진료지침과 공공기관 자료로 확인한 혈압 정보", "바른혈압")
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        if not os.path.exists(dest) or open(dest, "rb").read() != data:
            open(dest, "wb").write(data)
    return "/assets/og/default.png"
