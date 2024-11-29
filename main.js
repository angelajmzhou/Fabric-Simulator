import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import Physics from './physics.js';
import softBody from './softbody.js';
import { setupUIHandlers } from'./UI.js'

	// Get the canvas element
	const canvas = document.getElementById('canvas');
	
	// Scene Setup
	const scene = new THREE.Scene();

Ammo().then(function(Ammo) {
  const physics = new Physics(Ammo);
  console.log('Physics world initialized');

  // Now create the soft body
  const cloth = new softBody(Ammo, physics);

  // Access the cloth mesh and add it to the scene
  scene.add(cloth.get());

	const camera = new THREE.PerspectiveCamera(85, window.innerWidth / window.innerHeight, 0.1, 1000);
	camera.position.set(0, 2, 5);
	
	const renderer = new THREE.WebGLRenderer({ canvas });
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.setClearColor(0xA3A3A3);
	
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
	  physics.addRigid(mannequin);
	  scene.add(mannequin);
	});
	
	// Camera Controls
	const controls = new OrbitControls(camera, renderer.domElement);
	setupUIHandlers();
	// Animation Loop
	let prevTime = performance.now();
	function animate() {
		requestAnimationFrame(animate);
		//const deltaTime = clock.getDelta();
		//physicsWorld.simulate(deltaTime);
		renderer.render(scene, camera);
	}
	animate();

});

