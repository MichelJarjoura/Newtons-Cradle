/**
 * physics.js
 * ------------------------------------------------------------------
 * ديناميكا بندول نيوتن: تكامل معادلة البندول غير الخطية لكل كرة على
 * حدة، ثم حل التصادمات المرنة بين الكرات المتجاورة عبر عدة تمريرات
 * تكرارية لكل خطوة زمنية فرعية — وهذا ما يسمح بانتقال الزخم عبر أكثر
 * من كرة ساكنة في اللحظة نفسها، كما يحدث في الجهاز الحقيقي.
 * ------------------------------------------------------------------
 */

export const SCENARIOS = {
  single: {
    label: "كرة واحدة تسقط",
    description: "تُرفع الكرة الطرفية وتُترك لتنقل زخمها عبر السلسلة إلى الكرة المقابلة.",
    offsets: [0.85, 0, 0, 0, 0],
    restitution: 0.992,
    gap: 0,
    mass: [1, 1, 1, 1, 1],
  },
  double: {
    label: "كرتان تسقطان",
    description: "ترتفع كرتان معاً فتتضاعف الطاقة المنقولة إلى الطرف الآخر.",
    offsets: [0.85, 0.85, 0, 0, 0],
    restitution: 0.992,
    gap: 0,
    mass: [1, 1, 1, 1, 1],
  },
  triple: {
    label: "ثلاث كرات تسقط",
    description: "ثلاث كرات ترتفع معاً، فينتقل زخم أكبر عبر الكرات الساكنة.",
    offsets: [0.85, 0.85, 0.85, 0, 0],
    restitution: 0.99,
    gap: 0,
    mass: [1, 1, 1, 1, 1],
  },
  opposite: {
    label: "تصادم متناظر",
    description: "كرة من كل طرف تصطدمان بالكرات الوسطى في اللحظة ذاتها من الجهتين.",
    offsets: [-0.85, 0, 0, 0, 0.85],
    restitution: 0.985,
    gap: 0,
    mass: [1, 1, 1, 1, 1],
  },
  gaps: {
    label: "فجوات بين الكرات",
    description: "فجوات صغيرة بين الكرات تكسر التلامس المباشر فتظهر ارتدادات منفصلة زمنياً.",
    offsets: [0.85, 0, 0, 0, 0],
    restitution: 0.88,
    gap: 0.05,
    mass: [1, 1, 1, 1, 1],
  },
  differentMasses: {
    label: "اختلاف الكتل",
    description: "تختلف كتل الكرات فتتوزع سرعة الارتداد بنسب غير متساوية بعد التصادم.",
    offsets: [0.85, 0, 0, 0, 0],
    restitution: 0.96,
    gap: 0,
    mass: [1.6, 0.85, 1.0, 1.15, 0.7],
  },
};

export function createPhysicsState() {
  const ballCount = 5;
  const radius = 0.34;
  const spacing = 2 * radius;
  const length = 2.55;
  const pivotY = 3.55;
  const startX = -((ballCount - 1) * spacing) / 2;

  return {
    ballCount,
    length,
    spacing,
    pivotY,
    startX,
    radius,
    gravity: 9.81,
    damping: 0.004,
    speedMultiplier: 1.0,
    amplitude: 0.85,
    restitution: 0.99,
    gap: 0,
    scenarioName: "single",
    description: SCENARIOS.single.description,
    running: true,
    collisionCount: 0,
    lastCollisionSignal: 0,
    lastCollisionIntensity: 0,
    balls: Array.from({ length: ballCount }, (_, i) => ({
      index: i,
      theta: 0,
      omega: 0,
      mass: 1,
      baseX: startX + i * spacing,
    })),
  };
}

export function applyScenario(state, name, amplitude, damping, speedMultiplier) {
  const cfg = SCENARIOS[name] || SCENARIOS.single;
  state.scenarioName = name;
  state.description = cfg.description;
  state.amplitude = amplitude;
  state.damping = damping;
  state.speedMultiplier = speedMultiplier;
  state.restitution = cfg.restitution;
  state.gap = cfg.gap;

  state.balls.forEach((ball, i) => {
    ball.theta = cfg.offsets[i] * amplitude;
    ball.omega = 0;
    ball.mass = cfg.mass[i] ?? 1;
  });
}

export function ballPosition(state, ball) {
  const x = ball.baseX + state.length * Math.sin(ball.theta);
  const y = state.pivotY - state.length * Math.cos(ball.theta);
  return { x, y };
}

export function updatePhysics(state, deltaTime) {
  if (!state.running) return;

  const subSteps = 8;
  const step = Math.min(deltaTime * state.speedMultiplier, 0.032) / subSteps;

  for (let s = 0; s < subSteps; s++) {
    for (const ball of state.balls) {
      const angAccel =
        -(state.gravity / state.length) * Math.sin(ball.theta) -
        state.damping * ball.omega;
      ball.omega += angAccel * step;
      ball.theta += ball.omega * step;
    }

    for (let pass = 0; pass < 4; pass++) {
      for (let i = 0; i < state.balls.length - 1; i++) {
        const a = state.balls[i];
        const b = state.balls[i + 1];
        const pa = ballPosition(state, a);
        const pb = ballPosition(state, b);
        const dx = pb.x - pa.x;
        const dy = pb.y - pa.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const threshold = 2 * state.radius + state.gap;
        const closingSpeed = a.omega - b.omega;

        if (dist <= threshold + 1e-4 && closingSpeed > 1e-5) {
          const m1 = a.mass;
          const m2 = b.mass;
          const e = state.restitution;
          const v1 = a.omega;
          const v2 = b.omega;
          const v1n = ((m1 - e * m2) / (m1 + m2)) * v1 + (((1 + e) * m2) / (m1 + m2)) * v2;
          const v2n = (((1 + e) * m1) / (m1 + m2)) * v1 + ((m2 - e * m1) / (m1 + m2)) * v2;
          a.omega = v1n;
          b.omega = v2n;

          if (dist < threshold) {
            const correction = ((threshold - dist) * 0.5) / state.length;
            a.theta -= correction * 0.15;
            b.theta += correction * 0.15;
          }

          state.collisionCount++;
          state.lastCollisionSignal = 1;
          // Track the strongest collision this frame so the sound can
          // scale with impact speed instead of always sounding the same.
          state.lastCollisionIntensity = Math.max(
            state.lastCollisionIntensity || 0,
            Math.abs(closingSpeed)
          );
        }
      }
    }
  }
}