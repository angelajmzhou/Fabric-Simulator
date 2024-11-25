import Ammo from "ammo.js";

class Physics {
    constructor() {
        this.initPromise = null; // Promise to ensure Ammo.js initializes once
        this.physicsWorld = null;
        this.collisionConfiguration = null;
        this.dispatcher = null;
        this.broadphase = null;
        this.solver = null;
        this.objects = []; // Track objects added to the physics world
    }

    /**
     * Initialize Ammo.js and set up the physics world.
     * @returns {Promise<void>}
     */
    async init() {
        // asynchronously initializes Ammo.js; promise resolves when Ammo.js is ready
        if (this.initPromise) return this.initPromise;

        //initialize initPromise if not yet ready
        this.initPromise = Ammo().then((AmmoLib) => {
            //use default collision configuration
            this.collisionConfiguration = new AmmoLib.btDefaultCollisionConfiguration(); 
            //manage collisions between objects w/ configuration
            this.dispatcher = new AmmoLib.btCollisionDispatcher(this.collisionConfiguration);
            //broadphase collision detection algorithm (simple, check all object pairs w/o optimizing)
            this.broadphase = new AmmoLib.btSimpleBroadphase();
            //constraint solver -- calculates effects of collisions and forces on objects (i.e. interpenetration)
            this.solver = new AmmoLib.btSequentialImpulseConstraintSolver();
            //create physics world: simulation core 
            this.physicsWorld = new AmmoLib.btDiscreteDynamicsWorld(
                //use previously initialized values
                this.dispatcher,
                this.broadphase,
                this.solver,
                this.collisionConfiguration
            );
            //set earth-like gravity vector 
            this.physicsWorld.setGravity(new AmmoLib.btVector3(0, -9.81, 0)); // Default gravity
        });

        return this.initPromise;
    }

  

    /**
     * Run the physics simulation.
     * @param {number} deltaTime Time step for the simulation.
     */
    simulate(deltaTime) {
        if (!this.physicsWorld) {
            console.warn("Physics world not initialized. Call `init()` first.");
            return;
        }

        this.physicsWorld.stepSimulation(deltaTime, 10);

        // Optionally: Update positions of objects in your rendering engine
        this.objects.forEach((body) => {
            const transform = new Ammo.btTransform();
            body.getMotionState().getWorldTransform(transform);
            const origin = transform.getOrigin();
            const rotation = transform.getRotation();

            // Example: Update a Three.js mesh
            if (body.mesh) {
                body.mesh.position.set(origin.x(), origin.y(), origin.z());
                body.mesh.quaternion.set(rotation.x(), rotation.y(), rotation.z(), rotation.w());
            }

            Ammo.destroy(transform);
        });
    }
}

export default Physics;
