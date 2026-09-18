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

  // ===== 未回答チェック =====
  const unanswered = [];
  questions.forEach(q => {
    const checked = document.querySelector(`input[name="q${q.qid}"]:checked`);
    if (!checked) unanswered.push(q.qid);
  });

  const warnDiv = document.getElementById("warn");

  // 前回のハイライトを消す
  document.querySelectorAll(".question").forEach(el => el.classList.remove("unanswered"));

  if (unanswered.length > 0) {
    // 未回答がある間は結果を出さない
    document.getElementById("result").innerHTML = "";

    // 未回答の設問を赤くハイライト
    unanswered.forEach(qid => {
      const input = document.querySelector(`input[name="q${qid}"]`);
      if (input) input.closest(".question").classList.add("unanswered");
    });

    warnDiv.innerHTML =
      `未回答の設問が ${unanswered.length} 件あります。<br>` +
      `Q${unanswered.join("・Q")} に回答してから、もう一度お試しください。`;
    warnDiv.classList.add("show");

    // 最初の未回答へスクロール
    const first = document.querySelector(".question.unanswered");
    if (first) first.scrollIntoView({ behavior: "smooth", block: "center" });

    return;
  }

  // 全問回答済みなら警告を消す
  warnDiv.classList.remove("show");

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
        今の働き方が、この先もしばらく続いていたとしたら、あなたはどんな気持ちでいそうですか？
      </p>

      <p class="reflection-note">
        無理に答えを出す必要はありません。<br>
        少し想像してみるだけで大丈夫です。
      </p>

      <p class="reflection-note">
        考えてみて、もし少しでも引っかかる部分があれば、今の状況について整理してみるのも一つの方法です。
      </p>

      <p class="reflection-note">
        今感じていることを言葉にしてみるだけでも、これからの方向性が少し見えやすくなることもあります。
      </p>
      <div class="reflection-cta">
        <a class="reflection-link"
           href="https://forms.cloud.microsoft/r/BsGSCMturR"
           target="_blank" rel="noopener noreferrer">
          💡キャリアカウンセラーに話を聞いてみる
        </a>
      </div>
    </div>
      
    `;
  } else {
    resultDiv.innerHTML = `
      <h2>判定結果</h2>
      <p>条件に一致する結果が見つかりませんでした。</p>
    `;
  }
}