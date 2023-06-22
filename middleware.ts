import { escape } from "html-escaper";
import { load } from "cheerio";

const html = (templates: TemplateStringsArray, ...values: string[]) =>
  templates
    .map(
      (template, index) =>
        template + (values.length > index ? escape(values[index] ?? "") : "")
    )
    .join("");

const buildHtml = ({
  title = "",
  description = "",
  img = "",
  originalUrl = "",
}: {
  title: string;
  description: string;
  img: string;
  originalUrl: string;
}) => html`
  <!DOCTYPE html>
  <html lang="zh-Hant">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>${title} | ptt.vdustr.dev</title>
      <meta name="description" content="${description}" />
      <meta name="og:sitename" content="ptt.vdustr.dev" />
      <meta property="og:title" content="${title}" />
      <meta property="og:description" content="${description}" />
      <meta property="og:image" content="${img}" />
      <link
        href="https://cdn.jsdelivr.net/npm/@picocss/pico@2.0.0-alpha1/css/pico.min.css"
        rel="stylesheet"
      />
      <script>
        setTimeout(() => {
          location.href = "${originalUrl}";
        }, 5000);
      </script>
    </head>
    <body>
      <section class="container">
        <h1>${title}</h1>
        <article>
          <p>${description}</p>
          <img src="${img}" />
        </article>
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7516253226822868"
          crossorigin="anonymous"
        ></script>
        <!-- Responsive Square -->
        <ins
          class="adsbygoogle"
          style="display:block"
          data-ad-client="ca-pub-7516253226822868"
          data-ad-slot="1066948046"
          data-ad-format="auto"
          data-full-width-responsive="true"
        ></ins>
        <script>
          (adsbygoogle = window.adsbygoogle || []).push({});
        </script>
        <p>
          <a href="${originalUrl}">原始連結：${originalUrl}</a>
        </p>
        <p>您將在 5 秒後被導向原始連結，若無法導向，請點擊上方連結。</p>
      </section>
    </body>
    <footer>
      <div class="container">
        <p>Powered by <a href="https://vdustr.dev/">VdustR</a></p>
      </div>
    </footer>
  </html>
`;

const pathRegex =
  /^\/(?<boardId>[\w\-]+)\/(?<articleId>M\.\d+\.A\.[A-Za-z0-9]{3})$/;

function getOg(html: string) {
  const $ = load(html);
  const title =
    $("meta[property='og:title']").attr("content") ?? $("title").text();
  const description =
    $("meta[property='og:description']").attr("content") ??
    $("meta[name='description']").attr("content") ??
    "";
  const img = $("meta[property='og:image']").attr("content") ?? "";
  return { title, description, img };
}

export default async function middleware(request: Request) {
  const pathname = new URL(request.url).pathname;
  const matches = pathname.match(pathRegex);
  if (!matches) {
    return;
  }
  const boardId = matches.groups?.["boardId"] ?? "";
  const articleId = matches.groups?.["articleId"] ?? "";
  const pttResponse = await fetch(
    `https://www.ptt.cc/bbs/${boardId}/${articleId}.html`
  );
  const pttHtml = await pttResponse.text();
  const { title, description, img } = getOg(pttHtml);
  const html = buildHtml({
    title,
    description,
    img,
    originalUrl: `https://www.ptt.cc/bbs/${boardId}/${articleId}.html`,
  });
  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=UTF-8",
      "Cache-Control": "max-age=3600",
    },
  });
}
