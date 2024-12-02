import * as THREE from 'three';
import Physics from './physics';

class softBody {
    /** 
     * @param {Object} Ammo Ammo.js library instance
     * @param {Object} physics Physics world instance to manage the simulation
     * @param {number} clothWidth Width of the cloth
     * @param {number} clothHeight Height of the cloth
     * @param {THREE.Vector3} clothPos Position of the cloth in world space
     * @param {number} margin Collision margin for the soft body
     */
    constructor(Ammo, physics, clothWidth = 4, clothHeight = 3, clothPos = new THREE.Vector3(0, 0, 2), margin = 0.05) {
        // Store Ammo and physicsWorld
        this.Ammo = Ammo;
        this.physics = physics;
        this.margin = margin;

        // Cloth geometry setup
        this.clothWidth = clothWidth;
        this.clothHeight = clothHeight;
        this.clothNumSegmentsZ = clothWidth * 5;
        this.clothNumSegmentsY = clothHeight * 5;
        this.clothSegmentLengthZ = clothWidth / this.clothNumSegmentsZ;
        this.clothSegmentLengthY = clothHeight / this.clothNumSegmentsY;
        this.clothPos = clothPos;

        // Three.js cloth mesh setup
        this.clothGeometry = new THREE.PlaneGeometry(this.clothWidth, this.clothHeight, this.clothNumSegmentsZ, this.clothNumSegmentsY);
        this.clothGeometry.rotateY(Math.PI * 0.5);
        this.clothGeometry.translate(clothPos.x, clothPos.y + clothHeight * 0.5, clothPos.z - clothWidth * 0.5);

        this.clothMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF, side: THREE.DoubleSide });
        this.cloth = new THREE.Mesh(this.clothGeometry, this.clothMaterial);
        this.cloth.castShadow = true;
        this.cloth.receiveShadow = true;

        // Set up the cloth texture
        const textureLoader = new THREE.TextureLoader();
        textureLoader.load("../textures/grid.png", (texture) => {
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(this.clothNumSegmentsZ, this.clothNumSegmentsY);
            this.cloth.material.map = texture;
            this.cloth.material.needsUpdate = true;
        });

        // Ammo.js soft body setup
        this.softBodyHelpers = new this.Ammo.btSoftBodyHelpers();
        this.clothCorner00 = new this.Ammo.btVector3(clothPos.x, clothPos.y + clothHeight, clothPos.z);
        this.clothCorner01 = new this.Ammo.btVector3(clothPos.x, clothPos.y + clothHeight, clothPos.z - clothWidth);
        this.clothCorner10 = new this.Ammo.btVector3(clothPos.x, clothPos.y, clothPos.z);
        this.clothCorner11 = new this.Ammo.btVector3(clothPos.x, clothPos.y, clothPos.z - clothWidth);

        // Create the soft body from the helper
        this.clothSoftBody = physics.generateSoftBody(
            physics.physicsWorld.getWorldInfo(),
            this.clothCorner00,
            this.clothCorner10,
            this.clothCorner01,
            this.clothCorner11,
            this.clothNumSegmentsZ + 1,
            this.clothNumSegmentsY + 1,
            0, // Set fixed corners if any
            true // Generate diagonal links
        );

        //this.clothSoftBody.appendAnchor(0, physics.groundBody, true);
        //this.clothSoftBody.appendAnchor(this.clothNumSegmentsZ, physics.groundBody, true);

        // Configuration for the soft body
        let sbConfig = this.clothSoftBody.get_m_cfg();
        sbConfig.set_viterations(10);  // Set the number of velocity iterations
        sbConfig.set_piterations(10);  // Set the number of pressure iterations
        sbConfig.set_kDF(0.5); //dynamic friction
        sbConfig.set_kDP(0.005); //damping
        sbConfig.set_kPR(1); //pressure resistance
        sbConfig.set_kVCF(0.5); //volume conservation factor
        sbConfig.set_kMT(0.1); //pose matching coefficient

        // Set the mass for the cloth (not fully fixed)
        this.clothSoftBody.setTotalMass(0.9, false);

        // Collision margin
        this.Ammo.castObject(this.clothSoftBody, this.Ammo.btCollisionObject)
            .getCollisionShape()
            .setMargin(this.margin * 3);

        // Add soft body to the physics world
        this.physics.physicsWorld.addSoftBody(this.clothSoftBody, 1, -1);

        // Disable deactivation (keep the cloth active even if it is not moving)
        this.clothSoftBody.setActivationState(4);

        // Link the soft body physics to the mesh
        this.cloth.userData.physicsBody = this.clothSoftBody;
    }

    /** 
     * Getter for the cloth mesh
     * @returns {THREE.Mesh} The Three.js mesh for the cloth
     */
    get() {
        return this.cloth;
    }
    update() {
        this.clothSoftBody.get_m_nodes(); //Ammo.btAligned Object Array
        const geometry = this.cloth.geometry;
        const softBodyNodes = this.clothSoftBody.get_m_nodes();
    
        // Update each vertex position
        const position = geometry.attributes.position;
        for (let i = 0; i < position.count; i++) {
            const node = softBodyNodes.at(i); //get the ith node of Ammot.btAlignedObjectArray
            const nodePosition = node.get_m_x(); //get position of node as Ammo.btVector3
            position.setXYZ(i, nodePosition.x(), nodePosition.y(), nodePosition.z());
        }
    
        // Notify Three.js to update the geometry
        position.needsUpdate = true;
        console.log(position);
    }
}


// Export softBody as the default export
export default softBody;