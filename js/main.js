import * as THREE from 'three';

import {
  createPhysicsState,
  applyScenario,
  ballPosition,
  updatePhysics
} from './physics.js';

import { setupUi } from './ui.js';
import { createScene } from './sceneSetup.js';
import { createOrbitControls } from './cameraControls.js';
import { playCollisionSound } from './sound.js';

(function () {
  "use strict";

  /* ---------- Scene setup (rig, lights, materials, environment) ---------- */

  const container = document.getElementById("sceneContainer");
  const { scene, camera, renderer, group, envMap, brassMaterial, resize } =
    createScene(container);

  /* ---------- Physics state + ball/string meshes ---------- */

  const state = createPhysicsState();
  const strings = [];
  const spheres = [];

  const ballMaterial = () =>
    new THREE.MeshStandardMaterial({
      color: 0xdfe3e6,
      metalness: 1.0,
      roughness: 0.045,
      envMap,
      envMapIntensity: 1.6,
    });

  for (let i = 0; i < state.ballCount; i++) {
    const ball = state.balls[i];
    const anchorGeo = new THREE.SphereGeometry(0.035, 14, 14);

    const frontAnchor = new THREE.Mesh(anchorGeo, brassMaterial);
    frontAnchor.position.set(ball.baseX, 3.55, 0.82);
    group.add(frontAnchor);

    const backAnchor = new THREE.Mesh(anchorGeo, brassMaterial);
    backAnchor.position.set(ball.baseX, 3.55, -0.82);
    group.add(backAnchor);

    const line = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0xcbb488 }));
    group.add(line);
    strings.push(line);

    const sphere = new THREE.Mesh(new THREE.SphereGeometry(state.radius, 40, 40), ballMaterial());
    sphere.castShadow = true;
    group.add(sphere);
    spheres.push(sphere);
  }

  function syncVisuals() {
    state.balls.forEach((ball, i) => {
      const { x, y } = ballPosition(state, ball);
      spheres[i].position.set(x, y, 0);
      spheres[i].scale.setScalar(0.85 + 0.15 * ball.mass);
      strings[i].geometry.setFromPoints([
        new THREE.Vector3(ball.baseX, 3.55, 0.82),
        new THREE.Vector3(x, y, 0),
        new THREE.Vector3(ball.baseX, 3.55, -0.82),
      ]);
    });
  }

  /* ---------- Custom orbit camera (drag to rotate, wheel to zoom) ---------- */

  const controls = createOrbitControls(camera, container);
  controls.update();

  /* ---------- UI wiring ---------- */

  setupUi({
    state,
    applyScenario,
    syncVisuals,
    playClick: () => playCollisionSound(state.lastCollisionIntensity || 1),
  });

  applyScenario(state, "single", state.amplitude, state.damping, state.speedMultiplier);
  syncVisuals();

  /* ---------- Render loop ---------- */

  const clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    updatePhysics(state, delta);
    if (state.lastCollisionSignal) {
      playCollisionSound(state.lastCollisionIntensity);
      state.lastCollisionSignal = 0;
      state.lastCollisionIntensity = 0;
    }
    syncVisuals();
    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener("resize", resize);
  resize();
})();