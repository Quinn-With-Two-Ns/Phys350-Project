if ( ! Detector.webgl ) Detector.addGetWebGLMessage();
var container;
var stats;
var scene;
var camera;
var renderer;
var material;
var mesh;
var geometry;

var worldWidth = 124, worldDepth = 124;

var clock = new THREE.Clock();

function set_vertex( vertices, x, y, val){
    vertices[ (worldWidth+1)*y + x ].y = val;
}

function at(vertices, x, y){
    return (vertices[ (worldWidth+1)*y + x ]).y;
}

function createArray(length) {
    var arr = new Array(length || 0),
        i = length;

    if (arguments.length > 1) {
        var args = Array.prototype.slice.call(arguments, 1);
        while(i--) arr[length-1 - i] = createArray.apply(this, args);
    }

    return arr;
}

function set_heights(heights, verticies)
{
    for(var iy = 0; iy < worldDepth; iy++){
        for(var ix = 0; ix < worldDepth; ix++){
            set_vertex(verticies, ix, iy, height_field[iy][ix]);
        }
    }
}
velocity_field = createArray(worldWidth, worldDepth);
height_field = createArray(worldWidth, worldDepth);

function init_conditions(heights, velocities){
    // Zeros everything
    for(var iy = 0; iy < worldDepth; iy++){
        for(var ix = 0; ix < worldDepth; ix++){
            velocities[iy][ix] = 0.0;
            height_field[iy][ix] = 0.0;
        }
    }
    // Make a lil bump
    height_field[50][50] = 50;
    height_field[51][50] = 50;
    height_field[50][51] = 50;
    height_field[51][51] = 50;
}



// Given A height map and velocities updates the simulation
function simulation_step(heights, velocities , dt)
{
    var new_heights = createArray(worldWidth, worldDepth);
    h = 1000/worldWidth;
    var f;
    // For now I just fixed the boundries to be constant
    // Does some laplacian crap
    for(var iy = 1; iy < worldDepth-1; iy++){
        for(var ix = 1; ix < worldDepth-1; ix++){
            f = (1000)*( heights[iy][ix+1] + heights[iy][ix-1] + heights[iy+1][ix] + heights[iy-1][ix] - 4*heights[iy][ix])/(h*h);
            velocities[iy][ix] = velocities[iy][ix] + f*dt;
            new_heights[iy][ix] = heights[iy][ix] +  velocities[iy][ix]*dt;
        }
    }
    // Update the height map with new heights
    for(var iy = 1; iy < worldDepth-1; iy++){
        for(var ix = 1; ix < worldDepth-1; ix++){
            heights[iy][ix] =  new_heights[iy][ix];
        }
    }
}

// Sets up the Simulation
function init(){
    //
    init_conditions(height_field, velocity_field);
    //
    container = document.createElement( 'div' );
    document.body.appendChild( container );
    stats = new Stats();
    container.appendChild( stats.dom );
    //
    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0xffffff );
    camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 10000 );
    camera.position.y = 150;
    camera.position.x = -550;
    
    controls = new THREE.FirstPersonControls( camera );
    controls.movementSpeed =250;
    controls.lookSpeed = 0.1;
    
    renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );
    
    geometry = new THREE.PlaneGeometry( 1000, 1000, worldWidth, worldDepth );
    geometry.rotateX( - Math.PI / 2 );

    set_heights(height_field, geometry.vertices);

    var texture = new THREE.TextureLoader().load( "textures/water.jpg" );
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set( 5, 5 );

    material = new THREE.MeshBasicMaterial( { color: 0x0000ff, map: texture } );
    mesh = new THREE.Mesh( geometry, material );
    scene.add( mesh );
    
    camera.position.z = 5;
    window.addEventListener( 'resize', onWindowResize, false );


    
}

// Handles Window resizing
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
    controls.handleResize();
}

// Renders the water
function render(){
    // Only update when the window is in focus (Dosn't Work)
    var delta = clock.getDelta();
    if(document.visibilityState == "visible"){
        simulation_step(height_field, velocity_field, delta); // Performs a update of the simulation
    }
    set_heights(height_field, geometry.vertices);
    mesh.geometry.verticesNeedUpdate = true;
    controls.update( delta );
    renderer.render(scene, camera);
}


function animate (){
    requestAnimationFrame( animate ); // Keeps re-running this function
    render();
    stats.update();
};


init();
animate();