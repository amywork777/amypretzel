# Makes each project page's link preview, public/og/<slug>.jpg (2400 x 1260),
# in the same layout as the site's own preview (public/og-image.png): the
# wordmark, the project's homepage cover, its group, title and homepage line,
# and its URL. Everything is read off the running homepage, so nothing is
# typed twice. Run it after adding a project or changing a cover or line:
#
#   npm run dev                                   (on port 3000, or pass --site)
#   uv run --with playwright scripts/make-og.py [slug ...] [--site http://localhost:3001]
#
# Satori (next/og) can't read the licensed WOFF2 font, so these are rendered
# here in Arial, the site's metric-matched fallback, and committed.
import asyncio, html, os, sys
from playwright.async_api import async_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public", "og")
args = sys.argv[1:]
SITE = args[args.index("--site") + 1] if "--site" in args else "http://localhost:3000"
ONLY = [a for i, a in enumerate(args) if a != "--site" and (i == 0 or args[i - 1] != "--site")]

TPL = """<!doctype html><html><head><meta charset="utf-8"><style>
*{margin:0;box-sizing:border-box}
body{width:1200px;height:630px;background:#faf9f6;font-family:Arial,Helvetica,sans-serif;color:#1c1c1c;letter-spacing:-.015em;position:relative;overflow:hidden}
.mark{position:absolute;left:96px;top:72px;font-size:22px;font-weight:700;letter-spacing:-.02em}
.url{position:absolute;left:96px;bottom:62px;font-size:20px;color:rgba(28,28,28,.6)}
.pic{position:absolute;left:96px;top:168px;width:400px;height:300px;border-radius:10px;background:#f1f1f1;overflow:hidden;outline:1px solid rgba(28,28,28,.08);outline-offset:-1px}
.pic img{width:100%;height:100%;object-fit:cover;display:block}
.txt{position:absolute;left:552px;right:72px;top:168px;height:300px;display:flex;flex-direction:column;justify-content:center}
.group{font-size:21px;color:rgba(28,28,28,.55);margin-bottom:14px}
h1{font-weight:400;font-size:%TS%px;line-height:1.04;letter-spacing:-.035em;margin-bottom:22px;text-wrap:balance}
p{font-size:28px;line-height:1.3;text-wrap:pretty}
</style></head><body>
<div class="mark">amypretzel</div>
<div class="pic"><img src="%SITE%%IMG%"></div>
<div class="txt"><div class="group">%GROUP%</div><h1>%TITLE%</h1><p>%LINE%</p></div>
<div class="url">amypretzel.com%PATH%</div>
</body></html>"""

ROWS_JS = """[...document.querySelectorAll('#work .ui-list a')].map(a => {
  const img = a.querySelector('img');
  return {
    href: a.getAttribute('href'),
    img: img ? new URL(img.src, location.href).searchParams.get('url') : null,
    group: a.closest('details.ui-group')?.querySelector('summary')?.innerText.split('\\n')[0].trim() || '',
    lines: a.innerText.split('\\n').map(x => x.trim()).filter(Boolean),
  };
})"""


async def main():
    os.makedirs(OUT, exist_ok=True)
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        home = await browser.new_page()
        await home.goto(SITE + "/", wait_until="networkidle")
        await home.evaluate("document.querySelectorAll('#work details').forEach(d => d.open = true)")
        rows = await home.evaluate(ROWS_JS)
        page = await browser.new_page(viewport={"width": 1200, "height": 630}, device_scale_factor=2)
        for r in rows:
            slug = r["href"].rstrip("/").split("/")[-1]
            if (ONLY and slug not in ONLY) or not r["img"]:
                continue
            title, line = r["lines"][0], r["lines"][1]
            size = 68 if len(title) <= 16 else 56 if len(title) <= 26 else 48
            doc = (TPL.replace("%TS%", str(size)).replace("%SITE%", SITE).replace("%IMG%", r["img"])
                   .replace("%GROUP%", html.escape(r["group"])).replace("%TITLE%", html.escape(title))
                   .replace("%LINE%", html.escape(line)).replace("%PATH%", html.escape(r["href"])))
            await page.set_content(doc, wait_until="networkidle")
            await page.screenshot(path=os.path.join(OUT, f"{slug}.jpg"), type="jpeg", quality=86)
            print("made", slug)
        await browser.close()


asyncio.run(main())
