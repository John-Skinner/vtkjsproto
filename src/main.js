
// must include this Profiles/Volume or no rendering will occur.
import '@kitware/vtk.js/Rendering/Profiles/All'
import {GeneralVolume} from "./GeneralVolume";
import '@kitware/vtk.js/Rendering/Profiles/Volume'

import {ShortVolume} from "./ShortVolume";
import {mat3, mat4, vec3} from "gl-matrix";
import vtkRenderer from "@kitware/vtk.js/Rendering/Core/Renderer";
import vtkRenderWindow from "@kitware/vtk.js/Rendering/Core/RenderWindow";
import vtkOpenGLRenderWindow from "@kitware/vtk.js/Rendering/OpenGL/RenderWindow";
import vtkImageMapper from "@kitware/vtk.js/Rendering/Core/ImageMapper";
import vtkImageSlice from "@kitware/vtk.js/Rendering/Core/ImageSlice";


window.addEventListener('load',(event)=>
{
    if (window.started)
    {
        console.log('onload again');
        return;
    }
    let captureButton = document.getElementById('renderid');
    captureButton.addEventListener('click',(e)=>
    {
        console.log(" button clicked");
        let capturePromises = window.rw.captureImages();
        if (capturePromises.length > 0)
        {
            capturePromises[0].then((imageURL)=>
            {
                console.log(" url:" + imageURL);
                let img = new Image();
                img.src = imageURL;
                img.addEventListener('load',(e)=>
                {
                    console.log(' image loaded');
                    console.log('size:' + img.width + 'x' + img.height);
                })

            })
        }

    })
    window.started=true;
    console.log(' start');
    let fgSlices = 32;
    let container = document.getElementById('renderDiv');

    let dirMatrix = mat3.create();
    mat3.identity(dirMatrix);




    let initialValues = {
        background:[0.2,0.2,0.1]

    }
    let tryToHide = true;

    if (tryToHide)
    {
        window.rw = vtkRenderWindow.newInstance({useOffscreen:true});
        window.oglrw = vtkOpenGLRenderWindow.newInstance();
    }
    else
    {
        window.rw = vtkRenderWindow.newInstance();
        window.oglrw = vtkOpenGLRenderWindow.newInstance({useOffScreen:true});
    }


    window.oglrw.setContainer(container);
    window.oglrw.setSize(container.clientWidth,container.clientHeight);
    window.rw.addView(window.oglrw);


    let backgroundResolution = [128,128,32];
    let backgroundValues =
        {
            origin: [0, 0, 0],
            spacing: [1.0, 1.0, 1.0 ],
            extent: [0, backgroundResolution[0] - 1, 0, backgroundResolution[1] - 1, 0, backgroundResolution[2] - 1]
        }

    let bgShorts = new ShortVolume(backgroundResolution,backgroundValues,dirMatrix);
    bgShorts.makeTestCheckerVolume(8);
    let bgGeneral = new GeneralVolume();
    bgGeneral.setImageData(bgShorts.getVtkJSVolume());

    let renderer = vtkRenderer.newInstance();
    renderer.setBackground([0.1,0.1,0.2]);
    renderer.setViewport(0,0,1,1);
    window.rw.addRenderer(renderer);


    let imageActor=vtkImageSlice.newInstance();

    let imageMapper=vtkImageMapper.newInstance();
    imageMapper.setInputData(bgGeneral.imageData);
    imageMapper.setKSlice(12);

    imageActor.setMapper(imageMapper);
    imageActor.getProperty().setOpacity(1);

    renderer.addActor(imageActor);

    let cam=renderer.getActiveCamera();
    cam.setPosition(63.5,63.5,-20);
    cam.setFocalPoint(63.5,63.5,12);
    cam.setViewUp(0,-1,0);
    cam.setParallelProjection(true);
    cam.setParallelScale(64);
    cam.setClippingRange([0.01, 1000000])
    cam.modified();
    let pllScale= cam.getParallelScale();
    console.log('parallel scale:' + pllScale);
    let camPos=cam.getPosition();
    console.log(' camera pos:' + camPos);
    let camFocus = cam.getFocalPoint();
    console.log(' camera focal point:' + camFocus);
    let camVup=cam.getViewUp();
    console.log(' view up:' + camVup);


    imageActor.getProperty().setColorLevel(1000);
    imageActor.getProperty().setColorWindow(2000);
    renderer.getRenderWindow().render();
   window.rw.render();
    window.oglrw.render();

    console.log(" one time render done");
})

