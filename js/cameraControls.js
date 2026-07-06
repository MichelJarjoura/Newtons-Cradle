/**
 * cameraControls.js
 * ------------------------------------------------------------------
 * التحكم في الكاميرا المدارية: السحب للدوران، والعجلة للتكبير/التصغير.
 * ------------------------------------------------------------------
 */

import * as THREE from 'three';

export function createOrbitControls(camera, container, target = new THREE.Vector3(0, 1.5, 0)) {
  let camRadius = 8.6;
  let camTheta = 0.55;
  let camPhi = 1.15;
  const minRadius = 4.5;
  const maxRadius = 15;
  const minPhi = 0.35;
  const maxPhi = 1.5;

  function updateCameraPosition() {
    const x = target.x + camRadius * Math.sin(camPhi) * Math.sin(camTheta);
    const y = target.y + camRadius * Math.cos(camPhi);
    const z = target.z + camRadius * Math.sin(camPhi) * Math.cos(camTheta);
    camera.position.set(x, y, z);
    camera.lookAt(target);
    return target;
  }

  // Initialize camera position
  updateCameraPosition();

  // Mouse/Touch controls
  let dragging = false;
  let lastX = 0;
  let lastY = 0;

  container.addEventListener("pointerdown", (e) => {
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    container.setPointerCapture(e.pointerId);
  });

  container.addEventListener("pointerup", () => {
    dragging = false;
  });

  container.addEventListener("pointerleave", () => {
    dragging = false;
  });

  container.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    camTheta -= dx * 0.006;
    camPhi = Math.min(maxPhi, Math.max(minPhi, camPhi - dy * 0.006));
    updateCameraPosition();
  });

  container.addEventListener("wheel", (e) => {
    e.preventDefault();
    camRadius = Math.min(maxRadius, Math.max(minRadius, camRadius + e.deltaY * 0.0035));
    updateCameraPosition();
  }, { passive: false });

  // Return controls object with methods
  return {
    update: updateCameraPosition,
    setTarget: (newTarget) => {
      target.copy(newTarget);
      updateCameraPosition();
    },
    getTarget: () => target,
    getState: () => ({ radius: camRadius, theta: camTheta, phi: camPhi }),
    setState: ({ radius, theta, phi }) => {
      camRadius = Math.min(maxRadius, Math.max(minRadius, radius || camRadius));
      camTheta = theta || camTheta;
      camPhi = Math.min(maxPhi, Math.max(minPhi, phi || camPhi));
      updateCameraPosition();
    },
  };
}

