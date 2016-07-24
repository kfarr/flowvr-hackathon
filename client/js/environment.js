function addEnvironment(scene){
    environment = new Environment(); //global var
    scene.add(environment.object);
}

Environment = function() {
    this.object =  new THREE.Object3D();

    this.sky = this.createSkyGradient();

   // this.sky = this.createSky(); star image
    this.object.add(this.sky);

    this.floor = this.createFloor();
    this.floor.position.y = -20;
    this.object.add(this.floor);

    this.stars = this.createStars();
    this.object.add(this.stars);

    return this;
}

Environment.prototype.createSky =  function (){
    var folder = "images/";
    var sides = [
        // [folder + "posz.jpg", 0, 0, 100, 180 * deg2rad, 0, 0],
        // [folder + "posx.jpg", 100, 0, 0, 0, -90 * deg2rad, 180 * deg2rad],
        // [folder + "negz.jpg", 0, 0, -100, 180 * deg2rad, 180 * deg2rad, 0],
        // [folder + "negx.jpg", -100, 0, 0, 0, 90 * deg2rad, 180 * deg2rad ],
        // [folder + "negy.jpg", 0, 100, 0, 90 * deg2rad, 0, 0 ],
        // [folder + "posy.jpg", 0, -100, 0, -90 * deg2rad, 0, 0 ]
        [folder + "posz.png", 0, 0, 100, 180 * deg2rad, 0, 0],
        [folder + "posx.png", 100, 0, 0, 0, -90 * deg2rad, 180 * deg2rad],
        [folder + "negz.png", 0, 0, -100, 180 * deg2rad, 180 * deg2rad, 0],
        [folder + "negx.png", -100, 0, 0, 0, 90 * deg2rad, 180 * deg2rad ],
        [folder + "negy.png", 0, 100, 0, 90 * deg2rad, 0, 0 ],
        [folder + "posy.png", 0, -100, 0, -90 * deg2rad, 0, 0 ]
    ];

    var cube = new THREE.Object3D();
    for (var i = 0; i < sides.length; i ++) {

        var texture, material, plane;

        texture = THREE.ImageUtils.loadTexture( sides[i][0] );

        material = new THREE.MeshLambertMaterial({ map : texture });
        plane = new THREE.Mesh(new THREE.PlaneGeometry(200, 200, 10, 10), material);
        plane.material.side = THREE.DoubleSide;

        plane.position.set(
            sides[i][1],
            sides[i][2],
            sides[i][3]
        );
        plane.rotation.set(
            sides[i][4],
            sides[i][5],
            sides[i][6]
        );
        cube.add(plane);
    }
    cube.rotation.z = 180 * deg2rad;



    return cube;

}

Environment.prototype.createFloor = function() {
    var floorRadius = 100;

    var glowSpanTexture = THREE.ImageUtils.loadTexture('images/blueglowspan.png');

    var cylinderMaterial = new THREE.MeshBasicMaterial({
        map: glowSpanTexture,
        //blending: THREE.AdditiveBlending,
        transparent: true,
        depthTest: true,
        depthWrite: true,
        wireframe: true,
        opacity: 0.1
    })
    var cylinderGeo = new THREE.CylinderGeometry( floorRadius, 0, 0, (360/8) - 1, 20 );
    var matrix = new THREE.Matrix4();
    matrix.scale( new THREE.Vector3(1,0.0001,1) );
    cylinderGeo.applyMatrix( matrix );
    cylinderMaterial.map.wrapS = THREE.RepeatWrapping;
    cylinderMaterial.map.wrapT = THREE.RepeatWrapping;
   // cylinderMaterial.map.needsUpdate = true;
    var cylinderMesh = new THREE.Mesh( cylinderGeo, cylinderMaterial );

    return cylinderMesh;

}

Environment.prototype.createStars = function()  {

    function getColor(type) {

        var randomBetween = function (min, max) {
            return Math.floor(Math.random() * (max - min + 1) + min);
        }

        function c(start, end) {
            return randomBetween(start, end);
        }

        type = !type ? "#ffffff" : type;
        switch (type) {
            case  'green-bluish' :
                return "#" + "00" + c(100, 200) + c(100, 200);
            case  'cyanish' :
                //return "#" + "17" + c(215, 230) + c(240, 255);
                return new THREE.Color(5 / 256, c(125, 210) / 256, c(175, 235) / 256);
            case  'bluish' :
                var color = new THREE.Color(0, c(100, 120) / 256, c(180, 255) / 256);
                return color;
            case "purplish":
                return "#" + c(100, 200) + "cc" + "ff";
            default:
                return type;
        }

    }

    var geometry = new THREE.Geometry;

    var fieldWidth = 190;
    for (var i = 0; i < 500; i++) {

        var x = (0.5 - Math.random()) * fieldWidth;
        var y = (0.5 - Math.random()) * fieldWidth;
        var z = (0.5 - Math.random()) * fieldWidth;
        // console.log(z);
        var vert = new THREE.Vector3(x, y, z);

        // don't stand, don't stand so close to me
        if (vert.length() > 20) {
            geometry.vertices.push(vert);
            var color = getColor("cyanish");

            geometry.colors.push(color);
        }

    }

    geometry.verticesNeedUpdate = true;

    var map = THREE.ImageUtils.loadTexture("images/spark3.png");
    var material = new THREE.PointsMaterial({ size:0.4, map:map,
        transparent: (map !== null),
        depthWrite: false,
        vertexColors: (geometry.colors.length > 0)});
    var ps = new THREE.Points(geometry, material);
    ps.sortParticles = true;

    var mesh =  new THREE.Mesh( geometry, material );
    return ps;
}


Environment.prototype.update = function() {
    this.floor.material.map.offset.y -= 0.001;
   // this.floor.material.map.needsUpdate = true;

}


var colorToRgb = function (color, alpha) {
    if (alpha === undefined){ alpha = 1.0;}
    if (color =="transparent") {
        return "rgba(0, 0, 0, " + alpha +")";
    }
    var d = document.createElement("div");
    d.style.color = color;
    document.body.appendChild(d)

    var computedColor = window.getComputedStyle(d).color;
    var index = computedColor.lastIndexOf(")");
    var string= computedColor.substr(0, index) +", "+ alpha + ")";
    string = string.replace(/rgb/, "rgba");
    return string;
}

Environment.prototype.createSkyGradient = function() {
   /* var colors = [
        ['0.000', 'rgb(26, 24, 127)'],
        ['0.230', 'rgb(0,0,0)'],
        ['0.337', 'rgb(39,35,191)'],
        ['0.731', 'rgb(0,0,0)'],
        ['1.000', 'rgb(13,12,64)']
    ];*/
    //#fceabb 0%,#fccd4d 37%,#f8b500 51%,#ce7d40 82%,#fbdf93 100%
   /* var colors = [
        ['0.000', 'rgba(252, 234, 187, 1)'],
        ['0.230',  'rgba(252, 205, 77, 1)'],
        ['0.337', 'rgba(248, 181, 0, 1)'],
        ['0.731', 'rgba(206, 125, 64, 1)'],
        ['1.000', 'rgba(251, 223, 147, 1)'],
    ];


    var texture = createGradientTexture(512,colors,0,0,0,1);*/
    var texture =THREE.ImageUtils.loadTexture("images/gradientSky20x512.png");

    var geometry = new THREE.SphereGeometry( 200, 60, 40 );
    geometry.scale( - 1, 1, 1 );
    var material = new THREE.MeshBasicMaterial( {  map: texture, sides: THREE.DoubleSide  } );
    skysphere = new THREE.Mesh( geometry, material );
    return skysphere;


}

var createGradientTexture = function(size, colors, startX, startY, endX, endY) {
    var S = size;

    var canvas = document.createElement('canvas');
    canvas.width = S;
    canvas.height = S;

    var ctx = canvas.getContext('2d');

    var grd = ctx.createLinearGradient( startX * S, startY * S, endX * S, endY * S);

    if (colors.length == 1)
        colors[1] = colors[0];

    for (var i = 0; i < colors.length; i++) {
        var c = colors[i];
        var stop = Array.isArray(c ) ? c[0] : i * 1 / (colors.length - 1);
        var color = Array.isArray(c ) ? c[1] : c;
        grd.addColorStop(stop, color);
    }

    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, S, S);

    var texture = new THREE.Texture(canvas);

    texture.needsUpdate = true;

    return texture;
}

