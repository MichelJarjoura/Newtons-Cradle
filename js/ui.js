
function describeArc(cx, cy, r, startAngle, endAngle) {
  const start = { x: cx + r * Math.cos(startAngle), y: cy + r * Math.sin(startAngle) };
  const end = { x: cx + r * Math.cos(endAngle), y: cy + r * Math.sin(endAngle) };
  const largeArc = endAngle - startAngle <= Math.PI ? 0 : 1;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

export function setupUi({ state, applyScenario, syncVisuals, playClick }) {
  const scenarioSelect = document.getElementById("scenarioSelect");
  const amplitudeRange = document.getElementById("amplitudeRange");
  const dampingRange = document.getElementById("dampingRange");
  const speedRange = document.getElementById("speedRange");
  const playPauseBtn = document.getElementById("playPauseBtn");
  const resetBtn = document.getElementById("resetBtn");
  const scenarioDescription = document.getElementById("scenarioDescription");
  const metricMode = document.getElementById("metricMode");
  const metricEnergy = document.getElementById("metricEnergy");
  const ampVal = document.getElementById("ampVal");
  const dampVal = document.getElementById("dampVal");
  const speedVal = document.getElementById("speedVal");
  const gaugeArc = document.getElementById("gaugeArc");
  const gaugeNeedle = document.getElementById("gaugeNeedle");
  const tallyDigits = document.querySelectorAll("#collisionTally .tally-digit");

  function refresh() {
    ampVal.textContent = Number(amplitudeRange.value).toFixed(2);
    dampVal.textContent = Number(dampingRange.value).toFixed(4);
    speedVal.textContent = Number(speedRange.value).toFixed(2) + "×";
    scenarioDescription.textContent = state.description;
    metricMode.textContent = `الحالة: ${scenarioSelect.options[scenarioSelect.selectedIndex].text}`;
    playPauseBtn.textContent = state.running ? "إيقاف مؤقت" : "استئناف الحركة";

    const energy = state.balls.reduce(
      (acc, b) => acc + 0.5 * b.mass * state.length * state.length * b.omega * b.omega,
      0
    );
    const capped = Math.min(energy, 6);
    const frac = capped / 6;
    const endAngle = Math.PI * 0.82 + frac * Math.PI * 1.36;
    gaugeArc.setAttribute(
      "d",
      describeArc(50, 50, 37, Math.PI * 0.82, endAngle === Math.PI * 0.82 ? endAngle + 0.001 : endAngle)
    );
    const needleAngle = -2.36 + frac * 4.2;
    gaugeNeedle.setAttribute("x2", 50 + 34 * Math.sin(needleAngle));
    gaugeNeedle.setAttribute("y2", 50 - 34 * Math.cos(needleAngle));

    let label = "سكون ميكانيكي تام";
    if (energy > 1.4) label = "نشاط مرتفع";
    else if (energy > 0.05) label = "تذبذب متناقص";
    metricEnergy.textContent = label;

    const cs = String(Math.min(state.collisionCount, 999)).padStart(3, "0").split("");
    tallyDigits.forEach((el, i) => (el.textContent = cs[i]));
  }

  scenarioSelect.addEventListener("change", (e) => {
    applyScenario(state, e.target.value, Number(amplitudeRange.value), Number(dampingRange.value), Number(speedRange.value));
    state.collisionCount = 0;
    syncVisuals();
    refresh();
  });

  amplitudeRange.addEventListener("input", (e) => {
    applyScenario(state, state.scenarioName, Number(e.target.value), Number(dampingRange.value), Number(speedRange.value));
    syncVisuals();
    refresh();
  });

  dampingRange.addEventListener("input", (e) => {
    state.damping = Number(e.target.value);
    refresh();
  });

  speedRange.addEventListener("input", (e) => {
    state.speedMultiplier = Number(e.target.value);
    refresh();
  });

  playPauseBtn.addEventListener("click", () => {
    state.running = !state.running;
    refresh();
  });

  resetBtn.addEventListener("click", () => {
    applyScenario(state, state.scenarioName, Number(amplitudeRange.value), Number(dampingRange.value), Number(speedRange.value));
    state.collisionCount = 0;
    syncVisuals();
    refresh();
  });

  refresh();
  setInterval(refresh, 160);

  return { refresh };
}

// Optional: Also export as default if you prefer
// export default { setupUi };