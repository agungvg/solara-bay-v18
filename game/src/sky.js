// Solara Bay v18 — sky system: gradient dome, one sun, Tier-2 billboard clouds.
// One time-of-day parameter drives the sky shader, fog, sun light, hemisphere
// light and cloud tint together, so the horizon and the fog can never disagree.
import * as THREE from 'three';
import { DAY_PRESETS } from './config.js';

const SKY_VERT = `
varying vec3 vDir;
void main() {
  vDir = normalize(position);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_Position.z = gl_Position.w;
}`;

const SKY_FRAG = `
uniform vec3 uZenith; uniform vec3 uMid; uniform vec3 uHorizon;
uniform vec3 uSunDir; uniform vec3 uSunColor; uniform float uSunGlow;
varying vec3 vDir;
void main() {
  float h = clamp(vDir.y, -0.08, 1.0);
  vec3 col = h < 0.22
    ? mix(uHorizon, uMid, smoothstep(-0.02, 0.22, h))
    : mix(uMid, uZenith, smoothstep(0.22, 0.85, h));
  float s = max(dot(normalize(vDir), normalize(uSunDir)), 0.0);
  col += uSunColor * (pow(s, 350.0) * 1.4 + pow(s, 18.0) * uSunGlow);
  gl_FragColor = vec4(col, 1.0);
}`;

export class SkySystem {
  constructor(scene, renderer) {
    this.scene = scene;
    this.renderer = renderer;
    this.uniforms = {
      uZenith: { value: new THREE.Color('#2b7fe0') },
      uMid: { value: new THREE.Color('#7ec3f2') },
      uHorizon: { value: new THREE.Color('#cfeaff') },
      uSunDir: { value: new THREE.Vector3(0.3, 0.9, -0.35).normalize() },
      uSunColor: { value: new THREE.Color('#fff6e0') },
      uSunGlow: { value: 0.28 },
    };
    const geo = new THREE.SphereGeometry(880, 32, 18);
    const mat = new THREE.ShaderMaterial({
      vertexShader: SKY_VERT, fragmentShader: SKY_FRAG,
      uniforms: this.uniforms, side: THREE.BackSide, depthWrite: false, fog: false,
    });
    this.dome = new THREE.Mesh(geo, mat);
    this.dome.renderOrder = -10;
    scene.add(this.dome);

    this.sun = new THREE.DirectionalLight(0xfff6e0, 2.6);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    this.sun.shadow.camera.left = -90; this.sun.shadow.camera.right = 90;
    this.sun.shadow.camera.top = 90; this.sun.shadow.camera.bottom = -90;
    this.sun.shadow.camera.far = 400;
    this.sun.shadow.bias = -0.0006;
    scene.add(this.sun);
    scene.add(this.sun.target);

    this.hemi = new THREE.HemisphereLight(0xbfdfff, 0x8a7a5a, 0.9);
    scene.add(this.hemi);

    this.clouds = [];
    this.buildClouds();
    this.presetName = 'noon';
  }

  // Tier-2 billboard clouds: flattened sphere clusters on two drift layers,
  // soft white, tinted by the palette, fog off so they stay bright.
  buildClouds() {
    const group = new THREE.Group();
    const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.95, fog: false });
    const matFar = new THREE.MeshBasicMaterial({ color: 0xeef4ff, transparent: true, opacity: 0.75, fog: false });
    const spots = [
      [-120, 95, -160, 1.6, 0], [-40, 105, -190, 2.1, 0], [60, 98, -170, 1.4, 0],
      [140, 110, -120, 1.9, 1], [-160, 100, -60, 1.3, 1], [20, 118, -80, 1.7, 0],
      [-80, 90, 40, 1.5, 1], [110, 96, 30, 1.2, 0], [-20, 112, 90, 1.8, 1],
      [170, 104, -40, 1.4, 1], [-140, 108, 120, 1.1, 0], [40, 92, 140, 1.6, 1],
    ];
    for (const [x, y, z, s, layer] of spots) {
      const cloud = new THREE.Group();
      const puffs = 4 + Math.floor(s * 2);
      for (let i = 0; i < puffs; i += 1) {
        const r = (5 + Math.random() * 4) * s;
        const puff = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), layer === 0 ? mat : matFar);
        puff.position.set((i - puffs / 2) * 6.5 * s, (Math.random() - 0.5) * 2.5, (Math.random() - 0.5) * 6);
        puff.scale.y = 0.42;
        cloud.add(puff);
      }
      cloud.position.set(x, y, z);
      cloud.userData.layer = layer;
      cloud.userData.speed = layer === 0 ? 1.6 : 0.9;
      group.add(cloud);
      this.clouds.push(cloud);
    }
    this.cloudGroup = group;
    this.scene.add(group);
  }

  setPreset(name) {
    const p = DAY_PRESETS[name] || DAY_PRESETS.noon;
    this.presetName = name;
    const elev = (p.sunElev * Math.PI) / 180;
    const az = -0.6;
    const dir = new THREE.Vector3(
      Math.cos(elev) * Math.sin(az), Math.sin(elev), Math.cos(elev) * Math.cos(az),
    ).normalize();
    this.uniforms.uZenith.value.set(p.zenith);
    this.uniforms.uMid.value.set(p.mid);
    this.uniforms.uHorizon.value.set(p.horizon);
    this.uniforms.uSunDir.value.copy(dir);
    this.uniforms.uSunColor.value.set(p.sunColor);
    this.uniforms.uSunGlow.value = name === 'sunset' ? 0.55 : 0.28;
    this.sun.position.copy(dir).multiplyScalar(160);
    this.sun.target.position.set(0, 0, -20);
    this.sun.color.set(p.sunColor);
    this.sun.intensity = p.sunIntensity;
    this.hemi.color.set(p.hemiSky);
    this.hemi.groundColor.set(p.hemiGround);
    this.hemi.intensity = p.hemiIntensity;
    this.scene.fog = new THREE.Fog(new THREE.Color(p.fog), 120, 620);
    this.renderer.toneMappingExposure = p.exposure;
    // Cloud tint follows the palette: warm pink undersides at sunset.
    const tint = name === 'sunset' ? 0xffd9c2 : name === 'night' ? 0x8a94b8 : 0xffffff;
    for (const c of this.clouds) {
      for (const puff of c.children) puff.material.color.set(tint);
    }
    return p;
  }

  update(dt, time) {
    // Clouds drift with the wind, never regenerate; wrap around the city.
    for (const c of this.clouds) {
      c.position.x += c.userData.speed * dt;
      if (c.position.x > 220) c.position.x = -220;
    }
    this.dome.position.set(0, 0, 0);
  }
}
