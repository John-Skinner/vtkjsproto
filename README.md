# vtkjsproto
To demonstrate capture of rendering without hidden canvas, set
```
tryToHide=false; // in main.js
```
and update `dist/index.html` so that `renderDiv` does **not** include `hidden` attribute.
To demonstrate capture of rendering with hidden canvas, set
```
tryToHide=true; // in main.js
```
and update `dist/index.html` so that `renderDiv` does  include `hidden` attribute.
