let questions = [];
let results = [];

/* 質問CSVを読み込む */
fetch("questions.csv")
  .then(res => res.text())
  .then(text => {
    console.log("questions.csvの中身:", text);
    const lines = text.trim().split("\n");
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",");
      questions.push({
        qid: cols[0],
        text: cols[1],
        options: [
          { label: cols[2], point: Number(cols[3]) },
          { label: cols[4], point: Number(cols[5]) }
        ]
      });
    }
    renderQuestions();
  });

/* 結果CSVを読み込む */
fetch("results.csv")
  .then(res => res.text())
  .then(text => {
    const lines = text.trim().split("\n");
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",");
      results.push({
        min: Number(cols[0]),
        max: Number(cols[1]),
        text: cols[2]
      });
    }
  });

/* 質問を画面に表示 */
function renderQuestions() {
  const quiz = document.getElementById("quiz");
  questions.forEach(q => {
    quiz.innerHTML += `
      <div class="question">
      <p>${q.text}</p>
      ${q.options.map(o => `
        <label>
          <input type="radio" name="q${q.qid}" value="${o.point}">
          ${o.label}
        </label>
      `).join("")}
    </div>
    `;
  });
}

/* 結果判定 */
function showResult() {
  let total = 0;
  document.querySelectorAll("input:checked").forEach(el => {
    total += Number(el.value);
  });

  const r = results.find(r => total >= r.min && total <= r.max);
  document.getElementById("result").innerText =
    r ? r.text : "結果が判定できません";
}
