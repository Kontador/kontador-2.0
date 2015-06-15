//---------------------------------------------------------------------------------------------------------

// initialize ol

var view = new ol.View({
	center: ol.proj.transform([73.39646100997925, 61.253983635981406], 'EPSG:4326', 'EPSG:3857'),
	zoom: 16
});

var map = new ol.Map({
	layers: [
		new ol.layer.Tile({
			source: new ol.source.XYZ({
				url: 'http://tiles.{a-z}.st.vmp.ru/{z}/{x}/{y}.png',
				tilePixelRatio: 1,
				minZoom: 12,
				maxZoom: 18
			}),
		})
	],
	target: 'map',
	view: view,
	interactions: ol.interaction.defaults({
			keyboard: false,
			dragAndDrop: false,
			dragRotate: false,
			dragPan: false,
			altShiftDragRotate: false,
			pinchRotate: false,
			pinchZoom: true
	})
});

//---------------------------------------------------------------------------------------------------------

// marker

var markerEl = document.getElementById('location-marker');
var marker = new ol.Overlay({
	positioning: 'center-center',
	element: markerEl,
	stopEvent: false
});
map.addOverlay(marker);

var positions = new ol.geom.LineString([],
		/** @type {ol.geom.GeometryLayout} */ ('XYZM'));

// activate fuck
var geolocation = new ol.Geolocation(/** @type {olx.GeolocationOptions} */ ({
	projection: view.getProjection(),
	trackingOptions: {
		maximumAge: 10000,
		enableHighAccuracy: true,
		timeout: 600000
	}
}));

var speed = '';
var position = '';

var deltaMean = 500;

// listener
geolocation.on('change', function(evt) {
	var position = geolocation.getPosition();
	var accuracy = geolocation.getAccuracy();
	var heading  = geolocation.getHeading() || 0;
	var speed    = geolocation.getSpeed() || 0; // global
	var coords = positions.getCoordinates();

	console.log('Уважаемый пользователь! Уведомляем о том, что на данный момент произошло изменение позиции! Спасибо за понимание!' + position);

	// -----  Speed.
	speedometer(speed);

	var m = Date.now();
	addPosition(position, heading, m, speed);

	
	var len = coords.length;
	if (len >= 2) {
		deltaMean = (coords[len - 1][3] - coords[0][3]) / (len - 1);
	}
});

geolocation.on('error', function() {
	console.log('geolocation error');
});

function speedometer(speed){
	var speedHTML = (speed * 3.6).toFixed(1);
	if(speedHTML >= 10){
		speedHTML = speedHTML.toString().substr(0, speedHTML.length - 2);
	}
	var speedHTML = speedHTML.toString().replace(".", ",");
	console.log(speedHTML);
	$('#speed').html(speedHTML);
}

function radToDeg(rad) {
	return rad * 360 / (Math.PI * 2);
}
function degToRad(deg) {
	return deg * Math.PI * 2 / 360;
}
// invert negative
function mod(n) {
	return ((n % (2 * Math.PI)) + (2 * Math.PI)) % (2 * Math.PI);
}

function addPosition(position, heading, m, speed) {
	var x = position[0];
	var y = position[1];
	var fCoords = positions.getCoordinates();
	var previous = fCoords[fCoords.length - 1];
	var prevHeading = previous && previous[2];
	if (prevHeading) {
		var headingDiff = heading - mod(prevHeading);


		if (Math.abs(headingDiff) > Math.PI) {      // < 180 ok da
			var sign = (headingDiff >= 0) ? 1 : -1;
			headingDiff = - sign * (2 * Math.PI - Math.abs(headingDiff));
		}
		heading = prevHeading + headingDiff;
	}
	positions.appendCoordinate([x, y, heading, m]);

	positions.setCoordinates(positions.getCoordinates().slice(-20));

	if (heading && speed) {
		markerEl.src = 'img/location.png';
	} else {
		markerEl.src = 'img/location-static.png';
	}
}

var previousM = 0;

// set center
map.beforeRender(function(map, frameState) {
	if (frameState !== null) {
		var m = frameState.time - deltaMean * 1.5;      // get out smoother than ever!
		m = Math.max(m, previousM);
		previousM = m;
		var c = positions.getCoordinateAtM(m, true);    // stackoverflow magic!
		var view = frameState.viewState;
		if (c) {
			view.center = getCenterWithHeading(c, -c[2], view.resolution);
			view.rotation = -c[2];
			marker.setPosition(c);
		}
	}
	return true;
});

function getCenterWithHeading(position, rotation, resolution) {
	var size = map.getSize();
	var height = size[1];

	return [
		position[0] - Math.sin(rotation) * height * resolution * 1 / 4,
		position[1] + Math.cos(rotation) * height * resolution * 1 / 4
	];
}

// callback
function render() {
	map.render();
}

// TADA
function geolocate() {
	map.on('postcompose', render);
	map.render();
	geolocation.setTracking(true); // Start position tracking
}
geolocate();

//---------------------------------------------------------------------------------------------------------

// timer

var hours = 0, mins = 0, secs = 0;
function resetTimer(){
	secs = 0, mins = 0, hours = 0;
}

startTimer = function(){
	tick = setInterval(function(){
		secs += 1;

		if(secs < 10){
			hsecs = ':0' + secs;
		}

		else if(secs == 60){
			mins += 1;
			secs = 0;
			hsecs = ':0' + secs;
		}

		else
			hsecs = ':' + secs;

		if(mins < 10)
			hmins = '0' + mins;

		else if(mins == 60){
			hours += 1;
			mins = 0;
			hmins = '0' + mins;
		}

		else
			hmins = mins

		if(hours == 0)
			hhours = '';

		else {
			hhours = hours + ':';
			hsecs = "<sup>" + hsecs + "</sup>";

		}
		$("#timer").html(hhours + hmins + hsecs);

	}, 1000);

		$('h1, h4, h2').removeClass('sick');
		$('#stopTimer').show();
		$('#startTimer').hide();
}

var stopTimer = function(){

	$('h1, h4, h2').addClass('sick');
	$('#stopTimer').hide();
	$('#startTimer').show();
	clearInterval(tick);
}

$("#stopTimer").click(stopTimer);
$("#startTimer").click(startTimer);

//---------------------------------------------------------------------------------------------------------

// parse json and show ALL routes
function showRoutes(data){
	for(var i=0; i < data.routes.length; i++){
		var item = data.routes[i][i+1][0];

		var kind = {
			'dist': {
				css: "dist",
				header: "На дистанцию"
			},
			'time': {
				css: "time",
				header: "На время"
			}
		}
		item.length = item.length.toString().slice(0, -1);
		item.length = item.length.replace(".", ",");
		$("#routes").append("\
			<div class=\"item "+ kind[item.kind].css +"\">\
				<h4>"+ kind[item.kind].header +"</h4>\
				<h3 id=\"item1\">"+ item.name +"</h3>\
				<h1>" + item.length +" км</h1>\
			<button><a onclick=\"start('dist')\">Начать</a></button>\
			");
		console.log(i+1 + " route done");
	}
}

// parse json and show one of the routes on the map.
function getRoutes(data, id){
	if(!id) id = 0; // route number.
	var item = data.routes[id][id+1][0];

	// parsing one route
	var routesArr = new Array();
	for(var e=0; e < item.latlngs.length; e++){
		if(e == 0){
			var firstCoordinate = [item.latlngs[e].lat, item.latlngs[e].lng];
			distanceBeetween(firstCoordinate);
		}
		
		routesArr.push(item.latlngs[e]);
	}
	var rend = {}
	rend.latlngs = routesArr;
	addRoutes(rend);
}
$.getJSON( "json/routes.json", function( data ) {
	showRoutes(data);
	setTimeout(getRoutes(data), 1000);
});

function distanceBeetween(first) {
	if(!first) var first = [73.434314, 61.248798]; // начало
	try {
		var geo = geolocation.getPosition()[0];
	} catch(e){
		console.log("Мудрые говорят, что дистанция 'undefined' из-за того, что геолокация отключена...");
		console.log("Пожалуйста, включите геолокацию.");
	}
	var second = ol.proj.transform([geolocation.getPosition()[0], geolocation.getPosition()[1]], 'EPSG:3857', 'EPSG:4326');
	
	var sphereA = new ol.Sphere(6378137);
	var distance = sphereA.haversineDistance(second,first);
	var normalDis = (Math.round(distance * 1)/1) + 500;
	console.log(normalDis);
	distanceLeft(normalDis);
}

// TO HTML
function distanceLeft(distance){
	$("#left").html(normalDis);
}

var countLineRoutes = 0;
var vectorLayerLineFirst = new ol.layer.Vector({});

function addRoutes(coord) {
	if (countLineRoutes == 0) {
		var comp = new Array();

		for (var i = 0; i < coord.latlngs.length; i++) {
			var xandy = ol.proj.transform([coord.latlngs[i].lng, coord.latlngs[i].lat], 'EPSG:4326', 'EPSG:3857');
			comp.push(xandy);
		}

		var firstroutesF = new ol.Feature({
			geometry: new ol.geom.LineString(comp)
		});

		var vectorLineFirst = new ol.source.Vector({});
		vectorLineFirst.addFeature(firstroutesF);

		vectorLayerLineFirst = new ol.layer.Vector({
			source: vectorLineFirst
		});

		map.addLayer(vectorLayerLineFirst);
		countLineRoutes++;
	}
}
function delRoutes() {
	map.removeLayer(vectorLayerLineFirst);
	countLineRoutes = 0;
}

setTimeout(function(){
	frameNumb = 0;
	$(function () {
		$('.fotorama').on('fotorama:showend ',function (e, fotorama) {
			var frameNumb = fotorama.activeIndex;
			console.log(frameNumb);
			if(frameNumb != 0){
				$.getJSON('json/routes.json', function(data){
					delRoutes();
					getRoutes(data, frameNumb);
				});
			}
		}).fotorama();
	});
}, 800);

function heat() {
	$('.start').hide();
	$('.route').hide();
	$('.finish').hide();
	$('.list').show();
	$('#kntdr').attr('class', 'short');
};

$('.notice button').click(function() {
	$('.notice').fadeOut(200);
	$('#blur').removeClass('notice-shown');
});

function start(routeKind) {
	$('.list').hide();
	$('.start').show();
	window.routeKind = routeKind;
	$('.start').addClass(routeKind);
};

function route() {
	$('.start').hide();
	$('.route').show();
	$('.route').addClass(routeKind);
	$('#kntdr').attr('class', 'long');
	startTimer();
};

function finish() {
	$('.route').hide();
	$('.finish').show();
	$('.finish').addClass(routeKind);
};

function stop() {
	$('.finish').hide;
	$('.route').hide;
	$('.start').hide;
	heat();

};
heat();

$('.start').click(route);