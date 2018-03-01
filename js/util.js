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
    for(var iy = 0; iy < heights.length; iy++){
        for(var ix = 0; ix < heights.length; ix++){
            set_vertex(verticies, ix, iy, height_field[iy][ix]);
        }
    }
}


function create_container(width, depth, scene)
{
    var bottom = new THREE.PlaneGeometry( width, width);
    bottom.rotateX( - Math.PI / 2 );
    bottom.translate(0, -depth, 0);
    var mat = new THREE.MeshBasicMaterial( { color: 0x0ff000 } );
    var mesh = new THREE.Mesh( bottom, mat );
    scene.add(mesh);
    return mesh;
}