import Input from './input.js';
import * as THREE from 'three';

let clippedPoints = [];
let raycaster;
let camera;
let scene;

// Initialize raycaster
export function initializeRaycaster(raycasterInstance, sceneInstance, cameraInstance) {
  // mouse position in 3D
  raycaster = raycasterInstance;
  // objects be in this scene
  scene = sceneInstance;
  // camera for converting screen space to world space
  camera = cameraInstance;
}


const translationSpeed = 0.1; // Adjust speed as necessary

export function handleClothTranslationFromTop(physicsInstance) {
  const translationSpeed = 0.1;

  if (Input.isKeyDown('ArrowUp')) {
      physicsInstance.translateClothFromTop(0, 0, -translationSpeed); // Move forward
  }
  if (Input.isKeyDown('ArrowDown')) {
      physicsInstance.translateClothFromTop(0, 0, translationSpeed); // Move backward
  }
  if (Input.isKeyDown('ArrowLeft')) {
      physicsInstance.translateClothFromTop(-translationSpeed, 0, 0); // Move left
  }
  if (Input.isKeyDown('ArrowRight')) {
      physicsInstance.translateClothFromTop(translationSpeed, 0, 0); // Move right
  }
  if (Input.isKeyDown('t')) {
      physicsInstance.translateClothFromTop(0, translationSpeed, 0); // Move up
  }
  if (Input.isKeyDown('g')) {
      physicsInstance.translateClothFromTop(0, -translationSpeed, 0); // Move down
  }
}


// Step 1: Get the current mouse position in normalized device coordinates (NDC)
// Step 2: Update the raycaster to use the mouse position and camera
// Step 3: Check for intersections with objects in the scene
// Step 4: If an intersection is found, use the closest point
function clipPointToModel() {
  
  if (!raycaster || !camera || !scene) {
    console.log('Raycaster or scene/camera not initialized!');
    return;
  }

  console.log('Clipping point to the model...');

  // Step 1
  const mouse = new THREE.Vector2();
  // Convert X position to NDC (-1 to +1)
  mouse.x = (Input.mousex / window.innerWidth) * 2 - 1;
  // Convert Y position to NDC (-1 to +1)
  mouse.y = -(Input.mousey / window.innerHeight) * 2 + 1;
  console.log('Mouse position in NDC:', mouse);

  // Step 2
  raycaster.setFromCamera(mouse, camera);
  console.log('Raycaster set from camera and mouse position.');

  // Step 3
  // All objects in the scene
  const objectsToCheck = scene.children;
  // Check for intersections
  const intersects = raycaster.intersectObjects(objectsToCheck, true);
  console.log('Raycaster intersection results:', intersects);

  // Step 4
  if (intersects.length > 0) {
    // The closest intersected object
    const closestIntersection = intersects[0]; 
    // The exact 3D point of intersection
    const intersectedPoint = closestIntersection.point;
    // Save this point
    clippedPoints.push(intersectedPoint);
    console.log('Clipped point in world space:', intersectedPoint);
  } else {
    console.log('No objects intersected.');
  }
}

function showClippedPoints() {
  console.log('Showing all clipped points:');
  clippedPoints.forEach((point, index) => {
    console.log(`Point ${index + 1}:`, point);
  });
}

function clearClippedPoints() {
  console.log('Clearing all clipped points...');
  clippedPoints = [];
  showClippedPoints();
}

// Setup event handlers for UI interactions
export function setupUIHandlers() {
  const SButton = document.getElementById("clipToModel");
  const AButton = document.getElementById("drawmodePoints");
  const LButton = document.getElementById("RemovePoints");

  // Button event listeners
  document.getElementById('drawmodePoints').addEventListener('click', showClippedPoints);
  document.getElementById('clipToModel').addEventListener('click', clipPointToModel);
  document.getElementById('RemovePoints').addEventListener('click', clearClippedPoints);

  // Keyboard event listeners
  window.addEventListener('keydown', (event) => {
    if (event.key.toLowerCase() === 's') {
      console.log('[S] Key pressed');
      clipPointToModel();
      SButton.classList.add('active-button');
    }
    if (event.key.toLowerCase() === 'a') {
      AButton.classList.add('active-button');
    }
    if (event.key.toLowerCase() === 'l') {
      LButton.classList.add('active-button');
    }
  });

  window.addEventListener('keyup', (event) => {
    if (event.key.toLowerCase() === 's') {
      SButton.classList.remove('active-button');
    }
    if (event.key.toLowerCase() === 'a') {
      console.log('[A] Key released');
      showClippedPoints();
      AButton.classList.remove('active-button');
    }
    if (event.key.toLowerCase() === 'l') {
      console.log('[L] Key released');
      clearClippedPoints();
      LButton.classList.remove('active-button');
    }
  });
}
