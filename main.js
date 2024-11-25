import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Scene Setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 2, 5);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Lighting
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 10, 7);
scene.add(light);

// Load Mannequin
const loader = new FBXLoader();
let mannequin;
loader.load('Female_Body_Base_Model.fbx', (fbx) => {
  mannequin = fbx;
  mannequin.scale.set(0.01, 0.01, 0.01);
  scene.add(mannequin);
});

// Particle System
const fabricWidth = 10;
const fabricHeight = 10;
const particles = [];
const particleGeometry = new THREE.BufferGeometry();
const particleMaterial = new THREE.PointsMaterial({ size: 0.05, color: 0x00ff00 });
const particlePositions = [];

for (let i = 0; i < fabricWidth; i++) {
  for (let j = 0; j < fabricHeight; j++) {
    const position = new THREE.Vector3(i * 0.2, -j * 0.2, 0);
    particlePositions.push(position.x, position.y, position.z);
    particles.push({
      position,
      velocity: new THREE.Vector3(0, 0, 0),
      acceleration: new THREE.Vector3(0, 0, 0),
      pinned: j === 0,
    });
  }
}
particleGeometry.setAttribute('position', new THREE.Float32BufferAttribute(particlePositions, 3));
const particleMesh = new THREE.Points(particleGeometry, particleMaterial);
scene.add(particleMesh);

// Springs
const springs = [];
for (let i = 0; i < particles.length; i++) {
  if ((i + 1) % fabricWidth !== 0) springs.push([i, i + 1]);
  if (i + fabricWidth < particles.length) springs.push([i, i + fabricWidth]);
}

// Simulation Functions
function simulate(deltaTime) {
  // Reset forces
  particles.forEach((p) => p.acceleration.set(0, -9.8, 0));

  // Apply spring forces
  springs.forEach(([i, j]) => {
    const p1 = particles[i], p2 = particles[j];
    const dist = p1.position.distanceTo(p2.position);
    const direction = new THREE.Vector3().subVectors(p2.position, p1.position).normalize();
    const force = direction.multiplyScalar((dist - 0.2) * 50);
    if (!p1.pinned) p1.acceleration.add(force);
    if (!p2.pinned) p2.acceleration.sub(force);
  });

  // Integrate motion
  particles.forEach((p) => {
    if (!p.pinned) {
      p.velocity.addScaledVector(p.acceleration, deltaTime);
      p.position.addScaledVector(p.velocity, deltaTime);
    }
  });

  // Update positions
  const positions = [];
  particles.forEach((p) => positions.push(p.position.x, p.position.y, p.position.z));
  particleGeometry.attributes.position.array = new Float32Array(positions);
  particleGeometry.attributes.position.needsUpdate = true;
}

// Camera Controls
const controls = new OrbitControls(camera, renderer.domElement);

// Animation Loop
let prevTime = performance.now();
function animate() {
  requestAnimationFrame(animate);
  const currentTime = performance.now();
  const deltaTime = (currentTime - prevTime) / 1000;
  prevTime = currentTime;

  if (mannequin) simulate(deltaTime);
  renderer.render(scene, camera);
}
animate();
