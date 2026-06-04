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
  title: "BUSN3001 \u590d\u4e60\u77e5\u8bc6\u70b9\u548c\u8bba\u8ff0\u9898",
  description:
    "\u8fd9\u4e2a\u7248\u672c\u4e0d\u4f9d\u8d56 JavaScript\u3002\u624b\u673a\u6d4f\u89c8\u5668\u3001GitHub Pages\u3001Gemini \u6216\u666e\u901a\u6587\u4ef6\u9884\u89c8\u91cc\uff0c\u90fd\u5e94\u8be5\u80fd\u76f4\u63a5\u770b\u5230\u77e5\u8bc6\u70b9\u548c\u9898\u76ee\u5185\u5bb9\u3002",
  quickNav: "\u5feb\u901f\u76ee\u5f55",
  topics: "\u77e5\u8bc6\u70b9",
  questions: "\u9898\u76ee",
  topicIndex: "\u77e5\u8bc6\u70b9\u76ee\u5f55",
  knowledge: "\u4e2d\u6587\u8bb2\u89e3\uff1a\u8981\u4f1a\u5199\u4ec0\u4e48",
  questionIndex: "\u9898\u76ee\u76ee\u5f55",
  zhQuestion: "\u4e2d\u6587\u9898\u76ee",
  zhApproach: "\u4e2d\u6587\u7b54\u9898\u601d\u8def",
  zhAnswer: "\u4e2d\u6587\u56de\u7b54",
  vocab: "\u9700\u8981\u80cc\u8bf5\u7684\u82f1\u6587\u5355\u8bcd"
};

const topicName = (id) => topics.find((topic) => topic.id === id)?.name || id;

const quickNav = `
<aside class="quick-nav" aria-label="${label.quickNav}">
  <h2>${label.quickNav}</h2>
  <details open>
    <summary>${label.topics}</summary>
    <ol>${topics
      .map((topic) => `<li><a href="#topic-${esc(topic.id)}">${esc(topic.name)}</a></li>`)
      .join("\n")}</ol>
  </details>
  <details>
    <summary>${label.questions}</summary>
    <ol>${allQuestions
      .map((question, index) => `<li><a href="#q-${index + 1}">Q${index + 1}. ${esc(question.title)}</a></li>`)
      .join("\n")}</ol>
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
<title>BUSN3001 Study Site</title>
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
.quick-nav ol { margin: 10px 0 0; padding-left: 20px; }
.quick-nav li { margin: 0 0 8px; font-size: 14px; line-height: 1.35; }
.quick-nav a { color: var(--ink); text-decoration: none; }
.quick-nav a:hover { color: var(--accent); text-decoration: underline; }
.static-card { margin: 18px 0; padding: 22px; border: 1px solid var(--line); border-radius: 8px; background: #fff; box-shadow: 0 8px 28px rgba(24,32,44,.05); scroll-margin-top: 18px; }
.static-card h2 { font-size: 25px; display: flex; justify-content: space-between; gap: 12px; }
.static-card h2 span { color: var(--accent-2); font-size: 18px; white-space: nowrap; }
.static-card h3 { margin-top: 18px; color: var(--accent-2); font-size: 15px; text-transform: uppercase; }
.static-card li, .static-card p { font-size: 17px; line-height: 1.75; }
.source-line { color: var(--accent); font-weight: 800; }
.index-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 10px; padding: 0; list-style: none; }
.index-list a { display: block; padding: 10px 12px; border: 1px solid var(--line); border-radius: 8px; color: var(--ink); background: #fff; text-decoration: none; }
.index-list a:hover { border-color: var(--accent); color: var(--accent); }
@media (max-width: 900px) {
  html { scroll-padding-top: 150px; }
  .page-layout { display: block; width: min(1000px, calc(100% - 24px)); }
  .quick-nav { z-index: 20; top: 8px; max-height: 42vh; margin-top: 12px; }
  .quick-nav h2 { font-size: 16px; }
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
<ul class="index-list">${allQuestions
  .map((question, index) => `<li><a href="#q-${index + 1}">Q${index + 1}. ${esc(question.title)}</a></li>`)
  .join("\n")}</ul>
</section>
${questionCards}
</main>
</div>
</body>
</html>`;

fs.writeFileSync("index.html", html, "utf8");
fs.writeFileSync("mobile-study-static.html", html, "utf8");
fs.writeFileSync("mobile-study.html", html, "utf8");

console.log(`built static site: ${topics.length} topics, ${allQuestions.length} questions`);
