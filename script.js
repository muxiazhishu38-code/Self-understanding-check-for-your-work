let questions = [];
let choicesByScale = {};
let results = [];

/* =========================
   CSV 読み込み
========================= */
Promise.all([
  fetch("questions.csv").then(r => r.text()),
  fetch("choices.csv").then(r => r.text()),
  fetch("results.csv").then(r => r.text())
]).then(([qText, cText, rText]) => {

  // questions.csv
  qText.trim().split("\n").slice(1).forEach(line => {
    const [qid, question, scale, axis] = line.split(",");
    questions.push({
      qid: qid.trim(),
      text: question.trim(),
      scale: scale.trim(),
      axis: axis.trim()
    });
  });

  // choices.csv
  cText.trim().split("\n").slice(1).forEach(line => {
    const [scale, label, point] = line.split(",");
    const key = scale.trim();
    if (!choicesByScale[key]) choicesByScale[key] = [];
    choicesByScale[key].push({
      label: label.trim(),
      point: Number(point)
    });
  });

  // results.csv
  rText.trim().split("\n").slice(1).forEach(line => {
    const cols = line.split(",");
    results.push({
      age: cols[0]?.trim(),
      a_min: toNum(cols[1]),
      a_max: toNum(cols[2]),
      b_min: toNum(cols[3]),
      b_max: toNum(cols[4]),
      c_min: toNum(cols[5]),
      c_max: toNum(cols[6]),
      d_min: toNum(cols[7]),
      d_max: toNum(cols[8]),
      title: cols[9]?.trim(),
      description: cols[10]?.trim()
    });
  });

  renderQuestions();
});

/* =========================
   ヘルパー
========================= */
function toNum(v) {
  if (v === undefined || v === null) return null;
  const t = v.trim();
  return t === "" ? null : Number(t);
}

function inRange(score, min, max) {
  if (min === null && max === null) return true;
  if (min !== null && score < min) return false;
  if (max !== null && score > max) return false;
  return true;
}

/* =========================
   設問描画（UI改善反映）
========================= */
function renderQuestions() {
  const quiz = document.getElementById("quiz");
  quiz.innerHTML = "";

  questions.forEach(q => {
    const opts = choicesByScale[q.scale] || [];
    quiz.innerHTML += `
      <div class="question">
        <p class="question-text">
          <span class="q-number">Q${q.qid}.</span>
          <span class="q-body">${q.text}</span>
        </p>
        <div class="choices">
          ${opts.map(o => `
            <label>
              <input type="radio" name="q${q.qid}" value="${o.point}">
              ${o.label}
            </label>
          `).join("")}
        </div>
      </div>
    `;
  });
}

/* =========================
   結果判定
========================= */
function showResult() {
  const scores = { A: 0, B: 0, C: 0, D: 0 };

  document.querySelectorAll("input:checked").forEach(input => {
    const qid = input.name.replace("q", "");
    const q = questions.find(q => q.qid === qid);
    if (q) scores[q.axis] += Number(input.value);
  });

  // 年代正規化
  const selectedAge = document.getElementById("ageGroup").value;
  let ageKey = "";
  switch (selectedAge) {
    case "20s":
    case "30s":
      ageKey = "under40";
      break;
    case "40s":
      ageKey = "40s";
      break;
    case "50s":
    case "60s":
      ageKey = "50s";
      break;
  }

  const matched = results.find(r =>
    r.age === ageKey &&
    inRange(scores.A, r.a_min, r.a_max) &&
    inRange(scores.B, r.b_min, r.b_max) &&
    inRange(scores.C, r.c_min, r.c_max) &&
    inRange(scores.D, r.d_min, r.d_max)
  );

  document.getElementById("result").innerHTML = matched ? `
    <h2>${matched.title}</h2>
    <p>${matched.description}</p>
  ` : `
    <h2>判定結果</h2>
    <p>条件に一致する結果が見つかりませんでした。</p>
  `;
}