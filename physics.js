import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import * as THREE from 'three';

/* Sources:
 * https://medium.com/@bluemagnificent/intro-to-javascript-3d-physics-using-ammo-js-and-three-js-dd48df81f591
 * 
 */
class Physics {
    constructor(Ammo, scene) {
        this.Ammo = Ammo;
        this.scene = scene;
        this.objects = []; // Track objects added to the physics world
        this.cloth = null; // Track objects added to the physics world
        this.pinpoints = [];
		    this.margin = 0.05;
        this.time = performance.now();
        this.activePin = null;
        this.pinActive = false;
        this.wireframe = null;
        this.collisionConfiguration = new this.Ammo.btSoftBodyRigidBodyCollisionConfiguration(); 
        // Manage collisions between objects with configuration
        this.dispatcher = new this.Ammo.btCollisionDispatcher(this.collisionConfiguration);
        // Broadphase collision detection algorithm (simple, check all object pairs without optimizing)
        this.broadphase = new this.Ammo.btDbvtBroadphase();
        // Constraint solver -- calculates effects of collisions and forces on objects (i.e., interpenetration)
        this.solver = new this.Ammo.btSequentialImpulseConstraintSolver();

            // Create SoftBody helper and solver
        this.softBodyHelper = new this.Ammo.btSoftBodyHelpers();
        this.softBodySolver = new this.Ammo.btDefaultSoftBodySolver();

        // Create transform auxiliary object
        this.transformAux1 = new this.Ammo.btTransform();

        // Create physics world: simulation core 
        this.physicsWorld = new this.Ammo.btSoftRigidDynamicsWorld(
            this.dispatcher,
            this.broadphase,
            this.solver,
            this.collisionConfiguration,
            this.softBodySolver
        );
        this.physicsWorld.getSolverInfo().set_m_numIterations(100); // Increase iterations for better stability


        // Create the world info for the soft bodies
        this.worldInfo = this.physicsWorld.getWorldInfo();

        // Set earth-like gravity vector for entire rigid bodies physics world
        this.physicsWorld.setGravity(new this.Ammo.btVector3(0, -10, 0));

        // Set gravity for the soft body solver as well
        this.worldInfo.set_m_gravity(new this.Ammo.btVector3(0, -10, 0));
    }


/**
* Add a rigid body to the physics world.
* @param {THREE.mesh} mesh instance of a loaded mesh
*/
addModel(mesh, scale, frame, pos) {
  
    const meshShape = this.createWireframeAndMesh(mesh, scale, frame);
    const transform = new this.Ammo.btTransform();
    transform.setIdentity();
    console.log(pos);
    const origin = new this.Ammo.btVector3(pos[0], pos[1], pos[2]);
    transform.setOrigin(origin);
    const rotation = new this.Ammo.btQuaternion(0,0,0,1);
    //rotate to compensate for blender coordinates
    //rotation.setEulerZYX(0, 0, Math.PI/2); 
    transform.setRotation(rotation); // Adjust rotation in Ammo.js
    const motionState = new this.Ammo.btDefaultMotionState(transform);
    const rbInfo = new this.Ammo.btRigidBodyConstructionInfo(
        0, //mass
        motionState,
        meshShape,
        new this.Ammo.btVector3(0, 0, 0) //local inertia
    )
    const rigidBody = new this.Ammo.btRigidBody(rbInfo);

    this.physicsWorld.addRigidBody(rigidBody, 1, -1);

    mesh.userData.physicsBody = rigidBody;
    rigidBody.setWorldTransform(transform);
    rigidBody.setActivationState(4); // Disable deactivation
    rigidBody.activate();

    this.objects.push(mesh); 

    return rigidBody;
}

/**
* Add a rigid body to the physics world.
* @param {THREE.Mesh} threeObj three obj
* @param {Ammo.meshShape} shape shape of object
* @param {Ammo.btVector3} origin origin(location) of object
* @param {Ammo.mesh} mesh mesh of model
*/
addObject(threeObj, shape, origin, mesh) {
    var transform = new this.Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin(origin);
    var motionState = new this.Ammo.btDefaultMotionState(transform);
    var rbInfo = new this.Ammo.btRigidBodyConstructionInfo(
        0, //mass
        motionState,
        shape,
        new this.Ammo.btVector3(0, 0, 0) //local inertia
    )

    var rigidBody = new this.Ammo.btRigidBody(rbInfo);
    threeObj.userData.physicsBody = rigidBody;

    rigidBody.getCollisionShape().setMargin(this.margin);

    this.physicsWorld.addRigidBody(rigidBody, 1, -1);

    rigidBody.setActivationState(4); // Disable deactivation

    this.objects.push(mesh); 

    return rigidBody;
}
addCornerAnchor(threeObj, shape, origin, mesh) {
  var transform = new this.Ammo.btTransform();
  transform.setIdentity();
  transform.setOrigin(origin);
  var motionState = new this.Ammo.btDefaultMotionState(transform);
  var rbInfo = new this.Ammo.btRigidBodyConstructionInfo(
      0, //mass
      motionState,
      shape,
      new this.Ammo.btVector3(0, 0, 0) //local inertia
  )

  var rigidBody = new this.Ammo.btRigidBody(rbInfo);
  threeObj.userData.physicsBody = rigidBody;

  rigidBody.getCollisionShape().setMargin(this.margin);

  this.physicsWorld.addRigidBody(rigidBody, 1, -1);

  rigidBody.setActivationState(4); // Disable deactivation

  this.objects.push(mesh); 

  return rigidBody;
}



/**
 * Loads a collision shape for a static mannequin
 * @param {THREE.Mesh} mesh Instance of a loaded FBX model
 */
  createWireframeAndMesh(mesh, factor, frame) {
    //fbx_model.scale.set(1, 1, 1); // Temporarily reset scale
    //fbx_model.updateMatrixWorld(true); // Ensure the world matrix is up to date
    //mesh.geometry.applyMatrix4(fbx_model.matrixWorld); // Apply all transformations to the geometry
    if (mesh instanceof THREE.Mesh) {
      console.log("The object is a THREE.Mesh");
  } else {
      console.error("The provided object is not a THREE.Mesh. It's a:", mesh.constructor.name);
  }
    console.log(typeof mesh)
    mesh.geometry.scale(factor, factor, factor);
    const boxHelper = new THREE.BoxHelper(mesh, 0xffff00);

     this.scene.add(boxHelper);     
    const geometry = mesh.geometry;
    let scale = factor;
    if(frame){
       scale =1/factor; // Same scale applied to the collision shape
    }
    else{
      scale = 1;

    }
    const meshShape = new Ammo.btTriangleMesh(true, true);
    const vertices = geometry.attributes.position.array;

    // For wireframe visualization
    const linePositions = [];

    for (let i = 0; i < vertices.length; i += 9) {
      // Each triangle's vertices
      const v0 = new Ammo.btVector3(vertices[i] * scale, vertices[i + 1] * scale, vertices[i + 2] * scale);
      const v1 = new Ammo.btVector3(vertices[i + 3] * scale, vertices[i + 4] * scale, vertices[i + 5] * scale);
      const v2 = new Ammo.btVector3(vertices[i + 6] * scale, vertices[i + 7] * scale, vertices[i + 8] * scale);

      // Add triangle to Ammo mesh
      meshShape.addTriangle(v0, v1, v2, true);

      // For visualization: Push edges for Three.js line segments
      linePositions.push(
        v0.x(), v0.y(), v0.z(),
        v1.x(), v1.y(), v1.z(),
        v1.x(), v1.y(), v1.z(),
        v2.x(), v2.y(), v2.z(),
        v2.x(), v2.y(), v2.z(),
        v0.x(), v0.y(), v0.z()
      );

      // Free memory in Ammo.js
      Ammo.destroy(v0);
      Ammo.destroy(v1);
      Ammo.destroy(v2);
    }

    // Create the collision shape
    const shape = new Ammo.btBvhTriangleMeshShape(meshShape, true, true);
    shape.setMargin(0.01); // Reduce the collision margin

    // Visualization: Create a Three.js wireframe
    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
    const collisionWireframe = new THREE.LineSegments(lineGeometry, lineMaterial);

    // Position and scale the wireframe to match the mesh
    //collisionWireframe.scale.set(1 / scale, 1 / scale, 1 / scale); // Undo scale factor
    collisionWireframe.position.copy(mesh.position); // Match position
    collisionWireframe.quaternion.copy(mesh.quaternion); // Match rotation

    // Add the wireframe to the scene
    this.scene.add(collisionWireframe);
    this.wireframe = collisionWireframe;
    console.log("Collision shape and wireframe created:", meshShape.constructor.name);
    return shape;
  }

/** 
 * @param {number} clothWidth Width of the cloth
 * @param {number} clothHeight Height of the cloth
 * @param {THREE.Vector3} clothPos Position of the cloth in world space
 * @param {number} margin Collision margin for the soft body
 **/
createCloth(
  clothWidth = 20,
  clothHeight = 20,
  clothPos = new THREE.Vector3(20, 20, 0),
  margin = 0.5
) {
  const clothNumSegmentsZ = clothWidth;
  const clothNumSegmentsY = clothHeight;

  // Create Three.js geometry using PlaneGeometry
  const clothGeometry = new THREE.PlaneGeometry(
      clothWidth,
      clothHeight,
      clothNumSegmentsZ,
      clothNumSegmentsY
  );
  clothGeometry.rotateX(-Math.PI * 0.5);
  clothGeometry.translate(
      clothPos.x,
      clothPos.y,
      clothPos.z
  );

  const clothMaterial = new THREE.MeshLambertMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
      // wireframe: true
  });
  const cloth = new THREE.Mesh(clothGeometry, clothMaterial);

  // Define Ammo.js cloth corners
  const clothCorner00 = new this.Ammo.btVector3(
      clothPos.x - clothWidth * 0.5,
      clothPos.y,
      clothPos.z + clothHeight * 0.5
  );
  const clothCorner01 = new this.Ammo.btVector3(
      clothPos.x - clothWidth * 0.5,
      clothPos.y,
      clothPos.z - clothHeight * 0.5
  );
  const clothCorner10 = new this.Ammo.btVector3(
      clothPos.x + clothWidth * 0.5,
      clothPos.y,
      clothPos.z + clothHeight * 0.5
  );
  const clothCorner11 = new this.Ammo.btVector3(
      clothPos.x + clothWidth * 0.5,
      clothPos.y,
      clothPos.z - clothHeight * 0.5
  );

  // Create the soft body
  const clothSoftBody = this.softBodyHelper.CreatePatch(
      this.worldInfo,
      clothCorner00,
      clothCorner01,
      clothCorner10,
      clothCorner11,
      clothNumSegmentsZ + 1,
      clothNumSegmentsY + 1,
      0, // Fixed corners
      true // Generate diagonal links
  );

  // Soft body configuration
  const sbConfig = clothSoftBody.get_m_cfg();
  sbConfig.set_viterations(100); // Increase velocity solver iterations
  sbConfig.set_piterations(100); // Increase position solver iterations
  sbConfig.set_kDP(0.03); // Set damping
  sbConfig.set_kCHR(5.0);
  sbConfig.set_kDF(0.9);

  // Stiffness
  clothSoftBody.get_m_materials().at(0).set_m_kLST(0.3);
  clothSoftBody.get_m_materials().at(0).set_m_kAST(0.3);


  clothSoftBody.setTotalMass(3.0, false);

  Ammo.castObject(clothSoftBody, Ammo.btCollisionObject)
      .getCollisionShape()
      .setMargin(margin); // Adjust margin as per the working example

  this.physicsWorld.addSoftBody(clothSoftBody, 1, -1);

  // Link physics body to Three.js mesh
  cloth.userData.physicsBody = clothSoftBody;

  // Disable deactivation
  clothSoftBody.setActivationState(4);

  this.cloth = cloth;

  // Clean up Ammo.js objects
  Ammo.destroy(clothCorner00);
  Ammo.destroy(clothCorner01);
  Ammo.destroy(clothCorner10);
  Ammo.destroy(clothCorner11);

  return cloth;
}



    changeClothTexture(cloth){
        const textureLoader = new THREE.TextureLoader();
        textureLoader.load("../textures/grid.png", (texture) => {
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(this.clothNumSegmentsZ, this.clothNumSegmentsY);
            cloth.material.map = texture;
            cloth.material.needsUpdate = true;
        });
    }

    clothUpdate(cloth) {
        var clothSoftBody = cloth.userData.physicsBody;
        var geometry = cloth.geometry;
        var clothPositions = geometry.attributes.position.array;
        var numVerts = clothPositions.length/3;

        var softBodyNodes = clothSoftBody.get_m_nodes();
      
        if (softBodyNodes.size() !== numVerts) {
          console.error("Mismatch between soft body nodes and geometry vertices.");
          return;
        }
      
        let indexFloat = 0;
        for (let i = 0; i < numVerts; i++) {
          const node = softBodyNodes.at(i);
          const nodePos = node.get_m_x();
      
          const x = nodePos.x();
          const y = nodePos.y();
          const z = nodePos.z();
      
          if (isNaN(x) || isNaN(y) || isNaN(z)) {
            console.error(`NaN detected at vertex ${i}: x=${x}, y=${y}, z=${z}`);
            continue; // Skip updating this vertex
          }
      
          clothPositions[indexFloat++] = x;
          clothPositions[indexFloat++] = y;
          clothPositions[indexFloat++] = z;
        }
      
        geometry.computeVertexNormals();
        geometry.attributes.position.needsUpdate = true;
        geometry.attributes.normal.needsUpdate = true;
      }
      
      // Find the closest vertex index on the cloth
    findClosestVertex(targetPosition) {
      const geometry = this.cloth.geometry;
      const vertices = geometry.attributes.position.array;
      let closestIndex = -1;
      let closestDistance = Infinity;

      for (let i = 0; i < vertices.length / 3; i++) {
          const vertexPosition = new THREE.Vector3(
              vertices[i * 3],
              vertices[i * 3 + 1],
              vertices[i * 3 + 2]
          );
          const distance = vertexPosition.distanceTo(targetPosition);

          if (distance < closestDistance) {
              closestDistance = distance;
              closestIndex = i;
          }
      }

      return closestIndex;
  }
  createPinPoint(clickCoord){
    this.pinActive = true;
    
    const softBodyNodes = this.cloth.userData.physicsBody.get_m_nodes();
    const clothVertexIndex = this.findClosestVertex(clickCoord); // Vertex to drag
    const clothNode = softBodyNodes.at(clothVertexIndex);
    const clothNodePosition = clothNode.get_m_x(); // Initial position of the vertex

    // 1. Create a small draggable sphere
    const sphereSize = 0.1; // Small sphere
    const sphereGeometry = new THREE.SphereGeometry(sphereSize);
    const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const sphereMesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
    this.scene.add(sphereMesh);

    // Create Ammo.js rigid body for the sphere
    const sphereShape = new Ammo.btSphereShape(sphereSize);
    const sphereTransform = new Ammo.btTransform();
    sphereTransform.setIdentity();
    sphereTransform.setOrigin(new Ammo.btVector3(
      clickCoord.x,
      clickCoord.y,
      clickCoord.z
    ));
    const sphereMass = 0; // Small mass
    const sphereLocalInertia = new Ammo.btVector3(0, 0, 0);
    sphereShape.calculateLocalInertia(sphereMass, sphereLocalInertia);
    const sphereMotionState = new Ammo.btDefaultMotionState(sphereTransform);

    const sphereBody = new Ammo.btRigidBody(
      new Ammo.btRigidBodyConstructionInfo(sphereMass, sphereMotionState, sphereShape, sphereLocalInertia)
    );
    this.physicsWorld.addRigidBody(sphereBody);

    // Sync Three.js sphere with Ammo.js rigid body
    sphereMesh.position.set(
      clothNodePosition.x(),
      clothNodePosition.y(),
      clothNodePosition.z()
    );
    sphereMesh.userData.physicsBody = sphereBody;
    // 2. Anchor the cloth vertex to the sphere
    this.cloth.userData.physicsBody.appendAnchor(clothVertexIndex, sphereBody, true, 1.0);
    
    this.pinpoints.push(sphereMesh);
    this.activePin = sphereMesh;
    const index = this.pinpoints.length-1;

    return index;
  }
  setPinLocation(index, location){
    this.pinActive = false;
    const pinpoint = this.pinpoints[index].userData.physicsBody;
    console.log(pinpoint);
    const transform = pinpoint.getWorldTransform();
    transform.setIdentity(); // Reset to identity matrix
    transform.setOrigin(new this.Ammo.btVector3(location.x, location.y, location.z)); // Set new origin
    pinpoint.setWorldTransform(transform); // Update the object's world transform
  }

  destroyPin(index){
    if(this.pinpoints.length==0) {return;}
    if(index>=this.pinpoints.length){
      console.log("length exceeded for pinpoints");
      return;
    }
    console.log("pin destroyed")
    this.pinActive = false;
    const mesh = this.pinpoints[index];
    const body = mesh.userData.physicsBody;
    this.scene.remove(mesh); // Remove the mesh from the scene
    if (mesh.geometry) {
        mesh.geometry.dispose();
    }
    if (mesh.material) {
        if (Array.isArray(mesh.material)) {
            mesh.material.forEach((material) => material.dispose());
        } else {
            mesh.material.dispose();
        }
    }

    this.physicsWorld.removeRigidBody(body);
    this.Ammo.destroy(body.getMotionState());
    this.Ammo.destroy(body.getCollisionShape());
    this.Ammo.destroy(body);
    this.pinpoints.splice(index, 1);
  }

    simulate(deltaTime, anchorMesh) {
        // Step the physics simulation forward
        //let dt = Math.min(deltaTime, 1 / 30); // Cap deltaTime to ~33ms
        this.physicsWorld.stepSimulation(1/60, 5);
    
        // Update each soft body
        this.clothUpdate(this.cloth);
        
        
        // Sync anchor mesh with the physics body
        const anchorPhysicsBody = anchorMesh.userData.physicsBody;

        if (anchorPhysicsBody) {
          //update the location of the mesh anchor in the physics world
          this.transformAux1.setIdentity();
          this.transformAux1.setOrigin(new this.Ammo.btVector3(anchorMesh.position.x, anchorMesh.position.y, anchorMesh.position.z));
          anchorPhysicsBody.setWorldTransform(this.transformAux1);

        }
        if (this.pinActive && this.activePin){
          this.transformAux1.setIdentity();
          //eerrr how handle dis
          this.transformAux1.setOrigin(new this.Ammo.btVector3(this.activePin.position.x, this.activePin.position.y, this.activePin.position.z));
          this.activePin.userData.physicsBody.setWorldTransform(this.transformAux1);
        }
        
    }    
}
export default Physics