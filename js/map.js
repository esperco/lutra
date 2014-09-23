google.maps.event.addDomListener(window, 'load', init);
var map;
function init() {
  var mapOptions = {
    center: new google.maps.LatLng(37.454148,-122.162791),
    zoom: 11,
    zoomControl: true,
    zoomControlOptions: {
        style: google.maps.ZoomControlStyle.SMALL,
    },
    disableDoubleClickZoom: false,
    mapTypeControl: false,
    scaleControl: false,
    scrollwheel: false,
    panControl: false,
    streetViewControl: false,
    draggable : true,
    overviewMapControl: false,
    overviewMapControlOptions: {
        opened: false,
    },
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    styles: [
      {
        "featureType": "road",
        "stylers": [
          { "hue": "#5e00ff" },
          { "saturation": -79 }
        ]
      },{
        "featureType": "poi",
        "stylers": [
          { "saturation": -78 },
          { "hue": "#6600ff" },
          { "lightness": -47 },
          { "visibility": "off" }
        ]
      },{
        "featureType": "road.local",
        "stylers": [
          { "lightness": 22 }
        ]
      },{
        "featureType": "landscape",
        "stylers": [
          { "hue": "#6600ff" },
          { "saturation": -11 }
        ]
      },{
      },{
      },{
        "featureType": "water",
        "stylers": [
          { "saturation": -65 },
          { "hue": "#1900ff" },
          { "lightness": 8 }
        ]
      },{
        "featureType": "road.local",
        "stylers": [
          { "weight": 1.3 },
          { "lightness": 30 }
        ]
      },{
        "featureType": "transit",
        "stylers": [
          { "visibility": "simplified" },
          { "hue": "#5e00ff" },
          { "saturation": -16 }
        ]
      },{
        "featureType": "transit.line",
        "stylers": [
          { "saturation": -72 }
        ]
      },{
      }
    ],
  }
  var mapElement = document.getElementById("esper-map");
  var map = new google.maps.Map(mapElement, mapOptions);
  marker = new google.maps.Marker({
    icon: '../img/marker.svg',
    position: new google.maps.LatLng(37.4494339, -122.158983),
    clickable: false,
    map: map
  });
}
