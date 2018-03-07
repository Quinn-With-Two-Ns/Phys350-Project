class Fluid_Height_Map{
    constructor( width, length, nx, ny, initial_conditions){
        this.width = width;
        this.length = length;

        this.nx = nx;
        this.ny = ny;

        this.speed = 1000;

        this.velocity_field = createArray(ny, nx);
        this.height_field = createArray(ny, nx);

        initial_conditions(this.height_field, this.velocity_field);

    }

    update( dt ){
        let new_heights = createArray(this.ny, this.nx);
        let dx = this.width/this.nx; 
        let dy = this.length/this.ny; 
        var f;
        // Warning if the timestep is too large
        if( dt > dx/this.speed) { console.log("WARNING simulaton may be unstable"); } 
        // For now I just fixed the boundries to be constant
        // Does some laplacian crap
        for(var iy = 1; iy < this.ny - 1; iy++){
            for(var ix = 1; ix < this.nx - 1; ix++){
                f = (this.speed)*( this.height_field[iy][ix+1] + this.height_field[iy][ix-1] + this.height_field[iy+1][ix] + this.height_field[iy-1][ix] - 4*this.height_field[iy][ix])/(dx*dy);
                this.velocity_field[iy][ix] = this.velocity_field[iy][ix] + f*dt;
                new_heights[iy][ix] = this.height_field[iy][ix] +  this.velocity_field[iy][ix]*dt;
            }
        }
        // Update the height map with new heights
        for(var iy = 1; iy < this.ny - 1; iy++){
            for(var ix = 1; ix < this.nx - 1; ix++){
                this.height_field[iy][ix] =  new_heights[iy][ix];
            }
        }
    }

    height(x, y){
        return this.height_field[y][x];
    }
    set_height(x, y, val){
        this.height_field[y][x] = val;
    }
}