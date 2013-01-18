// Add listener for Apache Cordova
document.addEventListener("deviceready", onDeviceReady, false);

var compassWatchID = null;
var accelerometerWatchID = null;
var isLandscape = false;

function onDeviceOrientationChange(){
	switch (window.orientation){  
		case 90:
			$("#device-orientation").text("Landscape-left");
			isLandscape = true;
			break; 
		case -90:
			$("#device-orientation").text("Landscape-right");
			isLandscape = true;
			break; 
		case 180:
			$("#device-orientation").text("Portrait-upsidedown");
			isLandscape = false;
			break; 
		default:
			$("#device-orientation").text("Portrait");
			isLandscape = false;
			break; 
	}
}

window.onorientationchange = function(){
	onDeviceOrientationChange();
};

function onDeviceReady() {
	screenTest();
	onDeviceOrientationChange();
	// Get current location
	getLocation();
	// Update the watch every 30th of a second. Trigger a watchHeading
	// callback if the bearing changes by 1 degrees (not valid on Android).
	var compassOptions = { frequency: 300, filter: 1 };
	compassWatchID = navigator.compass.watchHeading(onCompassSuccess, onCompassError, compassOptions);
    
	// Update acceleration every 30th of a second
	var accelerometerOptions = { frequency: 300};
	accelerometerWatchID = navigator.accelerometer.watchAcceleration(onAccelerometerSuccess, onAccelerometerError, accelerometerOptions);
}

//=======================Accelerometer Operations=======================//  
// onSuccess: Get a snapshot of the current acceleration
//
function onAccelerometerSuccess(acceleration) {
    var angle = Math.round(9 * acceleration.x);
    if(isLandscape) {
        angle = Math.round(9 * acceleration.y);
    }
    
    var leftAdjust = Math.round(angle * 7);
    // min left = -70
	// max left = 70
    if(leftAdjust > 70){
        leftAdjust = 70;
    }
    if(leftAdjust < -70){
        leftAdjust = -70;
    }
    
    if(angle < 0) {
        // tilted to the right;
        angle = angle*(-1);
    }
    
	
	$('#level-bubble').animate( { left: leftAdjust }, 300 );
    
	$('#level-degree').html(Math.round(angle) + '&deg;');
	
	$('#level-info').html("Left Adjust: " + leftAdjust + "<br/>" + 
						  "X: " + acceleration.x + "<br/>" +
						  "Y: " + acceleration.y + "<br/>" +
						  "Z: " + acceleration.z
	);
	//spanZ.innerText = acceleration.z;				
	//spanTS.innerText = acceleration.timestamp;
} 

// onError: Failed to get the acceleration
//
function onAccelerometerError() {
	console.log('Unable to start accelerometer!');
}

//=======================Compass Operations=======================//
//
function onCompassSuccess(heading) {
	// Successfully retrieved the compass information. Display it all.
	// True heading and accuracy are not meaningful on iOS and Android devices.
	// Get the magnetic heading
	var mh = heading.magneticHeading; 
	var roundedHeading = Math.round(mh) - 1;
	var headingText = "";
    
	// Rotate the compass needle to magnetic North by subtracting the magnetic heading from 360.
	var ch = 360 - roundedHeading;
	$('#compass-face').css({'-webkit-transform':'rotate(' + ch + 'deg)'});
	// Determine the direction to display.
	if (roundedHeading >= 338 || roundedHeading < 20) {
		headingText = "N";
	}
	else if (roundedHeading >= 20 & roundedHeading < 69) {
		headingText = "NE";
	}
	else if (roundedHeading >= 69 & roundedHeading < 113) {
		headingText = "E";
	}
	else if (roundedHeading >= 113 & roundedHeading < 158) {
		headingText = "SE";
	}
	else if (roundedHeading >= 158 & roundedHeading < 203) {
		headingText = "S";
	}
	else if (roundedHeading >= 203 & roundedHeading < 248) {
		headingText = "SW";
	}
	else if (roundedHeading >= 248 & roundedHeading < 293) {
		headingText = "W";
	}
	else if (roundedHeading >= 293 & roundedHeading < 338) {
		headingText = "NW";
	}
                
	if (roundedHeading == 360) {
		roundedHeading = 0;
	}
    
	$("#current-heading").html(roundedHeading + "&deg; " + headingText);
}

function onCompassError(error) {
	setResults('code: ' + error.code + '<br/>' +
			   'message: ' + error.message + '<br/>');
}

//=======================Geolocation Operations=======================//
function getLocation() {
	navigator.geolocation.getCurrentPosition(onGeolocationSuccess, onGeolocationError);
}

// onGeolocationSuccess Geolocation
function onGeolocationSuccess(position) {
	// Use Google API to get the location data for the current coordinates
	var geocoder = new google.maps.Geocoder();
	var latlng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
	geocoder.geocode({ "latLng": latlng }, function (results, status) {
		if (status == google.maps.GeocoderStatus.OK) {
			if ((results.length > 1) && results[1]) {

				var streetAddy = results[0].address_components[0].long_name + 
								 " " + 
								 results[0].address_components[1].long_name;
                
				var cityAndCountry = results[0].address_components[2].long_name + 
									 ", " + 
									 results[0].address_components[4].short_name +
									 " " + 
									 results[0].address_components[6].long_name;
                
				$("#compass-current-address-street").html(streetAddy);
				$("#compass-current-address-city").html(cityAndCountry);
				$("#map-current-address").html(results[0].formatted_address);
			}
		}
	});

	// Use Google API to get a map of the current location
	// http://maps.googleapis.com/maps/api/staticmap?size=280x300&maptype=hybrid&zoom=16&markers=size:mid%7Ccolor:red%7C42.375022,-71.273729&sensor=true
	var mapSize = "size=320x320&zoom=16";
	if (viewport.width > 600) {
		mapSize = "size=600x600&zoom=16";
	}
    
	var mapUrl = 'http://maps.googleapis.com/maps/api/staticmap?' + mapSize + '&sensor=true&markers=size:mid%7Ccolor:red%7C' + latlng;
	$('#map-container').css({ 'background-image': 'url(\'' + mapUrl + '\')'});
}

// onGeolocationError Callback receives a PositionError object
function onGeolocationError(error) {
	$("#myLocation").html("<span class='err'>" + error.message + "</span>");
}

var viewport;

function screenTest() {
	viewport = {
		width  : $(window).width(),
		height : $(window).height()
	};
	$("#screen-height").text(viewport.height);
	$("#screen-width").text(viewport.width);
}