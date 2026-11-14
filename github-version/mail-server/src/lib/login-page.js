const escapeHtml = (s) => String(s).replace(/[&<>"']/g, c => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[c]));

export function loginPage({ configured, message = '', logout = false }) {
  const title = logout ? '로그아웃' : 'Agentic Inbox';
  return `<!doctype html><html lang="ko"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>${title}</title>
<style>
*{box-sizing:border-box}body{margin:0;background:#f7f8fa;color:#17202e;font:15px/1.6 system-ui,sans-serif;min-height:100dvh;display:grid;place-items:center;padding:24px}
main{width:100%;max-width:420px;padding:36px;background:white;border:1px solid #e2e6eb;border-radius:16px;box-shadow:0 8px 32px #18253b08}
.brand{color:#637082;font-size:12px;font-weight:700;letter-spacing:.12em}h1{font-size:28px;letter-spacing:-.6px;margin:12px 0}p{color:#647083}
label{display:block;font-weight:600;margin:24px 0 8px}input{width:100%;padding:12px;border:1px solid #b9c2ce;border-radius:8px;font:inherit}
input:focus{outline:2px solid #2563eb;outline-offset:2px}button{width:100%;background:#17202e;color:white;border:0;padding:13px;border-radius:8px;font:inherit;font-weight:600;margin-top:20px;cursor:pointer}
.message{background:#fff5e8;color:#8a4800;border-radius:8px;padding:12px;font-size:14px}a{color:#285bb0}code{overflow-wrap:anywhere}
</style></head><body><main><div class="brand">AGENT MAIL</div><h1>${title}</h1>
${logout ? '<p>현재 기기의 Inbox 세션을 종료합니다.</p><form action="/auth/logout" method="post"><button type="submit">로그아웃</button></form><p><a href="/">Inbox로 돌아가기</a></p>' : `
<p>메일과 캠페인 초안에 접근하려면 관리자 비밀번호를 입력하세요.</p>
${message ? `<p class="message" role="alert">${escapeHtml(message)}</p>` : ''}
${configured ? '<form action="/auth/login" method="post"><label for="password">관리자 비밀번호</label><input id="password" name="password" type="password" autocomplete="current-password" required maxlength="1024"><button type="submit">로그인</button></form>' : '<p class="message" role="status">관리자 로그인 설정이 필요합니다. 프로젝트 Secrets에 16자 이상의 <code>INBOX_ADMIN_PASSWORD</code>를 추가한 후 다시 게시하세요. 설정 전에는 메일 접근이 차단됩니다.</p>'}`}
</main></body></html>`;
}
