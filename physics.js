import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import * as THREE from 'three';

/* Sources:
 * https://medium.com/@bluemagnificent/intro-to-javascript-3d-physics-using-ammo-js-and-three-js-dd48df81f591
 * 
 */
class Physics {
    constructor(Ammo) {
        this.Ammo = Ammo;
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
        this.worldInfo = new this.Ammo.btSoftBodyWorldInfo();

        // Set earth-like gravity vector for entire rigid bodies physics world
        this.physicsWorld.setGravity(new this.Ammo.btVector3(0, -9.81, 0));

        // Set gravity for the soft body solver as well
        this.physicsWorld.getWorldInfo().set_m_gravity(new this.Ammo.btVector3(0, -9.81, 0));
    }
    

    
    generateSoftBody(worldInfo, corner00, corner10, corner01, corner11, resx, resy, fixedCorners, gendiags){
    return this.softBodyHelper.CreatePatch(
        worldInfo,          // 1. btSoftBodyWorldInfo object
        corner00,           // 2. btVector3 (bottom-left corner)
        corner10,           // 3. btVector3 (bottom-right corner)
        corner01,           // 4. btVector3 (top-left corner)
        corner11,           // 5. btVector3 (top-right corner)
        resx,               // 6. Integer (number of segments along X-axis)
        resy,               // 7. Integer (number of segments along Y-axis)
        fixedCorners,       // 8. Integer (bitmask to define fixed corners)
        gendiags            // 9. Boolean (whether to generate diagonal links)
    );
    }

/**
* Add a rigid body to the physics world.
* @param {THREE.Group} fbx_model instance of a loaded FBX model
*/
addModel(fbx_model) {
    const meshShape = this.createTriangleMeshCollisionShape(fbx_model);
    const transform = this.getTransform(fbx_model);
    const motionState = new this.Ammo.btDefaultMotionState(transform);
    const rbInfo = new this.Ammo.btRigidBodyConstructionInfo(
        0, //mass
        motionState,
        meshShape,
        new this.Ammo.btVector3(0, 0, 0) //local inertia
    )
    const rigidBody = new this.Ammo.btRigidBody(rbInfo);

    this.physicsWorld.addRigidBody(rigidBody);

    this.objects.push({physicsBody: rigidBody, mesh: fbx_model}); 

    return rigidBody;
}

/**
* Add a rigid body to the physics world.
* @param {Ammo.meshShape} shape shape of object
* @param {Ammo.btVector3} origin origin(location) of object
* @param {Ammo.mesh} mesh mesh of model
*/
addObject(shape, origin, mesh) {
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

    this.physicsWorld.addRigidBody(rigidBody);

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

    const transform = new this.Ammo.btTransform();
    transform.setIdentity();
    const origin = new this.Ammo.btVector3(position.x, position.y, position.z);
    transform.setOrigin(origin);
    const rotation = new this.Ammo.btQuaternion(quaternion.x, quaternion.y, quaternion.z, quaternion.w);
    transform.setRotation(rotation);

    return transform;
}
/**
 * Loads a collision shape for a static mannequin
 * @param {THREE.Group} meshGroup Instance of a loaded FBX model
 */
createTriangleMeshCollisionShape(meshGroup) {
    const triangleMesh = new this.Ammo.btTriangleMesh();

    // Assume the group has only one mesh
    const child = meshGroup.children[0];
    if (child.isMesh) {
        const geometry = child.geometry;
        const positionAttribute = geometry.attributes.position;

        // Add triangles to the btTriangleMesh
        for (let i = 0; i < positionAttribute.count; i += 3) {
            const vertex1 = new this.Ammo.btVector3(
                positionAttribute.getX(i),
                positionAttribute.getY(i),
                positionAttribute.getZ(i)
            );
            const vertex2 = new this.Ammo.btVector3(
                positionAttribute.getX(i + 1),
                positionAttribute.getY(i + 1),
                positionAttribute.getZ(i + 1)
            );
            const vertex3 = new this.Ammo.btVector3(
                positionAttribute.getX(i + 2),
                positionAttribute.getY(i + 2),
                positionAttribute.getZ(i + 2)
            );

            triangleMesh.addTriangle(vertex1, vertex2, vertex3, true);
            this.Ammo.destroy(vertex1);
            this.Ammo.destroy(vertex2);
            this.Ammo.destroy(vertex3);
        }
    } else {
        console.warn("The provided group does not contain a valid mesh.");
        return null;
    }

    // Create a collision shape from the triangle mesh
    const isStatic = true; // For static objects
    const shape = new this.Ammo.btBvhTriangleMeshShape(triangleMesh, isStatic);

    return shape;
    }


    /**
     * @param {number} clothWidth Width of the cloth
     * @param {number} clothHeight Height of the cloth
     * @param {THREE.Vector3} clothPos Position of the cloth in world space
     * @param {number} margin Collision margin for the soft body
     */
    createCloth(clothWidth = 4, clothHeight = 3, clothPos = new THREE.Vector3(0, 0, 2), margin = 0.05) {
        const clothNumSegmentsZ = clothWidth * 5;
        const clothNumSegmentsY = clothHeight * 5;
        const clothSegmentLengthZ = clothWidth / clothNumSegmentsZ;
        const clothSegmentLengthY = clothHeight / clothNumSegmentsY;

        // Three.js cloth mesh setup
        const clothGeometry = new THREE.PlaneGeometry(clothWidth, clothHeight, clothNumSegmentsZ, clothNumSegmentsY);
        clothGeometry.rotateY(Math.PI * 0.5);
        clothGeometry.translate(clothPos.x, clothPos.y + clothHeight * 0.5, clothPos.z - clothWidth * 0.5);

        const clothMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff, side: THREE.DoubleSide });
        const cloth = new THREE.Mesh(clothGeometry, clothMaterial);

        // Define corners of the cloth
        const clothCorner00 = new this.Ammo.btVector3(clothPos.x, clothPos.y + clothHeight, clothPos.z);
        const clothCorner01 = new this.Ammo.btVector3(clothPos.x, clothPos.y + clothHeight, clothPos.z - clothWidth);
        const clothCorner10 = new this.Ammo.btVector3(clothPos.x, clothPos.y, clothPos.z);
        const clothCorner11 = new this.Ammo.btVector3(clothPos.x, clothPos.y, clothPos.z - clothWidth);

        // Create the soft body
        const softBodyHelpers = new this.Ammo.btSoftBodyHelpers();
        const clothSoftBody = softBodyHelpers.CreatePatch(
            this.physicsWorld.getWorldInfo(),
            clothCorner00,
            clothCorner01,
            clothCorner10,
            clothCorner11,
            clothNumSegmentsZ + 1,
            clothNumSegmentsY + 1,
            0, // Fixed corners (e.g., 0b1010 fixes top-left and bottom-right corners)
            true // Generate diagonal links
        );

        // Soft body configuration
        const sbConfig = clothSoftBody.get_m_cfg();
        sbConfig.set_viterations(10);
        sbConfig.set_piterations(10);
        sbConfig.set_kDF(0.5); // Dynamic friction
        sbConfig.set_kDP(0.005); // Damping
        sbConfig.set_kPR(1); // Pressure resistance
        sbConfig.set_kVCF(0.5); // Volume conservation factor
        sbConfig.set_kMT(0.1); // Pose matching coefficient

        // Set mass for the cloth
        clothSoftBody.setTotalMass(0.9, false);

        // Set collision margin
        Ammo.castObject(clothSoftBody, this.Ammo.btCollisionObject)
            .getCollisionShape()
            .setMargin(margin);

        // Add soft body to the physics world
        this.physicsWorld.addSoftBody(clothSoftBody, 1, -1);

        // Keep the cloth active
        clothSoftBody.setActivationState(4);

        // Link physics body to Three.js mesh
        this.softbodies.push({ physicsBody: clothSoftBody, mesh: cloth });

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

    clothUpdate(clothSoftBody) {
        // Access Ammo.js soft body nodes
        const softBodyNodes = clothSoftBody.get_m_nodes();
        const geometry = this.cloth.geometry;
        const position = geometry.attributes.position;
    
        // Ensure node count matches geometry vertex count
        if (softBodyNodes.size() !== position.count) {
            console.error("Mismatch between soft body nodes and geometry vertices.");
            return;
        }
    
        // Update each vertex position
        for (let i = 0; i < position.count; i++) {
            const node = softBodyNodes.at(i); // Get the ith node of Ammo.btAlignedObjectArray
            const nodePosition = node.get_m_x(); // Get position of node as Ammo.btVector3
    
            // Extract position values
            const x = nodePosition.x();
            const y = nodePosition.y();
            const z = nodePosition.z();
    
            // Check for NaN values
            if (isNaN(x) || isNaN(y) || isNaN(z)) {
                console.error(`NaN detected at vertex ${i}: x=${x}, y=${y}, z=${z}`);
                continue; // Skip updating this vertex
            }
    
            // Set position in Three.js geometry
            position.setXYZ(i, x, y, z);
        }
    
        // Notify Three.js to update the geometry
        position.needsUpdate = true;
    
        // Optional: Log for debugging (remove for production)
        // console.log(position);
    }
    
    

   /**
 * Run the physics simulation.
 * @param {number} deltaTime Time step for the simulation.
 */
    simulate(deltaTime) {

        // Step the physics simulation forward
        // `deltaTime`: The time elapsed since the last simulation step
        // `10`: Maximum number of substeps to perform if the simulation is lagging
        this.physicsWorld.stepSimulation(deltaTime, 10);
        this.softbodies.forEach(({ physicsBody, mesh }) => {
        print(physicsBody)
        this.clothUpdate(physicsBody);
        }
    )};
}
export default Physics