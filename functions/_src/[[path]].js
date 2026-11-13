// /_src/ 아래 생성기 소스는 배포 대상이 아니므로 외부에 노출하지 않는다.
export function onRequest() {
  return new Response("Not Found", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8", "X-Robots-Tag": "noindex" } });
}
