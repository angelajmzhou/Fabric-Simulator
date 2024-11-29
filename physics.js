/**
* Sources:
* https://medium.com/@bluemagnificent/intro-to-javascript-3d-physics-using-ammo-js-and-three-js-dd48df81f591
* 
**/
class Physics {
    constructor() {
        console.log('Physics constructed')
        this.initPromise = null; // Promise to ensure Ammo.js initializes once
        this.physicsWorld = null;
        this.collisionConfiguration = null;
        this.dispatcher = null;
        this.broadphase = null;
        this.solver = null;
        this.softBodySolver = null;
        this.objects = []; // Track objects added to the physics world
		this.rigidBodies = [];
		this.margin = 0.05;
		this.cloth = null;
        this.softBodyHelper = null;
		this.transformAux1 = null;
        //elapsed time
        this.time = performance.now();
     }

    /**
     * Initialize Ammo.js and set up the physics world.
     * @returns {Promise<void>}
     **/


    async init() {
        // asynchronously initializes Ammo.js; promise resolves when Ammo.js is ready
        if (this.initPromise) return this.initPromise;
        if (typeof Ammo === 'undefined') {
            console.error('Ammo.js is not loaded or available.');
            return Promise.reject('Ammo.js not loaded');
        }
        //initialize Ammo.js library, returning a promise
        //once loaded, then handle result Ammo, the Ammo.js library object
        this.initPromise = Ammo().then((Ammo) => {
            console.log("ammo initialized")
            //use default collision configuration
            this.collisionConfiguration = new Ammo.btSoftBodyRigidBodyCollisionConfiguration(); 
            //manage collisions between objects w/ configuration
            this.dispatcher = new Ammo.btCollisionDispatcher(this.collisionConfiguration);
            //broadphase collision detection algorithm (simple, check all object pairs w/o optimizing)
            this.broadphase = new Ammo.btDbvtBroadphase();
            //constraint solver -- calculates effects of collisions and forces on objects (i.e. interpenetration)
            this.solver = new Ammo.btSequentialImpulseConstraintSolver();
            this.softBodyHelper = new Ammo.btSoftBodyHelpers();
            this.softBodySolver = new Ammo.btDefaultSoftBodySolver();
            this.transformAux1 = newAmmo.btTransform();
            //create physics world: simulation core 
            this.physicsWorld = new Ammo.btSoftRigidDynamicsWorld(
                //use previously initialized values
                this.dispatcher,
                this.broadphase,
                this.solver,
                this.collisionConfiguration,
                this.softBodySolver
            );
            //set earth-like gravity vector for entire rigid bodies physics world
            this.physicsWorld.setGravity( new Ammo.btVector3( 0, -9.81, 0 ) );
            //set earth-like gravity for soft body solver
            this.physicsWorld.getWorldInfo().set_m_gravity( new Ammo.btVector3( 0, -9.81, 0 ) );
        });
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
 * Run the physics simulation.
 * @param {number} deltaTime Time step for the simulation.
 */
    simulate(deltaTime) {
        // Check if the physics world has been initialized
        if (!this.physicsWorld) {
            console.log("Physics world not initialized. Call `init()` first.");
            return; // Exit early if the physics world is not ready
        }

        // Step the physics simulation forward
        // `deltaTime`: The time elapsed since the last simulation step
        // `10`: Maximum number of substeps to perform if the simulation is lagging
        this.physicsWorld.stepSimulation(deltaTime, 10);

        // Iterate over all rigid bodies in the physics world
        // `this.objects` is assumed to be a list of rigid bodies added earlier
        this.objects.forEach((body) => {
            // Create a transform object to hold the rigid body's current state
            const transform = new Ammo.btTransform();

            // Get the current position and rotation of the rigid body from Ammo.js
            body.getMotionState().getWorldTransform(transform);

            // Extract the position (origin) of the rigid body
            const origin = transform.getOrigin();

            // Extract the rotation (quaternion) of the rigid body
            const rotation = transform.getRotation();

            // If the rigid body is linked to a rendering object (e.g., a Three.js mesh)
            if (body.mesh) {
                // Update the mesh's position to match the rigid body's position
                body.mesh.position.set(origin.x(), origin.y(), origin.z());

                // Update the mesh's rotation to match the rigid body's rotation
                body.mesh.quaternion.set(rotation.x(), rotation.y(), rotation.z(), rotation.w());
            }

            // Free the memory used by the transform object to prevent memory leaks
            Ammo.destroy(transform);
        });
    }
    /**
     * Add a rigid body to the physics world.
     * @param {Ammo.btRigidBody} rigidBody
     */
    addRigidBody(rigidBody) {
        this.physicsWorld.addRigidBody(rigidBody);
        this.objects.push(rigidBody); // Keep track of the body
    }

    /**
     * loads a collision shape for static mannequin
     * @param {THREE.Mesh} mesh instance of a loaded FBX model
    */
    createTriangleMeshCollisionShape(mesh) {
        const triangleMesh = new Ammo.btTriangleMesh();

        // Iterate through the mesh geometry
        mesh.traverse((child) => {
            if (child.isMesh) {
                const geometry = child.geometry;
                const positionAttribute = geometry.attributes.position;

                // Add triangles to the btTriangleMesh
                for (let i = 0; i < positionAttribute.count; i += 3) {
                    const vertex1 = new Ammo.btVector3(
                        positionAttribute.getX(i),
                        positionAttribute.getY(i),
                        positionAttribute.getZ(i)
                    );
                    const vertex2 = new Ammo.btVector3(
                        positionAttribute.getX(i + 1),
                        positionAttribute.getY(i + 1),
                        positionAttribute.getZ(i + 1)
                    );
                    const vertex3 = new Ammo.btVector3(
                        positionAttribute.getX(i + 2),
                        positionAttribute.getY(i + 2),
                        positionAttribute.getZ(i + 2)
                    );

                    triangleMesh.addTriangle(vertex1, vertex2, vertex3, true);
                    Ammo.destroy(vertex1);
                    Ammo.destroy(vertex2);
                    Ammo.destroy(vertex3);
                }
            }
        });

    // Create a collision shape from the triangle mesh
    const isStatic = true; // For static objects
    const shape = new Ammo.btBvhTriangleMeshShape(triangleMesh, isStatic);

    return shape;
}

/**
 * loads a collision shape for static mannequin
 * @param {THREE.Mesh} mesh instance of a loaded FBX model
 * @param {BT_COLLISION_SHAPE_H} collisionShape collision shape from createTriangleMeshCollisionShape
 * @param {Float} mass mass of the object; 0 if static object (i.e. mannequin)
*/
createRigidBodyForTriangleMesh(mesh, collisionShape, mass = 0) {
    //create rigid transformation instance (defines position/rotation)
    const transform = new Ammo.btTransform();
    transform.setIdentity();

    const position = mesh.position;
    transform.setOrigin(new Ammo.btVector3(position.x, position.y, position.z));

    const rotation = mesh.quaternion;
    transform.setRotation(new Ammo.btQuaternion(rotation.x, rotation.y, rotation.z, rotation.w));

    const motionState = new Ammo.btDefaultMotionState(transform);
    const localInertia = new Ammo.btVector3(0, 0, 0);

    // No local inertia for static objects
    if (mass > 0) {
        collisionShape.calculateLocalInertia(mass, localInertia);
    }

    const rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, collisionShape, localInertia);
    const rigidBody = new Ammo.btRigidBody(rbInfo);

    physicsWorld.addRigidBody(rigidBody);
    return rigidBody;
}
}
export default Physics