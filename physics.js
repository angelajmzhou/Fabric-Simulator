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
        this.softbodies = []; // Track objects added to the physics world

		    this.margin = 0.05;
        this.time = performance.now();


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

        // Create the world info for the soft bodies
        this.worldInfo = this.physicsWorld.getWorldInfo();

        // Set earth-like gravity vector for entire rigid bodies physics world
        this.physicsWorld.setGravity(new this.Ammo.btVector3(0, -10, 0));

        // Set gravity for the soft body solver as well
        this.worldInfo.set_m_gravity(new this.Ammo.btVector3(0, -10, 0));
    }


/**
* Add a rigid body to the physics world.
* @param {THREE.Group} fbx_model instance of a loaded FBX model
*/
addModel(fbx_model) {
    fbx_model.updateMatrixWorld(true);
		const mesh = fbx_model.children[0] // Access the mesh
    const meshShape = this.createWireframeAndMesh(mesh, fbx_model);
    const transform = this.getTransform(fbx_model);

    const rotation = new Ammo.btQuaternion();
    rotation.setEulerZYX(Math.PI / 2, 0, 0); // Roll: 90 degrees
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

    this.objects.push({physicsBody: rigidBody, mesh: fbx_model}); 

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
    const transform = new this.Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin(origin);
    const motionState = new this.Ammo.btDefaultMotionState(transform);
    const rbInfo = new this.Ammo.btRigidBodyConstructionInfo(
        0, //mass
        motionState,
        shape,
        new this.Ammo.btVector3(0, 0, 0) //local inertia
    )
    
    const rigidBody = new this.Ammo.btRigidBody(rbInfo);
    threeObj.userData.physicsBody = rigidBody;

    rigidBody.getCollisionShape().setMargin(this.margin);

    this.physicsWorld.addRigidBody(rigidBody, 1, -1);

    rigidBody.setActivationState(4); // Disable deactivation

    this.objects.push({physicsBody: rigidBody, mesh: mesh}); 

    return rigidBody;
}
/**
* Calculate transform of a loaded model
* @param {THREE.Group} fbx_model instance of a loaded FBX model
*/
getTransform(fbx_model){
    const position = fbx_model.position;
    const quaternion = fbx_model.quaternion;
    console.log(quaternion)
    const transform = new this.Ammo.btTransform();
    transform.setIdentity();
    const origin = new this.Ammo.btVector3(position.x, position.y, position.z);
    transform.setOrigin(origin);
    const rotation = new this.Ammo.btQuaternion(quaternion.x, quaternion.y, quaternion.z, quaternion.w);
    transform.setRotation(rotation);
    console.log("Ammo Quaternion:", rotation.x(), rotation.y(), rotation.z(), rotation.w());
    console.log("Three.js Quaternion:", quaternion);


    return transform;
}
/**
 * Loads a collision shape for a static mannequin
 * @param {THREE.Mesh} mesh Instance of a loaded FBX model
 */

/**
 * Loads a collision shape for a static mannequin
 * @param {THREE.Mesh} mesh Instance of a loaded FBX model
 */
createTriangleMeshCollisionShape(mesh, fbx_model) {
  //geometry.computeBoundingBox();
  fbx_model.scale.set(1, 1, 1); // Temporarily reset scale
  fbx_model.updateMatrixWorld(true); // Update world matrix
  mesh.geometry.applyMatrix4(fbx_model.matrixWorld); // Apply the transformation
  mesh.geometry.scale(0.01, 0.01, 0.01); // Reapply the intended scale directly to geometry
  const geometry = mesh.geometry;
  const boxHelper = new THREE.BoxHelper(mesh, 0xffff00);
   this.scene.add(boxHelper);

   const axesHelper = new THREE.AxesHelper(1);
   fbx_model.add(axesHelper);


  const scale = 1;
  const meshShape = new Ammo.btTriangleMesh(true, true);
  const vertices = geometry.attributes.position.array;
  for (let i = 0; i < vertices.length; i += 9) {
    meshShape.addTriangle(
      new Ammo.btVector3(vertices[i] * scale, vertices[i + 1] * scale, vertices[i + 2] * scale),
      new Ammo.btVector3(vertices[i + 3] * scale, vertices[i + 4] * scale, vertices[i + 5] * scale),
      new Ammo.btVector3(vertices[i + 6] * scale, vertices[i + 7] * scale, vertices[i + 8] * scale),
      true
    );
  }  
  
    const shape = new Ammo.btBvhTriangleMeshShape(meshShape, false, true);
    console.log("Collision shape created:", meshShape.constructor.name);
    return shape;
    }

  createWireframeAndMesh(mesh, fbx_model) {
    fbx_model.scale.set(1, 1, 1); // Temporarily reset scale
    fbx_model.updateMatrixWorld(true); // Ensure the world matrix is up to date
    mesh.geometry.applyMatrix4(fbx_model.matrixWorld); // Apply all transformations to the geometry
    mesh.geometry.computeBoundingBox(); // Update bounding box
    mesh.geometry.computeBoundingSphere(); // Update bounding sphere

    // Reset the model's transformations
    fbx_model.position.set(0, 0, 0);
    fbx_model.rotation.set(0, 0, 0);

    mesh.geometry.scale(0.001, 0.001, 0.001); // Reapply the intended scale directly to geometry
    const boxHelper = new THREE.BoxHelper(mesh, 0xffff00);
     this.scene.add(boxHelper);
     console.log("FBX Model Rotation:", fbx_model.rotation);
     console.log("FBX Model MatrixWorld:", fbx_model.matrixWorld);
     
     const axesHelper = new THREE.AxesHelper(1);
     fbx_model.add(axesHelper);
    const geometry = mesh.geometry;
    const scale = 500; // Same scale applied to the collision shape
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
    console.log("Wireframe vertices:", linePositions.slice(0, 30)); // Log first 10 vertices
    console.log("Baked geometry bounding box:", mesh.geometry.boundingBox);

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

    console.log("Collision shape and wireframe created:", meshShape.constructor.name);
    return shape;
  }

    /**
     * @param {number} clothWidth Width of the cloth
     * @param {number} clothHeight Height of the cloth
     * @param {THREE.Vector3} clothPos Position of the cloth in world space
     * @param {number} margin Collision margin for the soft body
     */
    createCloth(
        clothWidth = 4,
        clothHeight = 3,
        clothPos = new THREE.Vector3(0, 6, 2),
        margin = 0.5
      ) {
        const clothNumSegmentsZ = clothWidth * 5;
        const clothNumSegmentsY = clothHeight * 5;
      
        // Create Three.js geometry using PlaneGeometry
        
        const clothGeometry = new THREE.PlaneGeometry(
          clothWidth,
          clothHeight,
          clothNumSegmentsZ,
          clothNumSegmentsY
        );
        clothGeometry.rotateY(Math.PI * 0.5);
        clothGeometry.translate(
          clothPos.x,
          clothPos.y + clothHeight * 0.5,
          clothPos.z - clothWidth * 0.5
        );
      
        const clothMaterial = new THREE.MeshLambertMaterial({
          color: 0xffffff,
          side: THREE.DoubleSide,
          //wireframe: true
        });
        const cloth = new THREE.Mesh(clothGeometry, clothMaterial);
      
        // Define Ammo.js cloth corners
        const clothCorner00 = new this.Ammo.btVector3(
          clothPos.x,
          clothPos.y + clothHeight,
          clothPos.z
        );
        const clothCorner01 = new this.Ammo.btVector3(
          clothPos.x,
          clothPos.y + clothHeight,
          clothPos.z - clothWidth
        );
        const clothCorner10 = new this.Ammo.btVector3(
          clothPos.x,
          clothPos.y,
          clothPos.z
        );
        const clothCorner11 = new this.Ammo.btVector3(
          clothPos.x,
          clothPos.y,
          clothPos.z - clothWidth
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
        sbConfig.set_viterations(20); // Increase velocity solver iterations
        sbConfig.set_piterations(20); // Increase position solver iterations
        sbConfig.set_kDP(0.01);       // Add damping to reduce jitter
        sbConfig.set_kDG(0.01);       // Add drag to stabilize movement
        sbConfig.set_kLF(0.01);       // Add lift to prevent excessive crumpling


        clothSoftBody.setTotalMass(0.9, false);
      
        Ammo.castObject(clothSoftBody, Ammo.btCollisionObject)
          .getCollisionShape()
          .setMargin(margin); // Adjust margin as per the working example
      
        this.physicsWorld.addSoftBody(clothSoftBody, 1, -1);
      
        // Link physics body to Three.js mesh
        cloth.userData.physicsBody = clothSoftBody;
      
        // Disable deactivation
        clothSoftBody.setActivationState(4);
      
        this.softbodies.push(cloth);
      
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

    translateClothFromTop(offsetX, offsetY, offsetZ) {
      if (this.softbodies.length === 0) {
          console.error("No soft body found to translate.");
          return;
      }
  
      const cloth = this.softbodies[0]; // Access the first soft body
  
      // Get the nodes of the soft body
      const nodes = cloth.userData.physicsBody.get_m_nodes();
      const numSegmentsX = Math.sqrt(nodes.size()); // Assume grid is square for simplicity
  
      // Move the top row of nodes
      for (let i = 0; i < numSegmentsX; i++) {
          const node = nodes.at(i); // Top row nodes are the first N nodes
          const pos = node.get_m_x();
          pos.setX(pos.x() + offsetX);
          pos.setY(pos.y() + offsetY);
          pos.setZ(pos.z() + offsetZ);
          node.set_m_x(pos);
      }
  
      // Update the Three.js mesh position to reflect the soft body
      cloth.position.x += offsetX;
      cloth.position.y += offsetY;
      cloth.position.z += offsetZ;
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
      
      
    
    simulate(deltaTime) {
        // Step the physics simulation forward
        //let dt = Math.min(deltaTime, 1 / 30); // Cap deltaTime to ~33ms
        this.physicsWorld.stepSimulation(1/60, 5);
    
        // Update each soft body
        this.softbodies.forEach((cloth) => {
            this.clothUpdate(cloth);
        });
    }    
}
export default Physics