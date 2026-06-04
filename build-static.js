const fs = require("fs");
const vm = require("vm");

let script = fs.readFileSync("script.js", "utf8");
script = script.replace(
  /renderPredictions\(\);\s*renderTopicFilters\(\);\s*renderTopics\(\);\s*renderQuestions\(\);\s*setupEvents\(\);\s*$/s,
  "globalThis.__data = { topics, allQuestions };"
);

const sandbox = {};
vm.runInNewContext(script, sandbox);

const { topics, allQuestions } = sandbox.__data;
const css = fs.readFileSync("styles.css", "utf8");

const esc = (value) =>
  String(value).replace(/[&<>"]/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;"
  })[ch]);

const label = {
  title: "BUSN7005 \u590d\u4e60\u77e5\u8bc6\u70b9\u548c\u8bba\u8ff0\u9898",
  description:
    "\u8fd9\u4e2a\u7248\u672c\u4e0d\u4f9d\u8d56 JavaScript\u3002\u624b\u673a\u6d4f\u89c8\u5668\u3001GitHub Pages\u3001Gemini \u6216\u666e\u901a\u6587\u4ef6\u9884\u89c8\u91cc\uff0c\u90fd\u5e94\u8be5\u80fd\u76f4\u63a5\u770b\u5230\u77e5\u8bc6\u70b9\u548c\u9898\u76ee\u5185\u5bb9\u3002",
  quickNav: "\u5feb\u901f\u76ee\u5f55",
  topics: "\u77e5\u8bc6\u70b9",
  questions: "\u9898\u76ee",
  jumpToQuestion: "\u76f4\u63a5\u8df3\u5230\u9898\u76ee",
  tutorialQuestions: "Tutorial Questions",
  extraPractice: "Extra Practice",
  topicIndex: "\u77e5\u8bc6\u70b9\u76ee\u5f55",
  knowledge: "\u4e2d\u6587\u8bb2\u89e3\uff1a\u8981\u4f1a\u5199\u4ec0\u4e48",
  questionIndex: "\u9898\u76ee\u76ee\u5f55",
  zhQuestion: "\u4e2d\u6587\u9898\u76ee",
  zhApproach: "\u4e2d\u6587\u7b54\u9898\u601d\u8def",
  zhAnswer: "\u4e2d\u6587\u56de\u7b54",
  vocab: "\u9700\u8981\u80cc\u8bf5\u7684\u82f1\u6587\u5355\u8bcd"
};

const topicName = (id) => topics.find((topic) => topic.id === id)?.name || id;
const questionItems = allQuestions.map((question, index) => ({ question, index }));

const tutorialGroups = questionItems.reduce((groups, item) => {
  const match = item.question.source.match(/^Week\s+(\d+)\s+Tutorial$/);
  if (!match) return groups;
  const key = `Week ${match[1]} Tutorial`;
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(item);
  return groups;
}, new Map());

const extraPracticeItems = questionItems.filter((item) => item.question.source === "Extra Practice");

const renderQuestionLink = ({ question, index }) =>
  `<li><a data-nav-link href="#q-${index + 1}">Q${index + 1}. ${esc(question.title)}</a></li>`;

const renderPlainQuestionLink = ({ question, index }) =>
  `<li><a href="#q-${index + 1}">Q${index + 1}. ${esc(question.title)}</a></li>`;

const renderGroupedQuestions = (linkRenderer) => `
  <div class="question-groups">
    <h3>${label.tutorialQuestions}</h3>
    ${Array.from(tutorialGroups.entries())
      .map(
        ([source, items], groupIndex) => `
      <details ${groupIndex === 0 ? "open" : ""}>
        <summary>${esc(source)} <span>${items.length}</span></summary>
        <ol>${items.map(linkRenderer).join("\n")}</ol>
      </details>`
      )
      .join("\n")}
    <h3>${label.extraPractice}</h3>
    <details>
      <summary>${label.extraPractice} <span>${extraPracticeItems.length}</span></summary>
      <ol>${extraPracticeItems.map(linkRenderer).join("\n")}</ol>
    </details>
  </div>`;

const jumpOptions = allQuestions
  .map((question, index) => `<option value="q-${index + 1}">Q${index + 1}. ${esc(question.title)} - ${esc(question.source)}</option>`)
  .join("\n");

const quickNav = `
<aside class="quick-nav" aria-label="${label.quickNav}">
  <h2>${label.quickNav}</h2>
  <label class="jump-label" for="questionJump">${label.jumpToQuestion}</label>
  <div class="jump-row">
    <select id="questionJump" class="jump-select">
      <option value="">${label.jumpToQuestion}</option>
      ${jumpOptions}
    </select>
    <button class="jump-button" type="button" id="questionJumpButton">\u8df3\u8f6c</button>
  </div>
  <details open>
    <summary>${label.topics}</summary>
    <ol>${topics
      .map((topic) => `<li><a data-nav-link href="#topic-${esc(topic.id)}">${esc(topic.name)}</a></li>`)
      .join("\n")}</ol>
  </details>
  <details>
    <summary>${label.questions}</summary>
    ${renderGroupedQuestions(renderQuestionLink)}
  </details>
</aside>`;

const topicCards = topics
  .map(
    (topic) => `
  <section class="static-card" id="topic-${esc(topic.id)}">
    <h2>${esc(topic.name)} <span>${esc(topic.probability)}</span></h2>
    <p class="source-line">Revision priority, not exam prediction</p>
    <p>${esc(topic.reason)}</p>
    <h3>${label.knowledge}</h3>
    <ul>${topic.knowledge.map((item) => `<li>${esc(item)}</li>`).join("\n")}</ul>
    <h3>English keywords</h3>
    <ul>${topic.english.map((item) => `<li>${esc(item)}</li>`).join("\n")}</ul>
    <h3>Writing move</h3>
    <p>${esc(topic.writing)}</p>
  </section>`
  )
  .join("\n");

const questionCards = allQuestions
  .map(
    (question, index) => `
  <section class="static-card question" id="q-${index + 1}">
    <p class="source-line">${esc(question.source)} | ${esc(topicName(question.topic))}</p>
    <h2>Q${index + 1}. ${esc(question.title)}</h2>
    <h3>English question</h3>
    <p>${esc(question.enQuestion)}</p>
    <h3>${label.zhQuestion}</h3>
    <p>${esc(question.zhQuestion)}</p>
    <h3>${label.zhApproach}</h3>
    <ul>${question.zhApproach.map((item) => `<li>${esc(item)}</li>`).join("\n")}</ul>
    <h3>${label.zhAnswer}</h3>
    <p>${esc(question.zhAnswer)}</p>
    <h3>English answer</h3>
    <p>${esc(question.enAnswer)}</p>
    <h3>${label.vocab}</h3>
    <ul>${question.vocab.map((item) => `<li>${esc(item)}</li>`).join("\n")}</ul>
  </section>`
  )
  .join("\n");

const html = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>BUSN7005 Study Site</title>
<style>
${css}
body { background: #f7f8fb; }
html { scroll-padding-top: 18px; }
.page-layout { display: grid; grid-template-columns: minmax(220px, 280px) minmax(0, 1fr); gap: 22px; width: min(1320px, calc(100% - 28px)); margin: 0 auto; align-items: start; }
.static-shell { width: 100%; min-width: 0; padding: 28px 0 60px; }
.static-hero { padding: 24px 0 18px; }
.static-hero h1 { font-size: clamp(30px, 6vw, 52px); margin-bottom: 12px; }
.quick-nav { position: sticky; top: 14px; max-height: calc(100vh - 28px); overflow: auto; margin-top: 28px; padding: 16px; border: 1px solid var(--line); border-radius: 8px; background: #fff; box-shadow: 0 8px 28px rgba(24,32,44,.05); }
.quick-nav h2 { margin: 0 0 12px; font-size: 18px; }
.quick-nav details { border-top: 1px solid var(--line); padding: 10px 0; }
.quick-nav details:first-of-type { border-top: 0; }
.quick-nav summary { cursor: pointer; font-weight: 800; color: var(--accent-2); }
.quick-nav summary span { float: right; color: var(--muted); font-size: 12px; }
.quick-nav h3 { margin: 12px 0 6px; color: var(--accent); font-size: 12px; text-transform: uppercase; }
.quick-nav ol { margin: 10px 0 0; padding-left: 20px; }
.quick-nav li { margin: 0 0 8px; font-size: 14px; line-height: 1.35; }
.quick-nav a { color: var(--ink); text-decoration: none; }
.quick-nav a:hover { color: var(--accent); text-decoration: underline; }
.quick-nav a.is-active { color: #fff; background: var(--accent); border-radius: 6px; display: block; margin-left: -6px; padding: 4px 6px; text-decoration: none; }
.jump-label { display: block; margin: 0 0 6px; color: var(--accent-2); font-size: 12px; font-weight: 800; text-transform: uppercase; }
.jump-row { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 8px; margin: 0 0 12px; }
.jump-select { width: 100%; min-width: 0; padding: 9px 10px; border: 1px solid var(--line); border-radius: 8px; background: #fff; color: var(--ink); font: inherit; font-size: 14px; }
.jump-button { padding: 9px 10px; border: 1px solid var(--accent); border-radius: 8px; background: var(--accent); color: #fff; font: inherit; font-size: 14px; font-weight: 800; cursor: pointer; }
.jump-button:hover { filter: brightness(0.95); }
.question-groups > details { padding-left: 0; }
.static-card { margin: 18px 0; padding: 22px; border: 1px solid var(--line); border-radius: 8px; background: #fff; box-shadow: 0 8px 28px rgba(24,32,44,.05); scroll-margin-top: 18px; }
.static-card h2 { font-size: 25px; display: flex; justify-content: space-between; gap: 12px; }
.static-card h2 span { color: var(--accent-2); font-size: 18px; white-space: nowrap; }
.static-card h3 { margin-top: 18px; color: var(--accent-2); font-size: 15px; text-transform: uppercase; }
.static-card li, .static-card p { font-size: 17px; line-height: 1.75; }
.source-line { color: var(--accent); font-weight: 800; }
.index-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 10px; padding: 0; list-style: none; }
.index-list a { display: block; padding: 10px 12px; border: 1px solid var(--line); border-radius: 8px; color: var(--ink); background: #fff; text-decoration: none; }
.index-list a:hover { border-color: var(--accent); color: var(--accent); }
.static-index-group { margin: 18px 0; }
.static-index-group h3 { margin: 18px 0 10px; color: var(--accent); font-size: 15px; text-transform: uppercase; }
.static-index-group details { margin: 10px 0; padding: 12px; border: 1px solid var(--line); border-radius: 8px; background: #fbfcfe; }
.static-index-group summary { cursor: pointer; color: var(--accent-2); font-weight: 800; }
.static-index-group summary span { float: right; color: var(--muted); font-size: 13px; }
@media (max-width: 900px) {
  html { scroll-padding-top: 18px; }
  .page-layout { display: block; width: min(1000px, calc(100% - 24px)); }
  .quick-nav { position: fixed; left: 12px; right: 12px; top: 10px; z-index: 20; max-height: none; margin-top: 0; padding: 0; overflow: visible; border-color: transparent; background: transparent; box-shadow: none; pointer-events: none; }
  .quick-nav h2 { font-size: 16px; }
  .quick-nav h2::before { content: "\u5feb\u901f\u76ee\u5f55"; display: inline-block; padding: 10px 12px; border-radius: 999px; background: var(--accent); color: #fff; box-shadow: 0 8px 24px rgba(24,32,44,.2); pointer-events: auto; }
  .quick-nav.is-open { max-height: calc(100vh - 20px); overflow: auto; padding: 14px; border-color: var(--line); background: #fff; box-shadow: 0 12px 34px rgba(24,32,44,.18); pointer-events: auto; }
  .quick-nav.is-open h2::before { content: "\u6536\u8d77\u76ee\u5f55"; }
  .quick-nav .jump-label,
  .quick-nav .jump-row,
  .quick-nav details { display: none; }
  .quick-nav.is-open .jump-label,
  .quick-nav.is-open .jump-row,
  .quick-nav.is-open details { display: block; }
  .quick-nav h2 { margin: 0; }
  .quick-nav.is-open h2 { margin-bottom: 12px; }
  .static-shell { padding-top: 10px; }
}
@media (max-width: 700px) { .static-card { padding: 16px; } .static-card h2 { display: block; } }
</style>
</head>
<body>
<div class="page-layout">
${quickNav}
<main class="static-shell">
<section class="static-hero">
<p class="label">No-JavaScript static version</p>
<h1>${label.title}</h1>
<p>${label.description}</p>
</section>
<section class="notice"><strong>Important:</strong><span>These practice questions are for extra practice only. They are not indicative of the final exam's coverage, standard, or difficulty. The exam structure is discussed in the Week 10 and Week 12 lectures.</span></section>
<section class="static-card">
<h2>${label.topicIndex}</h2>
<ul class="index-list">${topics
  .map((topic) => `<li><a href="#topic-${esc(topic.id)}">${esc(topic.name)} (${esc(topic.probability)})</a></li>`)
  .join("\n")}</ul>
</section>
${topicCards}
<section class="static-card">
<h2>${label.questionIndex}</h2>
<div class="static-index-group">
${renderGroupedQuestions(renderPlainQuestionLink)}
</div>
</section>
${questionCards}
</main>
</div>
<script>
(() => {
  const links = Array.from(document.querySelectorAll("[data-nav-link]"));
  const linkById = new Map(links.map((link) => [decodeURIComponent(link.hash.slice(1)), link]));
  const sections = Array.from(document.querySelectorAll("section[id]"));
  const nav = document.querySelector(".quick-nav");
  let activeId = "";

  const keepNavLinkVisible = (link) => {
    const nav = link.closest(".quick-nav");
    if (!nav || !nav.classList.contains("is-open")) return;
    const linkBox = link.getBoundingClientRect();
    const navBox = nav.getBoundingClientRect();
    if (linkBox.top < navBox.top + 70) nav.scrollTop -= navBox.top + 90 - linkBox.top;
    if (linkBox.bottom > navBox.bottom - 20) nav.scrollTop += linkBox.bottom - navBox.bottom + 40;
  };

  const setActive = (id) => {
    if (!id || id === activeId) return;
    activeId = id;
    links.forEach((link) => link.classList.toggle("is-active", linkById.get(id) === link));
    const activeLink = linkById.get(id);
    if (activeLink) {
      activeLink.closest("details")?.setAttribute("open", "");
      keepNavLinkVisible(activeLink);
    }
  };

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio || a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-18% 0px -65% 0px", threshold: [0.01, 0.12, 0.25, 0.5] }
    );
    sections.forEach((section) => observer.observe(section));
  }

  links.forEach((link) => link.addEventListener("click", () => setActive(decodeURIComponent(link.hash.slice(1)))));
  nav?.querySelector("h2")?.addEventListener("click", () => nav.classList.toggle("is-open"));
  const jumpSelect = document.querySelector("#questionJump");
  const jumpToSelected = () => {
    const id = jumpSelect?.value;
    if (!id) return;
    const target = document.getElementById(id);
    if (!target) return;
    target.scrollIntoView({ block: "start" });
    history.replaceState(null, "", "#" + id);
    setActive(id);
    nav?.classList.remove("is-open");
  };

  jumpSelect?.addEventListener("change", jumpToSelected);
  document.querySelector("#questionJumpButton")?.addEventListener("click", jumpToSelected);
})();
</script>
</body>
</html>`;

fs.writeFileSync("index.html", html, "utf8");
fs.writeFileSync("mobile-study-static.html", html, "utf8");
fs.writeFileSync("mobile-study.html", html, "utf8");

console.log(`built static site: ${topics.length} topics, ${allQuestions.length} questions`);
