document.addEventListener("deviceready", onDeviceReady, false);
function onDeviceReady(){}

$(document).ready(function(){

    //---------------------------------------------------------------------------------------------------------

    // initialize ol

    var view = new ol.View({
    	center: ol.proj.transform([73.241, 61.143], 'EPSG:4326', 'EPSG:3857'),
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
          DragAndDrop: false,
          altShiftDragRotate:false,
          pinchRotate:true
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

    var deltaMean = 500;

    // listener
    geolocation.on('change', function(evt) {
      var position = geolocation.getPosition();
      var accuracy = geolocation.getAccuracy();
      var heading  = geolocation.getHeading() || 0;
      var speed    = geolocation.getSpeed() || 0; // GLOBAL VARIABLE



      // -----  Speed.
      speedometr = setInterval(function(){
          var speed = geolocation.getSpeed() || 0; // GLOBAL VARIABLE
          $("#speed").html(speed);
          console.log("Speed: "+ speed);
      }, 2000);


      if(speed > 2) {
            geolocation.setTracking(true); // Start position tracking
      } else {
          geolocation.setTracking(false);
      }

      var m = Date.now();

      console.log(speed);
      addPosition(position, heading, m, speed);

      var coords = positions.getCoordinates();
      var len = coords.length;
      if (len >= 2) {
        deltaMean = (coords[len - 1][3] - coords[0][3]) / (len - 1);
      }

    });

    geolocation.on('error', function() {
      alert('geolocation error');
    });

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
      geolocation.setTracking(true); // Start position tracking
      map.on('postcompose', render);
      map.render();
    }

    geolocate();

    //---------------------------------------------------------------------------------------------------------

    // timer

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

    //---------------------------------------------------------------------------------------------------------

    // parse json and get routes

    $.getJSON( "json/routes.json", function( data ) {
      // for loop. parsing all routes.
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
          <div class=\"item dist\">\
            <h4>"+ kind[item.kind].header +"</h4>\
            <h3 id=\"item1\">"+ item.name +"</h3>\
            <h1>" + item.length +" км</h1>\
          <button><a onclick=\"start('dist')\">Начать</a></button>\
          ");

        console.log(i+1 + " route serializing");
        // parsing
        var routesArr = new Array();
        for(var e=0; e < item.latlngs.length; e++){
          routesArr.push(item.latlngs[e]);
        }
        var rend = {}
        rend.latlngs = routesArr;
        addRoutes(rend);

        // $("#routes").append("\
        //   <div class=\"item time\">\
        //     <h4>На время</h4>\
        //     <h3>Кедровый лог</h3>\
        //     <h1>17 мин</h1>\
        //     <button><a onclick=\"start('time')\">Начать</a></button>\
        //   </div>");
      }
    });

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
        console.log(comp);
      }
    }

});

setTimeout(function(){
  frameNumb = 0;
  $(function () {

      $('.fotorama')
      .on('fotorama:showend ',
              function (e, fotorama) {
                  var frameNumb = fotorama.activeIndex + 1;
                  console.log(frameNumb);
              }
          )
          .fotorama();
    });
}, 500);
