  import * as THREE from 'three';
  
  export function makeStudioEnvironment() {
    const size = 128;
    function face(topColor, bottomColor, bandColor) {
      const c = document.createElement("canvas");
      c.width = c.height = size;
      const ctx = c.getContext("2d");
      const g = ctx.createLinearGradient(0, 0, 0, size);
      g.addColorStop(0, topColor);
      g.addColorStop(0.5, bandColor);
      g.addColorStop(1, bottomColor);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, size, size);
      return c;
    }
    const sky = face("#fff3df", "#caa871", "#e7c07f");
    const floor = face("#241407", "#0c0704", "#180d06");
    const side = face("#caa871", "#2c1a10", "#a5794a");
    const faces = [side, side, sky, floor, side, side];
    const cubeTex = new THREE.CubeTexture(faces);
    cubeTex.needsUpdate = true;
    return cubeTex;
  }