class Fluid_Height_Map{
    constructor( width, length, nx, ny, initial_conditions, heightMap){
        this.width = width;
        this.length = length;
        nx += 1;
        ny += 1;
        this.nx = nx;
        this.ny = ny;
        this.dx = this.width/this.nx; 
        this.dy = this.length/this.ny; 
        
        this.g = createArray(nx,ny);
        heightMap(this.g);


        this.v1 = createArray(ny, nx);
        this.v2 = createArray(ny, nx);
        this.n = createArray(ny, nx);
        this.a = 0.1; // Units of [kg*m/s^2]

        this.h = createArray(this.ny, this.nx);
        initial_conditions( this.n, this.v1, this.v2 );

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
                let h_11, h_12, h_21, h_22;

                if(v1[i][j] <= 0){
                    h_11 = n[i+1][j];
                } else {
                    h_11 = n[i][j];
                }

                if(v1[i-1][j] <= 0){
                    h_12 = n[i][j];
                } else {
                    h_12 = n[i-1][j];
                }

                if(v2[i][j] <= 0){
                    h_21 = n[i][j+1];
                } else {
                    h_21 = n[i][j];
                }

                if(v2[i][j-1] <= 0){
                    h_22 = n[i][j];
                } else {
                    h_22 = n[i][j-1];
                }

                n[j][i] -= ( (h_11*v1[j][i+1]-h_12*v1[j][i])/this.dx + (h_12*v2[j+1][i]-h_22*v2[j][i])/this.dx )*dt;
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
        dt /= 1;
        this.n = this.advect( this.n, this.v1, this.v2, dt );
        this.v1 = this.advect( this.v1, this.v1, this.v2, dt );
        this.v2 = this.advect( this.v2, this.v1, this.v2, dt );
        
        this.updateHeights(this.n, this.v1, this.v2, dt);
    
        for(var j = 0; j < this.ny; j++){
            for(var i = 0; i < this.nx; i++){
                this.h[j][i] = this.n[j][i] + this.g[j][i];
            }
        }

        this.updateVelocities(this.h, this.v1, this.v2, dt);
        
    }

    height(x, y){
        return this.n[y][x];
    }
    set_height(x, y, val){
        this.n[y][x] = val;
    }
}