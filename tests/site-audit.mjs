import { existsSync } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const htmlFiles = (await readdir(root)).filter((name) => name.endsWith(".html")).sort();
const errors = [];
const warnings = [];
const pages = new Map();
const canonicalToFile = new Map();
const titleToFile = new Map();

function report(collection, file, message) {
  collection.push(`${file}: ${message}`);
}

function routeForFile(file) {
  if (file === "index.html") return "/";
  return `/${file.slice(0, -5)}`;
}

function attributeValues(html, attribute) {
  const expression = new RegExp(`\\b${attribute}\\s*=\\s*["']([^"']+)["']`, "gi");
  return [...html.matchAll(expression)].map((match) => match[1]);
}

function firstMatch(html, expression) {
  return html.match(expression)?.[1]?.trim() || "";
}

for (const file of htmlFiles) {
  const html = await readFile(path.join(root, file), "utf8");
  const route = routeForFile(file);
  const ids = new Set(attributeValues(html, "id"));
  const title = firstMatch(html, /<title>([\s\S]*?)<\/title>/i);
  const description = firstMatch(
    html,
    /<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i
  );
  const canonical = firstMatch(
    html,
    /<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i
  );
  const robots = firstMatch(
    html,
    /<meta\s+name=["']robots["']\s+content=["']([^"']+)["']/i
  ).toLowerCase();
  const h1Count = (html.match(/<h1\b/gi) || []).length;
  const icon = firstMatch(
    html,
    /<link\s+rel=["']icon["']\s+href=["']([^"']+)["']/i
  );
  const noindex = robots.includes("noindex");

  pages.set(route, { canonical, description, file, html, ids, noindex, title });

  if (h1Count !== 1) report(errors, file, `expected one h1, found ${h1Count}`);
  if (!title) report(errors, file, "missing title");
  if (!icon) report(errors, file, "missing site icon");
  if (!noindex && !description) report(errors, file, "missing meta description");
  if (!canonical && file !== "test-reservation.html") report(errors, file, "missing canonical URL");
  if (canonical) {
    if (!canonical.startsWith("https://www.carolinasedan.com/")) {
      report(errors, file, `canonical is outside the preferred HTTPS www origin: ${canonical}`);
    }
    if (canonicalToFile.has(canonical)) {
      report(errors, file, `duplicate canonical also used by ${canonicalToFile.get(canonical)}`);
    } else {
      canonicalToFile.set(canonical, file);
    }
  }
  if (title) {
    if (titleToFile.has(title)) report(warnings, file, `duplicate title also used by ${titleToFile.get(title)}`);
    else titleToFile.set(title, file);
  }

  for (const match of html.matchAll(/<img\b[^>]*>/gi)) {
    if (!/\balt\s*=\s*["'][^"']*["']/i.test(match[0])) {
      report(errors, file, `image is missing an alt attribute: ${match[0].slice(0, 90)}`);
    }
  }
  for (const match of html.matchAll(/<a\b[^>]*\btarget\s*=\s*["']_blank["'][^>]*>/gi)) {
    if (!/\brel\s*=\s*["'][^"']*noopener[^"']*["']/i.test(match[0])) {
      report(errors, file, `external link opening a new tab is missing rel="noopener": ${match[0].slice(0, 90)}`);
    }
  }

  for (const match of html.matchAll(/<script\s+type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/gi)) {
    try {
      JSON.parse(match[1]);
    } catch (error) {
      report(errors, file, `invalid JSON-LD: ${error.message}`);
    }
  }
}

function routeToFile(pathname) {
  if (pathname === "/") return "index.html";
  const direct = `${pathname.replace(/^\//, "")}.html`;
  return htmlFiles.includes(direct) ? direct : "";
}

for (const page of pages.values()) {
  const base = `https://www.carolinasedan.com${routeForFile(page.file)}`;
  for (const value of [...attributeValues(page.html, "href"), ...attributeValues(page.html, "src")]) {
    if (value.includes("${") || /^(mailto:|tel:|sms:|data:|javascript:)/i.test(value)) continue;
    let url;
    try {
      url = new URL(value, base);
    } catch {
      report(errors, page.file, `invalid URL: ${value}`);
      continue;
    }
    if (url.origin !== "https://www.carolinasedan.com") continue;

    if (url.pathname.startsWith("/assets/")) {
      if (!existsSync(path.join(root, url.pathname.slice(1)))) {
        report(errors, page.file, `missing image or asset: ${url.pathname}`);
      }
      continue;
    }
    if (["/styles.css", "/team.css", "/script.js", "/sitemap.xml", "/robots.txt", "/llms.txt"].includes(url.pathname)) {
      if (!existsSync(path.join(root, url.pathname.slice(1)))) report(errors, page.file, `missing file: ${url.pathname}`);
      continue;
    }

    const targetFile = routeToFile(url.pathname);
    if (!targetFile) {
      report(errors, page.file, `local link has no matching page: ${value}`);
      continue;
    }
    if (url.hash) {
      const target = pages.get(routeForFile(targetFile));
      const id = decodeURIComponent(url.hash.slice(1));
      if (!target?.ids.has(id)) report(errors, page.file, `fragment target does not exist: ${value}`);
    }
  }
}

const sitemap = await readFile(path.join(root, "sitemap.xml"), "utf8");
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
for (const value of sitemapUrls) {
  const url = new URL(value);
  const file = routeToFile(url.pathname);
  if (!file) report(errors, "sitemap.xml", `URL has no matching HTML page: ${value}`);
  else if (pages.get(routeForFile(file))?.noindex) report(errors, "sitemap.xml", `noindex page is listed: ${value}`);
}
for (const page of pages.values()) {
  if (page.noindex || page.file === "test-reservation.html") continue;
  if (!sitemapUrls.includes(page.canonical)) report(warnings, page.file, "indexable canonical is missing from sitemap");
}

const worker = await readFile(path.join(root, "worker.js"), "utf8");
const pageRouteBlock = firstMatch(worker, /const PAGE_ROUTES = \{([\s\S]*?)\n\};/);
const workerRoutes = new Map(
  [...pageRouteBlock.matchAll(/"(\/[^"\n]*)"\s*:\s*"(\/[^"\n]+\.html)"/g)].map((match) => [match[1], match[2]])
);
for (const [route, target] of workerRoutes) {
  if (!existsSync(path.join(root, target.slice(1)))) report(errors, "worker.js", `route ${route} targets missing file ${target}`);
}
for (const page of pages.values()) {
  if (page.file === "test-reservation.html") continue;
  const route = routeForFile(page.file);
  if (workerRoutes.get(route) !== `/${page.file}`) report(errors, page.file, `missing or mismatched Worker route for ${route}`);
}

const staticBlock = firstMatch(worker, /const STATIC_FILES = new Set\(\[([\s\S]*?)\n\]\);/);
for (const match of staticBlock.matchAll(/"(\/[^"\n]+)"/g)) {
  if (!existsSync(path.join(root, match[1].slice(1)))) report(errors, "worker.js", `static route targets missing file ${match[1]}`);
}

const assetIgnore = await readFile(path.join(root, ".assetsignore"), "utf8");
if (!/^tests\/$/m.test(assetIgnore)) report(errors, ".assetsignore", "tests directory is not excluded from deployment");
if (!/^test-reservation\.html$/m.test(assetIgnore)) {
  report(errors, ".assetsignore", "test reservation page is not excluded from deployment");
}
for (const privateAsset of [
  ".git",
  "*.md",
  "worker.js",
  "wrangler.jsonc",
  "functions/",
  "_headers",
  "_redirects",
  ".assetsignore",
  ".gitignore",
]) {
  if (!assetIgnore.split(/\r?\n/).includes(privateAsset)) {
    report(errors, ".assetsignore", `repository support file is not excluded from deployment: ${privateAsset}`);
  }
}

const customerFacing = [...pages.values()]
  .filter((page) => !["admin.html", "test-reservation.html"].includes(page.file))
  .map((page) => page.html)
  .join("\n");

for (const forbidden of [
  /919[\s-]*259[\s-]*4030/i,
  /sell certainty/i,
  /build the site/i,
  /high-intent content/i,
  /hotel-focused seo/i,
  /search assistants can quote/i,
  /partial source - date needs confirmation/i,
  /<p class=["']eyebrow["']>recovered post/i,
  /<p class=["']form-note["']>source status:/i,
  /<h3>google business profile post<\/h3>/i,
  /<h3>facebook post<\/h3>/i,
]) {
  if (forbidden.test(customerFacing)) report(errors, "customer-facing pages", `contains internal or obsolete text: ${forbidden}`);
}
if (!customerFacing.includes("919-924-0568")) report(errors, "site", "current phone number is missing");
if (!customerFacing.includes("booking@carolinasedan.com")) report(errors, "site", "booking email is missing");
if (!pages.get("/")?.html.includes("service beginning at $75")) {
  report(errors, "index.html", "Chapel Hill-to-RDU $75 starting rate is missing from customer copy");
}
if (!pages.get("/about")?.html.includes("<strong>Beck Kasimov</strong><span>Owner</span>")) {
  report(errors, "about.html", "owner role is missing from the team section");
}

console.log(`Audited ${htmlFiles.length} HTML files and ${sitemapUrls.length} sitemap URLs.`);
for (const warning of warnings) console.warn(`WARNING ${warning}`);
for (const error of errors) console.error(`ERROR ${error}`);
if (errors.length) process.exitCode = 1;
else console.log(`PASS with ${warnings.length} warning${warnings.length === 1 ? "" : "s"}.`);
