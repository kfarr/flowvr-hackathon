var camera, scene = null, renderer;
var socket;
var avatars = [];
var lasers = [];


function init() {

    camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 1000 );
    camera.position.z = 400;

    scene = new THREE.Scene();

    addAvatar(scene);

    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );

    window.addEventListener( 'resize', onWindowResize, false );

}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}

function animate() {

    requestAnimationFrame( animate );



    renderer.render( scene, camera );

}

function connected() {
    init();
    animate();
}


function loaded() {
    socket = new WebSocket('ws://' + SERVER_IP +':1337');
    socket.onopen = function () {
        var command = {
            "id": "createViewer",
            "data": {
            }
        };
        socket.send(JSON.stringify(command));
    };

    socket.onmessage = function (message) {
        var command = JSON.parse(message.data);
        if (command.id === "createViewerResponse") {
            connected();
        }
        if (command.id === "boxquat") {
            for (var i = 0; i < avatars.length; i++) {
                avatars[i].quaternion.copy(command.data);
            }
        }
    };

    socket.onerror = function (error) {
        console.log('WebSocket error: ' + error);
        if (scene === null) {
            connected();
        }
    };
}

addEventListener("load", loaded);
