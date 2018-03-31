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
     * @param {doule} length length of the area in m
     * @param {int} nx number of columns in the grid
     * @param {int} ny number of rows in the grid
     * @param {function} initial_conditions defines initial element values.
     * @param {function} heightMap defines ground geometry.
     */
    constructor(width, length, nx, ny, initial_conditions, heightMap) {
        this.width = width;
        this.length = length;
        nx += 1;
        ny += 1;
        this.nx = nx;
        this.ny = ny;
        this.dx = this.width / this.nx;
        this.dy = this.length / this.ny;

        this.heightMap = heightMap;
        this.g = createArray(nx, ny);
        heightMap(this.g);
        this.bc = 'fixed';

        this.v1 = createArray(ny, nx);
        this.v2 = createArray(ny, nx);
        this.n = createArray(ny, nx);
        this.a = 9.81; // Units of [kg*m/s^2]
        this.time = 0;
        this.h = createArray(this.ny, this.nx);
        this.initial_conditions = initial_conditions;
        initial_conditions(this.h, this.v1, this.v2);
        for (var j = 0; j < this.ny; j++) {
            for (var i = 0; i < this.nx; i++) {
                this.n[j][i] = this.h[j][i] - this.g[j][i];
            }
        }
    }

    /**
     * Helper function used to perform bilinear interpolations.
     * Determines new grid values at each timestep.
     * 
     * @param {Array} s Input array, could be heights above ground or velocities.
     * @param {double} x New x coordinate (x_prev + vx*dt)
     * @param {double} y New y coordinate (y_prev + vy*dt)
     */
    biLinearInterpolate(s, x, y) {
        // Figure out where the point is between
        let i1 = Math.floor(x / this.dx);
        let i2 = i1 + 1;
        let j1 = Math.floor(y / this.dy);
        let j2 = j1 + 1;

        let f11 = s[j1][i1];
        let f12 = s[j2][i1];
        let f21 = s[j1][i2];
        let f22 = s[j2][i2];

        let n = f11 * (i2 * this.dx - x) * (j2 * this.dy - y) + f21 * (x - i1 * this.dx) * (j2 * this.dy - y) + f12 * (i2 * this.dx - x) * (y - j1 * this.dy) + f22 * (x - i1 * this.dx) * (y - j1 * this.dy);
        let d = (i2 - i1) * (j2 - j1) * this.dx * this.dy;
        return (n / d);
    }

    /**
     * Lagrangian-Eulerian advection main method. Smooths out input array
     * using bilinear interpolation.
     * 
     * @param {Array} s Input array, could be heights above ground or velocities.
     * @param {Array} v1 Array of x velocities of each cell.
     * @param {Array} v2 Array of y velocities of each cell.
     * @param {double} dt Time step value
     */
    advect(s, v1, v2, dt) {
        let s_new = clone(s);
        for (var j = 0; j < this.ny; j++) {
            for (var i = 0; i < this.nx; i++) {
                if (i == 0 || j == 0 || j == (this.ny - 1) || i == (this.nx - 1)) { }
                else {
                    let x0 = i * this.dx;
                    let y0 = j * this.dy;
                    let x1 = x0 - dt * v1[j][i];
                    let y1 = y0 - dt * v2[j][i];
                    // Write to new state matrix
                    s_new[j][i] = this.biLinearInterpolate(s, x1, y1);
                }
            }
        }
        return s_new;
    }

    /**
     * Calculates new height map values using differential equation
     * 
     * @param {Array} n Array of heights above ground (h-g).
     * @param {Array} v1 Array of x velocities of each cell.
     * @param {Array} v2 Array of y velocities of each cell.
     * @param {double} dt Time step value.
     */
    updateHeights(n, v1, v2, dt) {

        for (var j = 1; j < this.ny - 1; j++) {
            for (var i = 1; i < this.nx - 1; i++) {
                let h_11, h_12, h_21, h_22;

                //(conditional) ?    (if true)     :    (if false)
                (v1[i][j] <= 0) ? h_11 = n[i + 1][j] : h_11 = n[i][j];

                (v1[i - 1][j] <= 0) ? h_12 = n[i][j] : h_12 = n[i - 1][j];

                (v2[i][j] <= 0) ? h_21 = n[i][j + 1] : h_21 = n[i][j];

                (v2[i][j - 1] <= 0) ? h_22 = n[i][j] : h_22 = n[i][j - 1];

                n[j][i] -= ((h_11 * v1[j][i + 1] - h_12 * v1[j][i]) / this.dx + (h_12 * v2[j + 1][i] - h_22 * v2[j][i]) / this.dy) * dt;
            }
        }
    }

    /**
     * Calculates new velocity array.
     * @param {Array} h Array containing fluid heights above 0 level.
     * @param {Array} v1 Array containing x velocities of each cell.
     * @param {Array} v2 Array containing y velocities of each cell.
     * @param {double} dt Time step value.
     */
    updateVelocities(h, v1, v2, dt) {
        for (var j = 1; j < this.ny - 1; j++) {
            for (var i = 2; i < this.nx - 1; i++) {
                v1[j][i] += this.a * ((h[j][i - 1] - h[j][i]) / this.dx) * dt;
            }
        }

        for (var j = 2; j < this.ny - 1; j++) {
            for (var i = 1; i < this.nx - 1; i++) {
                v2[j][i] += this.a * ((h[j - 1][i] - h[j][i]) / this.dy) * dt;
            }
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
        this.time += 0.95*dt;
        dt /= 1;

        for (let k = 0; k < this.ny; k++) {
            this.n[k][1] = 10 + 10 * Math.sin(1 * this.time);
        }

        let v1_copy = clone(this.v1);
        let v2_copy = clone(this.v2);

        //Smooth out arrays using advection
        this.n = this.advect(this.n, v1_copy, v2_copy, dt);
        this.v1 = this.advect(this.v1, v1_copy, v2_copy, dt);
        this.v2 = this.advect(this.v2, v1_copy, v2_copy, dt);

        //Update heights
        this.updateHeights(this.n, this.v1, this.v2, dt);

        //Update heights above 0
        for (let j = 0; j < this.ny; j++) {
            for (let i = 0; i < this.nx; i++) {
                this.h[j][i] = this.n[j][i] + this.g[j][i];
            }
        }

        //Update velociteis
        this.updateVelocities(this.h, this.v1, this.v2, dt);
    }
    /*
    */
    reset()
    {
        this.heightMap(this.g);
        this.initial_conditions(this.h, this.v1, this.v2);
        for (var j = 0; j < this.ny; j++) {
            for (var i = 0; i < this.nx; i++) {
                this.n[j][i] = this.h[j][i] - this.g[j][i];
            }
        }
        this.time = 0;

    }

    //Getter and setter for height above ground array.
    height(x, y) {
        return this.n[y][x];
    }
    set_height(x, y, val) {
        this.n[y][x] = val;
    }
}