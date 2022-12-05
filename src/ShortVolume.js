import vtkDataArray from "@kitware/vtk.js/Common/Core/DataArray";
import vtkImageData from "@kitware/vtk.js/Common/DataModel/ImageData"
import {mat3, mat4, vec3} from "gl-matrix";

/**
 * The ShortVolume class wraps the vtkImageData for Int16Array single-component volumes.
 */
export class ShortVolume {
    /**
     * The constructor allocates space for the voxels.
     * @param{bigint[]} dims The x/y/z dimensions to allocate the vtkImageData object.
     */

    constructor(dims, initialValues = null, dirMatrix = null) {
        this.traceOn = false;
        this.dimension = dims;
        let iv = null;
        if (initialValues == null) {
            iv = {
                origin: [0, 0, 0],
                spacing: [1.0, 1.0, 1.0],
                extent: [0, dims[0] - 1, 0, dims[1] - 1, 0, dims[2] - 1]
            }
        } else {
            iv = initialValues;
        }
        this.shortVtkVolume = vtkImageData.newInstance(iv);
        this.rawValues = null;
        if (dirMatrix != null) {
            this.shortVtkVolume.setDirection(dirMatrix);
        }
        this.rawValues = null;
        let itow = this.shortVtkVolume.getIndexToWorld();
        if (true) console.log('shortvolumes itow transform: ' + itow);
    }
    getIndexToWorld()
    {
        let itow=this.shortVtkVolume.getIndexToWorld();
        return itow;
    }


    /**
     * Return the vtkImageData object.
     * @returns {vtkImageData}
     */
    getVtkJSVolume() {
        return this.shortVtkVolume;
    }

    /**
     * Load this volume from a Int8Array 1-dimensional array that will fill the
     * 3d array in row-major order.
     * @param{Int16Array} data The 1-dimensional array to replace the current volume.
     * The size of the array must match dim[0]*dim[1]*dim[2].
     */
    loadValuesFrom(data) {
        let size = Number(this.dimension[0] * this.dimension[1] * this.dimension[2]);
        if (Math.round(data.length) !== size) {
            alert("ShortVolume loaded with incorrect array size for dimension");
            return;
        }
        this.rawValues = Int16Array.from(data);
        const valueArray = vtkDataArray.newInstance(
            {
                name: 'intensity',
                numberOfComponents: 1,
                values: this.rawValues,
            }
        );
        valueArray.setRange({
            min: -32768,
            max: 32767
        }, 0);
        this.shortVtkVolume.getPointData().setScalars(valueArray);
        let range = valueArray.getRange(0);
        if (this.traceOn) console.log('range of get:' + JSON.stringify(range));

    }


    setValue(data, x, y, z, intensity) {
        const i = z * this.dimension[1] * this.dimension[0] + this.dimension[0] * y + x;
        data[i] = intensity;
    }

    setAllTo(num) {
        const valueArray = new Int16Array(this.dimension[0] * this.dimension[1] * this.dimension[2]);
        for (let i = 0; i < valueArray.length; i++) {
            valueArray[i] = num;
        }
        this.loadValuesFrom(valueArray);
    }

    loadShortsFrom(shortData) {
        if (shortData.length !== this.dimension[0] * this.dimension[1] * this.dimension[2] * 4) {
            alert("ColorVolume loaded with incorrect array size for dimension");
            return;
        }
        this.rawShorts = shortData;
        const shortArray = vtkDataArray.newInstance(
            {
                name: 'scalar',
                numberOfComponents: 1,
                values: this.rawShorts
            }
        );
        this.shortVtkVolume.getPointData().setScalars(shortArray);
    }

    fillSquare(x, y, z, shade, radius, valueArray) {
        for (let ix = x - radius; ix < x + radius; ix++) {
            for (let iy = y - radius; iy < y + radius; iy++) {
                this.setValue(valueArray, ix, iy, z, shade);
            }
        }
    }


    drawArm(x, y, z, radians, length, valueArray) {

        let p2x = Math.round(x + Math.sin(radians) * length);
        let p2y = Math.round(y + Math.cos(radians) * length);

        this.fillSquare(x, y, z, 2000, 5, valueArray);
        this.fillSquare(p2x, p2y, z, 1000, 3, valueArray);
    }

    makeClockPattern(phaseArm) {
        const valueArray = new Int16Array(this.dimension[0] * this.dimension[1] * this.dimension[2])

        let precision = 35;
        let phaseArmMod = phaseArm % precision;
        let radian = phaseArmMod * Math.PI * 2 / precision + Math.PI / 2.0; // we add pi/2 so that 0 is +Y direction
        let centerX = this.dimension[0] / 2.0;
        let centerY = this.dimension[1] / 2.0;
        for (let z = 0; z < this.dimension[2]; z++) {

            let zArmMod = z % precision;
            let zRadian = (zArmMod * Math.PI * 2) / precision + Math.PI / 2.0;

            this.drawArm(centerX, centerY, z, zRadian, this.dimension[0] / 4, valueArray);
            this.drawArm(centerX, centerY, z, radian, this.dimension[0] / 2.5, valueArray);
        }
        this.loadValuesFrom(valueArray);

    }

    /**
     * This method creates a checkerboard pattern with 8 alternating shades across each axis.
     */

    makeConstantVolume(intensity) {
        const valueArray = new Int16Array(this.dimension[0] * this.dimension[1] * this.dimension[2]);
        for (let i = 0; i < valueArray.length; i++) {
            valueArray[i] = intensity;
        }
        valueArray[10] = -32768;
        valueArray[11] = 32767;
        this.loadValuesFrom(valueArray);
    }

    getPixels() {
        return this.rawValues;
    }

    getDimensions() {
        return this.dimension;
    }

    modified() {
        this.shortVtkVolume.modified();
    }

    makeTestCheckerVolume(numTiles) {

        const valueArray = new Int16Array(this.dimension[0] * this.dimension[1] * this.dimension[2])
        let tileSizeX = this.dimension[0] / numTiles;
        let tileSizeY = this.dimension[1] / numTiles;
        let tileSizeXY=Math.min(tileSizeX,tileSizeY);
        let tileSizeZ = 1;
        let numTilesZ = this.dimension[2];

        for (let z = 0; z < numTilesZ; z++) {
            let zStart = z * tileSizeZ;
            for (let y = 0; y < numTiles; y++) {
                let yStart = y * tileSizeY;
                for (let x = 0; x < numTiles; x++) {
                    let xStart = x * tileSizeX;
                    let isWhiteTile = ((x + y + z) % 2) === 0;
                    for (let iz = zStart; iz < zStart + tileSizeZ; iz++) {
                        for (let iy = yStart; iy < yStart + tileSizeY; iy++) {
                            for (let ix = xStart; ix < xStart + tileSizeX; ix++) {
                                let pixelValue = 0;
                                if (isWhiteTile) {
                                    pixelValue = 1000;
                                } else {
                                    pixelValue = 500;
                                }
                                this.setValue(valueArray, ix, iy, iz, pixelValue);
                            }
                        }
                    }
                }
            }
            this.fillSquare(tileSizeXY/8,tileSizeXY/8,z,2000,tileSizeXY/8,valueArray);
        }

        this.loadValuesFrom(valueArray);
    }

    makeDiagonalStripes(pixelsPerFill, pixelsHorizontalSpacing, onValue, offValue) {
        const valueArray = new Int16Array(this.dimension[0] * this.dimension[1] * this.dimension[2]);
        for (let i = 0; i < valueArray.length; i++) {
            valueArray[i] = 0;
        }
        let patternSize = pixelsPerFill + pixelsHorizontalSpacing;
        let numWholePatternsPerRow = Math.trunc(this.dimension[0] / patternSize);
        if (this.traceOn) console.log(' pattern size:' + patternSize + ' num patterns' + numWholePatternsPerRow);
        for (let z = 0; z < this.dimension[2]; z++) {
            let zOffset = z * this.dimension[0] * this.dimension[1];
            for (let y = 0; y < this.dimension[1]; y++) {
                let yOffset = this.dimension[0] * y;
                for (let x = 0; x < this.dimension[0]; x++) {
                    let stripe = x + y + z;
                    let modStripe = stripe % patternSize;
                    let value = onValue;
                    if (modStripe >= pixelsPerFill) {
                        value = offValue;
                    }
                    valueArray[zOffset + yOffset + x] = value;

                }
            }
        }

        this.loadValuesFrom(valueArray);
    }

    makeAllIntensities() {
        const valueArray = new Int16Array(this.dimension[0] * this.dimension[1] * this.dimension[2]);
        let shade = 0;
        for (let i = 0; i < valueArray.length; i++) {
            valueArray[i] = shade;
            shade = (shade + 1) % (64 * 64);
        }
        this.loadValuesFrom(valueArray);
    }
    makeZValues()
    {
        const valueArray = new Int16Array(this.dimension[0] * this.dimension[1] * this.dimension[2]);
        for (let z=0;z < this.dimension[2];z++)
        {
            for (let x = 0;x < this.dimension[0]/4;x++)
            {
                let sx = (x+1)*2;
                let syNeg = Math.trunc(this.dimension[1]/2)-6;
                let syPos = Math.trunc(this.dimension[1]/2)-6;
                this.fillSquare(sx,syNeg,z,-x*100,1,valueArray);
                this.fillSquare(sx,syPos,z,x*100,1,valueArray)
            }
        }

        this.loadValuesFrom(valueArray);
    }
}
