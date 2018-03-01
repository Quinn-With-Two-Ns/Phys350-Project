if ( ! Detector.webgl ) Detector.addGetWebGLMessage(); // Make sure the browser supports WebGL

var container;
var stats;
var scene;
var camera;
var renderer;
var water_mesh;

var worldWidth = 124;
var surface_width = 1000;
var clock = new THREE.Clock();

var raycaster = new THREE.Raycaster();


velocity_field = createArray(worldWidth, worldWidth);
height_field = createArray(worldWidth, worldWidth);

// Initial Conditions for the Height/Velocity Map
function init_conditions(heights, velocities){
    // Zeros everything
    for(var iy = 0; iy < heights.length; iy++){
        velocities[iy].fill(0.0);
        height_field[iy].fill(0.0);
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
    var new_heights = createArray(heights.length, heights.length);
    h = surface_width/worldWidth;
    var f;
    // For now I just fixed the boundries to be constant
    // Does some laplacian crap
    for(var iy = 1; iy < heights.length-1; iy++){
        for(var ix = 1; ix < heights.length-1; ix++){
            f = (1000)*( heights[iy][ix+1] + heights[iy][ix-1] + heights[iy+1][ix] + heights[iy-1][ix] - 4*heights[iy][ix])/(h*h);
            velocities[iy][ix] = velocities[iy][ix] + f*dt;
            new_heights[iy][ix] = heights[iy][ix] +  velocities[iy][ix]*dt;
        }
    }
    // Update the height map with new heights
    for(var iy = 1; iy < heights.length-1; iy++){
        for(var ix = 1; ix < heights.length-1; ix++){
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
    
    var water_geometry = new THREE.PlaneGeometry( surface_width, surface_width, worldWidth, worldWidth );
    water_geometry.rotateX( - Math.PI / 2 );
    set_heights(height_field, water_geometry.vertices);
    
    var water_texture = new THREE.TextureLoader().load( "textures/water.jpg" );
    water_texture.wrapS = water_texture.wrapT = THREE.RepeatWrapping;
    water_texture.repeat.set( 5, 5 );

    var water_material = new THREE.MeshBasicMaterial( { color: 0x0000ff, map: water_texture } );
    
    water_mesh = new THREE.Mesh( water_geometry, water_material );
    scene.add( water_mesh );
    //
    //create_container(surface_width, 100, scene)


    window.addEventListener( 'resize', onWindowResize, false );
    window.addEventListener( 'click', onDocumentMouseDown, false );

    
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
    var mouse = new THREE.Vector2();
    // calculate mouse position in normalized device coordinates
	// (-1 to +1) for both components
	mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
    raycaster.setFromCamera( mouse, camera );
    //
    var intersect_data = raycaster.intersectObject(water_mesh, false);
    if(intersect_data.length > 0){
        var face_hit = intersect_data[0].face;
        var vert_index = [face_hit.a, face_hit.b, face_hit.c];
        for(var i = 0; i < 3; i++){
            iy = Math.floor(vert_index[i] / (height_field.length+1));
            ix = vert_index[i] - (height_field.length+1)*iy;
            height_field[iy][ix] += 50;
        }
    }
}



// Renders the water
function render(){
    // Only update when the window is in focus (Dosn't Work)
    var delta = clock.getDelta();
    if(document.visibilityState == "visible"){
        simulation_step(height_field, velocity_field, delta); // Performs a update of the simulation
    }
    set_heights(height_field, water_mesh.geometry.vertices);
    water_mesh.geometry.verticesNeedUpdate = true;
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