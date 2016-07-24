var camera, scene = null, renderer, firstPersonControls, clock;
var deg2rad = Math.PI / 180;
var socket;
var environment;
var avatars = [];
var thisAvatarId = null;
var lasers = [];
var ar = null;

var connection;
var origin,  direction, raycaster;

console.warn = function() {

};

function init(ar) {
    window.ar = ar;

    camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.1, 10000 );
    camera.position.z = 100;
    camera.rotation.x = deg2rad * -30;
    scene = new THREE.Scene();

    renderer = new THREE.WebGLRenderer({ antialias: true});
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );

    clock = new THREE.Clock();

    if (ar) {
        renderer.autoClear = false;
        setupWebGLContextForARVuforia(renderer.context);
    }
    else {
        addEnvironment(scene);

        firstPersonControls = new FirstPersonControls(camera, renderer.domElement);
        firstPersonControls.look = true;
        firstPersonControls.active = true;

        firstPersonControls.moveSpeed = 1;
        firstPersonControls.camera = camera;
        firstPersonControls.init();


        origin = new THREE.Vector3();
        direction = new THREE.Vector3();
        raycaster = new THREE.Raycaster();
    }

    window.addEventListener( 'resize', onWindowResize, false );

    initConnection(true/*isViewer*/);

    animate();
}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );
}

function animate() {

    if (ar) {
        // Restore the camera (in case there are no AR markers)
        camera.matrixAutoUpdate = true;
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();

        var markersDetected = updateARVuforiaForThreeJS(ar, camera, true);
    }

    if (TWEEN) {
        TWEEN.update();
    }

    if (environment) {
        environment.update();
    }

    checkRollovers();

    updateAvatars() ;

    if (!ar) {
        firstPersonControls.update( clock.getDelta() );
    }

    renderer.render( scene, camera );

    requestAnimationFrame( animate );

}

function arInit() {
    startARVuforia(init, function(errorMessage) {
        init(null);
    }, { 
      licenseKey : "c9cd5035a33246c89726bbe84669615d",
      vuforiaMarkerFileName : "marker/LudeiDisney", 
      useDevicePixelRatio : false, 
      lookForMarkers : true,
      orientation : "LANDSCAPE",
      renderCameraInBackground: true
    });
}

function checkRollovers() {
    if (avatars) {
        for (var avatarId in avatars ) {

            var intersected = Avatar.objectFromAvatarView(avatars[avatarId]);
            avatars[avatarId].updateHitPoint(intersected);
            /* if (rolledOver ){
             if ( olledOver.object.name == "cone" ||  rolledOver.object.name == "rightEye"  ||  rolledOver.object.name == "lefttEye") {
             avatars[rolledOver.object.parent.avatarId].onViewover(avatarId);
             } else if ( rolledOver.object.name == "avatar") {
             rolledOver.object.onViewover(rolledOver);
             }
             } else {
             Avatar.onViewout();
             }*/
        }
    }

}

addEventListener("load", arInit);
