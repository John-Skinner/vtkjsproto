import vtkXMLImageDataReader from "@kitware/vtk.js/IO/XML/XMLImageDataReader";
import {mat3} from "gl-matrix";



export class GeneralVolume {

    constructor() {
        this.seriesUid = '';
        this.studyDir = '';
        this.imageData = null;
        this.seriesAnnotations = [];
    }

    setImageData(v) {
        this.imageData = v;
    }
    setImageDataAndGeometry(v,geometry)
    {
        this.imageData = v;
        this.imageData.setDirection(geometry.directionMatrix);
        this.imageData.setOrigin(geometry.position);
        this.imageData.setSpacing(geometry.scale);
        let dims=v.getDimensions();
        this.imageData.setExtent(0,dims[0]-1,0,dims[1]-1,0,dims[2]-1);
    }

    setStudyDir(dir) {
        this.studyDir = dir;
    }

    getDimensions() {
        return this.imageData.getDimensions();
    }


    load(seriesUid) {
        this.seriesUid = seriesUid;
        // fetch the geometry json then parse
        // parse the geometry json then fetch vtkimagedata
        // fetch the vtkimagedata then load the image object
        if (this.studyDir === null) {
            return Promise.reject(new Error(' No studyDir set in Volume'));
        }
        return new Promise((res, rej) => {

            this.fetchVolumeParams()
                .then(GeneralVolume.fetchGeometry)
                .then(sres => {
                    console.log(" this:", this);
                    this.holdLoadingGeometry(sres)
                })
                .then(sres => this.fetchvtkVolume(sres))
                .then(sres => GeneralVolume.parseVtkResponseBuffer(sres))
                .then(sres => this.parseVtkImage(sres))
                .then(sres => this.processJsonParse(sres))
                .then(sres => {
                    res("geometry parse completed");

                })
                .catch(rej);
            // first retrieve the json geometry object for the series
        });
    }

    holdLoadingGeometry(res) {
     this.loadingGeometry = res;
    }



    static fetchGeometry(res) {
        return res.json();
    }

    fetchvtkVolume(res) {

        const fullPath = this.studyDir + '/' + this.seriesUid + '_image.vti';
        return fetch(fullPath);
    }

    static parseVtkResponseBuffer(res, rej) {
        if (res.ok) {
            return res.arrayBuffer()
        } else {
            rej(res);
        }
    }

    parseVtkImage(res, resj) {
        const xmlReader = vtkXMLImageDataReader.newInstance();
        xmlReader.parseAsArrayBuffer(res);
        console.log(" setting image data from parsevtkImage");
        this.imageData = xmlReader.getOutputData();

    }

    getImageDataPixels() {
        const id = this.imageData;
        const pd = id.getPointData();
        const pix = pd.getScalars();
        let data = pix.getData();
        return data;
    }

    modified() {
        let id = this.imageData;
        let pd = id.getPointData();
        pd.modified();
    }

    copyKSliceFromArray(shortArray, K, sourceArraySliceOffset) {
        let volumeDims = this.imageData.getDimensions();
        if ((K < 0) || (K >= volumeDims[2])) {
            console.error('Internal Error, incorrect K value for copySlice');
        } else {


            let allPixels = this.getImageDataPixels();
            let sliceSize = volumeDims[0] * volumeDims[1];
            let sliceOffset = sliceSize * K;
            for (let i = 0; i < sliceSize; i++) {
                allPixels[sliceOffset + i] = shortArray[sourceArraySliceOffset + i];
            }
        }
        this.imageData.modified();
    }

    copyKSliceFromVolume(sourceVolume, K) {
        let sourceDims = sourceVolume.getDimensions();
        let pixels = sourceVolume.getPixels();
        let pixelOffset = sourceDims[0] * sourceDims[1] * K;
        this.copyKSliceFromArray(pixels, K, pixelOffset);
    }


    fetchVolumeParams() {
        let loc = this.studyDir + '/' + this.seriesUid + '_geometry.json';

        return fetch(loc);
    }

    processImageFetch(res) {
        res.arrayBuffer().then(this.processJsonParse)
    }

    processJsonParse(buffer) {

        this.imageData.setSpacing(this.loadingGeometry.scale);


        // special note about glMatrix,  the print of this matrix will look transposed to the row/column
        // suggested below.  But this is just how it is stored in physical memory.  The behavior when multiplied
        // is as suggested in the assignment below.
        const dirVectors = mat3.fromValues(
            this.loadingGeometry.directionMatrix[0], this.loadingGeometry.directionMatrix[1], this.loadingGeometry.directionMatrix[2],
            this.loadingGeometry.directionMatrix[3], this.loadingGeometry.directionMatrix[4], this.loadingGeometry.directionMatrix[5],
            this.loadingGeometry.directionMatrix[6], this.loadingGeometry.directionMatrix[7], this.loadingGeometry.directionMatrix[8]);
        this.imageData.setDirection(dirVectors);
        this.imageData.setOrigin(this.loadingGeometry.position);



    }

    getOrigin() {
        return this.imageData.getOrigin();
    }

    getDirectionMatrix() {
        return this.imageData.getDirection();
    }

    getSpacing() {
        return this.imageData.getSpacing();
    }

    getIJKToLPSTransform() {
        return this.imageData.getIndexToWorld();
    }

    get SeriesAnnotations() {
        return this.seriesAnnotations;
    }
    dumpAnnotations(title)
    {
        console.log(' dump volume:' + title);
        for (let se of this.seriesAnnotations)
        {
            console.log('set new annotation:' + se.Text);
        }
    }

    set SeriesAnnotations(annotations) {
        this.seriesAnnotations = annotations;

    }

}
