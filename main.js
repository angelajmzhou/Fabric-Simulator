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
  mannequin.scale.set(0.001, 0.001, 0.001);
  scene.add(mannequin);
});

// Camera Controls
const controls = new OrbitControls(camera, renderer.domElement);

// Animation Loop
let prevTime = performance.now();
function animate() {
  requestAnimationFrame(animate);
  //const currentTime = performance.now();
  //const deltaTime = (currentTime - prevTime) / 1000;
  //prevTime = currentTime;

  //if (mannequin) simulate(deltaTime);
  renderer.render(scene, camera);
}
animate();


