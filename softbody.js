class softBody extends Physics{
    /** 
     * @param {Physics} physicsWorld instance of the Physics class to manage collisions
     * @param {Int} clothWidth width of cloth
     * @param {Int} clothHeight height of cloth
     * @param {Vector3} position cloth position in world space
     *
     **/
    constructor(physicsWorld, clothWidth = 4, clothHeight = 3, clothPos = newThree.Vector3(-3,3,2)){
        super();
        this.physicsWorld = physicsWorld;
        this.Ammo = physicsWorld.Ammo;
        this.clothWidth = clothWidth;
        this.clothHeight = clothHeight;
        this.clothPos = clothPos;
        this.softBodyHelpers = new this.Ammo.btSoftBodyHelpers();

        this.clothNumSegmentsZ = clothWidth * 5;
        this.clothNumSegmentsY = clothHeight * 5;
        this.clothSegmentLengthZ = clothWidth / clothNumSegmentsZ;
        this.clothSegmentLengthY = clothHeight / clothNumSegmentsY;
        
		this.clothCorner00 = new this.Ammo.btVector3( clothPos.x, clothPos.y + clothHeight, clothPos.z );
		this.clothCorner01 = new this.Ammo.btVector3( clothPos.x, clothPos.y + clothHeight, clothPos.z - clothWidth );
		this.clothCorner10 = new this.Ammo.btVector3( clothPos.x, clothPos.y, clothPos.z );
		this.clothCorner11 = new this.Ammo.btVector3( clothPos.x, clothPos.y, clothPos.z - clothWidth );

        var clothGeometry = new THREE.PlaneBufferGeometry( clothWidth, clothHeight, clothNumSegmentsZ, clothNumSegmentsY );
        clothGeometry.rotateY( Math.PI * 0.5 )
        clothGeometry.translate( clothPos.x, clothPos.y + clothHeight * 0.5, clothPos.z - clothWidth * 0.5 );

        var clothMaterial = new THREE.MeshLambertMaterial( { color: 0xFFFFFF, side: THREE.DoubleSide } );
        this.mesh = new THREE.Mesh( clothGeometry, clothMaterial );
        cloth.castShadow = true;
        cloth.receiveShadow = true;

        this.cloth = physicsWorld.createClothPatch(worldInfo, this.clothCorner00, this.clothCorner01, this.clothCorner10, this.clothCorner11, this.clothNumSegmentsZ, this.clothNumSegmentsY, 1, physicsWorld );

    }

    createClothPatch(worldInfo, corner00, corner01, corner10, corner11, resX, resY, mass, physicsWorld) {
        const softBody = softBodyHelpers.CreatePatch(worldInfo, corner00, corner01, corner10, corner11, resX, resY, 0, true);
        const sbConfig = softBody.get_m_cfg();
        sbConfig.set_viterations(10);
        sbConfig.set_piterations(10);
        softBody.setTotalMass(mass, false);
        Ammo.castObject(softBody, Ammo.btCollisionObject).getCollisionShape().setMargin(margin * 3);
        physicsWorld.addSoftBody(softBody, 1, -1);
        softBody.setActivationState(4);
        return softBody;
    }


    get(){
        return this.cloth;
    }
    /*
    setTexture(filepath){
        textureLoader.load( "../textures/grid.png", function( texture ) {
					texture.wrapS = THREE.RepeatWrapping;
					texture.wrapT = THREE.RepeatWrapping;
					texture.repeat.set( clothNumSegmentsZ, clothNumSegmentsY );
					cloth.material.map = texture;
					cloth.material.needsUpdate = true;
				} );
    }
    */
	


			

        
}