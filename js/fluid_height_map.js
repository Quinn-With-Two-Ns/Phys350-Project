class Fluid_Height_Map{
    constructor( width, length, nx, ny, initial_conditions){
        this.width = width;
        this.length = length;

        this.nx = nx;
        this.ny = ny;

        this.speed = 10000;

        this.velocity_field = createArray(ny, nx);
        this.height_field = createArray(ny, nx);
        this.g = 1.0;
        for(var iy = 0; iy < this.height_field.length; iy++){
            for(var ix = 0; ix < this.height_field.length; ix++){
                this.velocity_field[iy][ix] = new THREE.Vector2( 0, 0 );
                this.height_field[iy][ix] = (1.0);
            }
        }
        
        //initial_conditions(this.height_field, this.velocity_field);

    }

    update( dt ){
        
        let dh = createArray(this.ny, this.nx);
        let dv = createArray(this.ny, this.nx);
        let dx = this.width/this.nx; 
        let dy = this.length/this.ny; 
        // Warning if the timestep is too large
        if( dt > dx/this.speed) { console.log("WARNING simulaton may be unstable"); } 
        // For now I just fixed the boundries to be constant
        // Does some laplacian crap
        for(let iy = 1; iy < this.ny - 1; iy++){
            for(let ix = 1; ix < this.nx - 1; ix++){
                let h_11 = (this.height_field[iy][ix+1] + this.height_field[iy][ix])/2.0;
                let h_12 = (this.height_field[iy][ix-1] + this.height_field[iy][ix])/2.0;
                let h_21 = (this.height_field[iy+1][ix] + this.height_field[iy][ix])/2.0;
                let h_22 = (this.height_field[iy-1][ix] + this.height_field[iy][ix])/2.0;

                let v_11 = (this.velocity_field[iy][ix+1].x);
                let v_12 = (this.velocity_field[iy][ix-1].x);
                let v_21 = (this.velocity_field[iy+1][ix].y);
                let v_22 = (this.velocity_field[iy-1][ix].y);

                dh[iy][ix] = (-(h_11*v_11 - h_12*v_12)/(2.0*dx) - (h_21*v_21 - h_22*v_22)/(2.0*dy))*dt;

                
                dv[iy][ix] = new THREE.Vector2( 0, 0 );
                dv[iy][ix].setX( ((-this.g/(2.0*dx))*(this.height_field[iy][ix+1] - this.height_field[iy][ix-1]) - this.velocity_field[iy][ix].x*(this.velocity_field[iy][ix+1].x - this.velocity_field[iy][ix-1].x)/(2.0*dx) - this.velocity_field[iy][ix].y*(this.velocity_field[iy+1][ix].x - this.velocity_field[iy-1][ix].x)/(2.0*dy))*dt);
                dv[iy][ix].setY( ((-this.g/(2.0*dy))*(this.height_field[iy+1][ix] - this.height_field[iy-1][ix]) - this.velocity_field[iy][ix].x*(this.velocity_field[iy][ix+1].y - this.velocity_field[iy][ix-1].y)/(2.0*dx) - this.velocity_field[iy][ix].y*(this.velocity_field[iy+1][ix].y - this.velocity_field[iy-1][ix].y)/(2.0*dy))*dt);
                
            }
        }

        for(let iy = 1; iy < this.ny - 1; iy++){
            for(let ix = 1; ix < this.nx - 1; ix++){
                this.height_field[iy][ix] += dh[iy][ix];
                this.velocity_field[iy][ix].x += dv[iy][ix].x;
                this.velocity_field[iy][ix].y += dv[iy][ix].y;
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