import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { Script } from "node:vm";

const projectRoot = resolve(import.meta.dirname, "..");
const distDirectory = resolve(projectRoot, "dist-standalone");
const sourceHtml = await readFile(resolve(distDirectory, "index.html"), "utf8");

const scriptMatch = sourceHtml.match(/<script[^>]+src="([^"]+)"[^>]*><\/script>/);
const styleMatch = sourceHtml.match(/<link[^>]+href="([^"]+\.css)"[^>]*>/);

if (!scriptMatch || !styleMatch) {
  throw new Error("没有在构建产物中找到 JavaScript 或 CSS 文件。请运行 npm run build:standalone。");
}

const scriptPath = resolve(distDirectory, scriptMatch[1].replace(/^\//, ""));
const stylePath = resolve(distDirectory, styleMatch[1].replace(/^\//, ""));
const [script, style] = await Promise.all([
  readFile(scriptPath, "utf8"),
  readFile(stylePath, "utf8"),
]);
// A classic script avoids file:// module loading restrictions.
new Script(script);

const standaloneHtml = sourceHtml
  .replace(styleMatch[0], () => `<style>${style.replaceAll("</style", "<\\/style")}</style>`)
  .replace(
    "<meta name=\"description\" content=\"轻量、离线的 Windows 日历备忘录\" />",
    "<meta name=\"description\" content=\"轻量、离线、可双击运行的日历备忘录\" />",
  )
  .replace(scriptMatch[0], "")
  .replace("</body>", () => `<script>${script.replaceAll("</script", "<\\/script")}</script>\n  </body>`);

const outputPath = resolve(projectRoot, "CalendarMemo-Standalone.html");
await writeFile(outputPath, standaloneHtml, "utf8");
console.log(`已生成：${outputPath}`);
