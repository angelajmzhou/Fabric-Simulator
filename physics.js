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
		this.cloth = null;
        this.softBodyHelper = null;
		this.transformAux1 = null;
        //elapsed time
        this.time = performance.now();
        this.Ammo = null;
     }

    /**
     * @returns {Promise<void>}
     */

 

    async init(Ammo) {
        // If Ammo is already initialized, return the existing promise
        if (this.initPromise) return this.initPromise;
        // Ensure Ammo is passed in correctly
        this.Ammo = Ammo;

        // Initialize Ammo.js using the provided Ammo instance
        this.initPromise = Promise.resolve().then(() => {
            // Use default collision configuration
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
        });

        return this.initPromise;
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
            const transform = new this.Ammo.btTransform();

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
            this.Ammo.destroy(transform);
        });
    }
}
export default Physics