let questions = [];
let choicesByScale = {};
let results = [];

Promise.all([
  fetch("questions.csv").then(res => res.text()),
  fetch("choices.csv").then(res => res.text()),
  fetch("results.csv").then(res => res.text())
]).then(([qText, cText, rText]) => {

  /* === questions.csv（設問だけ）=== */
  const qLines = qText.trim().split("\n");
  for (let i = 1; i < qLines.length; i++) {
    const [qid, question,scale.trim()] = qLines[i].split(",");
    questions.push({ qid, text: question,scale });
  }

  /* === choices.csv（リッカート尺度）=== */
  const cLines = cText.trim().split("\n");
  for (let i = 1; i < cLines.length; i++) {
    const [scale,label, point] = cLines[i].split(",");
    
    if (!choicesByScale[scale]) {
       choicesByScale[scale] = [];
      }
      choicesByScale[scale].push({
       label,
       point: Number(point)

      });
   }


  /* === results.csv（結果判定）=== */
  const rLines = rText.trim().split("\n");
  for (let i = 1; i < rLines.length; i++) {
    const [min, max, text] = rLines[i].split(",");
    results.push({
      min: Number(min),
      max: Number(max),
      text
    });
  }

  // 3つ全部そろってから描画
 
 renderQuestions();
});

/* 質問を画面に表示 */

function renderQuestions() {
  const quiz = document.getElementById("quiz");
  quiz.innerHTML = "";

  questions.forEach(q => {
    const scaleChoices = choicesByScale[q.scale] || [];
    
    quiz.innerHTML += `
      <div class="question">
        <p>${q.text}</p>
        <div class="choices">
          ${scaleChoices.map(c => `
            <label>
              <input type="radio" name="q${q.qid}" value="${c.point}">
              ${c.label}
            </label>
          `).join("")}
        </div>
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
