'use strict'

class physicsWorld{

/**
     * Create a new physics engine (Ammo) instance
 */
constructor() {
    this.bodies = [];
}

createBody(){

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

setupPhysicsWorld(){

    let collisionConfiguration  = new Ammo.btDefaultCollisionConfiguration(),
        dispatcher              = new Ammo.btCollisionDispatcher(collisionConfiguration),
        overlappingPairCache    = new Ammo.btDbvtBroadphase(),
        solver                  = new Ammo.btSequentialImpulseConstraintSolver();

    physicsWorld           = new Ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration);
    physicsWorld.setGravity(new Ammo.btVector3(0, -10, 0));

}

createRigidBodyForTriangleMesh(mesh, collisionShape, mass = 0) {
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

// Example usage:
let collisionShape = createTriangleMeshCollisionShape(fbx);
let rigidBody = createRigidBodyForTriangleMesh(fbx, collisionShape);

Ammo.destroy(collisionShape);
Ammo.destroy(triangleMesh);
}