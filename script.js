let questions = [];
let choicesByScale = {};
let results = [];

Promise.all([
  fetch("questions.csv").then(r => r.text()),
  fetch("choices.csv").then(r => r.text()),
  fetch("results.csv").then(r => r.text())
]).then(([qText, cText, rText]) => {

  qText.trim().split("\n").slice(1).forEach(line => {
    const [qid, question, scale, axis] = line.split(",");
    questions.push({
      qid: qid.trim(),
      text: question.trim(),
      scale: scale.trim(),
      axis: axis.trim()
    });
  });

  cText.trim().split("\n").slice(1).forEach(line => {
    const [scale, label, point] = line.split(",");
    const key = scale.trim();
    if (!choicesByScale[key]) choicesByScale[key] = [];
    choicesByScale[key].push({
      label: label.trim(),
      point: Number(point)
    });
  });

  rText.trim().split("\n").slice(1).forEach(line => {
    const cols = line.split(",");
    results.push({
      age: cols[0].trim(),
      a_min: toNum(cols[1]),
      a_max: toNum(cols[2]),
      b_min: toNum(cols[3]),
      b_max: toNum(cols[4]),
      c_min: toNum(cols[5]),
      c_max: toNum(cols[6]),
      d_min: toNum(cols[7]),
      d_max: toNum(cols[8]),
      title: cols[9].trim(),
      description: cols[10].trim()
    });
  });

  renderQuestions();
});

function toNum(v) {
  if (!v) return null;
  return v.trim() === "" ? null : Number(v);
}

function inRange(score, min, max) {
  if (min === null && max === null) return true;
  if (min !== null && score < min) return false;
  if (max !== null && score > max) return false;
  return true;
}

function renderQuestions() {
  const quiz = document.getElementById("quiz");
  quiz.innerHTML = "";

  questions.forEach(q => {
    const opts = choicesByScale[q.scale] || [];
    quiz.innerHTML += `
      <div class="question">
        <p class="question-text">
          <span class="q-number">Q${q.qid}.</span>
          <span>${q.text}</span>
        </p>
        <div class="choices">
          ${opts.map(o => `
            <label>
              <input type="radio" name="q${q.qid}" value="${o.point}">
              <span>${o.label}</span>
            </label>
          `).join("")}
        </div>
      </div>
    `;
  });
}

function showResult() {
  const scores = { A: 0, B: 0, C: 0, D: 0 };

  document.querySelectorAll("input:checked").forEach(input => {
    const qid = input.name.replace("q", "");
    const q = questions.find(q => q.qid === qid);
    if (q) scores[q.axis] += Number(input.value);
  });

  const selectedAge = document.getElementById("ageGroup").value;
  let ageKey = "";

  if (selectedAge === "20s" || selectedAge === "30s") ageKey = "under40";
  else if (selectedAge === "40s") ageKey = "40s";
  else ageKey = "50s";

  const matched = results.find(r =>
    r.age === ageKey &&
    inRange(scores.A, r.a_min, r.a_max) &&
    inRange(scores.B, r.b_min, r.b_max) &&
    inRange(scores.C, r.c_min, r.c_max) &&
    inRange(scores.D, r.d_min, r.d_max)
  );

  const resultDiv = document.getElementById("result");

  if (matched) {
    resultDiv.innerHTML = `
      <p class="result-intro">あなたの今の状態は、次のように整理できます。</p>
      <h2>${matched.title}</h2>
      <p>${matched.description}</p>
    
    <div class="reflection">
      <p class="reflection-question">
        今の働き方が、この先もしばらく続いていたとしたら、<br>
        あなたはどんな気持ちでいそうですか？
      </p>

      <p class="reflection-note">
        無理に答えを出す必要はありません。<br>
        今の感覚を少し想像してみるだけで大丈夫です。
      </p>

      <p class="reflection-note">
        もし考えてみて、「このままでいいのか少し引っかかった」と感じたら、<br>
        今の状態について誰かと話してみるのも一つの方法です。
      </p>

      <a href="https://forms.cloud.microsoft/r/cKVwMcfpgW" class="reflection-link">
        今の状態について、少し話を聞いてみる
      </a>
    </div>
      
    `;
  } else {
    resultDiv.innerHTML = `
      <h2>判定結果</h2>
      <p>条件に一致する結果が見つかりませんでした。</p>
    `;
  }
}