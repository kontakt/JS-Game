//// PHYSICS ////

//// Constants ////
// Gravitational Constant
var G = 6.674e-11;

//// Control variables ////
// Physics method
var physMode = "euler";
// Number of points in physics trace
var traceLength = 1000;
// Distance between trace points squared
var traceInterval = 1000;
// Speed of physics simulation (seconds per second)
var multiplier = 1;
var multiSave = multiplier;
var pause = false;

// Init physics
function physInit(){
	
	// Physics reserved clock
	physClock = new THREE.Clock();
	physClock.start();
	
	// Array of all physics objects
	physArray = [];
	if (DEBUG) console.debug("Phys Init");
}

// Add and object to the array and initialize all extra vectors
function physAdd(object){
	
	// Add necessary vectors (x, y ,z)
	object.velocity 	= new THREE.Vector3(0, 0, 0);
	object.acceleration = new THREE.Vector3(0, 0, 0);
	object.gravity		= new THREE.Vector3(0, 0, 0);
	object.spin 		= new THREE.Vector3(0, 0, 0);
	object.mass			= 0;
	
	// Points in trace
	object.tracePT		= new THREE.Geometry();
	
	for (i=0; i<traceLength; i++){
    	object.tracePT.vertices.push(object.position.clone());
    }    
    
    // Line for trace
    object.traceLine 	= new THREE.Line(object.tracePT, material3);
    object.traceLine.geometry.dynamic = true;  
    scene.add(object.traceLine);
	
	// Add to the array
	physArray.push(object);
}

// Steps all physics objects
function physUpdate(){
	
	// Get time since last update
	var delta = (physClock.getDelta())*multiplier;
	
	// Update acceleration
	physAcceleration();
	
	// Update positions
	if(physMode == "verlet"){
		for (i = 0; i < physArray.length; i++){
			physPositionVerlet(physArray[i], delta);
			drawLine(physArray[i]);	
		}
	}
	else if(physMode == "RK4"){
		for (i = 0; i < physArray.length; i++){
			physPositionRK4(physArray[i], delta);
			drawLine(physArray[i]);	
		}
	}
	else {
		for (i = 0; i < physArray.length; i++){
			physPositionEuler(physArray[i], delta);
			drawLine(physArray[i]);	
		}
	}
	// Update physics FPS
	physStats.update();
}

function physAcceleration(){
	// Update all physics objects
	for (i = 0; i < physArray.length; i++){
		for (j = 0; j < physArray.length; j++){
			if (i != j){
				 physGravity(physArray[i], physArray[j]);
			}	
		}	
	}
}

function physPause(){
		if(pause){
			multiplier = multiSave;
			multiSave = 0;
			pause = false;
		}
		else{
			multiSave = multiplier;
			multiplier = 0;
			pause = true;
		}
}

//// KINEMATICS ////
// Euler method
function physPositionEuler(object, delta){	
	// Update Velocity (acceleration)
	object.velocity.x += object.acceleration.x * delta;
	object.velocity.y += object.acceleration.y * delta;
	object.velocity.z += object.acceleration.z * delta;
	
	// Update Velocity (gravity)
	object.velocity.x += object.gravity.x * delta;
	object.velocity.y += object.gravity.y * delta;
	object.velocity.z += object.gravity.z * delta;
	
	// Update Position
	object.position.x += object.velocity.x * delta;
	object.position.y += object.velocity.y * delta;
	object.position.z += object.velocity.z * delta;
	
	// Update Rotation
	object.rotation.x += object.spin.x * delta; 
	object.rotation.y += object.spin.y * delta; 
	object.rotation.z += object.spin.z * delta; 
}

// Verlet Method
function physPositionVerlet(object, delta){
	//todo
	throw "Verlet physics not implemented yet!";
}

// Runge-Kutta Method
function physPositionRK4(object, delta){
	//todo
	throw "Runge-Kutta physics not implemented yet!";
}

// Calculates the gravitational pull between two objects 
function physGravity(a, b){
	var grav = new THREE.Vector3(0, 0, 0);
	grav = grav.subVectors(a.position, b.position);
	var r = grav.lengthSq();
	var A = (G)*(b.mass)/(r);
	grav = grav.normalize();
	grav.multiplyScalar(-A);
	a.gravity = grav;
}

//// LINES ////
function drawLine(object){
	var tmp = new THREE.Vector3;
	tmp.subVectors(object.position, object.traceLine.geometry.vertices[traceLength-2]);
	if(tmp.lengthSq() > traceInterval){
		// Delete first element
		object.traceLine.geometry.vertices.push(object.traceLine.geometry.vertices.shift());
    	// Append to line
    	object.traceLine.geometry.vertices[traceLength-1].copy(object.position); 
    	object.traceLine.geometry.verticesNeedUpdate = true;
    }
    else {
    	object.traceLine.geometry.vertices[traceLength-1].copy(object.position);
    	object.traceLine.geometry.verticesNeedUpdate = true;
    }
    	
}

//// Utilities ////

// Dynamically resizes the window based on current dimensions
function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
	renderer.setSize( window.innerWidth, window.innerHeight );
    if (DEBUG) console.debug("Window resized");
}
	
// Initializes stats
function statsInit(){
	stats = new Stats();
	stats.setMode(0); // 0: fps, 1: ms
	
	physStats = new Stats();
	physStats.setMode(0); // 0: fps, 1: ms
	
	// Framerate for draw
	stats.domElement.style.position = 'absolute';
	stats.domElement.style.left = '0px';
	stats.domElement.style.top = '0px';
	
	// Framerate for Physics
	physStats.domElement.style.position = 'absolute';
	physStats.domElement.style.left = '0px';
	physStats.domElement.style.top = '50px';

	document.body.appendChild( stats.domElement );
	document.body.appendChild( physStats.domElement );
	if (DEBUG) console.debug("Stats Init");
}

// Window Visibility
var vis = (function(){
    var stateKey, eventKey, keys = {
        hidden: "visibilitychange",
        webkitHidden: "webkitvisibilitychange",
        mozHidden: "mozvisibilitychange",
        msHidden: "msvisibilitychange"
    };
    for (stateKey in keys) {
        if (stateKey in document) {
            eventKey = keys[stateKey];
            break;
        }
    }
    return function(c) {
        if (c) document.addEventListener(eventKey, c);
        return !document[stateKey];
    }
})();

function focusChange(){
	if(vis()){
		document.title = 'Version '+version;
		physPause();
	}
	else{
		document.title = 'Version '+version+' - PAUSE';
		physPause();
	}

}
