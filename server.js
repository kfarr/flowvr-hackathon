var server = require('websocket').server;
var http = require('http');
var connect = require('connect');
var serveStatic = require('serve-static');
require('console-stamp')(console, 'HH:MM:ss.l'); //add timestamps in front of log messages
var express = require('express');
var app = express();
var swig  = require('swig');


app.engine('html', swig.renderFile);

app.set('view engine', 'html');
// app.set('port', process.env.PORT || 8080); // not working
app.get('/', function (req, res) {
 res.render('index.html', { /* template locals context */ });
});

// app.get('/score', function (req, res) {
//  res.render('scoreboard.html', { players: players, scores: scores});
//
// });

app.use(express.static('client'));

var port = 8080

app.listen(port, function () {
  console.log('Web server (Express) running on port 8080');
});

require('dns').lookup(require('os').hostname(), function (err, add, fam) {
  console.log('Primary network interface IP address: '+add);
  console.log('For debug try /tests/connectiontest.html in your browser');
  console.log('To start or join a game, point your browser to "http://' + add + ':' + port + '"');
})

var socket = new server({
    httpServer: http.createServer().listen(1337)
});
console.log("Socket server accepting connections at port 1337...");

function Player(connection, id) {
    this.connection = connection;
    this.id = id;
    this.position = {x: 0, y: 0, z: 0};
    this.orientation = {x: 0, y: 0, z: 0, w: 1};
    this.kills = 0;
    this.deaths = 0;
    this.sendCommand = function(command) {
        this.connection.sendUTF(JSON.stringify(command));
    };
    return this;
}

var MAX_NUMBER_OF_PLAYERS = 5;
var UNIVERSE_WIDTH = 200;
var UNIVERSE_HEIGHT = 200;
var UNIVERSE_DEPTH = 200;
var players = {};
var viewers = []; // They are actually connection instances
var uniquePlayerId = 0;

var kills = 0;

// cast a command to ALL players & viewers
function castCommand(command) {
    for (var id in players) {
        players[id].sendCommand(command);
    }
    for (var i = 0; i < viewers.length; i++) {
        viewers[i].sendUTF(JSON.stringify(command));
    }
}

// cast a command to all players & viewers EXCEPT for the connection passed
function castCommandExceptConnection(command, connection) {
    for (var id in players) {
        if (players[id].connection !== connection) {
          players[id].sendCommand(command);
        }
    }
    for (var i = 0; i < viewers.length; i++) {
        if (viewers[i] !== connection) {
        viewers[i].sendUTF(JSON.stringify(command));
        }
    }
}

// cast command string to all players & viewers EXCEPT for the connection passed
function castCommandStringExceptConnection(commandString, connection) {
    for (var id in players) {
        if (players[id].connection !== connection) {
          players[id].connection.sendUTF(commandString);
        }
    }
    for (var i = 0; i < viewers.length; i++) {
        if (viewers[i] !== connection) {
        viewers[i].sendUTF(commandString);
        }
    }
}

// cast command string to ALL players
function castCommandString(commandString) {
    for (var id in players) {
        players[id].connection.sendUTF(commandString);
    }
    for (var i = 0; i < viewers.length; i++) {
        viewers[i].sendUTF(commandString);
    }
}

function findPlayerFromConnection(connection) {
    var player = null;
    for (var id in players) {
        if (players[id].connection === connection) {
            player = players[id];
            break;
        }
    }
    return player;
}

function findViewerFromConnection(connection) {
    var viewer = null;
    for (var i = 0; i < viewers.length; i++) {
        if (viewers[i] === connection) {
            viewer = viewers[i];
            break;
        }
    }
    return viewer;
}

function findViewerIndexFromConnection(connection) {
    for (var i = 0; i < viewers.length; i++) {
        if (viewers[i] === connection) {
            break;
        }
    }
    return i;
}

function calculateNewPlayerId() {
    uniquePlayerId++;
    return "" + uniquePlayerId;
}

function getRandomPositionInUniverse() {
    var pos_x = Math.floor(Math.random() * UNIVERSE_WIDTH/2) - UNIVERSE_WIDTH/2;
    var pos_y = Math.floor(Math.random() * UNIVERSE_HEIGHT/2) - 15; //floor is at -20 and we never want to be below that
    var pos_z = Math.floor(Math.random() * UNIVERSE_DEPTH/2) - UNIVERSE_DEPTH/2;
    return { x: pos_x, y: pos_y, z: pos_z };
}

function createPlayerCommandReceived(command, connection) {
    var player = new Player(connection, calculateNewPlayerId());

    // Get random position for the player
    player.position = getRandomPositionInUniverse();

    console.log("PLAYER " + player.id + " is joining!");

    // Notify all other player and viewers that there is a new player
    var newPlayerCommand = {
        id: "newPlayer",
        data: {
            id: player.id,
            position: player.position
        }
    };
    castCommand(newPlayerCommand);

    // Respond to the created player sending him the neessary information
    var createPlayerResponseCommand = {
      id: "createPlayerResponse",
      data: {
        id: player.id,
        position: player.position,
        // orientation: player.orientation, // Is a new player, the server does not specify its orientation, so don't send it
        otherPlayers : {}
      }
    };
    // Fill the otherPlayers container
    for (var id in players) {
        var otherPlayer = players[id];
        createPlayerResponseCommand.data.otherPlayers[otherPlayer.id] = {
            position: otherPlayer.position,
            orientation: otherPlayer.orientation
        };
    }
    player.sendCommand(createPlayerResponseCommand);

    // We can finally add the player to the list of players
    players[player.id] = player;
}

function connectionClosed(connection) {
    var player = findPlayerFromConnection(connection);
    if (!player) {
        var viewerIndex = findViewerIndexFromConnection(connection);
        console.log("VIEWER SLOT " + viewerIndex + " disconnected");
        viewers.splice(viewerIndex, 1);
    }
    else {
        delete players[player.id];
        var disconnectedCommand = {
            id: "disconnected",
            data: {
                id: player.id
            }
        };
        castCommand(disconnectedCommand);
        console.log("PLAYER " + player.id + " disconnected");
    }
}

function updatePlayerStatusCommand(command, connection) {
    // get the player from connection
    var player = findPlayerFromConnection(connection);

//    console.log("Updating player " + player.id + " from " + player.position + " to " + command.data.position);
    // update the player properties based on the new data
    player.position = command.data.position;
    player.orientation = command.data.orientation;

    var createPlayerStatusResponseCommand = {
      id: "status",
      data: {
        id: player.id,
        position: player.position,
        orientation: player.orientation,
      }
    };

    // cast new player position to all players except this one
    castCommandExceptConnection(createPlayerStatusResponseCommand, connection);
}

function createViewerCommand(command, connection) {
  // tell the viewer where all the players are
  viewers.push(connection);
  console.log("New viewer joined. Total viewers: " + viewers.length);
  // Respond to the created viewer sending necessary information
  var createViewerResponseCommand = {
    id: "createViewerResponse",
    data: {
      otherPlayers : {}
    }
  };
  // Fill the otherPlayers container
  for (var id in players) {
      var otherPlayer = players[id];
      createViewerResponseCommand.data.otherPlayers[otherPlayer.id] = {
          position: otherPlayer.position,
          orientation: otherPlayer.orientation
      };
  }
  connection.sendUTF(JSON.stringify(createViewerResponseCommand));
}

function dodgeCommand(messageString, connection) {
  // detect the dodge - get the playerId
  var command = JSON.parse(messageString);
  var player_id = command.data.id;
  console.log("PLAYER " + player_id + " dodged the laser");

  // rebroadcast dodge stringcommand to everyone except the player who dodged
  castCommandStringExceptConnection(messageString, connection);
}

function killCommand(messageString, connection) {
  // client detects kill and sends to server
  var command = JSON.parse(messageString);
  var victim_id = command.data.victim_id;
  var killer_id = command.data.killer_id;
  console.log("PLAYER " + victim_id + " was killed by PLAYER " + killer_id);

  // server sends this event to all other clients
  castCommandStringExceptConnection(messageString, connection);

  players[victim_id].deaths += 1;
  players[killer_id].kills += 1;

  scoreCommand({ id: "score" }, connection);

  // server should then respawn the user who was killed
  var new_position = getRandomPositionInUniverse();
  var killResponseCommand = {
    id: "killResponse",
    data: {
      position: new_position
    }
  }
  players[victim_id].connection.sendUTF(JSON.stringify(killResponseCommand));

}

function getColorForNumber(number) {
  if(number % 5 === 0) {return "cyan"};
  if(number % 4 === 0) {return "green"};
  if(number % 3 === 0) {return "purple"};
  if(number % 2 === 0) {return "red"};
  return "blue";
}

function scoreCommand(command, connection) {
    var scoreCommandResponse = {
      id: "scoreCommandResponse",
      data: {
        scores : {}
      }
    };
    // Fill the scores
    console.log("+------------+------+------+");
    console.log("| SCOREBOARD |KILLS |DEATHS| COLOR");
    for (var id in players) {
        var player = players[id];
        scoreCommandResponse.data.scores[player.id] = {
            kills: player.kills,
            deaths: player.deaths
        };
        console.log("| PLAYER " + player.id + "   | " + player.kills + "    |  "+ player.deaths+ "   | " + getColorForNumber(player.id));
    }
    console.log("+------------+------+------+");
    castCommand(scoreCommandResponse);
//    connection.sendUTF(JSON.stringify(scoreCommandResponse));

}
socket.on('request', function(request) {
    var connection = request.accept(null, request.origin);

    connection.on('message', function(message) {
        var messageString = message.utf8Data;
        var command = JSON.parse(messageString);

        if (command.id === "createPlayer") {
            createPlayerCommandReceived(command, connection);
        }
        else if (command.id === "status") {
            updatePlayerStatusCommand(command, connection);
        }
        else if (command.id === "createViewer") {
            createViewerCommand(command, connection);
        }
        else if (command.id === "dodge") {
            dodgeCommand(messageString, connection);
        }
        else if (command.id === "kill") {
            killCommand(messageString, connection);
        }
        else if (command.id === "score") {
            scoreCommand(command, connection);
        }
    });
    connection.on('close', function(event) {
        connectionClosed(this);
    });
});
