var NOSE_FROMFACE_POSITION = -6;

/**
 *
 * @param id
 * @param position
 */
function addAvatar(id, position, orientation) {
    var avatar = new Avatar(id);
    avatar.object.position.set(position.x, position.y, position.z );
    if (orientation) {
        avatar.object.rotation.set(orientation.x, orientation.y, orientation.z);
    }
    scene.add(avatar.object);

    avatars[id] = avatar; //global var
}

function updateAvatars() {
    for (var id in avatars) {
        avatars[id].update();
    }
}

/*data: {
    id: X,
        position: { x: 0, y: 0, z: 0 },
    orientation: { x: 0, y: 0, z: 0, w: 1 }
}*/
function updateAvatarStatus( data ) {
    var avatar = avatars[ data.id ] ;
    if (!avatar) { return }
    avatar.object.position.set(data.position.x, data.position.y, data.position.z );
    if (data.orientation) {
        avatar.object.quaternion.copy(data.orientation);
       // camera.quaternion.copy(data.orientation);
    }

}


/*
 otherPlayers : {
     "X": {
         position: { x: 0, y: 0, z: 0 },
         orientation: { x: 0, y: 0, z: 0, w: 1 }
     },
     "Y": {
         position: { x: 0, y: 0, z: 0 },
         orientation: { x: 0, y: 0, z: 0, w: 1 }
     }
 }
 */
function addOtherAvatars(otherPlayers) {
    for (var item in otherPlayers) {
        addAvatar(item, otherPlayers[item].position, otherPlayers[item].orientation);
    }
}

function removeAvatar(id) {
    avatars[id].delete();
    delete avatars[id];
}


Avatar = function(id) {
    this.id = id;
    this.create();
    this.object.name = "avatar" + this.id;
    this.object.avatarId = this.id;

    return this;

}

Avatar.prototype.delete = function() {
    var selectedObject = scene.getObjectByName("avatar" + this.id );
    scene.remove( selectedObject );
}

Avatar.prototype.create = function() {

    this.object = new THREE.Object3D();

    this.sphere = this.createSphere();
    this.sphere.name="avatarSphere";
    this.object.add(this.sphere);


    if (thisAvatarId != this.id ) {
        this.createEyes();
    } else {
        this.sphere.material.opacity = 0;
        this.sphere.material.transparent = true;;
    }

    this.cone = this.createCone();    this.cone.name = "cone"
    this.object.add(this.cone);




   /* this.laser = this.createLaser();
    scene.add(this.laser); //add to top level scene*/
}

    Avatar.prototype.createSphere = function(avatarId) {
    // #b4ddb4 0%, #83c783 26%, #52b152 33%, #008a00 61%, #005700 79%, #002400 93%, #39d64c 100%)
    var colors =Math.random()>0.5 ? [
        ['0.000', 'rgba(180, 221, 180, 1)'],
        ['0.260',  'rgba(131, 199, 131, 1)'],
        ['0.33',  'rgba(82, 177, 82, 1)'],
        ['0.61', 'rgba(0, 138, 0, 1)'],
        ['0.79', 'rgba(0, 87, 0, 1)'],
        ['0.93', 'rgba(0, 36, 0, 1)'],
        ['1.000', 'rgba(57, 214, 76, 1)'],
    ] :
        // #cedbe9 0%, #aac5de 17%, #6199c7 50%, #3a84c3 51%, #419ad6 59%, #4bb8f0 71%, #3a8bc2 84%, #26558b 100%)
        [
            ['0.000', 'rgba(38, 85, 139, 1)'],
            ['0.17', 'rgba(170, 197, 222, 1)'],
            ['0.50',  'rgba(97, 153, 199, 1)'],
            ['0.51', 'rgba(58, 132, 195, 1)'],
            ['0.59', 'rgba(65, 154, 214, 1)'],
            ['0.71', 'rgba(75, 184, 240, 1)'],
            ['0.84', 'rgba(58, 139, 194, 1)'],
            ['1.000', 'rgba(38, 85, 139, 1)'],
        ]



      //  var texture = createGradientTexture(64, colors,0,0,1,0);

    var texture =  THREE.ImageUtils.loadTexture( getGradientForNumber( this.id ) );
    var geometry = new THREE.SphereGeometry( 5, 20, 20 );
    var material = new THREE.MeshBasicMaterial( {  map: texture  } );
    var sphere = new THREE.Mesh( geometry, material );
    return sphere;

}

function getGradientForNumber(number) {
    if (number % 5 === 0) {return "images/gradientAvatarCyan20x64.png"};
    if (number % 4 === 0) {return "images/gradientAvatarGreen20x64.png"};
    if (number % 3 === 0) {return "images/gradientAvatarPurple20x64.png"};
    if (number % 2 === 0) {return "images/gradientAvatarRed20x64.png"};
    return "images/gradientAvatarBlue20x64.png";
}

Avatar.prototype.createCone = function(){

    cylinderGeometry	= new THREE.CylinderGeometry(0.1, 0.3, 1, 20, 1, false);
    cylinderMaterial	= new THREE.MeshBasicMaterial({
        color: 0xCC0000,
        opacity:(thisAvatarId == this.id )? 0.2 :1.0,
        transparent:(thisAvatarId == this.id )
    });
    var cone	= new THREE.Mesh( cylinderGeometry, cylinderMaterial );
    cone.name = "nose";
    cone.position.y = 0.5;


    var coneWrap = new THREE.Object3D();
    coneWrap.add(cone);
    coneWrap.rotation.x= deg2rad * -90;
    coneWrap.position.z=NOSE_FROMFACE_POSITION;
    coneWrap.name = "nose";
    return coneWrap;
}

Avatar.prototype.createEyes = function() {

    var leftEyeGeometry = new THREE.SphereGeometry(1, 10, 10);
   var  leftEyeTexture	= THREE.ImageUtils.loadTexture( "images/eye.png" );
//    texture	= THREE.ImageUtils.loadTexture( "./images/android-logo-white.png" );
    leftEyeTexture.wrapS = leftEyeTexture.wrapT = THREE.ClampToEdgeWrapping;
   var leftEyeMaterial	= new THREE.MeshBasicMaterial({
        color: 0xFFFFFF,
        map:    leftEyeTexture
    });
    this.leftEye = new THREE.Mesh( leftEyeGeometry, leftEyeMaterial );
    this.leftEye.position.x = 1;
    this.leftEye.position.y = 1;
    this.leftEye.position.z = -4.5;
    this.leftEye.rotation.y = deg2rad *90;
    this.leftEye.scale.y = 1.2;
    this.leftEye.castShadow = true;
    this.leftEye.receiveShadow = false;
    this.leftEye.name = "leftEye";

    var rightEyeGeometry = new THREE.SphereGeometry(1, 10, 10);
    var rightEyeTexture = THREE.ImageUtils.loadTexture( "images/eye.png" );
//    console.info(rightEyeTexture,leftEyeTexture);
    rightEyeTexture.wrapS = rightEyeTexture.wrapT = THREE.ClampToEdgeWrapping;
    var rightEyeMaterial = new THREE.MeshBasicMaterial({
        color: 0xFFFFFF,
        map:    rightEyeTexture
    });
    this.rightEye = new THREE.Mesh( rightEyeGeometry, rightEyeMaterial );
    this.rightEye.position.x = -1;
    this.rightEye.position.y = 1;
    this.rightEye.position.z =- 4.5;
    this.rightEye.rotation.y =  deg2rad *90;
    this.rightEye.scale.y = 1.2;
    this.rightEye.castShadow = true;
    this.rightEye.receiveShadow = false;
    this.rightEye.name = "rightEye";

    this.object.add(this.leftEye);
    this.object.add(this.rightEye);
    this.object.translateY(3);

    /** Original attributes */
    this.leftEye.material.map.offset.original = {};
    this.rightEye.material.map.offset.original = {};
    this.leftEye.material.map.offset.original.x = 0;
    this.rightEye.material.map.offset.original.x = 0;
    this.leftEye.material.map.offset.original.y = 0;
    this.rightEye.material.map.offset.original.y = 0;

    var self = this;
    setTimeout (function() {self.startSquint() } , 1000);
}

Avatar.prototype.resetEyes = function(){

    this.leftEye.material.map.offset.x = this.leftEye.material.map.offset.original.x;
    this.rightEye.material.map.offset.x = this.rightEye.material.map.offset.original.x;
    this.leftEye.material.map.offset.y = this.leftEye.material.map.offset.original.y;
    this.rightEye.material.map.offset.y = this.rightEye.material.map.offset.original.y;

}

Avatar.prototype.updateSquint = function(){
    if (this.squinting == true && this.leftEye) {
        if (this.leftEye.material.map.offset.x < 0.38) {
            this.leftEye.material.map.offset.x = this.leftEye.material.map.offset.x + 0.01;
            this.rightEye.material.map.offset.x = this.rightEye.material.map.offset.x - 0.01;
            this.leftEye.material.map.offset.y = this.leftEye.material.map.offset.y + 0.008;
            this.rightEye.material.map.offset.y = this.rightEye.material.map.offset.y + 0.008;
            this.leftEye.material.map.needsUpdate = true;
            this.rightEye.material.map.needsUpdate = true;

        } else {
            this.stopSquint();
        }
    }
};

Avatar.prototype.startSquint = function(){
    this.squinting = true;
}

Avatar.prototype.stopSquint = function(){

    if (this.squinting == true){
        this.leftEye.material.map.offset.x = this.leftEye.material.map.offset.original.x;
        this.rightEye.material.map.offset.x = this.rightEye.material.map.offset.original.x;
        this.leftEye.material.map.offset.y = this.leftEye.material.map.offset.original.y;
        this.rightEye.material.map.offset.y = this.rightEye.material.map.offset.original.y;
        this.leftEye.material.map.needsUpdate = true;
        this.rightEye.material.map.needsUpdate = true;
        this.squinting = false;
   }
};



Avatar.prototype.update= function() {
    this.updateSquint();

}

Avatar.prototype.updateHitPoint = function(intersected){
    this.cone.scale.set(1, Math.min(intersected.distance + NOSE_FROMFACE_POSITION - 0.8, 100),1);

   /* if (intersected.object.parent.avatarId == this.id){
        //I'm being targeted
        console.log("targeted");
    }*/
};

 Avatar.onViewout = function(){

 };

Avatar.objectFromAvatarView = function (avatar) {

    raycaster.near = camera.near;
    raycaster.far = camera.far;

    origin.set(0, 0, 0);
    origin.applyMatrix4(avatar.object.matrixWorld);
    direction.set(0, 0, -1);
    direction.transformDirection(avatar.object.matrixWorld);

    raycaster.set(origin, direction);


    var intersects = raycaster.intersectObject(scene, true);

    if (intersects.length > 0 ) {
        var i = 0;
        while (i < intersects.length && intersects[i].object.name== "nose" ) {
            i++;
        }
        var intersected = intersects[i];
    }

    if (intersected ) {
        return intersected;
    } else {
        return null;
    }
    return null;

}



