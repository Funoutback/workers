// Step 1: Define the perm array generation function
function generatePerm() {
    let perm = [];
    for (let i = 0; i < 256; i++) {
        perm[i] = i;
    }

    // Shuffle perm array
    for (let i = 255; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [perm[i], perm[j]] = [perm[j], perm[i]];
    }

    return perm.concat(perm); // Duplicate perm array for wraparound
}

// Step 2: Define the SimplexNoise class
class SimplexNoise {
    constructor(perm) {
        this.perm = perm;
    }

    // Gradient function
    grad(hash, x, y, z) {
        const h = hash & 15;
        let u = h < 8 ? x : y;
        let v = h < 4 ? y : h === 12 || h === 14 ? x : z;
        return ((h & 1 ? -u : u) + (h & 2 ? -v : v));
    }

    // Fade function
    fade(t) {
        return t * t * t * (t * (t * 6 - 15) + 10);
    }

    // Linear interpolation
    lerp(t, a, b) {
        return a + t * (b - a);
    }

    // Main Simplex noise function
    noise(xin, yin, zin) {
        const p = this.perm;
        let X = Math.floor(xin) & 255;
        let Y = Math.floor(yin) & 255;
        let Z = Math.floor(zin) & 255;
        let xf = xin - Math.floor(xin);
        let yf = yin - Math.floor(yin);
        let zf = zin - Math.floor(zin);

        let u = this.fade(xf);
        let v = this.fade(yf);
        let w = this.fade(zf);

        let A = p[X] + Y;
        let AA = p[A] + Z;
        let AB = p[A + 1] + Z;
        let B = p[X + 1] + Y;
        let BA = p[B] + Z;
        let BB = p[B + 1] + Z;

        let aa = this.grad(p[AA], xf, yf, zf);
        let ba = this.grad(p[BA], xf - 1, yf, zf);
        let ab = this.grad(p[AB], xf, yf - 1, zf);
        let bb = this.grad(p[BB], xf - 1, yf - 1, zf);

        let a = this.lerp(u, aa, ba);
        let b = this.lerp(u, ab, bb);

        let aaa = this.grad(p[AA + 1], xf, yf, zf - 1);
        let bba = this.grad(p[BA + 1], xf - 1, yf, zf - 1);
        let abb = this.grad(p[AB + 1], xf, yf - 1, zf - 1);
        let bbb = this.grad(p[BB + 1], xf - 1, yf - 1, zf - 1);

        let c = this.lerp(u, aaa, bba);
        let d = this.lerp(u, abb, bbb);

        let result = this.lerp(v, a, b);
        return this.lerp(w, result, this.lerp(v, c, d));
    }
}

// Step 3: Initialize the worker
const perm = generatePerm(); // Generate the perm array
const simplexNoise = new SimplexNoise(perm); // Instantiate the SimplexNoise class using `new`

self.onmessage = function (event) {
    const { chunkX, chunkZ, chunkSize, chunkHeight } = event.data;

    const chunkData = [];
    for (let dx = 0; dx < chunkSize; dx++) {
        for (let dz = 0; dz < chunkSize; dz++) {
            for (let dy = 0; dy < chunkHeight; dy++) {
                let nx = (chunkX + dx) * 0.1;
                let ny = dy * 0.1;
                let nz = (chunkZ + dz) * 0.1;

                let noiseValue = simplexNoise.noise(nx, ny, nz);
                if (noiseValue > 0.2) {
                    chunkData.push({ x: dx, y: dy, z: dz });
                }
            }
        }
    }

    postMessage(chunkData); // Send chunk data back to the main thread
};

