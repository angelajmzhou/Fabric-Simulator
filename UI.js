import { flattenJSON } from 'three/src/animation/AnimationUtils.js';
import Input from './input.js';
import * as THREE from 'three';

class UI{
// Initialize raycaster
constructor(sceneInstance, cameraInstance, physicsInstance) {
  // mouse position in 3D
  this.raycaster = new THREE.Raycaster();
  this.raycaster.near = 0.1;
  this.raycaster.far = 1000; // Adjust to your scene size
  this.raycaster.params.Line.threshold = 5
  this.raycaster.params.Points.threshold = 5
  this.pinIndex = 0;
  // objects be in this scene
  this.scene = sceneInstance;
  // camera for converting screen space to world space
  this.camera = cameraInstance;
  this.physics = physicsInstance;
  this.clippedPoints = [];
  this.anchorDrag = false; // Track if the user is dragging
  this.clothDrag = false;
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

  // Calculate the view vector (camera direction)
  const viewVector = new THREE.Vector3();
  this.camera.getWorldDirection(viewVector); // Get the normalized direction the camera is looking

  // Define a plane perpendicular to the view vector, passing through the anchor's position
  const movementPlane = new THREE.Plane(viewVector, -viewVector.dot(anchorMesh.position));
  const intersection = new THREE.Vector3();

  // Check for intersection with the plane
  if (this.raycaster.ray.intersectPlane(movementPlane, intersection)) {
    // Directly set the position to the intersection point without lerping
    anchorMesh.position.copy(intersection);
  } 
}

//check if a click is on the cloth, and if it is, drag it
//upon unclick, check if the raycaster intersects the mannequin. if yes, pin it. if no, let go of the cloth and destroy the temporary physics
handleClothDrag(event){
    let tempClip = this.physics.activePin;
    // Convert mouse position to normalized device coordinates (NDC)
    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX - canvas.offsetLeft) / canvas.clientWidth * 2 - 1;
    mouse.y = -(event.clientY - canvas.offsetTop) / canvas.clientHeight * 2 + 1; 
  
    // Update raycaster
    this.raycaster.setFromCamera(mouse, this.camera);
  
    // Calculate the view vector (camera direction)
    const viewVector = new THREE.Vector3();
    this.camera.getWorldDirection(viewVector); // Get the normalized direction the camera is looking
    // Define a plane perpendicular to the view vector, passing through the anchor's position
    const movementPlane = new THREE.Plane(viewVector, -viewVector.dot(tempClip.position));
    const intersection = new THREE.Vector3();
  
    // Check for intersection with the plane
    if (this.raycaster.ray.intersectPlane(movementPlane, intersection)) {
      // Directly set the position to the intersection point without lerping
      tempClip.position.copy(intersection);
    } else {
      console.log('No intersection with movement plane.');
    }
  }

  checkMouseClickOnCloth(event, cloth, mannequin, physics) {
    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX - canvas.offsetLeft) / canvas.clientWidth * 2 - 1;
    mouse.y = -(event.clientY - canvas.offsetTop) / canvas.clientHeight * 2 + 1;  
    
    // Set up the raycaster using the mouse click location
    this.raycaster.setFromCamera(mouse, this.camera);
    if (!(cloth instanceof THREE.Mesh)) {
      console.error("Cloth is not a valid THREE.Mesh object!");
    }
    cloth.geometry.computeBoundingBox();

    // Perform intersection test with the anchor
    const intersects = this.raycaster.intersectObject(cloth, true);
     if (intersects.length > 0) {
      // if (this.clothDrag) {
      //   // If dragging is already active, stop it
      //   this.clothDrag = false;
      //   console.log('Dragging deactivated!');
      //   let intersection = this.clipPointToModel(mannequin);
      //   if(intersection != -1){
      //     physics.setPinLocation(this.index, intersection);
      //   }
      //   else{
      //     if(physics.pinActive){
      //       physics.destroyPin(this.index);//need to implement this
      //     }
      //   }
        if(!this.clothDrag){
          // If dragging isn't active, start it
          this.clothDrag = true;
          this.pinIndex = physics.createPinPoint(intersects[0].point);
          console.log('Dragging activated!');
        }
        else{
          console.log('Dragging already active!');
        }
    } else {
      console.log('No valid intersection');
    }
  }
  checkMouseClickOnPin(event, physics) {
    const mouse = new THREE.Vector2();
    var pin = null;
    mouse.x = (event.clientX - canvas.offsetLeft) / canvas.clientWidth * 2 - 1;
    mouse.y = -(event.clientY - canvas.offsetTop) / canvas.clientHeight * 2 + 1;  
    
    // Set up the raycaster using the mouse click location
    this.raycaster.setFromCamera(mouse, this.camera);
    if (physics.pinActive){
      pin = physics.activePin;
    }
    // Perform intersection test with the anchor
    const intersects = this.raycaster.intersectObject(pin, true);
     if (intersects.length > 0) {
      if(this.clothDrag){
        // If dragging active, stop it
        this.clothDrag = false;
        console.log('Dragging deactivated!');
      }
      else{
        // If dragging isn't active, start it
        this.clothDrag = true;
        console.log('Dragging activated!');
      }
    } else {
      console.log('No valid intersection');
    }
  }

// Step 1: Get the current mouse position in normalized device coordinates (NDC)
// Step 2: Update the raycaster to use the mouse position and camera
// Step 3: Check for intersections with objects in the scene
// Step 4: If an intersection is found, use the closest point
clipPointToModel(woman) {

  // Step 1
  const mouse = new THREE.Vector2();
  // Convert X position to NDC (-1 to +1)
  mouse.x = (Input.mousex / window.innerWidth) * 2 - 1;
  // Convert Y position to NDC (-1 to +1)
  mouse.y = -(Input.mousey / window.innerHeight) * 2 + 1;

  // Step 2
  this.raycaster.setFromCamera(mouse, this.camera);
  let mannequin = woman;
  console.log(mannequin.children);
  if (!(mannequin instanceof THREE.Object3D)) {
    console.error("Mannequin is not a valid THREE.Object3D!");
  }
  if (!mannequin) {
    console.error("Mannequin is undefined or not yet loaded!");
    return;
  }
  //mannequin.computeBoundingBox();
  // Check for intersections
  const intersects = this.raycaster.intersectObjects([mannequin]);


  // Step 4
  if (intersects.length > 0) {
    // The closest intersected object
    const closestIntersection = intersects[0]; 
    // The exact 3D point of intersection
    const intersectedPoint = closestIntersection.point;
    // Save this point
    this.clippedPoints.push(intersectedPoint);
    console.log('Clipped point in world space:', intersectedPoint);
  } else {
    console.log('No objects intersected.');
  }
  return intersects.length>0?intersects[0].point:-1;
}

showClippedPoints() {
  console.log('Showing all clipped points:');
  this.clippedPoints.forEach((point, index) => {
    console.log(`Point ${index + 1}:`, point);
  });
}

clearClippedPoints() {
  console.log('Clearing all clipped points...');
  this.clippedPoints = [];
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
    if (this.anchorDrag) {
      // If dragging is already active, stop it
      this.anchorDrag = false;
    } else {
      // If dragging isn't active, start it
      this.anchorDrag = true;
    }
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
    if (event.key.toLowerCase() === 'j') {
      console.log('[S] Key pressed');
      //clipPointToModel();
      SButton.classList.add('active-button');
    }
    if (event.key.toLowerCase() === 'k') {
      AButton.classList.add('active-button');
    }
    if (event.key.toLowerCase() === 'l') {
      LButton.classList.add('active-button');
    }
  });

  window.addEventListener('keyup', (event) => {
    if (event.key.toLowerCase() === 'j') {
      SButton.classList.remove('active-button');
    }
    if (event.key.toLowerCase() === 'k') {
      console.log('[A] Key released');
      showClippedPoints();
      AButton.classList.remove('active-button');
    }
    if (event.key.toLowerCase() === 'l') {
      console.log('[L] Key released');
      clearClippedPoints();
      LButton.classList.remove('active-button');
    }
    // if (event.key.toLowerCase() === 'w') {
    //   console.log('[W] Key released');
    //   if (this.physics.pinActive){
    //     this.physics.destroyPin(this.physics.activePin);

    //   }
    // }
  });
}
  setupMouseHandlers(anchorMesh, cloth, mannequin, physics) {
    if (!this.raycaster || !this.camera || !this.scene) {
      console.log('Raycaster, camera, or scene not initialized!');
      return;
    }
  
    // Mouse state flags
    this.anchorDrag = false;
  
    // Add event listeners
    window.addEventListener('mousedown', (event) => {
      this.checkMouseClickOnAnchor(event, anchorMesh);
      this.checkMouseClickOnCloth(event, cloth, mannequin, physics);
      if (this.clothDrag) {this.checkMouseClickOnPin(event, physics);}
      });
  
    window.addEventListener('mousemove', (event) => {
      if (this.anchorDrag) {
        this.handleAnchorDrag(event, anchorMesh);
      } else if(this.clothDrag){
        this.handleClothDrag(event);
      }
    });
  }
  // addWASDRotation(controls) {
  //   const rotationSpeed = 0.02; // Adjust rotation speed as needed
  
  //   if (Input.isKeyPressed('w')) {
  //     controls.object.rotation.x -= rotationSpeed; // Rotate upward
  //     console.log("w pressed");
  //   }
  //   if (Input.isKeyPressed('s')) {
  //     controls.object.rotation.x += rotationSpeed; // Rotate downward
  //     console.log("s pressed");
  //   }
  //   if (Input.isKeyPressed('a')) {
  //     controls.object.rotation.y -= rotationSpeed; // Rotate left
  //     console.log("a pressed");
  //   }
  //   if (Input.isKeyPressed('d')) {
  //     controls.object.rotation.y += rotationSpeed; // Rotate right
  //     console.log("d pressed");
  //   }
  //   controls.update(); // Ensure OrbitControls updates its internal state
  // }
}
export default UI