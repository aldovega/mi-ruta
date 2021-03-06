window.hack = {}; // 
clog = function(args){console.log(args);};
cdir = function(args){console.dir(args);};

(function() {
	var h = hack;
	h.map = null;
	h.routes = [];
	h.endpoints = null;
	h.init = function() {
		var mapOpts = {
          center: new google.maps.LatLng(20.65965, -103.34963),
          zoom: 12,
          mapTypeId: google.maps.MapTypeId.ROADMAP
        };
		this.map = new google.maps.Map(document.getElementById("mapCanvas"), mapOpts);
		
		this.endpoints = new markers( this.map, null, {autoinit: true} );

		this.bindControllers();
	};

	h.addRoute = function( data, coords ) {
		h.routes.push( new route( data, this.map, coords, {autoinit: true} ) );
	};

	h.searchAddress = function( address, callback, backup ) {
		var geocoder = new google.maps.Geocoder();
		geocoder.geocode( { 'address': address }, function(results, status) {
			if (status == google.maps.GeocoderStatus.OK) {
				if(callback && typeof callback === 'function') {
					callback(results[0].geometry.location);	
				}
			}
			else {
				if(backup && typeof backup === 'function') {
					backup(results);	
				}
			}
		});
	};

	h.setEndpoints = function( origin, destiny ) {
		this.endpoints.set( 0, origin, null);
		this.endpoints.set( 1, destiny, null);
	};

	h.getOrigin = function() {
		if( h.endpoints.get(0) !== -1 ) {
			return h.endpoints.get(0);
		}
		return -1;
	};

	h.setOrigin = function( coord ) {
		if( h.endpoints.get(0) !== -1 ) {
			h.endpoints.set( 0, coord, null);
		}
		else {
			h.endpoints.add( coord, {icon: 'images/start.png'} );
		}
	};

	h.getDestiny = function() {
		if( h.endpoints.get(1) !== -1 ) {
			return h.endpoints.get(1);
		}
		return -1;
	};

	h.setDestiny = function( coord ) {
		if( h.endpoints.get(1) !== -1 ) {
			h.endpoints.set( 1, coord, null);
		}
		else {
			if( this.getOrigin() !== -1 ) {
				h.endpoints.add( coord, {icon: 'images/end.png'} );
			}
			else {
				alert('Elige el origen primero');
			}
		}
	};

	h.getUserLocation = function( callback ) {
		var me = this;
		if (navigator.geolocation) {
			clog('getting location, please wait...');
			navigator.geolocation.getCurrentPosition(function (position) {
				var latLng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
				if( typeof callback === 'function') {
					callback( latLng );
				}
			});
		}
		else {
			return -1;
		}
	};

	h.getRoutes = function() {
		var me = this,
			origin = me.getOrigin(),
			destiny = me.getDestiny();

		$.ajax({
			type: 'GET',
			url: '',
			data: { 
				origin: origin.lat() + '' + origin.lng(),
				destiny: destiny.lat() + '' + destiny.lng()
			}
		}).done( function( resp ) {
			if( resp !== 'error') {
				var response = JSON.parse( resp );
			}
		});
	};

	h.panToEndpoint = function( index ) {
		var endpoint = this.endpoints.get( index );
		if( endpoint !== -1 ) {
			this.map.panTo( endpoint.getPosition() );
		}
	};

	/** MODELS **/

	/**
	* Markers
	*/
	function markers( map, coords, opts) {
		this.map = null;
		this.coords = [];
		this.opts = null;
		this.markers = [];

		this.init = function() {
			var that = this;
			if( map ) {
				this.map = map;	
			}
			else {
				throw "No map passed as parameter for the Position Collection";
			}
			
			if( coords ) {
				this.coords = coords;
				for(var i = 0, len = this.coords.length; i < len; i++ ) {
					this.add( this.coords[i], null);
				}
			}
			if( opts ) {
				this.opts = opts;
			}
		};	

		this.add = function( coord, opts, listener ) {
			this.markers.push( new google.maps.Marker( {position: coord, map: this.map, draggable: true} ) );
			if( opts && opts.icon ) {
				this.markers[ this.markers.length -1 ].setIcon( opts.icon );
			}
		};

		this.set = function( index, coord, opts) {
			if( this.markers[index] ) {
				this.markers[index].setPosition( coord );
			}
		};

		this.get = function( index ) {
			if( this.markers[index] ) {
				return this.markers[index];
			}
			return -1;
		};

		if( opts.autoinit === true ) {
			this.init();
		}
	}

	/**
	* Model for a route
	*/
	function route( data, map, coords, opts ) {
		this.id = data.id || '';
		this.name = data.name || '';
		this.map = null;
		this.coords = [];
		this.opts = null;
		this.path = null;

		this.init = function() {
			var that = this;
			if( map ) {
				this.map = map;	
			}
			else {
				throw "No map passed as parameter for the Position Collection";
			}
			
			if( coords ) {
				this.coords = coords;
			}
			if( opts ) {
				this.opts = opts;
			}

			this.path = new google.maps.Polyline({					// Create the polylines for to join the markers
				path: that.coords,
				strokeColor: '#FF0000',
				strokeOpacity: 1.0,
				strokeWeight: 2
			});
		};

		this.addPosition = function( latLng, lng ) {
			if( arguments.length === 1 ) {
				this.coords.push( latLng );
			}
			else if( arguments.length === 2 ) {
				var newLatLng = new google.maps.LatLng( latLng, lng );
				this.coords.push( newLatLng );
			}

			this.path = new google.maps.Polyline({
				path: this.coords,
				strokeColor: '#FF0000',
				strokeOpacity: 1.0,
				strokeWeight: 2
			});
		};

		this.showPath = function() {
			this.path.setMap( this.map );
		};

		this.hidePath = function() {
			this.path.setMap( null );
		};

		if( opts.autoinit === true ) {
			this.init();
		}
	}


	h.bindControllers = function() {
		var me = this,
			positions = {
				surveyStart: $('#cuestionario').position().top,
				q0: $('#question0').position().top,
				q1: $('#question1').position().top,
				q2: $('#question2').position().top,
				q3: $('#question3').position().top,
				q4: $('#question4').position().top,
				q5: $('#question5').position().top
			};
		me.positions = positions;

		$('#getLocationBtn').click( function() {
			me.getUserLocation( function( latLng ) {
				me.setOrigin( latLng );
				me.map.panTo( latLng );
			});
		});

		$('#searchAddrBtn').click( function() {
			var origin = $('#originInput').val(),
				destiny = $('#destinyInput').val(),
				regex = new RegExp('guadalajara', 'i');

			if( regex.test( origin ) === false ) {
				origin += ' Guadalajara';
			}
			if( regex.test( destiny ) === false ) {
				destiny += ' Guadalajara';
			}

			if( me.getOrigin() === -1 ) {
				me.searchAddress( origin, function( result ) {
					me.setOrigin( result );

					me.searchAddress( destiny, function( result ) {
						me.setDestiny( result );
						me.map.panTo( result );

						var georssLayer = new google.maps.KmlLayer('rutas.kml');
						georssLayer.setMap(me.map);
					});
				});
			}
			else {
				if( me.getDestiny() === -1 ) {
					me.searchAddress( destiny, function( result ) {
						me.setDestiny( result );
						me.map.panTo( result );
					});
				}
				else {
					me.map.panTo( me.getDestiny().getPosition() );
				}
			}

			$('html, body').animate({
	            scrollTop: $("#mapCanvas").offset().top
	        }, 200);

	        var georssLayer = new google.maps.KmlLayer('https://dl.dropbox.com/s/bjs386dqnvc1qt7/rutas%20de%20transporte.kmz');
			georssLayer.setMap(me.map);
			$('.routeDetail').css('display', 'inline');
			$('.routeDetail').css('margin-left', 15);
		});

		$('#originMapBtn').click( function() {
			var origin = me.getOrigin();
			if( origin === -1 ) {
				me.setOrigin( me.map.getCenter() );
				origin = me.getOrigin();
			}
			origin.setAnimation(google.maps.Animation.BOUNCE);
			window.setTimeout( function() {
				origin.setAnimation(null);
			}, 2000);
		});

		$('#destinyMapBtn').click( function() {
			var destiny = me.getDestiny();
			if( destiny === -1 ) {
				me.setDestiny( me.map.getCenter() );
				destiny = me.getDestiny();
			}
			if( destiny !== -1 ) {
				destiny.setAnimation(google.maps.Animation.BOUNCE);
				window.setTimeout( function() {
					destiny.setAnimation(null);
				}, 2000);
			}
		});

		/** Pan to sections */
		$('.ans').click( function() {
	    	setSelectedOpt( $(this).attr('id').split('_')[1] );
	    });

	    $('.backBtn').click(function() {
	    	var section = $(this).attr('id').split('backTo')[1];
	    	panToSection( parseInt(section) );
		});

		$('.ansTextfield').on('change', function(){
			var val = $(this).val();
			if( !isNaN( val ) ) {
				panToSection(1);
			}
			else {
				alert('Solo numeros por favor.');
				panToSection(0);
			}
		});		

		$('.routeTextfield').on('change', function(){
			var val = $(this).val();
			panToSection(0);
			// if( !isNaN( val ) ) {
				
			// }
			// else {
			// 	alert('Solo numeros por favor.');
			// 	panToSection(0);
			// }
		});

		$(window).resize(function () 
		{ 
			var newCenter = me.map.getCenter();
		    if(me.map !== null ) { 
		    	google.maps.event.trigger(me.map, "resize");
		    	me.map.panTo( newCenter );
		    }
		    $('#progressBar').css('top', $(window).height()/4 );
			$('#progressBar > span').css('top', $(window).height()/4 );
		});

		$(window).scroll(function() {
			progressFunction( me.positions );
		});

		$('.routeDetailItem').click( function() {
			var id = parseInt( $(this).attr('id').split('_')[1] );
			me.panToEndpoint( id );
		});

		window.setTimeout( function() {
			$('.question').css('height',  $(window).height() );	
			$('.question').css('padding-top', 0 );	
			$('#progressBar').css('top', $(window).height()/4 );
			$('#progressBar > span').css('top', $(window).height()/4 );
			positions = {
				surveyStart: $('#question0').position().top,
				q0: $('#question0').position().top,
				q1: $('#question1').position().top,
				q2: $('#question2').position().top,
				q3: $('#question3').position().top,
				q4: $('#question4').position().top,
				q5: $('#question5').position().top
			};
			$('.routeDetail').css('display', 'none');
		}, 100);
		
		$('#submitButton').click( function() {
			var answers = [],
				minutes = $('.ansTextfield').val(),
				completeFlag = false;
			if( minutes !== '' && !isNaN(minutes) ) {
				answers.push('0_'+minutes);

				for( var i = 1; i < 6; i++ ) {
					var opt = $('#ansOpts'+i+' > .ansSelected').attr('id');
					if( opt !== undefined ) {
						opt = opt.split('_')[1];
						answers.push(opt.charAt(0)+'_'+opt.charAt(1));

					}
					else {
						alert('Debe completar el cuestionario.');
						panToSection(i);
						break;
					}
				}

				$.ajax({
					type: 'POST',
					url: location.href + 'post_survey',
			          beforeSend: function(){
			            $("#thanks").foundation('reveal','open');
			            setTimeout(function() {
			            	$("#thanks").foundation('reveal','close');
				              showCharts();
				              panToSection(1);
				              $('#submitButton').css('display','none');
				              $('.ans').unbind('click');
				              $('.ans').on('click',function() {
				              	var section = $(this).attr('id').split('_')[1].charAt(0);
						    	if( section < 5 ) {
						    		panToSection( parseInt(section) + 1);
						    	}
				              });
				          }, 3000);
			          },
								data: { survey: answers}
							}).done( function( resp ) {
								clog(resp);
				});
			}
			else {
				alert('Debe completar el cuestionario.');
					panToSection(0);
			}
		});

		$('#progressBar').css('display', 'none');

		$('#startSurveyButton').click(function() {
			$('#evaluaciones').css('display', 'inline');
			$('html, body').animate({
	            scrollTop: $("#evaluaciones").offset().top
	        }, 500);
	        $('#progressBar').css('top', $(window).height()/4 );
			$('#progressBar > span').css('top', $(window).height()/4 );
			me.positions = {
				surveyStart: $('#question0').position().top,
				q0: $('#question0').position().top,
				q1: $('#question1').position().top,
				q2: $('#question2').position().top,
				q3: $('#question3').position().top,
				q4: $('#question4').position().top,
				q5: $('#question5').position().top
			};
		});
	};

	/**
	* Auxiliary functions
	*/
	function progressFunction( positions ) {
		var pOff = $('#progressBar').offset().top;

		if( pOff > positions.surveyStart ) {
			$('#progressBar').css('display', 'inline');

			if( pOff > positions.q5 ) {
				$('#progressBar').html('<span>6/6</span>');
			} else if( pOff > positions.q4 ) {
				$('#progressBar').html('<span>5/6</span>');
			} else if( pOff > positions.q3 ) {
				$('#progressBar').html('<span>4/6</span>');
			} else if( pOff > positions.q2 ) {
				$('#progressBar').html('<span>3/6</span>');
			} else if( pOff > positions.q1 ) {
				$('#progressBar').html('<span>2/6</span>');
			}
			else {
				$('#progressBar').html('<span>1/6</span>');	
			}
			$('#progressBar > span').css('top', $(window).height()/4 + 20);
		}
		else {
			$('#progressBar').css('display', 'none');
		}
	}

	function setSelectedOpt( id ) {
    	var section = id.charAt(0);
    	for(var i=1; i<4; i++) {
    		$('#ans_'+ section + i ).removeClass('ansSelected');
    	}
    	$('#ans_' + id).addClass('ansSelected');
    	if( section < 5 ) {
    		panToSection( parseInt(section) + 1);
    	}
    }

    function panToSection( section ) {
    	$('html, body').animate({
            scrollTop: $("#question"+ section).offset().top
        }, 500);
        $("#question"+ section).css('height',  $(window).height() );    
    }

    function showCharts() {
    	$('#chart1').highcharts({
	        chart: {
	            type: 'bar'
	        },
	        title: {
	            text: 'Resultados'
	        },
	        xAxis: {
	            categories: ['Satisfaccion con la espera']
	        },
	        yAxis: {
	            title: {
	                text: 'Usuarios'
	            }
	        },
	        series: [
	        {
			    type: 'bar',
			    name: 'Si',
			    data: [7]
			}, {
			    type: 'bar',
			    name: 'No',
			    data: [2]
			}]
	    });
	    $('#chart2').highcharts({
	        chart: {
	            type: 'bar'
	        },
	        title: {
	            text: 'Resultados'
	        },
	        xAxis: {
	            categories: ['Estado de la unidad']
	        },
	        yAxis: {
	            title: {
	                text: 'Usuarios'
	            }
	        },
	        series: [
	        {
			    type: 'bar',
			    name: 'Bueno',
			    data: [3]
			}, {
			    type: 'bar',
			    name: 'Regular',
			    data: [11]
			}, {
			    type: 'bar',
			    name: 'Malo',
			    data: [2]
			}]
	    });
	    $('#chart3').highcharts({
	        chart: {
	            type: 'bar'
	        },
	        title: {
	            text: 'Resultados'
	        },
	        xAxis: {
	            categories: ['Servicio brindado']
	        },
	        yAxis: {
	            title: {
	                text: 'Usuarios'
	            }
	        },
	        series: [
	        {
			    type: 'bar',
			    name: 'Bueno',
			    data: [3]
			}, {
			    type: 'bar',
			    name: 'Regular',
			    data: [8]
			}, {
			    type: 'bar',
			    name: 'Malo',
			    data: [11]
			}]
	    });
	    $('#chart4').highcharts({
	        chart: {
	            type: 'bar'
	        },
	        title: {
	            text: 'Resultados'
	        },
	        xAxis: {
	            categories: ['Forma de conducir']
	        },
	        yAxis: {
	            title: {
	                text: 'Usuarios'
	            }
	        },
	        series: [
	        {
			    type: 'bar',
			    name: 'Buena',
			    data: [3]
			}, {
			    type: 'bar',
			    name: 'Regular',
			    data: [14]
			}, {
			    type: 'bar',
			    name: 'Mala',
			    data: [2]
			}]
	    });
	    $('#chart5').highcharts({
	        chart: {
	            type: 'bar'
	        },
	        title: {
	            text: 'Resultados'
	        },
	        xAxis: {
	            categories: ['Se detuvo en paradas oficiales']
	        },
	        yAxis: {
	            title: {
	                text: 'Usuarios'
	            }
	        },
	        series: [
	        {
			    type: 'bar',
			    name: 'En todas',
			    data: [3]
			}, {
			    type: 'bar',
			    name: 'En la mayoria',
			    data: [8]
			}, {
			    type: 'bar',
			    name: 'Solo en algunas',
			    data: [5]
			}]
	    });
    }
})();

hack.init();
