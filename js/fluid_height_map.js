class Fluid_Height_Map{
    constructor( width, length, nx, ny, initial_conditions){
        this.width = width;
        this.length = length;
        nx += 1;
        ny += 1;
        this.nx = nx;
        this.ny = ny;
        this.dx = this.width/this.nx; 
        this.dy = this.length/this.ny; 

        this.speed = 10000;

        this.v1 = createArray(ny, nx);
        this.v2 = createArray(ny, nx);
        this.height_field = createArray(ny, nx);
        this.a = -0.1; // Units of [kg*m/s^2]
        for(var iy = 0; iy < this.height_field.length; iy++){
            for(var ix = 0; ix < this.height_field.length; ix++){
                this.v1[iy][ix] = 0.0;
                this.v2[iy][ix] = 0.0;
                this.height_field[iy][ix] = (1.0);
            }
        }
        
        //initial_conditions(this.height_field, this.velocity_field);

    }

    biLinearInterpolate( s, x, y ){
        // Figure out where the point is between
        let i1 = Math.floor( x / this.dx );
        let i2 = i1 + 1;
        let j1 = Math.floor( y / this.dy );
        let j2 = j1 + 1;
        //
        let f11 = s[j1][i1];
        let f12 = s[j2][i1];
        let f21 = s[j1][i2];
        let f22 = s[j2][i2];
        //
        let n = f11*(i2*this.dx - x)*(j2*this.dy - y) + f21*(x - i1*this.dx)*(j2*this.dy - y) + f12*(i2*this.dx - x)*(y - j1*this.dy) + f22*(x - i1*this.dx)*(y - j1*this.dy);
        let d = (i2-i1)*(j2-j1)*this.dx*this.dy;
        return ( n / d );
    }

    advect( s, v1, v2, dt ){
        let s_new = clone(s);
        for(var j = 1; j < this.ny-1; j++){
            for(var i = 1; i < this.nx-1; i++){
                let x0 = i*this.dx;
                let y0 = j*this.dy;
                let x1 = x0 - dt*v1[j][i];
                let y1 = y0 - dt*v2[j][i];
                s_new[j][i] = this.biLinearInterpolate(s, x1, y1);
            }
        }
        return s_new;
    }

    updateHeights(n, v1, v2, dt){

        for(var j = 1; j < this.ny-1; j++){
            for(var i = 1; i < this.nx-1; i++){
                n[j][i] += n[j][i]*( (v1[j][i+1]-v1[j][i])/this.dx + (v2[j+1][i]-v2[j][i])/this.dx )
            }
        }

    }

    updateVelocities(h, v1, v2, dt){
        for(var j = 1; j < this.ny-1; j++){
            for(var i = 2; i < this.nx-1; i++){
                v1[j][i] += this.a*((h[j][i-1]-h[j][i])/this.dx)*dt;
            }
        }

        for(var j = 2; j < this.ny-1; j++){
            for(var i = 1; i < this.nx-1; i++){
                v2[j][i] += this.a*((h[j-1][i]-h[j][i])/this.dy)*dt;
            }
        }
    }

    /*
        Variables:
            h - height above zero level
            g - height of grounds
            n - is height above ground (h - g), for nomw assume g = 0 => n = h
            v - horizontal velocity (x,z) or (v1,v2)
            an - vertical acceleration of fluid (gravity)  
        Governing Equations
            (d/dt)n + (grad n)v = -n(div v)
            and
            (d/dt)v + (grad v)v = an(grad h)
            or
            (d/dt)v1 + (grad v1)v = an(grad h)
            (d/dt)v2 + (grad v2)v = -an(grad h)
            where, v1,v2 are x and z velocities respectivly

    
    
    */
    update( dt ){

        let dh = createArray(this.ny, this.nx);
        let dv = createArray(this.ny, this.nx);

        // 
        this.height_field = this.advect( this.height_field, this.v1, this.v2, dt );
        this.v1 = this.advect( this.v1, this.v1, this.v2, dt );
        this.v2 = this.advect( this.v2, this.v1, this.v2, dt );
        this.updateHeights(this.height_field, this.v1, this.v2, dt);
        this.updateVelocities(this.height_field, this.v1, this.v2, dt);
        
    }

    height(x, y){
        return this.height_field[y][x];
    }
    set_height(x, y, val){
        this.height_field[y][x] = val;
    }
}