var socket = null;
var deg2rad = Math.PI / 180;
var camera, scene = null, renderer, stats;

var SHOW_STATS = false;
var vrEffect;
var vrControls;
var deviceOrientationController;
var useDeviceOrientation = false;

var environment;
var avatars = [];
var lasers = [];
var thisAvatarId;

var sounds = new Sounds();

var manager;

var origin,  direction, raycaster;

var gazeAndWaitCursor;

function init() {


  /*  var container = document.createElement( 'div' );
    document.body.appendChild( container );*/

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
    //camera.rotation.order = "XYZ";

    scene = new THREE.Scene();

    addEnvironment(scene);

    var light = new THREE.AmbientLight( 0xFFFFFF );
    scene.add( light );

    renderer = new THREE.WebGLRenderer({ antialias: true});
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = 0;
    document.body.appendChild(renderer.domElement);

    // VR split screen
    vrEffect = new THREE.VREffect( renderer );

    // Input
    // WebVR controls
    vrControls = new THREE.VRControls( camera );

    window.WebVRConfig = window.WebVRConfig || {};

    window.WebVRConfig.PREVENT_DISTORTION = true;

    manager = new WebVRManager(renderer, vrEffect, {hideButton: false});

    // devieorientation controls
    deviceOrientationController = new DeviceOrientationController(camera, renderer.domElement);
    deviceOrientationController.enableManualDrag = false;
    deviceOrientationController.enableManualZoom = false;
    deviceOrientationController.connect();

    if (SHOW_STATS) {
        stats = new Stats();
        stats.domElement.style.position = 'absolute';
        stats.domElement.style.top = '0px';
        document.body.appendChild( stats.domElement );
    }

    /*window.addEventListener( 'resize', onWindowResize, false );
    var fullScreenButton = document.querySelector( '.full-screen' );

    fullScreenButton.onclick = function() {
       // vrEffect.setFullScreen( true );
        if ( renderer.domElement.mozRequestFullScreen ) {
            renderer.domElement.mozRequestFullScreen();
        } else {
            renderer.domElement.webkitRequestFullscreen();
        }
    };*/

    gazeAndWaitCursor = new GazeAndWaitCursor(camera);
    scene.add(camera); //if using the cursor, must add camera

    origin = new THREE.Vector3();
    direction = new THREE.Vector3();
    raycaster = new THREE.Raycaster();

    initConnection();

    animate();
}


function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    vrEffect.setSize( window.innerWidth, window.innerHeight );

}

var animate = function() {

    if (useDeviceOrientation) {
        deviceOrientationController.update();
    }
    else {
        vrControls.update();
    }

    if (avatars && avatars [thisAvatarId]) {
        avatars[thisAvatarId].object.quaternion.copy(camera.quaternion);
    }

    if (TWEEN) {
        TWEEN.update();
    }

    if (connection) {
        connection.updateStatus();
    }

   /* vrEffect.render( scene, camera );*/
    manager.render( scene, camera );

    if (SHOW_STATS) {
        stats.update();
    }

    if (environment) {
        environment.update();
    }


    if (gazeAndWaitCursor) {
        //if the user looks down, show the controls to select something new
        gazeAndWaitCursor.update( function(){

            var x= null;
        });
    }


    checkRollovers();

    updateAvatars() ;

    requestAnimationFrame(animate);
}


var targetedTimer;

function checkRollovers() {
    if (avatars && thisAvatarId) {
        var iAMintersected = false;
        for (var avatarId in avatars ) {

            var intersected = Avatar.objectFromAvatarView(avatars[avatarId]);

            if (intersected){
                avatars[avatarId].updateHitPoint(intersected);
                var that = this;

              /*  if (intersected.object.parent ==avatars[thisAvatarId].object) {
                    console.log("targeted");
                    if ( ! avatars[thisAvatarId].isTargeted ) {
                        sounds.play("targeted", true);
                        avatars[thisAvatarId].isTargeted = true;
                    }
                }*/
                ( function(intersected, aId){
                        avatars[thisAvatarId].object.traverse( function(o) {
                            if (o == intersected.object) {
                                //startTargeted();
                                //console.log("targeted");
                                if ( ! avatars[thisAvatarId].isTargeted ) {
                                    console.log("I'm targeted")
                                    sounds.play("targeted", true);
                                    console.log("started sound")
                                    avatars[thisAvatarId].isTargeted = true;
                                   targetedTimer=  setTimeout( function(){
                                       //I'm dead
                                       console.log("I'm dead")
                                       sounds.stop("targeted");
                                       sounds.play("killed");
                                           //send it to the server
                                       connection.sendCommand(
                                           {
                                               id: "kill",
                                               data: {
                                                   victim_id: thisAvatarId ,
                                                   killer_id: aId
                                               }
                                           }
                                       )
                                   }, 5000);
                                }
                                iAMintersected = true;

                            }
                        });
                })(intersected, avatarId);



                var avatarHit = objectFromView();
                if ( avatarHit) {
                   
                    gazeAndWaitCursor.start();
                } else {
                    gazeAndWaitCursor.stop();
                }
            } else {
                gazeAndWaitCursor.stop();
            }
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
        if (! iAMintersected &&   avatars[thisAvatarId].isTargeted){
            sounds.stop("targeted");
            avatars[thisAvatarId].isTargeted = false;
            window.clearTimeout(targetedTimer);
        }
    }

}


function objectFromView() {

    var origin = new THREE.Vector3();
    var direction = new THREE.Vector3();
    var raycaster = new THREE.Raycaster();
    origin.set(0, 0, 0);
    origin.applyMatrix4(camera.matrixWorld);
    direction.set(0, 0, -1);
    direction.transformDirection(camera.matrixWorld);

    raycaster.set(origin, direction);
    raycaster.near = camera.near;
    raycaster.far = camera.far;

    var intersects = raycaster.intersectObjects(scene.children, true);
    if ( intersects.length > 0 ) {
        var i = 0;
        for (var i=0; i< intersects.length; i++) {
            if ( intersects[i].object.name == "avatarSphere" ){
                return intersects[i].object;
            }
        }

    }
    return null
}



addEventListener("load", init);