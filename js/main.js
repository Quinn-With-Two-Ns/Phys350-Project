if ( ! Detector.webgl ) Detector.addGetWebGLMessage(); // Make sure the browser supports WebGL

let blocker = document.getElementById( 'blocker' );
let instructions = document.getElementById( 'pause' );

var container;
var controls;
var stats;
var scene;
var camera;
var renderer;
var water_mesh;
var isPlay;

var worldWidth = 124;
var surface_width = 1000;
var clock = new THREE.Clock();
let render_clk = new THREE.Clock();

var raycaster = new THREE.Raycaster();

var fluid_height_map;
// Simulation Parameters
let sim_parameters = {
    "wave Speed": 100,
    amplitude: 50
};

// Initial Conditions for the Height/Velocity Map
function init_conditions(heights, velocities){
    // Zeros everything
    for(var iy = 0; iy < heights.length; iy++){
        velocities[iy].fill(0.0);
        heights[iy].fill(0.0);
    }
    // Make a lil bump
    heights[50][50] = 50;
    heights[51][50] = 50;
    heights[50][51] = 50;
    heights[51][51] = 50;
}

function create_Gui()
{
    let gui = new dat.GUI();
    let change = function(){
        fluid_height_map.speed = sim_parameters["wave Speed"];
    }
    gui.add( sim_parameters, "wave Speed", 0, 1000, 0.1 ).onChange( change );
    gui.add( sim_parameters, "amplitude", -100, 100, 0.1 ).onChange( change );

    //
    change();
}



// Sets up the Simulation
function init(){
    isPlay = true;
    // 
    fluid_height_map = new Fluid_Height_Map(surface_width, surface_width, worldWidth, worldWidth, init_conditions);
    //
    container = document.getElementById( 'container' );
    stats = new Stats(); // Gives the framerate in the top corner 
    container.appendChild( stats.dom );
    //
    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0xffffff );
    //
    camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 10000 );
    camera.position.y = 150;
    camera.position.x = -550;
    camera.position.z = 5;
    // Set up the first person controls should proably be changed to use keyboard
    controls = new THREE.FirstPersonControls( camera );
    controls.movementSpeed =250;
    controls.lookSpeed = 0.1;
    //
    renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );
    //
    var water_geometry = new THREE.PlaneGeometry( surface_width, surface_width, worldWidth, worldWidth );
    water_geometry.rotateX( - Math.PI / 2 );
    set_heights(fluid_height_map, water_geometry.vertices);
    //
    var water_texture = new THREE.TextureLoader().load( "textures/water.jpg" );
    water_texture.wrapS = water_texture.wrapT = THREE.RepeatWrapping;
    water_texture.repeat.set( 5, 5 );

    var water_material = new THREE.MeshBasicMaterial( { color: 0x0000ff, map: water_texture } );
    
    water_mesh = new THREE.Mesh( water_geometry, water_material );
    scene.add( water_mesh );
    //
    //create_container(surface_width, 100, scene)
    //
    create_Gui();
    //
    window.addEventListener( 'resize', onWindowResize, false );
    window.addEventListener( 'click', onDocumentMouseDown, false );
    window.addEventListener( 'blur', onBlur, false );
    window.addEventListener( 'focus', onFocus, false );
    window.addEventListener('keydown', function(event) {
        if(event.keyCode == 27){ // Escape button
            isPlay = !isPlay;
            if(isPlay === false){
                blocker.style.display = 'block';
                instructions.style.display = '';
            }
            else{
                blocker.style.display = 'none';
            }
            clock.getDelta();
            render_clk.getDelta();
        }
    }, false);
}

function onFocus(){
    isPlay = true;
    clock.getDelta();
    render_clk.getDelta();
    blocker.style.display = 'none';
}
function onBlur(){
    isPlay = false;
    blocker.style.display = 'block';
    instructions.style.display = '';
}

// Handles Window resizing
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
    controls.handleResize();
}
// Handles Mouse Click
function onDocumentMouseDown( event ) {
    if(!isPlay) return; 
    var mouse = new THREE.Vector2();
    // calculate mouse position in normalized device coordinates
	// (-1 to +1) for both components
	mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
    raycaster.setFromCamera( mouse, camera );
    // Look where the mouse clicked and pull up the first face that intersects with the mouse
    var intersect_data = raycaster.intersectObject(water_mesh, false);
    // See if we clicked on anything
    if(intersect_data.length > 0){
        var face_hit = intersect_data[0].face; // just look at the first face clicked on
        var vert_index = [face_hit.a, face_hit.b, face_hit.c];
        for(var i = 0; i < 3; i++){
            iy = Math.floor(vert_index[i] / (worldWidth+1));
            ix = vert_index[i] - (worldWidth+1)*iy;
            fluid_height_map.height_field[iy][ix] += sim_parameters.amplitude;
        }
    }
}



// Renders the water
function render(){
    if(!isPlay) return;
    var delta = clock.getDelta();
    set_heights(fluid_height_map, water_mesh.geometry.vertices); // Syncs the height-map with the 3-D model
    water_mesh.geometry.verticesNeedUpdate = true; // Make sure Three.js know we changed the mesh
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

// Simulation update moved here to make it faster then 60 Hz
setInterval(function(){ 
    if(!isPlay) return;
    // Only update when the window is in focus
    if(document.visibilityState == "visible"){
        fluid_height_map.update( render_clk.getDelta() ); // Performs a update of the simulation
    }
}, 1);