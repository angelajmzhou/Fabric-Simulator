import Input from './input.js';
import * as THREE from 'three';

class UI{
// Initialize raycaster
constructor(sceneInstance, cameraInstance, physicsInstance) {
  // mouse position in 3D
  this.raycaster = new THREE.Raycaster();
  // objects be in this scene
  this.scene = sceneInstance;
  // camera for converting screen space to world space
  this.camera = cameraInstance;
  this.physics = physicsInstance;
  this.clippedPoints = [];
  this.isDragging = false; // Track if the user is dragging
  this.anchorClicked = false; // Track if the anchor is clicked
  this.mouse = new THREE.Vector2(); // Normalized device coordinates
  this.anchorMesh = null; // Reference to the anchor mesh
}
handleAnchorMovement(deltaTime, anchorMesh) {
  const moveSpeed = 5.0; // Movement speed

  // const sensitivity = 0.1; // Mouse sensitivity
  // anchorMesh.position.x += Input.getMouseDx * sensitivity;
  // anchorMesh.position.y -= Input.getMouseDy * sensitivity;

  // Calculate movement based on input state
  if (Input.isKeyDown('ArrowUp')) anchorMesh.position.y += moveSpeed * deltaTime;
  if (Input.isKeyDown('ArrowDown')) anchorMesh.position.y -= moveSpeed * deltaTime;
  if (Input.isKeyDown('ArrowLeft')) anchorMesh.position.x -= moveSpeed * deltaTime;
  if (Input.isKeyDown('ArrowRight')) anchorMesh.position.x += moveSpeed * deltaTime;
  if (Input.isKeyDown('g')) anchorMesh.position.z += moveSpeed * deltaTime;
  if (Input.isKeyDown('t')) anchorMesh.position.z -= moveSpeed * deltaTime;
}

// Handle anchor dragging
handleAnchorDrag(event, anchorMesh) {
  // Convert mouse position to normalized device coordinates (NDC)
  const mouse = new THREE.Vector2();
  mouse.x = (event.clientX - canvas.offsetLeft) / canvas.clientWidth * 2 - 1;
  mouse.y = -(event.clientY - canvas.offsetTop) / canvas.clientHeight * 2 + 1; 

  // Update raycaster
  this.raycaster.setFromCamera(mouse, this.camera);

  // Define the movement plane (e.g., XY plane with Z fixed)
  const movementPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -anchorMesh.position.z);
  const intersection = new THREE.Vector3();

  // Check for intersection with the plane
  if (this.raycaster.ray.intersectPlane(movementPlane, intersection)) {
    // Directly set the position to the intersection point without lerping
    anchorMesh.position.copy(intersection);
    console.log('Anchor position updated to:', anchorMesh.position);
  } else {
    console.log('No intersection with movement plane.');
  }
}

// Step 1: Get the current mouse position in normalized device coordinates (NDC)
// Step 2: Update the raycaster to use the mouse position and camera
// Step 3: Check for intersections with objects in the scene
// Step 4: If an intersection is found, use the closest point
clipPointToModel() {
  
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

showClippedPoints() {
  console.log('Showing all clipped points:');
  clippedPoints.forEach((point, index) => {
    console.log(`Point ${index + 1}:`, point);
  });
}

clearClippedPoints() {
  console.log('Clearing all clipped points...');
  clippedPoints = [];
  showClippedPoints();
}

// Check if the mouse click is on the anchor
checkMouseClickOnAnchor(event, anchorMesh) {
  const mouse = new THREE.Vector2();
  mouse.x = (event.clientX - canvas.offsetLeft) / canvas.clientWidth * 2 - 1;
  mouse.y = -(event.clientY - canvas.offsetTop) / canvas.clientHeight * 2 + 1;  

  // Set up the raycaster using the mouse click location
  this.raycaster.setFromCamera(mouse, this.camera);

  // Perform intersection test with the anchor
  const intersects = this.raycaster.intersectObject(anchorMesh, true);

  if (intersects.length > 0) {
    if (this.isDragging) {
      // If dragging is already active, stop it
      this.isDragging = false;
      console.log('Dragging deactivated!');
    } else {
      // If dragging isn't active, start it
      this.isDragging = true;
      console.log('Dragging activated!');
    }
  } else {
    console.log('No valid intersection');
  }
}



// Setup event handlers for UI interactions
setupUIHandlers() {
  const SButton = document.getElementById("clipToModel");
  const AButton = document.getElementById("drawmodePoints");
  const LButton = document.getElementById("RemovePoints");

  // Button event listeners
  document.getElementById('drawmodePoints').addEventListener('click', this.showClippedPoints);
  document.getElementById('clipToModel').addEventListener('click', this.clipPointToModel);
  document.getElementById('RemovePoints').addEventListener('click', this.clearClippedPoints);

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
  setupMouseHandlers(anchorMesh) {
    if (!this.raycaster || !this.camera || !this.scene) {
      console.log('Raycaster, camera, or scene not initialized!');
      return;
    }
  
    // Mouse state flags
    this.isDragging = false;
  
    // Add event listeners
    window.addEventListener('mousedown', (event) => {
      this.checkMouseClickOnAnchor(event, anchorMesh);
    });
  
    window.addEventListener('mousemove', (event) => {
      if (this.isDragging) {
        this.handleAnchorDrag(event, anchorMesh);
      }
    });
  }
}
export default UI