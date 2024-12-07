import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import Physics from './physics.js';
import UI from './UI.js';
//import { setupUIHandlers, initializeRaycaster, handleClothTranslationFromTop  , clipPointToModel} from'./UI.js'

// Get the canvas element
const canvas = document.getElementById('canvas');
let physicsInstance;
	
// Scene Setup
const scene = new THREE.Scene();

const clock = new THREE.Clock();
Ammo().then(function(Ammo) {
  	const physics = new Physics(Ammo, scene);
	console.log('Physics world initialized');

	physicsInstance = physics; 
	const clothe = physics.createCloth(); // Create the cloth
    scene.add(clothe); // Add the cloth to the scene


	const camera = new THREE.PerspectiveCamera(85, window.innerWidth / window.innerHeight, 0.1, 1000);
	camera.position.set(0, 20, 50);

	// Raycaster
	const raycaster = new UI(scene, camera, physics);
	
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
	  console.log("Mannequin scale:", fbx.scale);
	  console.log("Mannequin position:", fbx.position);
	  physics.addModel(fbx);
	  fbx.frustumCulled = false;
	  scene.add(fbx);
	});

	const floorShape = new Ammo.btBoxShape(new Ammo.btVector3(10, 0.5, 10));
	const origin = new Ammo.btVector3(0,-1,0);

	// Three.js floor mesh setup
	const floorGeometry = new THREE.BoxGeometry(20, 1, 20);
	const floorMaterial = new THREE.MeshPhongMaterial({ color: 0x808080 });
	const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
	floorMesh.position.y -= 0.45;
	floorMesh.receiveShadow = true;
	physics.addObject(floorMesh, floorShape, origin, floorMesh);
	scene.add(floorMesh);
	
	let cloth = physics.createCloth();
	physics.changeClothTexture(cloth);
	cloth.frustumCulled = false;
	cloth.castShadow = true;
	cloth.receiveShadow = true;
	scene.add(cloth);

	// Camera Controls
	const controls = new OrbitControls(camera, renderer.domElement);
	
	// UI function
	raycaster.setupUIHandlers();

	// Animation Loop
	function animate() {
		requestAnimationFrame(animate);
		const deltaTime = clock.getDelta();
		physics.simulate(deltaTime);
		// Handle cloth translation
		if (physicsInstance) {
			raycaster.handleClothTranslationFromTop(physicsInstance);
		}
		
		renderer.render(scene, camera);
	}
	animate();

});
