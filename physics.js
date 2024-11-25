import Ammo from "./js/ammo";

/* Sources:
 * https://medium.com/@bluemagnificent/intro-to-javascript-3d-physics-using-ammo-js-and-three-js-dd48df81f591
 * 
 */
class Physics {
    constructor() {
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
		this.cloth;
		this.transformAux1 = new Ammo.btTransform();
        this.time = 0;
    }

    /**
     * Initialize Ammo.js and set up the physics world.
     * @returns {Promise<void>}
     */

 

    async init() {
        // asynchronously initializes Ammo.js; promise resolves when Ammo.js is ready
        if (this.initPromise) return this.initPromise;

        //initialize Ammo.js library, returning a promise
        //once loaded, then handle result Ammo, the Ammo.js library object
        this.initPromise = Ammo().then((Ammo) => {
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

        return this.initPromise;
    }


    
    generateSoftBody(worldInfo, ){
        
        worldInfo,          // 1. btSoftBodyWorldInfo object
        corner00,           // 2. btVector3 (bottom-left corner)
        corner10,           // 3. btVector3 (bottom-right corner)
        corner01,           // 4. btVector3 (top-left corner)
        corner11,           // 5. btVector3 (top-right corner)
        resx,               // 6. Integer (number of segments along X-axis)
        resy,               // 7. Integer (number of segments along Y-axis)
        fixedCorners,       // 8. Integer (bitmask to define fixed corners)
        gendiags            // 9. Boolean (whether to generate diagonal links)

        return this.softBodyHelper.CreatePatch( physicsWorld.getWorld + 1, clothNumSegmentsY + 1, 0, true );
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
}

export default Physics;
