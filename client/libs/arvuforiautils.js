// A function to try to initialize ARVuforia.
// This function is compatible with browsers without the CocoonJS extension.
// - onSuccess: A function that will receive the ARVuforia instance (if the extension exists) or null (if the extension does not exist).
// - onError: A function that will receive the error message explaining what the problem was.
// - params: An object to configure how to initialize Vuforia. Structure:
// {
//      useDevicePixelRatio: boolean, -- Multiply the size of the window by the devicePixelRatio
//      vuforiaMarkerFileName: string, -- The name of the Vuforia marker files (.XML and .DAT)
//      markerDataFileStorageType: string, -- The storage type: INTERNAL_STORAGE, EXTERNAL_STORAGE, APP_STORAGE, ABSOLUTE
//      lookForMarkers: boolean, -- Look for markers. It might not make sense not to activate this but it could be useful to have video feed in the background with no mareker detection.
//      renderCameraInBackground: boolean, -- Render the camera or not. Does not mean the markers won't be detected or not.
//      orientation: string, -- 
//      width: float, --
//      height: float --
// }
function startARVuforia(onSuccess, onError, params) {
    var ARVuforia = window.ext && window.ext.ARVuforia ? window.ext.ARVuforia : null;

    // If there is no extension, why bother downloading marker files etc?
    if (!ARVuforia) {
        console.warn("Trying to start ARVuforia but there is no ARVuforia extension in the system.");
        onSuccess(ARVuforia);
        return;
    }

    if (!params) params = {};
    params.vuforiaMarkerFileName = typeof(params.vuforiaMarkerFileName) === "string" ? params.vuforiaMarkerFileName : "VuforiaMarker";
    params.lookForMarkers = typeof(params.lookForMarkers) === "boolean" ? params.lookForMarkers : true;
    params.renderCameraInBackground = typeof(params.renderCameraInBackground) === "boolean" ? params.renderCameraInBackground : true;

    var vuforiaMarkerXMLFilePath = null;

    // Initialize vuforia
    function initializeARVuforia() {
        // Setup Vuforia listeners
        ARVuforia.addEventListener("initializationSucceeded", function() {
            ext.ARVuforia.makeCall("start");
            onSuccess(ARVuforia);
        });

        ARVuforia.addEventListener("initializationFailed", function() {
            onError("ARVuforia initializationFailed");
        });

        ARVuforia.addEventListener("arMarkersDetected", function(arMarkers) {
            ARVuforia.arMarkers = arMarkers;
        });

        // Initialize Vuforia
        ARVuforia.makeCall("initialize", { 
            licenseKey : typeof(params.licenseKey) === "string" ? params.licenseKey : "",
            markerDataFilePath : vuforiaMarkerXMLFilePath.substring(7, vuforiaMarkerXMLFilePath.length), 
            markerDataFileStorageType : typeof(params.markerDataFileStorageType) === "string" ? params.markerDataFileStorageType : "ABSOLUTE",
            // markerDataFilePath : "VuforiaMarker.xml", 
            // markerDataFileStorageType : "INTERNAL_STORAGE",
            renderCameraInBackground : !!params.renderCameraInBackground, 
            extendedTracking : !!params.extendedTracking,
            width : typeof(params.width) === "number" ? params.width : (window.innerWidth * (params.useDevicePixelRatio ? window.devicePixelRatio : 1)), 
            height : typeof(params.height) === "number" ? params.height : (window.innerHeight * (params.useDevicePixelRatio ? window.devicePixelRatio : 1)),
            lookForMarkers : !!params.lookForMarkers,
            orientation: typeof(params.orientation) === "string" ? params.orientation : "PORTRAIT"
        });
    }

    // A generic function to perform a XHR request for a resource and try to download it using the cocoonSetOutputFile extension.
    function download(url, file, onLoad, onError) {
        var xhr = new XMLHttpRequest();
        xhr._onLoad = onLoad;
        xhr._onError = onError;
        file = xhr.cocoonSetOutputFile && xhr.cocoonSetOutputFile(file, "INTERNAL_STORAGE");

        function readyStateChangeCallback(event) {
            if (xhr.readyState === 4) {
                if (xhr.status >= 200 && xhr.status < 300 || xhr.status === 304) {
                    event.target._onLoad && event.target._onLoad.apply(this, Array.prototype.splice(arguments));
                }
                else {
                    var errorMessage = "Unknown error";
                    switch(xhr.status) {
                        case 404:
                            errorMessage = "File not found";
                            break;
                        case 500:
                            errorMessage = "Server error";
                            break;
                        case 0:
                            errorMessage = "Request aborted";
                            break;
                    }
                    event.target._onError && event.target._onError.call(this, errorMessage);
                }
                xhr.removeEventListener(readyStateChangeCallback);
            }   
        }

        xhr.addEventListener("readystatechange", readyStateChangeCallback);
        xhr.open("GET", url, true);
        xhr.send();
        return file;
    };

    // Function to download the ARVuforia marker.
    function downloadARVuforiaMarker() {
        // NOTE: Let's force to download the vuforia markers for now to test the XHR and download functionalities.
        // No ARVuforia extension, call it a success ;)
        // if (!ARVuforia) {
        //     onSuccess(ARVuforia);
        //     return;
        // }
        // Download the market XML file
        vuforiaMarkerXMLFilePath = download(
            params.vuforiaMarkerFileName + ".xml", 
            params.vuforiaMarkerFileName + ".xml",
            function() {
                if (!(window.ext) || (window.ext && window.ext.IDTK_APP.makeCall("existsPath", params.vuforiaMarkerFileName + ".xml", "INTERNAL_STORAGE"))) 
                {
                    // Download the DAT file.
                    var vuforiaMarkerDATFilePath = download(
                        params.vuforiaMarkerFileName + ".dat", 
                        params.vuforiaMarkerFileName + ".dat",
                        function() {
                            if (!(window.ext) || (window.ext && window.ext.IDTK_APP.makeCall("existsPath", params.vuforiaMarkerFileName + ".dat", "INTERNAL_STORAGE"))) {
                                initializeARVuforia();
                            }
                            else {
                                onError("The '" + vuforiaMarkerDATFilePath + "' does not exist.");
                            }
                        },
                        function() {
                            onError("Error while downloading marker DAT file.");
                        });

                }
                else {
                    onError("The '" + vuforiaMarkerXMLFilePath + "' file does not exist.");
                }
            },
            function() {
                onError("Error while downloading marker XML file.");
            });
    }

    var orientationWatchdogTriggered = false;
    var orientationChangeCallbackWasCalled = false;
    var preferredWindowOrientation = typeof(params.orientation) === "string" ? (params.orientation === "PORTRAIT" ? 0 : 90) : 0;
    var preferredOrientation = preferredOrientation === 0 ? 1 : 4;

    // Initial setup. Wait for the correct orientation or set it up.
    // If the orientation is not the desired one
    if (window.orientation !== preferredWindowOrientation) {

        // If the CocoonJS extensions exist, try to setup the correct orientation.
        if (window.ext && window.ext.IDTK_APP) {
            function orientationchangeCallback() {
                orientationChangeCallbackWasCalled = true;
                if (!orientationWatchdogTriggered) {
                    window.removeEventListener("orientationchange", orientationchangeCallback);
                    downloadARVuforiaMarker();
                    console.log("orientation change callback was called");
                }
            }
            window.addEventListener("orientationchange", orientationchangeCallback);
            window.ext.IDTK_APP.makeCall("setPreferredOrientation", preferredOrientation);
            setTimeout(function() {
                orientationWatchdogTriggered = true;
                if (!orientationChangeCallbackWasCalled) {
                    downloadARVuforiaMarker();
                    console.log("orientation watchdog triggered");
                }
            }, 2000);
        }
        // There is no CocoonJS extensions so assume that the orientation is correct :(
        else {
            downloadARVuforiaMarker();
        }
    }
    // The orientation is correct, so start
    else {
        downloadARVuforiaMarker();
    }
}

function updateARVuforiaForThreeJS(ARVuforia, camera) {

    function captureCamera(camera) {
        camera.ARVuforia.matrixAutoUpdate = camera.matrixAutoUpdate;
        camera.ARVuforia.projectionMatrix.copy(camera.projectionMatrix);
        camera.ARVuforia.matrixWorld.copy(camera.matrixWorld);
    }

    function restoreCapturedCamera(camera) {
        camera.matrixAutoUpdate = camera.ARVuforia.matrixAutoUpdate;
        camera.projectionMatrix.copy(camera.ARVuforia.projectionMatrix);
        camera.matrixWorld.copy(camera.ARVuforia.matrixWorld);
    }

    var cameraWasUpdatedByARVuforiaInAPreviousCall = false;

    // Setup the camera for this update and future updates.
    if (camera) {
        // First time? Create the data structure to hold the information for camera restoration
        if (!camera.ARVuforia) {
            camera.ARVuforia = {
                updated: false,
                projectionMatrix: new THREE.Matrix4(),
                matrixWorld: new THREE.Matrix4()
            };
        }

        // Store what happened in a previous call
        cameraWasUpdatedByARVuforiaInAPreviousCall = camera.ARVuforia.updated;
        // We assume ARVuforia won't update the camera in this call
        camera.ARVuforia.updated = false;
    }

    // Update Vuforia
    if (ARVuforia) {
      ARVuforia.arMarkers = null;
      ARVuforia.makeCall("update");

      if (camera && ARVuforia.arMarkers && ARVuforia.arMarkers.length > 0) {

        // If the camera was not updated in the previous update, capture it's current values.
        if (!cameraWasUpdatedByARVuforiaInAPreviousCall) {
            captureCamera(camera);
        }        

        // We do not want ThreeJS messing around with the matrices, we will take care of them ;)
        camera.matrixAutoUpdate = false;    

        // THE PROJECTION MATRIX FOR THE CAMERA
        var pm = ARVuforia.makeCall("getProjectionMatrix");
        camera.projectionMatrix.set(pm[0], pm[4], pm[8], pm[12], pm[1], pm[5], pm[9], pm[13], pm[2], pm[6], pm[10], pm[14], pm[3], pm[7], pm[11], pm[15]);
        // ARVuforia matrices are row major but ThreeJS understands them as column major.
        // An alternative option by assigning the matrix in order and then transposing it.
        // pm = new THREE.Matrix4(pm[0], pm[1], pm[2], pm[3], pm[4], pm[5], pm[6], pm[7], pm[8], pm[9], pm[10], pm[11], pm[12], pm[13], pm[14], pm[15]);
        // pm.transpose();
        // camera.projectionMatrix.copy(pm);

        // THE MODEL VIEW MATRIX FOR THE CAMERA
        var mvm = ARVuforia.arMarkers[0].modelViewMatrix;
        mvm = new THREE.Matrix4(mvm[0], mvm[4], mvm[8], mvm[12], mvm[1], mvm[5], mvm[9], mvm[13], mvm[2], mvm[6], mvm[10], mvm[14], mvm[3], mvm[7], mvm[11], mvm[15]);
        // ARVuforia matrices are row major but ThreeJS understands them as column major.
        // An alternative option by assigning the matrix in order and then transposing it.
        // mvm = new THREE.Matrix4(mvm[0], mvm[1], mvm[2], mvm[3], mvm[4], mvm[5], mvm[6], mvm[7], mvm[8], mvm[9], mvm[10], mvm[11], mvm[12], mvm[13], mvm[14], mvm[15]);
        // mvm.transpose();
        // The modelview matrix provided by Vuforia is already inverted. The ThreeJS renderer will invert it again, so we need to invert it first so the final used values are the ones Vuforia provided.
        // It is a pitty we cannot use camera.matrixWorldInverse as it is always set by the renderer :(
        camera.matrixWorld.getInverse(mvm);

        camera.ARVuforia.updated = true;
      }
    }

    // If the the camera was not updated by ARVuforia in this call, but it was in a previous call, restore it.
    if (camera && !camera.ARVuforia.updated && cameraWasUpdatedByARVuforiaInAPreviousCall) {
        restoreCapturedCamera(camera);
    }

    // Notify the called that the camera was updated by ARVuforia
    return camera && camera.ARVuforia.updated;
}

function updateARVuforiaForPlayCanvas(ARVuforia, camera) {
    var updated = false;

    function captureCamera(camera) {
        camera.ARVuforia._projMat.copy(camera.camera.camera._projMat);
        camera.ARVuforia.worldTransform.copy(camera.camera.camera.worldTransform);
    }

    function restoreCapturedCamera(camera) {
        camera.camera.camera._projMat.copy(camera.ARVuforia._projMat);
        camera.camera.camera.worldTransform.copy(camera.ARVuforia.worldTransform);
    }

    var cameraWasUpdatedByARVuforiaInAPreviousCall = false;

    // Setup the camera for this update and future updates.
    if (camera) {
        // First time? Create the data structure to hold the information for camera restoration
        if (!camera.ARVuforia) {
            camera.ARVuforia = {
                updated: false,
                _projMat: new pc.Mat4(),
                worldTransform: new pc.Mat4()
            };
        }

        // Store what happened in a previous call
        cameraWasUpdatedByARVuforiaInAPreviousCall = camera.ARVuforia.updated;
        // We assume ARVuforia won't update the camera in this call
        camera.ARVuforia.updated = false;
    }

    // Update Vuforia
    if (ARVuforia) {
        ARVuforia.arMarkers = null;
        ARVuforia.makeCall("update");

        if (ARVuforia.arMarkers && ARVuforia.arMarkers.length > 0) {

            // If the camera was not updated in the previous update, capture it's current values.
            if (!cameraWasUpdatedByARVuforiaInAPreviousCall) {
                captureCamera(camera);
            }        

            // THE PROJECTION MATRIX FOR THE CAMERA
            var arVuforiaProjectionMatrix = ARVuforia.makeCall("getProjectionMatrix");
            camera.camera.camera._projMat.data.set(arVuforiaProjectionMatrix);

            // THE MODEL VIEW MATRIX FOR THE CAMERA
            var arVuforiaMarkerModelViewMatrix = ARVuforia.arMarkers[0].modelViewMatrix;
            camera.camera.camera.worldTransform.data.set(arVuforiaMarkerModelViewMatrix);
            // The modelview matrix provided by Vuforia is already inverted. The Playcanvas renderer will invert it again, so we need to invert it first so the final used values are the ones Vuforia provided.
            camera.camera.camera.worldTransform.invert();

            camera.ARVuforia.updated = true;
        }
    }

    // If the the camera was not updated by ARVuforia in this call, but it was in a previous call, restore it.
    if (camera && !camera.ARVuforia.updated && cameraWasUpdatedByARVuforiaInAPreviousCall) {
        restoreCapturedCamera(camera);
    }

    return camera && camera.ARVuforia.updated;
}

function setupWebGLContextForARVuforia(gl) {
    gl.ARVuforia = gl.ARVuforia || {};
    gl.ARVuforia.old_vertexAttribPointer = gl.ARVuforia.old_vertexAttribPointer || gl.vertexAttribPointer;
    gl.vertexAttribPointer = function(attribute) {
        this.enableVertexAttribArray(attribute);
        this.ARVuforia.old_vertexAttribPointer.apply(this, Array.prototype.slice.apply(arguments));
    };
}

function restoreWebGLContextForARVuforia(gl) {
    if (gl.ARVuforia && gl.ARVuforia.old_vertexAttribPointer) {
        gl.vertexAttribPointer = gl.ARVuforia.old_vertexAttribPointer;
        gl.ARVuforia = undefined;
    }
}



