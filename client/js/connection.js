/*
Config
{
	url: "",
	onConnected: function(),
	onDisconnected: function(),
	onError: function(message),
	onCommandReceived: function(command)
}

// API
connect(config);
send(command);
disconnect();
*/


function Connection() {
    this.connected = false;
	this.connect = function(config) {
		this.config = config;
		this.socket = new WebSocket(config.url);
		this.socket.connection = this;
		this.socket.onopen = function(event) {
            this.connection.connected= true;
			this.connection.config.onConnected.call(this.connection);
		};
		this.socket.onclose = function(event) {
            this.connection.connected = false;
			this.connection.config.onDisconnected.call(this.connection);
		};
		this.socket.onmessage = function(event) {
	        var command = JSON.parse(event.data);
			this.connection.config.onCommandReceived.call(this.connection, command);
		};
		this.socket.onerror = function(event) {
			console.log(JSON.stringify(event));
			this.connection.config.onError.call(this.connection, "");
		};
	};
	this.sendCommand = function(command) {
        if (this.connected ) {
            this.socket.send(JSON.stringify(command));
        }
	};
	this.disconnect = function() {
		this.socket.close();
		this.socket = null;
		this.config = null;
	};
	return this;
}

function initConnection(isViewer){
     connection = new Connection();

    var command = isViewer?
    {  id: "createViewer" }
    :
    {  id: "createPlayer" };
    connection.connect({
        url: "ws://"+ location.hostname +":1337",
        onConnected: function () {
            console.log("Connected!");

            this.sendCommand(command);
        },
        onDisconnected: function () {
            console.log("Disconnected!");
        },
        onError: function (message) {
            console.error(message);
        },
        onCommandReceived: function (command) {
            //handle commands
            handleSocketCommands(command);

           // console.log(JSON.stringify(command));
        }
    });
}

function handleSocketCommands(command) {
    switch (command.id){
        case "createPlayerResponse" :
            thisAvatarId=command.data.id;
            addAvatar(command.data.id, command.data.position);
            camera.position.set(command.data.position.x, command.data.position.y, command.data.position.z);
            addOtherAvatars(command.data.otherPlayers);
            break;
        case "createViewerResponse" :
            addOtherAvatars(command.data.otherPlayers);
            break;
        case "newPlayer":
            addAvatar(command.data.id, command.data.position );
            break;
        case "status":
            updateAvatarStatus(command.data);
            break;
        case "disconnected":
            removeAvatar(command.data.id);
            break;
        case "aimStart":

            break;
        case "aimStop":

            break;
        case "kill": //someone other than myself was killed
          /*  new TWEEN.Tween( avatars[thisAvatarId].object.position).to({x: command.data.position.x, y: command.data.position.y, z: command.data.position.z }, 4000)
                .easing(TWEEN.Easing.Quadratic.InOut)
                .start();*/
            /*var tweenShrink = new TWEEN.Tween( avatars[command.data.victim_id].object.scale).to( {x:0.1, y:1, z: 0.1 }, 1000)
                .easing(TWEEN.Easing.Quadratic.Out);
            var tweenGrow= new TWEEN.Tween( avatars[command.data.victim_id].object.scale).to( {x:1, y:1, z: 1 }, 40);
            tweenShrink.chain(tweenGrow);
            tweenShrink.start();*/

            var avatarSphere = avatars[command.data.victim_id].sphere;
            avatarSphere .material.color =  new THREE.Color( 0xce215e );
            setTimeout( function (){
                avatarSphere.material.color = new THREE.Color( 0xffffff );
            }, 500);
            break;
        case "killResponse": //I was killed
            environment.sky.material.color = new THREE.Color( 0xce215e );
            setTimeout( function (){
                environment.sky.material.color = new THREE.Color( 0x000000 );
            }, 200);
            new TWEEN.Tween(camera.position).to({x: command.data.position.x, y: command.data.position.y, z: command.data.position.z }, 300)
                .easing(TWEEN.Easing.Quadratic.Out)
                .start();
            new TWEEN.Tween( avatars[thisAvatarId].object.position).to({x: command.data.position.x, y: command.data.position.y, z: command.data.position.z }, 300)
                .easing(TWEEN.Easing.Quadratic.Out)
                .start()
                .onComplete(function() {
                    environment.sky.material.color = new THREE.Color( 0xffffff );
                });;

            /* camera.position.set(command.data.position.x, command.data.position.y, command.data.position.z);
             avatars[thisAvatarId].object.position.set( command.data.position.x, command.data.position.y, command.data.position.z);*/
            break;

        case "scoreCommandResponse":

            break;
        default:
            console.log("Unknown command received: "+ JSON.stringify(command));
    }
}

function mockConnection(){
   // addAvatar(scene);

}


Connection.prototype.updateStatus = function() {

    var statusCommand = {
        "id": "status",
        "data": {
            id: thisAvatarId,
            position: {x: camera.position.x, y: camera.position.y, z: camera.position.z},
            orientation: {x: camera.quaternion.x, y: camera.quaternion.y, z: camera.quaternion.z, w: camera.quaternion.w}
        }
    }

    this.sendCommand(statusCommand);
}