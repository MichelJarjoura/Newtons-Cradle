import * as THREE from 'three';

 export function makeWoodTexture() {
    const c = document.createElement("canvas");
    c.width = 1024;
    c.height = 512;
    const ctx = c.getContext("2d");
    const base = ctx.createLinearGradient(0, 0, 0, c.height);
    base.addColorStop(0, "#3a2314");
    base.addColorStop(1, "#20130a");
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, c.width, c.height);

    for (let i = 0; i < 70; i++) {
      const y = Math.random() * c.height;
      ctx.strokeStyle = `rgba(${20 + Math.random() * 30},${12 + Math.random() * 14},${6 + Math.random() * 8},${0.15 + Math.random() * 0.25})`;
      ctx.lineWidth = 1 + Math.random() * 2.5;
      ctx.beginPath();
      ctx.moveTo(0, y);
      let py = y;
      for (let x = 0; x <= c.width; x += 40) {
        py += (Math.random() - 0.5) * 18;
        ctx.lineTo(x, py);
      }
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 1);
    return tex;
  }