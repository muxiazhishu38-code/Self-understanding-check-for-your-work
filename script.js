let questions = [];
let choicesByScale = {};
let results = [];

Promise.all([
  fetch("questions.csv").then(res => res.text()),
  fetch("choices.csv").then(res => res.text()),
  fetch("results.csv").then(res => res.text())
]).then(([qText, cText, rText]) => {

  // questions.csv
  const qLines = qText.trim().split("\n");
  for (let i = 1; i < qLines.length; i++) {
    const [qid, question, scale] = qLines[i].split(",");
    questions.push({
      qid: qid.trim(),
      text: question.trim(),
      scale: scale.trim()
    });
  }

  // choices.csv
  const cLines = cText.trim().split("\n");
  for (let i = 1; i < cLines.length; i++) {
    const [scale, label, point] = cLines[i].split(",");
    const key = scale.trim();

    if (!choicesByScale[key]) {
      choicesByScale[key] = [];
    }

    choicesByScale[key].push({
      label: label.trim(),
      point: Number(point)
    });
  }

  // results.csv（年代別コメント）
  const rLines = rText.trim().split("\n");
  for (let i = 1; i < rLines.length; i++) {
    const [min, max, title, desc20, desc30, desc40] = rLines[i].split(",");
    results.push({
      min: Number(min),
      max: Number(max),
      title: title.trim(),
      desc20: desc20.trim(),
      desc30: desc30.trim(),
      desc40: desc40.trim(),
      desc50: desc50.trim(),
      desc60: desc60.trim()
    });
  }

  renderQuestions();
});

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

function showResult() {
  let total = 0;
  document.querySelectorAll("input:checked").forEach(el => {
    total += Number(el.value);
  });

  const r = results.find(r => total >= r.min && total <= r.max);
  const ageGroup = document.getElementById("ageGroup").value;

  let description = "";
  if (r) {
    switch (ageGroup) {
      case "20s":
        description = r.desc20;
        break;
      case "30s":
        description = r.desc30;
        break;
      case "40s":
        description = r.desc40;
        break;
      case "50s":
        description = r.desc50;
        break;
      case "60s":
        description = r.desc60;
        break;
    }
  }

  document.getElementById("result").innerHTML = r ? `
    <h2>${r.title}</h2>
    <p>${description}</p>
  ` : "結果が判定できません";
}