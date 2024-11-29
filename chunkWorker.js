// Simplex Noise Class
class SimplexNoise {
    constructor(perm) {
        this.perm = perm;
    }
    grad(hash, x, y, z) {
        const h = hash & 15;
        let u = h < 8 ? x : y;
        let v = h < 4 ? y : h === 12 || h === 14 ? x : z;
        return ((h & 1 ? -u : u) + (h & 2 ? -v : v));
    }
    fade(t) {
        return t * t * t * (t * (t * 6 - 15) + 10);
    }
    lerp(t, a, b) {
        return a + t * (b - a);
    }
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

// Permutation Array Generation
function generatePerm() {
    let perm = [151,160,137,91,90,15,
  131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,23,
  190, 6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,
  88,237,149,56,87,174,20,125,136,171,168, 68,175,74,165,71,134,139,48,27,166,
  77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,55,46,245,40,244,
  102,143,54, 65,25,63,161, 1,216,80,73,209,76,132,187,208, 89,18,169,200,196,
  135,130,116,188,159,86,164,100,109,198,173,186, 3,64,52,217,226,250,124,123,
  5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,
  223,183,170,213,119,248,152, 2,44,154,163, 70,221,153,101,155,167, 43,172,9,
  129,22,39,253, 19,98,108,110,79,113,224,232,178,185, 112,104,218,246,97,228,
  251,34,242,193,238,210,144,12,191,179,162,241, 81,51,145,235,249,14,239,107,
  49,192,214, 31,181,199,106,157,184, 84,204,176,115,121,50,45,127, 4,150,254,
  138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180];
    for (let i = 0; i < 256; i++) {
        perm[i] = i;
    }
    for (let i = 255; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [perm[i], perm[j]] = [perm[j], perm[i]];
    }
    return perm.concat(perm);
}

// Worker Logic
const perm = generatePerm();
const simplexNoise = new SimplexNoise(perm);

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

    postMessage(chunkData);
};

