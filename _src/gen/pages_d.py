# -*- coding: utf-8 -*-
"""회원(가입·로그인·마이페이지)과 자유게시판 화면 (2026-11)"""
from base import page, page_head, table, ICONS

ACCOUNT_JS = '<script src="/assets/js/account.js"></script>'
BOARD_JS = '<script src="/assets/js/board.js"></script>'
BOARD_CATS = ["자유", "정보공유", "생활습관", "음식·식단", "측정·기기", "가족·돌봄", "질문"]

RULES = [
    ("의료 조언을 하지 않습니다", "약을 시작·중단·변경하라고 권하거나, 다른 사람의 수치를 보고 병을 단정하는 글은 숨김 처리합니다. 약과 진단은 의료진과 상의할 영역입니다."),
    ("경험은 경험으로 나눕니다", "“저는 이렇게 해 봤어요”까지가 경험입니다. 내 경험이 모든 사람에게 맞는 것처럼 쓰지 않습니다."),
    ("개인정보를 올리지 않습니다", "본인이나 다른 사람의 실명, 연락처, 주소, 진료기록·처방전 사진은 올리지 않습니다. 누구나 볼 수 있는 공간입니다."),
    ("광고·홍보·판매 글은 지웁니다", "특정 제품·병원·보험·건강식품의 홍보, 구매 링크, 공동구매 모집은 올릴 수 없습니다."),
    ("응급 증상은 119입니다", "갑작스러운 심한 두통, 가슴 통증, 한쪽 마비, 말 어눌함이 있으면 글을 쓰지 말고 바로 119에 연락하세요."),
    ("서로 존중합니다", "비난·욕설·차별 표현, 같은 내용의 반복 게시는 숨김 처리합니다."),
]


def rules_box(compact=True):
    items = "".join(f"<li><b>{t}.</b>{'' if compact else ' ' + d}</li>" for t, d in RULES)
    more = '<p class="fine" style="margin:10px 0 0"><a href="/policy/community.html">게시판 운영 원칙 전체 보기</a></p>' if compact else ""
    return f'<div class="rules"><h3 style="margin-bottom:8px">게시판 이용 원칙</h3><ol>{items}</ol>{more}</div>'


# ------------------------------------------------------------------ 계정
def login_page():
    body = page_head("로그인", "저장한 글을 여러 기기에서 보고, 자유게시판에 글과 댓글을 쓸 수 있습니다.", [("/", "홈"), (None, "로그인")], "/account/login/") + """
<section class="section section--tight">
<div class="wrap">
<div class="auth">
<div class="card">
<form class="form" id="login-form" autocomplete="on">
<div class="field"><label for="l-id">아이디</label><input id="l-id" name="username" type="text" autocomplete="username" autocapitalize="none" spellcheck="false" required maxlength="20"></div>
<div class="field"><label for="l-pw">비밀번호</label><input id="l-pw" name="password" type="password" autocomplete="current-password" required></div>
<button class="btn btn--primary btn--block" type="submit">로그인</button>
<div class="form-msg" role="status"></div>
</form>
<div class="links"><a href="/account/signup/">회원가입</a><a href="/account/reset/">비밀번호를 잊으셨나요?</a></div>
</div>
<p class="fine" style="margin-top:16px">혈압 기록은 로그인과 관계없이 이 기기에만 저장됩니다. 로그인하지 않아도 <a href="/check7/">7일 혈압 기록</a>과 모든 글을 그대로 이용할 수 있습니다.</p>
</div>
</div>
</section>
"""
    return page("로그인", "바른혈압 로그인. 저장한 글 모아 보기와 자유게시판 이용.", "/account/login/", body, noindex=True, extra_js=ACCOUNT_JS)


def signup_page():
    consent = table(["수집 항목", "이용 목적", "보유 기간"], [
        ["(필수) 아이디, 비밀번호, 닉네임", "회원 식별, 로그인, 게시판 글쓴이 표시", "탈퇴 시 즉시 삭제"],
        ["(선택) 이메일", "비밀번호 분실 시 본인 확인, 중요 안내", "탈퇴 시 즉시 삭제"],
    ])
    body = page_head("회원가입", "글을 저장해 여러 기기에서 보고, 자유게시판에서 경험과 정보를 나눌 수 있습니다. 가입은 1분이면 됩니다.", [("/", "홈"), (None, "회원가입")], "/account/signup/") + f"""
<section class="section section--tight">
<div class="wrap">
<div class="auth" id="signup-box">
<div class="notice-soft" style="margin-bottom:16px"><b>혈압 기록은 계정에 저장하지 않습니다.</b> 가입해도 혈압 수치는 지금처럼 이 기기에만 남고, 서버로 보내지 않습니다. 이름·전화번호·생년월일도 받지 않습니다.</div>
<div class="card">
<form class="form" id="signup-form" autocomplete="on" novalidate>
<input class="hp" type="text" name="website" tabindex="-1" autocomplete="off">
<div class="field"><label for="s-id">아이디</label><input id="s-id" name="username" type="text" autocomplete="username" autocapitalize="none" spellcheck="false" required maxlength="20" placeholder="영문 소문자·숫자 4~20자"><div class="hint" data-hint="username" data-d="영문 소문자로 시작. 가입 후에는 바꿀 수 없습니다.">영문 소문자로 시작. 가입 후에는 바꿀 수 없습니다.</div></div>
<div class="row"><div class="field"><label for="s-pw">비밀번호</label><input id="s-pw" name="password" type="password" autocomplete="new-password" required minlength="8" placeholder="8자 이상"></div><div class="field"><label for="s-pw2">비밀번호 확인</label><input id="s-pw2" name="password2" type="password" autocomplete="new-password" required></div></div>
<div class="field"><label for="s-nick">닉네임</label><input id="s-nick" name="nickname" type="text" required maxlength="12" placeholder="한글·영문·숫자 2~12자"><div class="hint" data-hint="nickname" data-d="게시판에 표시되는 이름입니다. 실명은 쓰지 않는 것을 권합니다.">게시판에 표시되는 이름입니다. 실명은 쓰지 않는 것을 권합니다.</div></div>
<div class="field"><label for="s-email">이메일 <span style="font-weight:500">(선택)</span></label><input id="s-email" name="email" type="email" autocomplete="email" maxlength="120" placeholder="you@example.com"><div class="hint">비밀번호를 잊었을 때 본인 확인에 씁니다. 입력하지 않아도 가입할 수 있습니다.</div></div>
<div class="consent">
<label class="all"><input type="checkbox" id="agree-all"> <span>아래 내용에 모두 동의합니다</span></label>
<label><input type="checkbox" name="age14" data-c> <span>(필수) 만 14세 이상입니다</span></label>
<label><input type="checkbox" name="agree_terms" data-c> <span>(필수) <a href="/policy/terms.html" target="_blank" rel="noopener">이용약관</a>과 <a href="/policy/community.html" target="_blank" rel="noopener">게시판 운영 원칙</a>에 동의합니다</span></label>
<label><input type="checkbox" name="agree_privacy" data-c> <span>(필수) 개인정보 수집·이용에 동의합니다<small>아래 표의 항목을 회원 관리 목적으로 수집하며, 동의하지 않으면 가입할 수 없습니다. <a href="/policy/privacy.html" target="_blank" rel="noopener">개인정보 처리방침</a></small></span></label>
<label><input type="checkbox" name="newsletter" data-c> <span>(선택) 주간 혈압 레터를 이메일로 받습니다<small>이메일을 입력한 경우에만 발송하며, 언제든 수신거부할 수 있습니다.</small></span></label>
</div>
<details class="fine"><summary>수집하는 개인정보 자세히 보기</summary>{consent}</details>
<button class="btn btn--primary btn--block" type="submit">가입하기</button>
<div class="form-msg" role="status"></div>
</form>
<div class="links"><span>이미 회원이신가요?</span><a href="/account/login/">로그인</a></div>
</div>
</div>
</div>
</section>
"""
    return page("회원가입", "바른혈압 회원가입. 글 저장과 자유게시판 이용. 혈압 기록은 계정에 저장하지 않습니다.", "/account/signup/", body, noindex=True, extra_js=ACCOUNT_JS)


def reset_page():
    body = page_head("비밀번호 재설정", "가입할 때 받은 복구 코드로 비밀번호를 직접 다시 정할 수 있습니다.", [("/", "홈"), ("/account/login/", "로그인"), (None, "비밀번호 재설정")], "/account/reset/") + """
<section class="section section--tight">
<div class="wrap">
<div class="auth" id="reset-box">
<div class="card">
<form class="form" id="reset-form" autocomplete="off" novalidate>
<div class="field"><label for="r-id">아이디</label><input id="r-id" name="username" type="text" autocomplete="username" autocapitalize="none" spellcheck="false" required maxlength="20"></div>
<div class="field"><label for="r-code">복구 코드</label><input id="r-code" name="code" type="text" autocomplete="off" autocapitalize="characters" spellcheck="false" required maxlength="24" placeholder="XXXX-XXXX-XXXX-XXXX"><div class="hint">가입 직후 화면에 나온 16자리 코드입니다.</div></div>
<div class="row"><div class="field"><label for="r-pw">새 비밀번호</label><input id="r-pw" name="password" type="password" autocomplete="new-password" required minlength="8" placeholder="8자 이상"></div><div class="field"><label for="r-pw2">새 비밀번호 확인</label><input id="r-pw2" name="password2" type="password" autocomplete="new-password" required></div></div>
<button class="btn btn--primary btn--block" type="submit">비밀번호 바꾸기</button>
<div class="form-msg" role="status"></div>
</form>
</div>
<div class="card card--sky" style="margin-top:16px">
<h3>복구 코드가 없다면</h3>
<p style="margin:0;font-size:.95rem">가입할 때 등록한 이메일 주소로 <a href="mailto:spaceblank0100@gmail.com?subject=%5B%EB%B0%94%EB%A5%B8%ED%98%88%EC%95%95%5D%20%EB%B9%84%EB%B0%80%EB%B2%88%ED%98%B8%20%EC%9E%AC%EC%84%A4%EC%A0%95%20%EC%9A%94%EC%B2%AD">spaceblank0100@gmail.com</a>에 아이디를 적어 보내 주세요. 등록된 이메일과 일치하면 임시 비밀번호를 회신해 드립니다. 이메일을 등록하지 않은 계정은 본인 확인이 어려워 도와드리지 못할 수 있습니다.</p>
</div>
</div>
</div>
</section>
"""
    return page("비밀번호 재설정", "바른혈압 비밀번호 재설정.", "/account/reset/", body, noindex=True, extra_js=ACCOUNT_JS)


def my_page():
    body = page_head("마이페이지", "저장한 글, 내가 쓴 글, 계정 설정을 한곳에서 봅니다.", [("/", "홈"), (None, "마이페이지")], "/my/") + f"""
<section class="section section--tight">
<div class="wrap wrap--narrow" id="my">
<div id="my-loading" class="empty-box"><p style="margin:0">불러오는 중…</p></div>
<div id="my-guest" class="notice-soft" style="margin-bottom:18px" hidden><b>로그인하지 않은 상태입니다.</b> 아래는 이 기기에 저장한 글입니다. <a id="my-guest-login" href="/account/login/">로그인</a>하거나 <a href="/account/signup/?next=/my/">가입</a>하면 다른 기기에서도 볼 수 있고, 자유게시판에 글을 쓸 수 있습니다.</div>
<div id="my-user" class="my-head" hidden>
<div><h2 id="my-nick"></h2><div class="fine" id="my-id"></div></div>
<div style="display:flex;gap:8px"><a class="btn btn--secondary btn--sm" href="/community/board/write/">글쓰기</a><button type="button" class="btn btn--secondary btn--sm" id="logout-btn">로그아웃</button></div>
</div>
<div id="my-suspended" class="caution" hidden><b>이용 제한</b> — 운영 원칙 위반으로 글·댓글 쓰기가 제한된 상태입니다. 문의: spaceblank0100@gmail.com</div>
<div class="tabs">
<button type="button" data-tab="saved" aria-pressed="true">저장한 글</button>
<button type="button" data-tab="mine" aria-pressed="false">내 글·댓글</button>
<button type="button" data-tab="account" aria-pressed="false">계정 설정</button>
</div>

<div class="my-panel" data-panel="saved"><div id="saved-list"></div></div>

<div class="my-panel" data-panel="mine" hidden><div id="mine-list"><div class="empty-box"><p style="margin:0">불러오는 중…</p></div></div></div>

<div class="my-panel stack" data-panel="account" hidden>
<div id="temp-note" class="caution" hidden><b>임시 비밀번호로 로그인했습니다</b> — 아래 ‘비밀번호 바꾸기’에서 새 비밀번호를 정해 주세요.</div>
<div class="card"><h3>닉네임·이메일</h3>
<form class="form" id="profile-form" novalidate>
<div class="row"><div class="field"><label for="p-nick">닉네임</label><input id="p-nick" name="nickname" type="text" required maxlength="12"></div><div class="field"><label for="p-email">이메일 (선택)</label><input id="p-email" name="email" type="email" maxlength="120" placeholder="비밀번호 분실 시 본인 확인용"></div></div>
<div><button class="btn btn--primary btn--sm" type="submit">저장</button></div>
<div class="form-msg" role="status"></div>
</form></div>
<div class="card"><h3>비밀번호 바꾸기</h3>
<form class="form" id="password-form" autocomplete="off" novalidate>
<div class="field"><label for="pw-cur">현재 비밀번호</label><input id="pw-cur" name="current" type="password" autocomplete="current-password" required></div>
<div class="row"><div class="field"><label for="pw-new">새 비밀번호</label><input id="pw-new" name="next" type="password" autocomplete="new-password" required minlength="8" placeholder="8자 이상"></div><div class="field"><label for="pw-new2">새 비밀번호 확인</label><input id="pw-new2" name="next2" type="password" autocomplete="new-password" required></div></div>
<div><button class="btn btn--primary btn--sm" type="submit">비밀번호 바꾸기</button></div>
<div class="form-msg" role="status"></div>
</form></div>
<div class="card"><h3>복구 코드 새로 받기</h3>
<p class="fine">복구 코드를 잃어버렸다면 새로 받을 수 있습니다. 새 코드를 받으면 이전 코드는 쓸 수 없습니다.</p>
<form class="form" id="recovery-form" autocomplete="off" novalidate>
<div class="field"><label for="rc-cur">현재 비밀번호</label><input id="rc-cur" name="current" type="password" autocomplete="current-password" required></div>
<div><button class="btn btn--secondary btn--sm" type="submit">새 복구 코드 받기</button></div>
<div class="form-msg" role="status"></div>
</form></div>
<div class="card card--sky"><h3>혈압 기록은 어디에 있나요?</h3>
<p style="margin:0;font-size:.95rem">혈압 기록은 계정이 아니라 <b>이 기기의 브라우저</b>에 저장됩니다. 다른 기기로 옮기려면 <a href="/tools/backup/">기록 백업·복원</a>을 이용하세요. 로그아웃하거나 탈퇴해도 이 기기의 혈압 기록은 지워지지 않습니다.</p></div>
<div class="card"><h3>회원 탈퇴</h3>
<p class="fine">탈퇴하면 아이디·닉네임·이메일·저장한 글 목록이 즉시 삭제되고 되돌릴 수 없습니다. 쓴 글과 댓글은 ‘탈퇴한 회원’으로 표시되어 남으며, 함께 지우려면 아래를 체크하세요.</p>
<form class="form" id="withdraw-form" autocomplete="off" novalidate>
<div class="field"><label for="wd-cur">현재 비밀번호</label><input id="wd-cur" name="current" type="password" autocomplete="current-password" required></div>
<label class="agree"><input type="checkbox" name="delete_posts"> 내가 쓴 글과 댓글도 함께 삭제합니다.</label>
<label class="agree"><input type="checkbox" name="sure"> 탈퇴하면 계정을 되살릴 수 없다는 것을 확인했습니다.</label>
<div><button class="btn btn--secondary btn--sm" type="submit" style="color:var(--red);border-color:var(--red)">탈퇴하기</button></div>
<div class="form-msg" role="status"></div>
</form></div>
</div>
</div>
</section>
"""
    return page("마이페이지", "저장한 글, 내가 쓴 글, 계정 설정.", "/my/", body, noindex=True, extra_js=ACCOUNT_JS)


# ------------------------------------------------------------------ 자유게시판
def board_index():
    body = page_head("자유게시판", "혈압을 관리하며 겪은 일, 도움이 된 방법, 궁금한 점을 편하게 나누는 공간입니다. 글과 댓글은 회원만 쓸 수 있고, 읽기는 누구나 할 수 있습니다.", [("/", "홈"), ("/community/", "커뮤니티"), (None, "자유게시판")], "/community/board/") + f"""
<section class="section section--tight">
<div class="wrap">
<div class="board-layout">
<div>
<div class="tabs" id="board-cats" style="margin-bottom:14px"></div>
<div class="board-tools">
<form class="grow" id="board-search" role="search"><input id="board-q" type="search" placeholder="제목·내용 검색" aria-label="게시판 검색" maxlength="40"></form>
<div><select id="board-sort" aria-label="정렬"><option value="">최신순</option><option value="like">공감순</option><option value="comment">댓글순</option></select></div>
<a class="btn btn--primary btn--sm" href="/community/board/write/">글쓰기</a>
</div>
<p class="fine" id="board-count" style="margin:0 0 8px"></p>
<ul class="board-list" id="board-list"><li style="padding:24px 8px;color:var(--muted)">불러오는 중…</li></ul>
<div class="pager" id="board-pager"></div>
</div>
<aside class="stack">
{rules_box()}
<div class="card card--sky"><h3>의학적인 궁금증이라면</h3><p style="font-size:.93rem;margin:0 0 10px">수치의 의미, 검사, 약에 관한 질문은 편집팀이 근거를 붙여 답하는 <a href="/community/#qna">질문과 답변</a>에 남겨 주세요.</p><a class="btn btn--secondary btn--sm" href="/community/#ask">질문 남기기</a></div>
<div class="card"><h3>함께 해 보기</h3><p style="font-size:.93rem;margin:0 0 10px">7일 재기, 국물 남기기, 30분 걷기. 작은 습관을 같이 이어갑니다.</p><a class="btn btn--secondary btn--sm" href="/community/challenges/">챌린지 보기</a></div>
</aside>
</div>
</div>
</section>
"""
    return page("자유게시판 — 고혈압 관리 경험과 정보 나누기", "혈압을 관리하는 사람들이 경험과 정보를 나누는 자유게시판. 생활습관, 음식, 측정·기기, 가족 돌봄 이야기를 나눕니다.", "/community/board/", body, extra_js=BOARD_JS,
                keywords=["고혈압 게시판", "고혈압 커뮤니티", "혈압 관리 후기", "고혈압 카페", "혈압 경험담"])


def board_write():
    opts = "".join(f"<option>{c}</option>" for c in BOARD_CATS)
    body = page_head('<span id="write-title">글쓰기</span>', "", [("/", "홈"), ("/community/", "커뮤니티"), ("/community/board/", "자유게시판"), (None, "글쓰기")], "/community/board/write/") + f"""
<section class="section section--tight">
<div class="wrap">
<div class="board-layout" id="write-box">
<div>
<div id="write-loading" class="empty-box"><p style="margin:0">로그인 상태를 확인하는 중…</p></div>
<form class="form card" id="write-form" novalidate hidden>
<div class="row"><div class="field"><label for="w-cat">말머리</label><select id="w-cat" name="category">{opts}</select></div><div></div></div>
<div class="field"><label for="w-title">제목</label><input id="w-title" name="title" type="text" required maxlength="80" placeholder="2~80자"></div>
<div class="field"><label for="w-body">내용</label><textarea id="w-body" name="body" required maxlength="5000" style="min-height:280px" placeholder="무엇을 겪었고, 무엇을 해 봤는지 편하게 적어 주세요.&#10;&#10;정확한 수치나 약 이름보다 과정과 느낀 점을 나눠 주시면 다른 분들께 더 도움이 됩니다."></textarea><div class="hint" id="write-count">0 / 5,000자</div></div>
<label class="agree"><input type="checkbox" name="agree"> 연락처·진료기록 같은 개인정보, 약을 권하는 내용, 홍보를 넣지 않았습니다. <a href="/policy/community.html" target="_blank" rel="noopener">운영 원칙</a></label>
<div style="display:flex;gap:10px;justify-content:flex-end"><a class="btn btn--secondary" href="/community/board/">취소</a><button class="btn btn--primary" type="submit">올리기</button></div>
<div class="form-msg" role="status"></div>
</form>
</div>
<aside class="stack">{rules_box()}
<div class="caution" style="margin:0"><b>응급 상황이면 119</b> — 심한 두통, 가슴 통증, 마비, 말 어눌함은 글을 쓰지 말고 바로 연락하세요.</div>
</aside>
</div>
</div>
</section>
"""
    return page("글쓰기 — 자유게시판", "바른혈압 자유게시판 글쓰기.", "/community/board/write/", body, noindex=True, extra_js=BOARD_JS)


def board_post():
    body = f"""
<section class="section section--tight">
<div class="wrap">
<nav class="crumbs" aria-label="현재 위치"><a href="/">홈</a> › <a href="/community/">커뮤니티</a> › <a href="/community/board/">자유게시판</a></nav>
<div class="board-layout">
<div id="post-view"><div class="empty-box"><p style="margin:0">불러오는 중…</p></div></div>
<aside class="stack">
<div class="notice-soft"><b>회원이 쓴 글입니다.</b> 개인의 경험과 의견이며 의학적 조언이 아닙니다. 약과 진단은 의료진과 상의하세요.</div>
{rules_box()}
</aside>
</div>
</div>
</section>
"""
    return page("자유게시판", "바른혈압 자유게시판 글.", "/community/board/post/", body, noindex=True, extra_js=BOARD_JS)


def community_policy():
    rows = "".join(f"<h3>{i + 1}. {t}</h3><p>{d}</p>" for i, (t, d) in enumerate(RULES))
    body = page_head("게시판 운영 원칙", "자유게시판과 댓글에 적용되는 원칙입니다. 고혈압은 잘못된 정보가 건강에 직접 영향을 줄 수 있어, 일반 커뮤니티보다 조금 더 조심스럽게 운영합니다.", [("/", "홈"), (None, "게시판 운영 원칙")], "/policy/community.html") + f"""
<section class="section section--tight"><div class="wrap"><article class="article">
<h2>글을 쓸 때 지킬 것</h2>
{rows}
<h2>숨김과 삭제</h2>
<ul>
<li>원칙에 맞지 않는 글·댓글은 운영팀이 숨김 처리합니다. 숨김 처리된 글은 다른 사람에게 보이지 않고, 글쓴이에게는 사유가 표시됩니다.</li>
<li>서로 다른 회원 5명이 신고한 글·댓글은 운영팀이 확인할 때까지 자동으로 임시 숨김됩니다. 확인 결과 문제가 없으면 다시 보이게 합니다.</li>
<li>광고·도배, 불법 정보, 타인의 권리를 침해하는 글은 예고 없이 삭제할 수 있습니다.</li>
<li>원칙을 반복해서 어기면 글·댓글 쓰기를 제한하거나 회원 자격을 잃을 수 있습니다.</li>
</ul>
<h2>신고와 이의 제기</h2>
<ul>
<li>글·댓글의 ‘신고’ 버튼으로 알려 주세요. 신고 내용은 운영팀만 봅니다.</li>
<li>내 글이 숨김 처리된 것에 이의가 있거나, 내 권리(명예·사생활·저작권)를 침해한 글의 게시 중단을 요청하려면 <a href="mailto:spaceblank0100@gmail.com">spaceblank0100@gmail.com</a>으로 글 주소와 사유를 보내 주세요. 접수 후 영업일 기준 3일 안에 조치 결과를 알려 드립니다.</li>
</ul>
<h2>글의 권리와 이용</h2>
<ul>
<li>글의 저작권은 글쓴이에게 있습니다. 바른혈압은 서비스 안에서 글을 보여 주고 검색되게 하는 범위에서만 이용합니다.</li>
<li>글쓴이는 언제든 자신의 글과 댓글을 지울 수 있습니다. 지운 글은 화면에서 바로 사라지고, 분쟁 대응을 위해 30일 보관한 뒤 완전히 삭제합니다.</li>
<li>탈퇴하면 글쓴이 표시는 ‘탈퇴한 회원’으로 바뀝니다. 탈퇴할 때 글과 댓글을 함께 삭제하도록 선택할 수 있습니다.</li>
</ul>
<h2>바른혈압의 역할</h2>
<p>게시판의 글은 회원 개인의 경험과 의견이며, 바른혈압이 내용을 검증하거나 보증하지 않습니다. 편집팀이 근거를 확인해 쓰는 글은 <a href="/info/">건강정보</a>와 <a href="/factcheck/">팩트체크</a>에 있고, 의학적인 질문은 <a href="/community/#qna">질문과 답변</a>에서 근거를 붙여 답합니다.</p>
<p class="fine">시행일 2026-11-14</p>
</article></div></section>
"""
    return page("게시판 운영 원칙", "바른혈압 자유게시판 운영 원칙. 의료 조언 금지, 개인정보 보호, 광고 금지, 신고와 숨김 처리 기준.", "/policy/community.html", body)
