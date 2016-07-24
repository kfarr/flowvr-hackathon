/**
 * Created by jm on 1/31/2016.
 */

GazeAndWaitCursor = function(camera) {

    this.isGazing = false;

    //gaze and wait icon
    this.canvas = document.createElement( 'canvas' );
    this.canvas.width =128;
    this.canvas.height = 128;

    this.draw(1000); //not neccessary to draw initial  context

    // canvas contents will be used for a texture
    this.texture = new THREE.Texture(this.canvas)
    this.texture.needsUpdate = true;

    this.material = new THREE.MeshBasicMaterial( {map: this.texture } );
    this.material.transparent = true;

    this.object = new THREE.Mesh(
        new THREE.PlaneGeometry(0.12, 0.12, 1, 1),
        this.material
    );

    this.object.position.z = -2;
    this.object.visible =true;
    camera.add( this.object );

    return this;
}

GazeAndWaitCursor.GAZE_AND_WAIT_TIME =2000 ;

GazeAndWaitCursor.prototype.draw = function(millisecondsPassed){

    var context = this.canvas.getContext('2d');

    var currentPercentFromTop = millisecondsPassed / GazeAndWaitCursor.GAZE_AND_WAIT_TIME  ;//0 is straight up (none), 0.99 is 59.5 minute position
    var radius = 120/2;
    var startAngle = 1.5 * Math.PI; //straight up

    var endAngle = (currentPercentFromTop * 2 + 1.5) * Math.PI;
    var counterClockwise = false;
    context.clearRect(0,0,128,128);
    context.beginPath();
    context.arc(128/2, 128/2, radius, startAngle, endAngle, counterClockwise);
    context.lineWidth = 15;

// line color
    context.strokeStyle = 'orange';
    context.stroke();

    return currentPercentFromTop;

}


GazeAndWaitCursor.prototype.start = function() {
    this.timerStartTime = 0;
    this.timerStartTime =  new Date().getTime();
    this.object.visible = true;
    this.isGazing = true;
}

GazeAndWaitCursor.prototype.stop = function() {
    this.object.visible = false;
    this.isGazing = false;
}


GazeAndWaitCursor.prototype.update = function( onExecution ) {
    if (!this.isGazing){
        return;
    }

    var now =  new Date().getTime();
    var millisecondsPassed = now - this.timerStartTime;

    var currentPercentFromTop = this.draw( millisecondsPassed);

    // canvas contents will be used for a texture
    this.texture = new THREE.Texture(this.canvas);
    this.texture.needsUpdate = true;

    this.material = new THREE.MeshBasicMaterial( {map: this.texture } );
    this.material.transparent = true;
    this.material.needsUpdate = true;
    this.object.material = this.material;


    if (currentPercentFromTop >=1) {
        this.stop();
        console.log("execute onGazeWaited");
        if ( onExecution != undefined){
            onExecution();
        }
    }
}