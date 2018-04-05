if ( ! Detector.webgl ) Detector.addGetWebGLMessage(); // Make sure the browser supports WebGL

let blocker = document.getElementById( 'blocker' );
let instructions = document.getElementById( 'pause' );

var container;
var controls;
var stats;
var scene;
var camera;
var renderer;
var water_mesh, ground_mesh;
let mesh_sides = new Array(4);
var isPlay;
let bgSound
var worldWidth = 100;
var surface_width = 1000;
var clock = new THREE.Clock();
let render_clk = new THREE.Clock();
let ground_geometry;
var raycaster = new THREE.Raycaster();
let base_Height = 30;
var fluid_height_map;
// Simulation Parameters
let sim_parameters = {
    "wave Speed": 100,
    amplitude: 3,
    frequency: 1,
    "Simulation Speed": 1,
    'reset':()=>{ fluid_height_map.reset(); },
    'Ground Profile':'ramp',
    'Initial Conditions':"flat"
};



// Initial Conditions for the Height/Velocity Map
function init_conditions_flat(heights, v1, v2){
    for(var iy = 0; iy < heights.length; iy++){
        for(var ix = 0; ix < heights[0].length; ix++){
            v1[iy][ix] = 0.0;
            v2[iy][ix] = 0.0;
            heights[iy][ix] = base_Height;
        }
    }
}

// Initial Conditions for the Height/Velocity Map
function init_conditions_bump(heights, v1, v2){
    for(var iy = 0; iy < heights.length; iy++){
        for(var ix = 0; ix < heights[0].length; ix++){
            v1[iy][ix] = 0.0;
            v2[iy][ix] = 0.0;
            heights[iy][ix] = base_Height*(1.0 + 1.5*Math.exp(-((heights[0].length/2 - ix)**2 + (heights.length/2 - iy)**2)/100));
        }
    }
}

function heightMap_ramp(heights){
    for(var j = 0; j < heights.length; j++){
        for(var i = 0; i < heights[0].length; i++){
            if(i > heights.length/4){
                heights[j][i] = base_Height*(i-heights.length/4)/heights.length;
            }
            else{
                heights[j][i] = 0;
            }
        }
    }
}

function heightMap_corner(heights){
    for(var j = 0; j < heights.length; j++){
        for(var i = 0; i < heights[0].length; i++){
            heights[j][i] = base_Height*(i+j)/(heights.length + heights[0].length);
        }
    }
}

function heightMap_flat(heights){
    for(var j = 0; j < heights.length; j++){
        for(var i = 0; i < heights[0].length; i++){
            heights[j][i] = 0;
        }
    }
}

function create_Gui()
{
    let gui = new dat.GUI();
    let change = function(){
        fluid_height_map.simulation_Speed = sim_parameters["Simulation Speed"];
        fluid_height_map.frequency = sim_parameters["frequency"];
        fluid_height_map.amplitude = sim_parameters["amplitude"];
        
    }
    gui.add( sim_parameters, "amplitude", 0, 10, 0.1 ).onChange( change );
    gui.add( sim_parameters, "frequency", 0, 1.5, 0.1 ).onChange( change );
    gui.add( sim_parameters, "Simulation Speed", 0, 5, 0.1 ).onChange( change );
    gui.add( sim_parameters, 'Ground Profile', ['flat', 'ramp', "corner"]).onChange( () => {
        if(sim_parameters["Ground Profile"] == "flat")
        {
            fluid_height_map.heightMap = heightMap_flat;
        }else if(sim_parameters["Ground Profile"] == "ramp"){
            fluid_height_map.heightMap = heightMap_ramp;
        } else if(sim_parameters["Ground Profile"] == "corner"){
            fluid_height_map.heightMap = heightMap_corner;
        }
        sim_parameters.reset();
        set_heights(fluid_height_map.g, ground_mesh.geometry.vertices);
        ground_mesh.geometry.verticesNeedUpdate = true;
    });

    gui.add( sim_parameters, 'Initial Conditions', ['flat', 'bump']).onChange( () => {
        if(sim_parameters["Initial Conditions"] == "flat")
        {
            fluid_height_map.initial_conditions = init_conditions_flat;
        }else if(sim_parameters["Initial Conditions"] == "bump"){
            fluid_height_map.initial_conditions = init_conditions_bump;
        }
        sim_parameters.reset();
    });
    gui.add( sim_parameters, 'reset' );
    //
    change();
}



// Sets up the Simulation
function init(){
    isPlay = true;
    // 
    fluid_height_map = new Fluid_Height_Map(surface_width, surface_width, worldWidth, worldWidth, init_conditions_flat, heightMap_ramp, base_Height);
    //
    container = document.getElementById( 'container' );
    stats = new Stats(); // Gives the framerate in the top corner 
    container.appendChild( stats.dom );
    //
    scene = new THREE.Scene();
    scene.background = new THREE.CubeTextureLoader()
	.setPath( 'textures/cubeMaps/' )
	.load( [
		'Daylight Box_Right.bmp',
		'Daylight Box_Left.bmp',
		'Daylight Box_Top.bmp',
		'Daylight Box_Bottom.bmp',
		'Daylight Box_Front.bmp',
		'Daylight Box_Back.bmp'
	] );
    //
    let listener = new THREE.AudioListener();
    bgSound = new THREE.Audio( listener );
    let bgAudioLoader = new THREE.AudioLoader();
    bgAudioLoader.load( 'audio/ocean.mp3', ( buffer ) => {
        bgSound.setBuffer( buffer );
        bgSound.setLoop( true );
        bgSound.setVolume( 1.0 );
        bgSound.play();
    });
    //
    light = new THREE.DirectionalLight( 0xffffff, 0.8 );
    scene.add( light );
    //
    camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 10000 );
    // Set up the first person controls should proably be changed to use keyboard
    controls = new THREE.FirstPersonControls( camera );
    controls.movementSpeed =250;
    controls.lookSpeed = 0.3;
    scene.add( controls.transGroup );
    controls.transGroup.translateX(0);
    controls.transGroup.translateY(80);
    controls.transGroup.translateZ(200);
    //
    renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );
    // Create the water
    var water_geometry = new THREE.PlaneGeometry( surface_width, surface_width, worldWidth, worldWidth );
    water_geometry.rotateX( - Math.PI / 2 );
    set_heights(fluid_height_map.h, water_geometry.vertices);
    
    var water_texture = new THREE.TextureLoader().load( "textures/Water-0326.jpg" );
    water_texture.wrapS = water_texture.wrapT = THREE.RepeatWrapping;
    water_texture.repeat.set( 5, 5 );

    var waterNM_texture = new THREE.TextureLoader().load( "textures/Water 0326normal.jpg" );
    waterNM_texture.wrapS = waterNM_texture.wrapT = THREE.RepeatWrapping;
    waterNM_texture.repeat.set( 5, 5 );

    var water_material = new THREE.MeshPhongMaterial( { color: 0xffffff, flatshading:true,map: water_texture, shininess:90, normalMap:waterNM_texture} );
    water_material.transparent = true;
    water_material.opacity = 0.75;
    water_mesh = new THREE.Mesh( water_geometry, water_material );
    scene.add( water_mesh );
    // Create sides

    // Create the ground
    ground_geometry = new THREE.PlaneGeometry( surface_width, surface_width, worldWidth, worldWidth );
    ground_geometry.rotateX( - Math.PI / 2 );
    set_heights(fluid_height_map.g, ground_geometry.vertices);
    //
    var ground_texture = new THREE.TextureLoader().load( "textures/sand.png" );
    ground_texture.wrapS = ground_texture.wrapT = THREE.RepeatWrapping;
    ground_texture.repeat.set( 5, 5 );
    var ground_material = new THREE.MeshBasicMaterial( { map: ground_texture } );
    ground_mesh = new THREE.Mesh( ground_geometry, ground_material );
    scene.add( ground_mesh );
    // Create a black plane to show groud levels better
    var sur = new THREE.PlaneGeometry( surface_width, surface_width, worldWidth, worldWidth );
    sur.rotateX( - Math.PI / 2 );
    var mat = new THREE.MeshBasicMaterial( { color:0x000000 } );
    
    mesh = new THREE.Mesh( sur, mat );
    mesh.translateY(-0.1);
    scene.add( mesh );
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
                bgSound.pause()
            }
            else{
                blocker.style.display = 'none';
                bgSound.play()
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
    bgSound.play()
}

function onBlur(){
    isPlay = false;
    blocker.style.display = 'block';
    instructions.style.display = '';
    bgSound.pause()
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
            fluid_height_map.n[iy][ix] += sim_parameters.amplitude;
        }
    }
}



// Renders the water
function render(){
    if(!isPlay) return;
    var delta = clock.getDelta();
    
    set_heights(fluid_height_map.h, water_mesh.geometry.vertices); // Syncs the height-map with the 3-D model
    water_mesh.geometry.verticesNeedUpdate = true; // Make sure Three.js know we changed the mesh
    //fluid_height_map.update( delta ); 
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
    let dt = render_clk.getDelta();
    if( dt > 1/60) return;
    fluid_height_map.update( dt ); 

}, 1);