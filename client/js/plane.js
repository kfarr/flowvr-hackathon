'use strict';

/**
 * Plane
 *
 *  from http://stars.chromeexperiments.com/
 */

mv.Prefabs.Plane = function(params)
{
    params = params || {};

    var path = params.path;

    var obj3d = new THREE.Object3D();

    var planeRadius = 10;

    var obj = new glam.Object();

    var glowSpanTexture = THREE.ImageUtils.loadTexture('images/glowspan.png', undefined, 
        function(map) {

            var cylinderMaterial = new THREE.MeshBasicMaterial({
                map: map,
               //blending: THREE.AdditiveBlending,
                transparent: true,
                depthTest: true,
                depthWrite: true,
                wireframe: true,
                opacity: 0.1
            })
            var cylinderGeo = new THREE.CylinderGeometry( planeRadius, 0, 0, (360/8) - 1, 20 );
            var matrix = new THREE.Matrix4();
            matrix.scale( new THREE.Vector3(1,0.0001,1) );
            cylinderGeo.applyMatrix( matrix );
            cylinderMaterial.map.wrapS = THREE.RepeatWrapping;
            cylinderMaterial.map.wrapT = THREE.RepeatWrapping;
            cylinderMaterial.map.needsUpdate = true;
            var cylinderMesh = new THREE.Mesh( cylinderGeo, cylinderMaterial );


            obj3d.add(cylinderMesh);

            var visual = new glam.Visual(
                {
                    object : obj3d
                });
            obj.addComponent(visual);
            obj.transform.position.y =-2.5;
            obj.transform.position.z =-2;

            var script = new mv.PlaneScript(cylinderMesh);
            obj.addComponent(script);


        });

   /* var lines = new THREE.Geometry();
    lines.vertices.push( new THREE.Vector3(0,0,-planeRadius) );
    lines.vertices.push( new THREE.Vector3(0,0,planeRadius) );
    lines.vertices.push( new THREE.Vector3(-planeRadius,0,0) );
    lines.vertices.push( new THREE.Vector3(planeRadius,0,0) );
    var axesLines = new THREE.Line( lines, new THREE.LineBasicMaterial(
        {
            color: 0xcec28b,//0x111144,
            blending: THREE.AdditiveBlending,
            transparent: true,
            depthTest: false,
            depthWrite: false,
            wireframe: true,
            linewidth: 2
        }), THREE.LinePieces );

    obj3d.add(axesLines);*/


    return obj;
}

goog.provide('mv.PlaneScript');
goog.require('glam.Script');

mv.PlaneScript = function(cylinderMesh, axesLines)
{
    this.cylinderMesh = cylinderMesh;
    this.axesLines = axesLines;

    glam.Script.call(this);
}

goog.inherits(mv.PlaneScript, glam.Script);


mv.PlaneScript.prototype.realize = function()
{
   /* var visual = this._object.getComponent(glam.Visual);

    visual.material.transparent = true;
    visual.material.opacity =0.5;*/


}

mv.PlaneScript.prototype.update = function()
{

   /*  if( this.axesLines.material.map !== undefined && this.axesLines.material.opacity <= 0.001 ){
        this.axesLines.material.map.offset.y = 0.0;
        this.axesLines.material.map.needsUpdate = true;
    }*/

  /*  if( this.axesLines.material.opacity <= 0 )
        this.axesLines.visible = false;
    else
        this.axesLines.visible = true;*/

    this.cylinderMesh.material.map.offset.y -= 0.001;
    this.cylinderMesh.material.map.needsUpdate = true;

}

