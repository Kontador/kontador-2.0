window.onload = function () {
    // creating the view
    var view = new ol.View({
    	center: ol.proj.transform([73.241, 61.143], 'EPSG:4326', 'EPSG:3857'),
    	zoom: 16
    });

    // creating the map
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
          DragAndDrop: false,
          altShiftDragRotate:false,
          pinchRotate:true
      })
    });


    // Geolocation marker
    var markerEl = document.getElementById('location-marker');
    var marker = new ol.Overlay({
      positioning: 'center-center',
      element: markerEl,
      stopEvent: false
    });
    map.addOverlay(marker);

    // LineString to store the different geolocation positions. This LineString
    // is time aware.
    // The Z dimension is actually used to store the rotation (heading).
    var positions = new ol.geom.LineString([],
        /** @type {ol.geom.GeometryLayout} */ ('XYZM'));

    // Geolocation Control
    var geolocation = new ol.Geolocation(/** @type {olx.GeolocationOptions} */ ({
      projection: view.getProjection(),
      trackingOptions: {
        maximumAge: 10000,
        enableHighAccuracy: true,
        timeout: 600000
      }
    }));

    var deltaMean = 500; // the geolocation sampling period mean in ms

    // Listen to position changes
    geolocation.on('change', function(evt) {
      var position = geolocation.getPosition();
      var accuracy = geolocation.getAccuracy();
      var heading = geolocation.getHeading() || 0;
      var speed = geolocation.getSpeed() || 0;
      var m = Date.now();

      addPosition(position, heading, m, speed);

      var coords = positions.getCoordinates();
      var len = coords.length;
      if (len >= 2) {
        deltaMean = (coords[len - 1][3] - coords[0][3]) / (len - 1);
      }

    });

    geolocation.on('error', function() {
      alert('geolocation error');
      // FIXME we should remove the coordinates in positions
    });

    // convert radians to degrees
    function radToDeg(rad) {
      return rad * 360 / (Math.PI * 2);
    }
    // convert degrees to radians
    function degToRad(deg) {
      return deg * Math.PI * 2 / 360;
    }
    // modulo for negative values
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

        // force the rotation change to be less than 180°
        if (Math.abs(headingDiff) > Math.PI) {
          var sign = (headingDiff >= 0) ? 1 : -1;
          headingDiff = - sign * (2 * Math.PI - Math.abs(headingDiff));
        }
        heading = prevHeading + headingDiff;
      }
      positions.appendCoordinate([x, y, heading, m]);

      // only keep the 20 last coordinates
      positions.setCoordinates(positions.getCoordinates().slice(-20));

      if (heading && speed) {
        markerEl.src = 'img/location.png';
      } else {
        markerEl.src = 'img/location-static.png';
      }
    }

    var previousM = 0;
    // change center and rotation before render
    map.beforeRender(function(map, frameState) {
      if (frameState !== null) {
        // use sampling period to get a smooth transition
        var m = frameState.time - deltaMean * 1.5;
        m = Math.max(m, previousM);
        previousM = m;
        // interpolate position along positions LineString
        var c = positions.getCoordinateAtM(m, true);
        var view = frameState.viewState;
        if (c) {
          view.center = getCenterWithHeading(c, -c[2], view.resolution);
          view.rotation = -c[2];
          marker.setPosition(c);
        }
      }
      return true; // Force animation to continue
    });

    // recenters the view by putting the given coordinates at 3/4 from the top or
    // the screen
    function getCenterWithHeading(position, rotation, resolution) {
      var size = map.getSize();
      var height = size[1];

      return [
        position[0] - Math.sin(rotation) * height * resolution * 1 / 4,
        position[1] + Math.cos(rotation) * height * resolution * 1 / 4
      ];
    }

    // postcompose callback
    function render() {
      map.render();
    }

    // geolocate device
    function geolocate() {
      geolocation.setTracking(true); // Start position tracking

      map.on('postcompose', render);
      map.render();

    }

    geolocate();


    //---------------------------------------------------------------------------------------------------------

    //---- kontador timer

    var hours = 0, mins = 0, secs = 0;
    function resetTimer(){
    	secs = 0, mins = 0, hours = 0;
    }
    function startTimer(){
    	tick = setInterval(function(){
    		secs += 1;
    		if(secs < 10){
    			hsecs = ':0' + secs;
    		} else if(secs == 60){
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
    }
    function stopTimer(){
    	clearInterval(tick);
    }
    startTimer();
}

// ----- Get Routes

$.getJSON( "json/routes.json", function( data ) {
  for(var i=0; i < data.routes.length; i++){
    var item = data.routes[i][i+1][0];
    $("#item"+i).html(item.name);
    console.log(item.latlngs);
    var points = new Array(
      new ol.geom.Point(61.254417055826664, 73.39525938034058),
      new ol.geom.Point(61.2550981320786, 61.2550981320786)
    );
    var line = new ol.geom.LineString(points);
  }
});