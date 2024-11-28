import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import * as CANNON from 'cannon-es';

// Renderer, Scene, and Camera Setup
const canvas = document.getElementById('canvas');
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  canvas: canvas, // Attach renderer to this canvas
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0xA3A3A3);
// document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(85, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 2, 5);
camera.lookAt(0, 0, 0);

const orbit = new OrbitControls(camera, renderer.domElement);
orbit.update();

// Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 10, 7);
scene.add(directionalLight);

// Physics World
const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -9.81, 0) });

// Cloth Parameters
const Nx = 15;
const Ny = 15;
const mass = 0.1;
const clothWidth = 4; // Adjusted for model size
const clothHeight = 2; // Adjusted for model height
const dist = clothWidth / Nx;

const clothGeometry = new THREE.PlaneGeometry(clothWidth, clothHeight, Nx, Ny);
const clothMaterial = new THREE.MeshPhongMaterial({
  color: 0x00ff00,
  side: THREE.DoubleSide,
  wireframe: true,
});
const clothMesh = new THREE.Mesh(clothGeometry, clothMaterial);
scene.add(clothMesh);

// Cloth Particles
const particles = [];
for (let i = 0; i <= Nx; i++) {
  particles.push([]);
  for (let j = 0; j <= Ny; j++) {
    const particle = new CANNON.Body({
      mass: j === 0 ? 0 : mass, // Top row fixed
      shape: new CANNON.Particle(),
      position: new CANNON.Vec3((i - Nx / 2) * dist, (j - Ny / 2) * dist + 5, 0),
    });
    particles[i].push(particle);
    world.addBody(particle);
  }
}

// Cloth Constraints
function connectParticles(i1, j1, i2, j2) {
  const distance = particles[i1][j1].position.distanceTo(particles[i2][j2].position);
  const constraint = new CANNON.DistanceConstraint(particles[i1][j1], particles[i2][j2], distance);
  world.addConstraint(constraint);
}

for (let i = 0; i <= Nx; i++) {
  for (let j = 0; j <= Ny; j++) {
    if (i < Nx) connectParticles(i, j, i + 1, j);
    if (j < Ny) connectParticles(i, j, i, j + 1);
  }
}

// Load FBX Model
const fbxLoader = new FBXLoader();
let modelBody = null;
fbxLoader.load('./Female_Body_Base_Model.fbx', (fbx) => {
  const model = fbx;
  model.scale.set(0.001, 0.001, 0.001);
  scene.add(model);

  const bbox = new THREE.Box3().setFromObject(model);
  const size = bbox.getSize(new THREE.Vector3());

  const shape = new CANNON.Box(new CANNON.Vec3(size.x / 2, size.y / 2, size.z / 2));
  modelBody = new CANNON.Body({ mass: 1, shape });
  modelBody.position.set(0, size.y / 2, 0);
  world.addBody(modelBody);
});

// Update Cloth
function updateCloth() {
  const positions = clothGeometry.attributes.position.array;
  let index = 0;
  for (let i = 0; i <= Nx; i++) {
    for (let j = 0; j <= Ny; j++) {
      const particle = particles[i][j];
      positions[index++] = particle.position.x;
      positions[index++] = particle.position.y;
      positions[index++] = particle.position.z;
    }
  }
  clothGeometry.attributes.position.needsUpdate = true;
}

// Arrow Key Movement
const keyState = {};
window.addEventListener('keydown', (event) => (keyState[event.key] = true));
window.addEventListener('keyup', (event) => (keyState[event.key] = false));

function moveCloth() {
  const force = 5;
  particles.forEach((row) => {
    row.forEach((particle) => {
      if (keyState.ArrowUp) particle.applyForce(new CANNON.Vec3(0, 0, -force), particle.position);
      if (keyState.ArrowDown) particle.applyForce(new CANNON.Vec3(0, 0, force), particle.position);
      if (keyState.ArrowLeft) particle.applyForce(new CANNON.Vec3(-force, 0, 0), particle.position);
      if (keyState.ArrowRight) particle.applyForce(new CANNON.Vec3(force, 0, 0), particle.position);
    });
  });
}

// Animation Loop
function animate() {
  requestAnimationFrame(animate);
  world.step(1 / 60);

  moveCloth();
  updateCloth();

  renderer.render(scene, camera);
}
animate();

// Window Resize Handler
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});