import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

/* Sources:
 * https://medium.com/@bluemagnificent/intro-to-javascript-3d-physics-using-ammo-js-and-three-js-dd48df81f591
 * 
 */
class Physics {
    constructor(Ammo) {
        this.Ammo = Ammo;
        this.objects = []; // Track objects added to the physics world
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
 * Run the physics simulation.
 * @param {number} deltaTime Time step for the simulation.
 */
    simulate(deltaTime) {

        // Step the physics simulation forward
        // `deltaTime`: The time elapsed since the last simulation step
        // `10`: Maximum number of substeps to perform if the simulation is lagging
        this.physicsWorld.stepSimulation(deltaTime, 10);

        // Iterate over all rigid bodies in the physics world
        // `this.objects` is assumed to be a list of rigid bodies added earlier
        this.objects.forEach(({ physicsBody, mesh }) => {
            // Create a transform object to hold the rigid body's current state
            const transform = new this.Ammo.btTransform();
            
            // Get the current position and rotation of the rigid body from Ammo.js
            physicsBody.getMotionState().getWorldTransform(transform);
        
            // Extract the position (origin) of the rigid body
            const origin = transform.getOrigin();
        
            // Extract the rotation (quaternion) of the rigid body
            const rotation = transform.getRotation();
        
            // Update the mesh if it exists
            if (mesh) {
                // Update the mesh's position to match the rigid body's position
                mesh.position.set(origin.x(), origin.y(), origin.z());
        
                // Update the mesh's rotation to match the rigid body's rotation
                mesh.quaternion.set(rotation.x(), rotation.y(), rotation.z(), rotation.w());
            }
        
            // Free the memory used by the transform object to prevent memory leaks
            this.Ammo.destroy(transform);
        });
    }
}
export default Physics