/**
 * sceneSetup.js
 * ------------------------------------------------------------------
 * إعداد المشهد: الكاميرا، المُصيّر، الإضاءة، بيئة الانعكاس، وهيكل
 * الجهاز (الطاولة، الأعمدة، القضبان). هذا الملف مسؤول فقط عن "الرِّگ"
 * الثابت للمشهد — أما الكرات والخيوط فتُبنى في main.js لأنها مرتبطة
 * مباشرة بحالة الفيزياء.
 * ------------------------------------------------------------------
 */

import * as THREE from 'three';
import { makeStudioEnvironment } from './studioEnv.js';
import { makeWoodTexture } from './woodTexture.js';

export function createScene(container) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0b0d);
  scene.fog = new THREE.Fog(0x0a0b0d, 9, 22);

  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  container.appendChild(renderer.domElement);

  const envMap = makeStudioEnvironment();
  scene.environment = envMap;

  scene.add(new THREE.AmbientLight(0x362b20, 0.55));

  const key = new THREE.SpotLight(0xfff1da, 2.6, 30, Math.PI / 6, 0.4, 1.2);
  key.position.set(3.5, 9, 5);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.bias = -0.0004;
  scene.add(key);
  scene.add(key.target);

  const rim = new THREE.PointLight(0xe7c07f, 0.9, 20);
  rim.position.set(-5, 3, -4);
  scene.add(rim);

  const fill = new THREE.PointLight(0x8fb8ff, 0.35, 20);
  fill.position.set(-3, 2, 5);
  scene.add(fill);

  const brassMaterial = new THREE.MeshStandardMaterial({
    color: 0xb98a4e,
    metalness: 1.0,
    roughness: 0.28,
    envMap,
    envMapIntensity: 1.1,
  });

  const woodTex = makeWoodTexture();
  const tableMaterial = new THREE.MeshStandardMaterial({
    map: woodTex,
    roughness: 0.5,
    metalness: 0.05,
    envMap,
    envMapIntensity: 0.25,
  });

  const floorMaterial = new THREE.MeshStandardMaterial({
    color: 0x0e0b09,
    roughness: 0.9,
    metalness: 0.0,
  });

  const group = new THREE.Group();
  scene.add(group);

  const table = new THREE.Mesh(new THREE.BoxGeometry(7.4, 0.32, 3.2), tableMaterial);
  table.position.set(0, -0.2, 0);
  table.receiveShadow = true;
  group.add(table);

  const floor = new THREE.Mesh(new THREE.CircleGeometry(14, 48), floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.36;
  floor.receiveShadow = true;
  group.add(floor);

  const pillarGeo = new THREE.CylinderGeometry(0.055, 0.055, 3.65, 20);
  const barGeo = new THREE.CylinderGeometry(0.055, 0.055, 4.3, 20);
  const jointGeo = new THREE.SphereGeometry(0.075, 20, 20);

  [
    [-2.05, 0.82],
    [2.05, 0.82],
    [-2.05, -0.82],
    [2.05, -0.82],
  ].forEach(([x, z]) => {
    const pillar = new THREE.Mesh(pillarGeo, brassMaterial);
    pillar.position.set(x, 1.775, z);
    pillar.castShadow = true;
    group.add(pillar);

    const joint = new THREE.Mesh(jointGeo, brassMaterial);
    joint.position.set(x, 3.55, z);
    joint.castShadow = true;
    group.add(joint);
  });

  [0.82, -0.82].forEach((z) => {
    const bar = new THREE.Mesh(barGeo, brassMaterial);
    bar.rotation.z = Math.PI / 2;
    bar.position.set(0, 3.55, z);
    bar.castShadow = true;
    group.add(bar);
  });

  function resize() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  return { scene, camera, renderer, group, envMap, brassMaterial, tableMaterial, floorMaterial, resize };
}