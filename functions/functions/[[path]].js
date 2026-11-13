// 저장소 루트를 배포 폴더로 쓰므로, /functions/ 아래 소스 파일이 웹에 노출되지 않게 막는다
export function onRequest() {
  return new Response("Not Found", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8", "X-Robots-Tag": "noindex" } });
}
