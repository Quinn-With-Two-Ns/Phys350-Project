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