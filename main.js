import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';
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


	const camera = new THREE.PerspectiveCamera(85, window.innerWidth / window.innerHeight, 0.1, 1000);
	camera.position.set(0, 20, 50);

	// Raycaster
	const raycaster = new UI(scene, camera, physics);
	
	const renderer = new THREE.WebGLRenderer({ canvas });
	renderer.setSize(window.innerWidth, window.innerHeight);
	//renderer.setClearColor(0xA3A3A3);
	
	// Lighting
	const ambientLight = new THREE.AmbientLight(0xffffff, 1); // White light with intensity of 1
	scene.add(ambientLight);

	const light = new THREE.DirectionalLight(0xffffff, 1);
	light.position.set(5, 10, 7);
	scene.add(light);
	let mannequin;
	// Load Mannequin
	/*
	const loader = new FBXLoader();
	loader.load('Female_Body_Base_Model.fbx', (fbx) => {
	  mannequin = fbx;
	  console.log("Mannequin scale:", fbx.scale);
	  console.log("Mannequin position:", fbx.position);
	  physics.addModel(mannequin.children[0], 0.01, true, [0,0,0]);
	  mannequin.frustumCulled = false;
	  scene.add(mannequin);
	  fbx.traverse((child) => {
        if (child.isMesh) {
            // Handle cases where material might be an array (multi-material)
            if (child.material) {
                // Single material
                child.material.side = THREE.DoubleSide;
                child.material.needsUpdate = true;
				console.log("material update")
            }
        }
	});
	});
	*/
	const mtlLoader = new MTLLoader();
	mtlLoader.load('birdman.mtl', (materials) => {
		materials.preload(); 
		const objLoader = new OBJLoader();
		objLoader.setMaterials(materials); // Apply the loaded materials
		objLoader.load('birdman.obj', (object) => {
			object.frustumCulled = false;
			const position = [0,11,0];
			const axesHelper = new THREE.AxesHelper(5); // Size of 5 units
			scene.add(axesHelper);

			scene.add(object); // Add the object to the scene
			object.traverse((child) => {
				if (child instanceof THREE.Mesh) {
					child.position.set(position[0], position[1], position[2]);
					console.log("pos updated")
					physics.addModel(child, 5, false, position); // Add each mesh to the physics world
					mannequin = child;
				}
			});
		});
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

	// Three.js anchor mesh setup
	if (!cloth.userData.physicsBody) {
		console.error("Cloth does not have a physics body.");
		return null;
	}
	const nodes = cloth.userData.physicsBody.get_m_nodes();
	const targetNode = nodes.at(0);

	if (!targetNode) {
	console.error("No node found at index.");
	return null;
	}
	
	// add cloth corner anchor
	const position = targetNode.get_m_x(); // Get the position of the corner node
	const anchorOrigin = new Ammo.btVector3(position.x(), position.y(), position.z());
	const anchorShape = new Ammo.btBoxShape(new Ammo.btVector3(0.1, 0.1, 0.1));
	const anchorGeometry = new THREE.SphereGeometry(0.5, 16, 16);
	const anchorMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 });
	const anchorMesh = new THREE.Mesh(anchorGeometry, anchorMaterial);
	anchorMesh.position.set(position.x(), position.y(), position.z());
	anchorMesh.castShadow = true;
	anchorMesh.receiveShadow = true;
	anchorMesh.frustumCulled = false;
	const anchor = physics.addCornerAnchor(anchorMesh, anchorShape, anchorOrigin, anchorMesh);

	//let corner = physics.addClothAnchor(cloth, 0);
	scene.add(anchorMesh);
	cloth.userData.physicsBody.appendAnchor(0, anchorMesh.userData.physicsBody, false, 1.0);
	physics.anchorRigidBody = anchor;

	// Camera Controls
	const controls = new OrbitControls(camera, renderer.domElement);
	
	// UI function
	raycaster.setupUIHandlers();
	console.log(physics.objects)
	raycaster.setupMouseHandlers(anchorMesh, cloth, mannequin, physics);

	// Animation Loop
	function animate() {
		requestAnimationFrame(animate);
		const deltaTime = clock.getDelta();
		// Handle movement of the corner anchor
		if (anchorMesh && physics) {
		  raycaster.handleAnchorMovement(deltaTime, anchorMesh);
		}
		physics.simulate(deltaTime, anchorMesh);
		renderer.render(scene, camera);
	  }
	  animate();

});
