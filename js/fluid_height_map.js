/**
 * @file fluid_height_map.js
 * 
 * Structure is used to describe the state
 * of a fluid in a container and determine
 * the time evolution of that state.
 * 
 */
class Fluid_Height_Map {

    /**
     * Constructor for the height map. Implemented as two 2D arrays
     * @param {double} width width of the area in m
     * @param {int} nx number of columns in the grid
     * @param {function} initial_conditions defines initial element values.
     * @param {function} heightMap defines ground geometry.
     */
    constructor(length, n, initial_conditions, heightMap) {
        this.length = length;
        n += 1;
        this.nx = n;
        this.dx = this.length / this.nx;

        this.simulation_Speed = 1.0;

        this.heightMap = heightMap;
        this.g = new Array(n);
        heightMap(this.g);
        this.bc = 'fixed';

        this.v = new Array(n);

        this.n = new Array(n);
        this.a = 9.81; // Units of [kg*m/s^2]
        this.time = 0;
        this.h = new Array(n);
        this.initial_conditions = initial_conditions;
        initial_conditions(this.h, this.v);
        for (var i = 0; i < this.nx; i++) {
            this.n[i] = this.h[i] - this.g[i]; 
        }
    }

    /**
     * Helper function used to perform bilinear interpolations.
     * Determines new grid values at each timestep.
     * 
     * @param {Array} s Input array, could be heights above ground or velocities.
     * @param {double} x New x coordinate (x_prev + vx*dt)
     */
    linearInterpolate(s, x) {
        // Figure out where the point is between
        let i1 = Math.floor(x / this.dx); //find array element corresponding to position
        let i2 = i1 + 1; // adjacent element in array

        let f1 = s[i1];
        let f2 = s[i2];

        let n = f1 * (i2 * this.dx - x) +  f2 * (x - i1 * this.dx);
        let d = (i2 - i1) * this.dx;
        return (n / d);
    }

    /**
     * Lagrangian-Eulerian advection main method. Smooths out input array
     * using bilinear interpolation.
     * 
     * @param {Array} s Input array, could be heights above ground or velocities.
     * @param {Array} v Array of x velocities of each cell.
     * @param {double} dt Time step value
     */
    advect(s, v, dt) {
        let s_new = clone(s);

        for (var i = 1; i < this.nx; i++) {
            if ( i == (this.nx - 1)) {

            }
            else {
                let x0 = i * this.dx;
                let x1 = x0 + dt * v[i];
                // Write to new state matrix
                s_new[i] = this.linearInterpolate(s, x1);
            }
        }     
        return s_new;
    }

    /**
     * Calculates new height map values using differential equation
     * 
     * @param {Array} n Array of heights above ground (h-g).
     * @param {Array} v Array of x velocities of each cell.
     * @param {double} dt Time step value.
     */
    updateHeights(n, v, dt) {

         for (var i = 1; i < this.nx - 1; i++) {
            let h_1, h_2;

            (v[i] <= 0) ? h_1 = n[i + 1] : h_1 = n[i];

            (v[i - 1] <= 0) ? h_2 = n[i] : h_2 = n[i - 1];

            n[i] -= ((h_1 * v[i + 1] - h_2 * v[i]) / this.dx ) * dt;
        }

    }

    /**
     * Calculates new velocity array.
     * @param {Array} h Array containing fluid heights above 0 level.
     * @param {Array} v Array containing x velocities of each cell.
     * @param {double} dt Time step value.
     */
    updateVelocities(h, v, dt) {
        for (var i = 1; i < this.nx - 1; i++) {
            v[i] += this.a * ((h[i - 1] - h[i]) / this.dx) * dt;
        }
    }

    /**
     * 
     * Update function as called by main.js
     * 
     *  Variables:
     *      h - height above zero level
     *      g - height of grounds
     *      n - is height above ground (h - g)
     *      v - horizontal velocity (x,z) or (v1,v2)
     *      a - vertical acceleration of fluid (gravity)  
     * Governing Equations
     *      (d/dt)n + (grad n)v = -n(div v)
     *      and
     *      (d/dt)v + (grad v)v = a(grad h)
     *      or
     *      (d/dt)v1 + (grad v1)v = a(grad h)
     *      (d/dt)v2 + (grad v2)v = a(grad h)
     *      where, v1,v2 are x and z velocities respectively
     *
     * @param {double} dt Time step value.
     */
    update(dt) {
        dt *= 1;
        this.time += dt;
        
        if(!paused)this.n[0] = 10 + 4 * Math.sin(1 * this.time);
        
        let v_copy = clone(this.v);


        //Smooth out arrays using advection
        this.n = this.advect(this.n, v_copy, dt);
        this.v = this.advect(this.v, v_copy, dt);

        //Update heights
        this.updateHeights(this.n, this.v, dt);

        //Update heights above 0
        for (let i = 0; i < this.nx; i++) {
            this.h[i] = this.n[i] + this.g[i];
        }

        //Update velociteis
        this.updateVelocities(this.h, this.v, dt);
    }
    /*
    */
    reset()
    {
        this.heightMap(this.g);
        this.initial_conditions(this.h, this.v);
        for (var i = 0; i < this.nx; i++) {
            this.n[i] = this.h[i] - this.g[i]; 
        }
        this.time = 0;

    }

    //Getter and setter for height above ground array.
    height(x) {
        return this.n[y];
    }
    set_height(x, val) {
        this.n[x] = val;
    }
}