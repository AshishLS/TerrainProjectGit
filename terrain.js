
//chrome.exe --disable-web-security --user-data-dir="C:\Users\ASHISH\Dropbox\Terrain Project"
// Load the Visualization API and the columnchart package.
      google.load('visualization', '1', {packages: ['columnchart']});
      var map;
      var elevator;
      var geocoder;

      var clickListener, mouseMoveListener;
      var firstClickPt;
      var secondClickPt;
      var firstPtClicked = false;
      var transientPolyline;
      var firstMarker, secondMarker;
      var clickDelta = 0.05;
      var results; 
      var nSamples = 100;
      var nTotalCalls = 1;
      var nCurrentCall = 0;
      var response_string;
      var midPt;
      var nMatrixCount = 10;

function initMap() {
        // The following path marks a path from Mt. Whitney, the highest point in the
        // continental United States to Badwater, Death Valley, the lowest point.
        

          map = new google.maps.Map(document.getElementById('map'),         {
          zoom: 8,
          //center: {lat: 27.987789, lng: 86.925056}, // Somewhere around Everest
          //center: {lat: 17.74, lng: 142.943}, // Somewhere in Pacific
          center: {lat: -3.086176, lng: 37.366420}, // Near Kilimanjaro
          mapTypeId: 'terrain'
        });

        // create a geocoder service.
        geocoder = new google.maps.Geocoder();

        // Create an ElevationService.
        elevator = new google.maps.ElevationService;
  
        transientPolyline = new google.maps.Polyline({
          strokeColor: '#AA00CD',
          strokeOpacity: 0.8,
          map: map
        });
        
       firstMarker = new google.maps.Marker({map: map});       
       secondMarker = new google.maps.Marker({map: map});

        document.getElementById('btnGoToLocation').addEventListener('click', function() {
          goToLocation();
        });

        document.getElementById('btnGoToAddress').addEventListener('click', function() {
          goToAddress();
        });



        // Draw the path, using the Visualization API and the Elevation service.
        //displayPathElevation(path, elevator, map);  
      }

      function goToAddress() {
        var adrs = document.getElementById("address").value;
        alert(adrs);
        geocoder.geocode({address: adrs}, function(geocode_results, status) {
          if (status === 'OK') {
            map.setCenter(geocode_results[0].geometry.location);
            var marker = new google.maps.Marker({
              map: map,
              position: geocode_results[0].geometry.location
            });
          } else {
            alert('Geocode was not successful for the following reason: ' + status);
          }
        });
      }

      function goToLocation()
      {
        var latitude = document.getElementById("latitude").value;
        var longitude = document.getElementById("longitude").value;
        alert('go to lat ' + latitude + ' lng ' + longitude);
        var y = JSON.parse(latitude);
        var x = JSON.parse(longitude);
        map.setCenter({lat: y, lng: x});
      }

      function selectArea()
      {
        // disable the 3D Viewer
        document.getElementById("canvasID").style.pointerEvents="none";

        clickListener = map.addListener('click', function(e) {
          onClick(e.latLng, map);
        });        
        // reset values.
        firstPtClicked = false;
      }

    function onClick(latLng, map) {
      
        var pt = latLng;
        if(firstPtClicked ==false)
        {
          firstClickPt = pt;
          firstPtClicked = true;
          firstMarker.setPosition(pt);
          
          // Start transient area.
           mouseMoveListener = map.addListener('mousemove', function(e) {
           onMouseMove(e.latLng, map);
           });
        }
        else
        {
          var x = latLng.lat() + clickDelta;
          var y = latLng.lng() + clickDelta;
          pt = {lat: x, lng: y};
          secondClickPt = pt;
          secondMarker.setPosition(pt);
          
          // Remove listener.
          google.maps.event.removeListener(clickListener);          
          google.maps.event.removeListener(mouseMoveListener);
          
          // pan to center of area.
          x = (x + firstClickPt.lat()) * 0.5;          
          y = (y + firstClickPt.lng()) * 0.5;
          map.panTo({lat: x, lng: y});

          // add midpt
           // Get midpt for later reference.
           midPt = {lat: x, lng: y};

           //alert('midPt is ' + JSON.stringify(midPt));
        }
    }

        function onMouseMove(latLng, map) 
        {
           //var rubberGeom = [{lat: firstClickPt.lat, lng: firstClickPt.lng}, {lat: latLng.lat, lng: latLng.lng}]; 
          var y1 = firstClickPt.lat();
          var x1 = firstClickPt.lng();
          var y2 = latLng.lat() + clickDelta;
          var x2 = latLng.lng() + clickDelta;
          var rubberGeom = [{lat: y1, lng: x1}, 
                           {lat: y2, lng: x1}, 
                           {lat: y2, lng: x2}, 
                           {lat: y1, lng: x2}, 
                           {lat: y1, lng: x1}];
          
          transientPolyline.setPath(rubberGeom);
        }

        function getTerrain()
        {
          // get point matrix count.
          var pointCount = document.getElementById("matrixCount").value;
          if(JSON.parse(pointCount))
            nMatrixCount = JSON.parse(pointCount);

          nCurrentCall = 0;
          if(transientPolyline)
          {
            var polyline = transientPolyline.getPath().getArray();

            var input = {
              GridType : "Rectangle",
              EndPoints :
              [ 
                {
                  lng: polyline[0].lng(),
                  lat: polyline[0].lat(),
                },
                {
                  lng: polyline[2].lng(),
                  lat: polyline[2].lat(),
                }
              ],
              GridSize : 
              {
                Rows : nMatrixCount,
                Columns : nMatrixCount
              }
            };

            alert(JSON.stringify(input));
            
            var link = "https://lm4jh7wng3.execute-api.us-west-2.amazonaws.com/testing/api/v0/maps/terrain/get";
              
            var request = $.ajax({
              url: link,
              type: "POST",
              data: JSON.stringify(input),
              dataType: "application/json"
            }); 

            request.done(function(msg) {
             alert( msg ); 
            });

            request.fail(function(jqXHR) {
              alert(JSON.stringify("Calculation Done with message \n" + jqXHR.responseText));
              response_string = jqXHR.responseText;

              // Activate the show 3D button.
              var show3DButton = document.getElementById('btnShow3D');
              show3DButton.disabled = false;
            });
              //displayPathElevation(grid_path);
          }
        }

        function show3D()
        {
          // Enable 3D viewer.
          document.getElementById("canvasID").style.pointerEvents="auto";

          //if(nCurrentCall >= nTotalCalls)
          show3DTerrain();

          // Activate the show 3D button.
          var show3DButton = document.getElementById('btnShow3D');
          show3DButton.disabled = true;
        }

        function displayPathElevation(path) {
        
          alert(JSON.stringify(path));

          // Create a PathElevationRequest object using this array.
          // Ask for 256 samples along that path.
          // Initiate the path request.
           elevator.getElevationAlongPath({
              'path': path,
              'samples': nSamples
              }, plotElevation);
        }        

// Takes an array of ElevationResult objects, draws the path on the map
      // and plots the elevation profile on a Visualization API ColumnChart.
      function plotElevation(elevations, status) {
        //alert('Inside plotElevation');
      
        var chartDiv = document.getElementById('elevation_chart');
        if (status !== 'OK') {
          // Show the error code inside the chartDiv.
          chartDiv.innerHTML = 'Cannot show elevation: request failed because ' +
              status;
          return;
        }
        
        if(results == null)
          results = elevations;
        else
          {
            for(var i = 0; i < elevations.length; i++)
              results.push(elevations[i]);
          }


        // Create a new chart in the elevation_chart DIV.
        var chart = new google.visualization.ColumnChart(chartDiv);
        // Extract the data from which to populate the chart.
        // Because the samples are equidistant, the 'Sample'
        // column here does double duty as distance along the
        // X axis.
        var data = new google.visualization.DataTable();
        data.addColumn('string', 'Sample');
        data.addColumn('number', 'Elevation');
        for (var i = 0; i < elevations.length; i++) {
          data.addRow(['', elevations[i].elevation]);
        }
               // var checkit = firstClickPt; //{lat: 0.0, lng: 0.0};
              //elevations[i].location;
          //loc = ;
        // Draw the chart using the data within its DIV.
        chart.draw(data, {
          height: 150,
          legend: 'none',
          titleY: 'Elevation (m)'
        });
        
        nCurrentCall++;
      }


// THREEJS - WEBGL
      var camera, scene, renderer;
			var mesh, terrain;

			function init() {
        var canvas = document.getElementById("canvasID");
        //renderer = new THREE.WebGLRenderer({ canvas: canvas });
        renderer = new THREE.WebGLRenderer({ canvas: canvas});
       // renderer.setClearColor( 0xff0000, 0);
        
				camera = new THREE.PerspectiveCamera( 70, canvas.offsetWidth/ canvas.offsetHeight, 1, 1000 );
        
        // debug
       // alert(JSON.stringify(camera));
        
				camera.position.z = 400;
				scene = new THREE.Scene();
				//var texture = new THREE.TextureLoader().load( "http://www.brighton-boxes.co.uk/wp-content/uploads/2014/04/cardboard-box-30139.jpg");
        // LIGHTS - needed for phong shading.
        var light = new THREE.HemisphereLight( 0xffffbb, 0x080820, 4 );
        scene.add( light );

        // BOX
				var geometry = new THREE.BoxBufferGeometry( 200, 200, 200 );
        //alert(JSON.stringify(geometry));

				var material = new THREE.MeshBasicMaterial({color:0xff3300, wireframe: true});
				mesh = new THREE.Mesh( geometry, material );
				scene.add( mesh );
        
        
				//renderer = new THREE.WebGLRenderer();
				renderer.setPixelRatio( 5 );
				//renderer.setSize( window.innerWidth, window.innerHeight );
				document.body.appendChild( renderer.domElement );
				//
				window.addEventListener( 'resize', onWindowResize, false );
        
        // Add orbit control. http://jsfiddle.net/Stemkoski/ddbTy/
         var controls = new THREE.OrbitControls( camera, renderer.domElement );
        //controls.addEventListener( 'change', render );
			}

			function onWindowResize() {
				//camera.aspect = window.innerWidth / window.innerHeight;
				camera.updateProjectionMatrix();
				//renderer.setSize( window.innerWidth, window.innerHeight );
			}
			function animate() {
				requestAnimationFrame( animate );
				//mesh.rotation.z += 0.005;
				//mesh.rotation.y += 0.01;
        
        //if(terrain)
        //  terrain.rotation.z += 0.005;
        //terrain.rotation.y += 0.01;
				renderer.render( scene, camera );
			}

      function show3DTerrain() 
      {
        if(scene == null)
        {     
          init();
          animate();
        }
        //drawTerrain();
        show3DTerrainSuarabh();
	     
      }

      function show3DTerrainSuarabh()
      {
          var errMsgDiv = document.getElementById('error_message');

            // Show the error code inside the errMsgDiv.
        if(response_string)
        {
            //alert("results are fine");
            var response_data = JSON.parse(response_string);

            alert('response data' + JSON.stringify(response_data));
            
            var midX = midPt.lng;
            var midY = midPt.lat;

            var geom = new THREE.Geometry();

            for (var i = 0; i < response_data.Points.length;) 
            {
              //var v1 = new THREE.Vector3(,response_data.Points[i++],response_data.Points[i++]);

              var x =  response_data.Points[i++];
              var y = response_data.Points[i++];
              var z = response_data.Points[i++];
              

              var terrainPt = new THREE.Vector3((x - midY)*111.0, (y - midX)*111.0, z);
              terrainPt.setZ(terrainPt.getComponent(2) * 0.001);
              
              geom.vertices.push(terrainPt);// here you can use 3-dimensional coordinates
              //alert(JSON.stringify(terrainPt));
            };

            //alert('total vertices are: ' + geom.vertices.length + '\n' + JSON.stringify(geom.vertices));

             for (var i = 0; i < response_data.Indexes.length;) 
            {
              geom.faces.push( new THREE.Face3( response_data.Indexes[i++], response_data.Indexes[i++], response_data.Indexes[i++] ) );              
            };

            //alert('total faces are: ' + geom.faces.length + '\n' + JSON.stringify(geom.faces));

            geom.computeFaceNormals();

            if(terrain)
              scene.remove(terrain);

            //terrain = new THREE.Mesh( geom, new THREE.MeshPhongMaterial({color:0xff3300, shading:THREE.SmoothShading}));
            //var material = new THREE.MeshBasicMaterial( {color:0xff33ff} );
            var material = new THREE.MeshLambertMaterial( { ambient: 0x050505, color: 0x0033ff, specular: 0x555555, shininess: 50, side: THREE.DoubleSide, wireframe:true} );
            terrain = new THREE.Mesh( geom, material);
            scene.add(terrain);
        }
      }