/** copied from GLAM.FirstPersonControls
 * JM: removed mouse drag Events, because these are handled by the VRControls
 *
 * @param object
 * @param domElement
 * @constructor
 */
FirstPersonControls = function ( object, domElement ) {

    this.object = object;
    this.target = new THREE.Vector3( 0, 0, 0 );

    this.domElement = ( domElement !== undefined ) ? domElement : document;

    this.useWASD = true;
    this.useArrows = true;

    this.enabled = true;

    this.movementSpeed = 10.0;
    this.lookSpeed = 0.1;

    this.turnSpeed = 5; // degs
    this.tiltSpeed = 5;
    this.turnAngle = 0;
    this.tiltAngle = 0;

    this.mouseX = 0;
    this.mouseY = 0;
    this.lastMouseX = 0;
    this.lastMouseY = 0;

    this.touchScreenX = 0;
    this.touchScreenY = 0;
    this.lookTouchId = -1;
    this.moveTouchId = -1;

    this.lat = 0;
    this.lon = 0;
    this.phi = 0;
    this.theta = 0;

    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;

    this.turnRight = false;
    this.turnLeft = false;
    this.tiltUp = false;
    this.tiltDown = false;

    this.mouseDragOn = false;
    this.mouseLook = false;

    this.viewHalfX = 0;
    this.viewHalfY = 0;

    if ( this.domElement !== document ) {

        this.domElement.setAttribute( 'tabindex', -1 );

    }

    this.handleResize = function () {

        if ( this.domElement === document ) {

            this.viewHalfX = window.innerWidth / 2;
            this.viewHalfY = window.innerHeight / 2;

        } else {

            this.viewHalfX = this.domElement.offsetWidth / 2;
            this.viewHalfY = this.domElement.offsetHeight / 2;

        }

    };

    this.onMouseDown = function ( event ) {

        if ( this.domElement === document ) {

            this.mouseX = event.pageX - this.viewHalfX;
            this.mouseY = event.pageY - this.viewHalfY;

        } else {

            this.mouseX = event.pageX - this.domElement.offsetLeft - this.viewHalfX;
            this.mouseY = event.pageY - this.domElement.offsetTop - this.viewHalfY;

        }

        this.lastMouseX = this.mouseX;
        this.lastMouseY = this.mouseY;
        this.mouseDragOn = true;

    };

    this.onMouseUp = function ( event ) {

        this.mouseDragOn = false;

    };

    this.onMouseMove = function ( event ) {

        if ( this.domElement === document ) {

            this.mouseX = event.pageX - this.viewHalfX;
            this.mouseY = event.pageY - this.viewHalfY;

        } else {

            this.mouseX = event.pageX - this.domElement.offsetLeft - this.viewHalfX;
            this.mouseY = event.pageY - this.domElement.offsetTop - this.viewHalfY;

        }

    };

    this.onTouchStart = function ( event ) {

        event.preventDefault();

        if (event.touches.length > 0) {

            if (this.lookTouchId == -1) {
                this.lookTouchId = event.touches[0].identifier;

                // synthesize a left mouse button event
                var mouseEvent = {
                    'type': 'mousedown',
                    'view': event.view,
                    'bubbles': event.bubbles,
                    'cancelable': event.cancelable,
                    'detail': event.detail,
                    'screenX': event.touches[0].screenX,
                    'screenY': event.touches[0].screenY,
                    'clientX': event.touches[0].clientX,
                    'clientY': event.touches[0].clientY,
                    'pageX': event.touches[0].pageX,
                    'pageY': event.touches[0].pageY,
                    'button': 0,
                    'preventDefault' : event.preventDefault
                };

                this.onMouseDown(mouseEvent);
            }
            else {
                // second touch does move
                this.touchScreenX = event.touches[1].screenX;
                this.touchScreenY = event.touches[1].screenY;
                this.moveTouchId = event.touches[1].identifier;
            }

        }

    }


    this.onTouchMove = function ( event ) {

        event.preventDefault();

        var lookTouch = null, moveTouch = null,
            len = event.changedTouches.length;

        for (var i = 0; i < len; i++) {

            if (event.changedTouches[i].identifier == this.lookTouchId)
                lookTouch = event.changedTouches[i];

            if (event.changedTouches[i].identifier == this.moveTouchId)
                moveTouch = event.changedTouches[i];

        }

        if (lookTouch) {
            // synthesize a left mouse button event
            var mouseEvent = {
                'type': 'mousemove',
                'view': event.view,
                'bubbles': event.bubbles,
                'cancelable': event.cancelable,
                'detail': event.detail,
                'screenX': lookTouch.screenX,
                'screenY': lookTouch.screenY,
                'clientX': lookTouch.clientX,
                'clientY': lookTouch.clientY,
                'pageX': lookTouch.pageX,
                'pageY': lookTouch.pageY,
                'button': 0,
                'preventDefault' : event.preventDefault
            };

            this.onMouseMove(mouseEvent);
        }


        if (moveTouch) {
            // second touch does move
            var deltaX = moveTouch.screenX - this.touchScreenX;
            var deltaY = moveTouch.screenY - this.touchScreenY;

            this.touchScreenX = moveTouch.screenX;
            this.touchScreenY = moveTouch.screenY;

            if (deltaX > 0) {
                this.moveRight = true;
            }

            if (deltaX < 0) {
                this.moveLeft = true;
            }

            if (deltaY > 0) {
                this.moveBackward = true;
            }

            if (deltaY < 0) {
                this.moveForward = true;
            }


        }

    }


    this.onTouchEnd = function ( event ) {

        event.preventDefault();

        var lookTouch = null, moveTouch = null,
            len = event.changedTouches.length;

        for (var i = 0; i < len; i++) {

            if (event.changedTouches[i].identifier == this.lookTouchId)
                lookTouch = event.changedTouches[i];

            if (event.changedTouches[i].identifier == this.moveTouchId)
                moveTouch = event.changedTouches[i];

        }

        if (lookTouch) {
            // synthesize a left mouse button event
            var mouseEvent = {
                'type': 'mouseup',
                'view': event.view,
                'bubbles': event.bubbles,
                'cancelable': event.cancelable,
                'detail': event.detail,
                'screenX': lookTouch.screenX,
                'screenY': lookTouch.screenY,
                'clientX': lookTouch.clientX,
                'clientY': lookTouch.clientY,
                'pageX': lookTouch.pageX,
                'pageY': lookTouch.pageY,
                'button': 0,
                'preventDefault' : event.preventDefault
            };

            this.onMouseUp(mouseEvent);

            this.lookTouchId = -1;
        }

        if (moveTouch) {
            // second touch does move
            this.touchScreenX = moveTouch.screenX;
            this.touchScreenY = moveTouch.screenY;

            this.moveRight = false;
            this.moveLeft = false;
            this.moveBackward = false;
            this.moveForward = false;

            this.moveTouchId = -1;
        }

    }

    this.onGamepadButtonsChanged = function ( event ) {
    }

    var MOVE_VTHRESHOLD = 0.2;
    var MOVE_HTHRESHOLD = 0.5;
    this.onGamepadAxesChanged = function ( event ) {

        var axes = event.changedAxes;
        var i, len = axes.length;
        for (i = 0; i < len; i++) {
            var axis = axes[i];

            if (axis.axis == glam.Gamepad.AXIS_LEFT_V) {
                // +Y is down
                if (axis.value < -MOVE_VTHRESHOLD) {
                    this.moveForward = true;
                    this.moveBackward = false;
                }
                else if (axis.value > MOVE_VTHRESHOLD) {
                    this.moveBackward = true;
                    this.moveForward = false;
                }
                else {
                    this.moveBackward = false;
                    this.moveForward = false;
                }
            }
            else if (axis.axis == glam.Gamepad.AXIS_LEFT_H) {
                // +X is to the right
                if (axis.value > MOVE_HTHRESHOLD) {
                    this.moveRight = true;
                    this.moveLeft = false;
                }
                else if (axis.value < -MOVE_HTHRESHOLD) {
                    this.moveLeft = true;
                    this.moveRight = false;
                }
                else {
                    this.moveLeft = false;
                    this.moveRight = false;
                }
            }
            else if (axis.axis == glam.Gamepad.AXIS_RIGHT_V) {
                // +Y is down
                if (axis.value < -MOVE_VTHRESHOLD) {
                    this.tiltUp = true;
                    this.tiltDown = false;
                }
                else if (axis.value > MOVE_VTHRESHOLD) {
                    this.tiltDown = true;
                    this.tiltUp = false;
                }
                else {
                    this.tiltDown = false;
                    this.tiltUp = false;
                }
            }
            else if (axis.axis == glam.Gamepad.AXIS_RIGHT_H) {
                if (axis.value > MOVE_HTHRESHOLD) {
                    this.turnLeft = true;
                    this.turnRight = false;
                }
                else if (axis.value < -MOVE_HTHRESHOLD) {
                    this.turnRight = true;
                    this.turnLeft = false;
                }
                else {
                    this.turnLeft = false;
                    this.turnRight = false;
                }
            }

        }
    };

    this.onKeyDown = function ( event ) {

        //event.preventDefault();
        this.isShiftKeyDown = event.shiftKey;

        if (this.useWASD) {

            if ( event.keyCode ==66 ) /* B*/ this.moveForward = true;

            if ( event.keyCode == 65 ) /*A*/ this.moveLeft = true;

            if ( event.keyCode == 32 ) /*Space*/ this.moveBackward = true;

            if ( event.keyCode == 68 ) /*D*/ this.moveRight = true;

            if ( event.keyCode == 87 ) /*W*/ this.moveUp = true;

            if ( event.keyCode == 83 ) /*S*/ this.moveDown = true;

        }

        if (this.useArrows) {

            if ( event.keyCode == 38 ) /*up*/ this.moveForward = true;

            if ( event.keyCode == 37 ) /*left*/ this.moveLeft = true;

            if ( event.keyCode == 40 ) /*down*/ this.moveBackward = true;

            if ( event.keyCode == 39 ) /*right*/ this.moveRight = true;

        }

    };

    this.onKeyUp = function ( event ) {

        if (this.useWASD) {

            if ( event.keyCode ==66 ) /* B*/ this.moveForward = false;

            if ( event.keyCode == 65 ) /*A*/ this.moveLeft = false;

            if ( event.keyCode == 32 ) /*Space*/ this.moveBackward = false;

            if ( event.keyCode == 68 ) /*D*/ this.moveRight = false;

            if ( event.keyCode == 87 ) /*W*/ this.moveUp = false;

            if ( event.keyCode == 83 ) /*S*/ this.moveDown = false;


        }

        if (this.useArrows) {

            if ( event.keyCode == 38 ) /*up*/ this.moveForward = false;

            if ( event.keyCode == 37 ) /*left*/ this.moveLeft = false;

            if ( event.keyCode == 40 ) /*down*/ this.moveBackward = false;

            if ( event.keyCode == 39 ) /*right*/ this.moveRight = false;

        }


    };

    this.update = function( delta ) {

        if (this.enabled === false) return;

        this.startY = this.object.position.y;

        var actualMoveSpeed = delta * this.movementSpeed;

        var speedMultiplier = this.isShiftKeyDown ? 20 : 1;
        if (this.moveForward) {
            var teVector = this.object.getWorldDirection();
            this.object.position.add( teVector.multiplyScalar(actualMoveSpeed * speedMultiplier));
        }
        if ( this.moveBackward ) {
            var teVector = this.object.getWorldDirection();
            this.object.position.add(teVector.multiplyScalar(-actualMoveSpeed * speedMultiplier));
        }
        if ( this.moveLeft )
            this.object.translateX( actualMoveSpeed* speedMultiplier );
        if ( this.moveRight )
            this.object.translateX(- actualMoveSpeed * speedMultiplier);

        if ( this.moveUp )
            this.object.translateY( - actualMoveSpeed * speedMultiplier);
        if ( this.moveDown)
            this.object.translateY(  actualMoveSpeed * speedMultiplier);

       // this.object.position.y = this.startY;

        var actualLookSpeed = delta * this.lookSpeed;

        var DRAG_DEAD_ZONE = 1;

        if ((this.mouseDragOn || this.mouseLook) && this.lookSpeed) {

            var deltax = this.lastMouseX - this.mouseX;
            if (Math.abs(deltax) < DRAG_DEAD_ZONE)
                dlon = 0;
            var dlon = deltax / this.viewHalfX * 900;
            this.lon += dlon * this.lookSpeed;

            var deltay = this.lastMouseY - this.mouseY;
            if (Math.abs(deltay) < DRAG_DEAD_ZONE)
                dlat = 0;
            var dlat = deltay / this.viewHalfY * 900;
            this.lat += dlat * this.lookSpeed;

            this.theta = THREE.Math.degToRad( this.lon );

            this.lat = Math.max( - 85, Math.min( 85, this.lat ) );
            this.phi = THREE.Math.degToRad( this.lat );

            var targetPosition = this.target,
                position = this.object.position;

            targetPosition.x = position.x - Math.sin( this.theta );
            targetPosition.y = position.y + Math.sin( this.phi );
            targetPosition.z = position.z - Math.cos( this.theta );

            this.object.lookAt( targetPosition );

            this.lastMouseX = this.mouseX;
            this.lastMouseY = this.mouseY;
        }

        if (this.turnRight || this.turnLeft || this.tiltUp || this.tiltDown) {

            var dlon = 0;
            if (this.turnRight)
                dlon = 1;
            else if (this.turnLeft)
                dlon = -1;
            this.lon += dlon * this.turnSpeed;

            var dlat = 0;
            if (this.tiltUp)
                dlat = 1;
            else if (this.tiltDown)
                dlat = -1;

            this.lat += dlat * this.tiltSpeed;

            this.theta = THREE.Math.degToRad( this.lon );

            this.lat = Math.max( - 85, Math.min( 85, this.lat ) );
            this.phi = THREE.Math.degToRad( this.lat );

            var targetPosition = this.target,
                position = this.object.position;

            if (this.turnSpeed) {
                targetPosition.x = position.x - Math.sin( this.theta );
            }

            if (this.tiltSpeed) {
                targetPosition.y = position.y + Math.sin( this.phi );
                targetPosition.z = position.z - Math.cos( this.theta );
            }

            if (this.turnSpeed || this.tiltSpeed) {
                this.object.lookAt( targetPosition );
            }
        }
    };


    this.domElement.addEventListener( 'contextmenu', function ( event ) { event.preventDefault(); }, false );

    this.domElement.addEventListener( 'mousemove', bind( this, this.onMouseMove ), true );
    this.domElement.addEventListener( 'mousedown', bind( this, this.onMouseDown ), false );
    this.domElement.addEventListener( 'mouseup', bind( this, this.onMouseUp ), false );
    this.domElement.addEventListener( 'touchstart', bind( this, this.onTouchStart), false );
    this.domElement.addEventListener( 'touchmove', bind( this, this.onTouchMove), false );
    this.domElement.addEventListener( 'touchend', bind( this, this.onTouchEnd), false );
    this.domElement.addEventListener( 'keydown', bind( this, this.onKeyDown ), false );
    this.domElement.addEventListener( 'keyup', bind( this, this.onKeyUp ), false );
    this.domElement.addEventListener( 'resize', bind( this, this.handleResize ), false );

    var gamepad = null;//glam.Gamepad.instance;
    if (gamepad) {
        gamepad.addEventListener( 'buttonsChanged', bind( this, this.onGamepadButtonsChanged ), false );
        gamepad.addEventListener( 'axesChanged', bind( this, this.onGamepadAxesChanged ), false );
    }

    function bind( scope, fn ) {

        return function () {

            fn.apply( scope, arguments );

        };

    };

    this.handleResize();

};


//TODO: move all the mosue and touch events into their own class
var swipeMoveMilliseconds = 400; // a swipe is equivalent to holding down a key for how many milliseconds
var mouseDownStart ={x:0, y:0};
var mouseDownEnd ={x:0, y:0};
var mouseDragged ={x:0, y:0};
var useSwipeNavigation = false;

FirstPersonControls.prototype.init = function() {
    document.body.addEventListener("mousedown", onWindowClick, true); //iOS needs the touchStart as well
    document.body.addEventListener("touchstart", onTouchStart, true);
    document.body.addEventListener("touchend", onTouchEnd, true);
    window.addEventListener('keydown', onKey, true);

}


function onTouchStart(event) {
    handleMouseDownTouchStart(event);
}

function onTouchEnd(event) {
    handleMouseUpTouchEnd(event);
}


function handleMouseDownTouchStart(event) {
    if ( event.touches && event.touches.length) {
        var touch = event.touches[0]; //only going to deal with the first touch
        mouseDownStart.x = touch.clientX;
        mouseDownStart.y = touch.clientY;
    } else {
        mouseDownStart.x = event.clientX;
        mouseDownStart.y = event.clientY;
    }
}


function handleMouseUpTouchEnd(event) {

    if (wasMouseDragged(event) && useSwipeNavigation) {

        //glam.Application.instance.onMouseDragged(event);
        if (Math.abs(mouseDragged.x ) > Math.abs(mouseDragged.y)) {// is this primarily a swipe up or a swipe across?
            if (mouseDragged.x < 0) {
                firstPersonControls.moveForward = true;
                var that = this;
                setTimeout(function () {
                    firstPersonControls.moveForward = false;
                }, swipeMoveMilliseconds)
            } else {
                firstPersonControls.moveBackward = true;
                var that = this;
                setTimeout(function () {
                    firstPersonControls.moveBackward = false;
                }, swipeMoveMilliseconds)
            }
        } else {//swipe up/down will move up/down
            if (mouseDragged.y < 0) {
                firstPersonControls.moveUp = true;
                var that = this;
                setTimeout(function () {
                    firstPersonControls.moveUp = false;
                }, swipeMoveMilliseconds)
            } else {
                firstPersonControls.moveDown = true;
                var that = this;
                setTimeout(function () {
                    firstPersonControls.moveDown = false;
                }, swipeMoveMilliseconds)
            }
        }

    } else if (!wasMouseDragged(event)) {
        /* if (this.focusObject && this.focusObject.onMouseUp) {
         //console.log("application: onMouseUp")
         this.focusObject.onMouseUp(event);
         } else {
         if (!document.globalGraph || !  document.globalGraph.isMouseUpHandled ) {
         // refreshLayout();
         return;
         }
         }*/

    }
}

/**
 * If the mouse was dragged, then let the calling function know not to handle it
 * @param event
 * @returns {boolean}
 */
function wasMouseDragged(event) {
    if ( event.changedTouches && event.changedTouches.length) {
        var touch = event.changedTouches[0]; //only going to deal with the first touch
        mouseDownEnd.x = touch.clientX;
        mouseDownEnd.y = touch.clientY;
    } else if (event.hasOwnProperty("clientX")){
        mouseDownEnd.x = event.clientX;
        mouseDownEnd.y = event.clientY;
    }
    //  console.log("onTouchEnd: x: " + mouseDownEnd.x +" y: " + mouseDownEnd.y  );
    mouseDragged.x = mouseDownEnd.x - mouseDownStart.x;
    mouseDragged.y = mouseDownEnd.y - mouseDownStart.y;
    // alert("wasMouseDragged: x: " + mouseDragged.x +" y: " + mouseDragged.y  );
    if (Math.abs(mouseDragged.x) > 10 || Math.abs(mouseDragged.y) > 10) {
        return true;
    }
    return false;
}

function onWindowClick() {
    var isDragging =  (window.mouseKeyboardPositionSensorVRDevice &&
    window.mouseKeyboardPositionSensorVRDevice.isDragging ) ;
    if (! isDragging){ //This works on iOS and PC and Android, but the manager.isVRMode is simpler and might now work with the "touchstart"
        /*if (cities && isMobile() ) {
            cities.onSelect();
        }*/
    }

}



// Reset the position sensor when 'z' pressed.
function onKey(event) {
    if (event.keyCode == 90) { // z
       // controls.resetSensor();
    }
    if (event.keyCode == 13 ) { // enter/return
       /* if (cities){
            cities.onSelect();
        }*/
    }
}


