particlesJS("particles-js", {
  particles: {
    number: { value: 75, density: { enable: true, value_area: 900 } },
    color: { value: ["#38bdf8", "#ffffff"] },
    opacity: { value: 0.25, random: true },
    size: { value: 2, random: true },
    line_linked: {
      enable: true,
      distance: 140,
      color: "#38bdf8",
      opacity: 0.15,
      width: 1,
    },
    move: { enable: true, speed: 0.8 },
  },
  interactivity: {
    events: {
      onhover: { enable: true, mode: "grab" },
      onclick: { enable: true, mode: "push" },
    },
    modes: {
      grab: { distance: 180, line_linked: { opacity: 0.4 } },
      push: { particles_nb: 4 },
    },
  },
  retina_detect: true,
});

const API_KEY = "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";

const btn = document.getElementById("btnAnalyze");
const loader = document.getElementById("loader");
const btnText = document.getElementById("btnText");
const outputArea = document.getElementById("resultArea");
const outputText = document.getElementById("aiOutput");

function detectSeverity(log) {
  const lower = log.toLowerCase();
  if (lower.includes("fatal") || lower.includes("crash")) return "CRÍTICO";
  if (lower.includes("uncaught") || lower.includes("exception")) return "ALTO";
  if (lower.includes("warning")) return "MÉDIO";
  return "NORMAL";
}

function extractErrorLocation(log) {
  const regex = /\(?([a-zA-Z0-9_./\\-]+):(\d+):?\d*\)?/;
  const match = log.match(regex);
  if (!match) return null;
  return { path: match[1], line: match[2] };
}

function generateFileTree(path) {
  const parts = path.split(/[\\/]/);
  let html = `<div class="file-map"><ul>`;

  parts.forEach((part, index) => {
    const isLast = index === parts.length - 1;
    html += `
      <li class="${isLast ? "file-error" : ""}">
        ${isLast ? "📄" : "📁"} ${part}
      </li>
    `;
  });

  html += `</ul></div>`;
  return html;
}

function isValidError(content) {
  const keywords = [
    "error",
    "exception",
    "at ",
    "line",
    "stack",
    "uncaught",
    "failed",
    "undefined",
    "null",
    "npm",
    "install",
  ];
  return keywords.some((k) => content.toLowerCase().includes(k));
}

btn.addEventListener("click", async () => {
  const errorContent = document.getElementById("errorInput").value.trim();

  if (!errorContent) {
    alert("O campo está vazio. Cole seu erro.");
    return;
  }

  if (!isValidError(errorContent) && errorContent.length < 30) {
    outputArea.style.display = "block";
    outputArea.style.borderColor = "#ffcc00";
    outputText.innerHTML = `
      <div class="diagnosis-card">
        <h3>Entrada inválida</h3>
        <p>Isso não parece um log real de erro.</p>
      </div>
    `;
    return;
  }

  btn.disabled = true;
  loader.style.display = "inline-block";
  btnText.innerText = "Escaneando Stack...";
  outputArea.style.display = "none";

  const severity = detectSeverity(errorContent);
  const extracted = extractErrorLocation(errorContent);

  try {
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content: `Você é o Bugly PRO. Analise logs de erro e responda em HTML formatado profissional.`,
            },
            { role: "user", content: errorContent },
          ],
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Falha na API");
    }

    const data = await response.json();
    let aiMessage = data?.choices?.[0]?.message?.content || "";

    let enhancedInfo = `
      <div style="margin-top:20px;padding:15px;border-radius:12px;border:1px solid var(--border);background:rgba(255,255,255,0.02)">
        <strong>Severidade Detectada:</strong> ${severity}
      </div>
    `;

    if (extracted) {
      enhancedInfo += generateFileTree(extracted.path);
      enhancedInfo += `
        <div class="line-error">
          🔴 Linha detectada automaticamente: ${extracted.line}
        </div>
      `;
    }

    outputText.innerHTML = aiMessage + enhancedInfo;
    outputArea.style.display = "block";
  } catch (err) {
    console.error(err);
    outputText.innerHTML = `
      <div class="diagnosis-card">
        <h3>Erro na conexão</h3>
        <p>Não foi possível comunicar com a Bugly Engine.</p>
      </div>
    `;
    outputArea.style.display = "block";
  } finally {
    btn.disabled = false;
    loader.style.display = "none";
    btnText.innerText = "Analisar com Bugly AI";
  }
});