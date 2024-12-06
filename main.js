import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import Physics from './physics.js';
import softBody from './softbody.js';
import { setupUIHandlers, initializeRaycaster } from'./UI.js'

// Get the canvas element
const canvas = document.getElementById('canvas');
	
// Scene Setup
const scene = new THREE.Scene();

const clock = new THREE.Clock();
Ammo().then(function(Ammo) {
  	const physics = new Physics(Ammo);
	console.log('Physics world initialized');

  	// Now create the soft body
  	//const cloth = new softBody(Ammo, physics);

  	// Access the cloth mesh and add it to the scene
  	//scene.add(cloth.get());

	// Raycaster stuff
	const raycaster = new THREE.Raycaster();
	const camera = new THREE.PerspectiveCamera(85, window.innerWidth / window.innerHeight, 0.1, 1000);
	camera.position.set(0, 2, 5);
	
	const renderer = new THREE.WebGLRenderer({ canvas });
	renderer.setSize(window.innerWidth, window.innerHeight);
	//renderer.setClearColor(0xA3A3A3);
	
	// Lighting
	const light = new THREE.DirectionalLight(0xffffff, 1);
	light.position.set(5, 10, 7);
	scene.add(light);
	
	// Load Mannequin
	const loader = new FBXLoader();
	let mannequin;
	loader.load('Female_Body_Base_Model.fbx', (fbx) => {
	  fbx.scale.set(0.001, 0.001, 0.001);
	  physics.addModel(fbx);
	  scene.add(fbx);
	});

	const floorShape = new Ammo.btBoxShape(new Ammo.btVector3(50, 0.5, 50));
	const origin = new Ammo.btVector3(0,-0.5,0);

	// Three.js floor mesh setup
	const floorGeometry = new THREE.BoxGeometry(100, 1, 100);
	const floorMaterial = new THREE.MeshPhongMaterial({ color: 0x808080 });
	const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
	floorMesh.receiveShadow = true;
	physics.addObject(floorMesh, floorShape, origin, floorMesh);
	scene.add(floorMesh);

	let cloth = physics.createCloth();
	physics.changeClothTexture(cloth);

	cloth.castShadow = true;
	cloth.receiveShadow = true;
	scene.add(cloth);

	// Camera Controls
	const controls = new OrbitControls(camera, renderer.domElement);

	// Initialize raycaster in UI
	initializeRaycaster(raycaster, scene, camera);
	
	// UI function
	setupUIHandlers();

	// Animation Loop
	function animate() {
		requestAnimationFrame(animate);
		const deltaTime = clock.getDelta();
		physics.simulate(deltaTime);
		renderer.render(scene, camera);
	}
	animate();

});

