/*
const locations = JSON.parse(document.getElementById('map').dataset.locations);
console.log(locations);
*/


export const displayMap = (locations) => {
    mapboxgl.accessToken = 'pk.eyJ1Ijoic2hpbGMiLCJhIjoiY2w1N2N6ZWdiMDlscTNqdWt0andqNDN1diJ9.SgHDNonMOtEdWczzXt7BtQ';
    var map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/light-v10',
        scrollZoom: false
        //center: [-118.113491, 34.111745], //- Longitude and latitude. mapbox expects longitude and then latitude just like mongo DB. Have a look at mapbox GL JS documentation for various options
        //zoom: 10,
        //interactive: false
    });
    //- Create the id element called map and copy the snippet from mapbox. It will put the map on the element with the id of map
    
    const bounds = new mapboxgl.LngLatBounds(); //- Area displayed on the map. We get access to mapbox gl, coz we included the library as part of the script in tour.pug
    
    locations.forEach(loc => {
        //Create marker
        const el = document.createElement('div');
        el.className = 'marker' //- classname from css style
        
        //Add marker inside mapbox
        new mapboxgl.Marker({
            element: el,
            anchor: 'bottom' //bottom of pin located at the exact GPS location
        }).setLngLat(loc.coordinates).addTo(map);
    
        //Add popup
        new mapboxgl.Popup({
            offset: 30 //To avoid overlapping by the marker
        }).setLngLat(loc.coordinates).setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`).addTo(map);
    
        //Extend map bounds to include the current location
        bounds.extend(loc.coordinates);  
    })
    
    //Map to fit the bounds
    
    map.fitBounds(bounds,{
        padding:{         
                top: 200, //Padding if necessary
                bottom: 150,
                left: 100,
                right: 100      
        }
    });
}

/*
mapboxgl.accessToken = 'pk.eyJ1Ijoic2hpbGMiLCJhIjoiY2w1N2N6ZWdiMDlscTNqdWt0andqNDN1diJ9.SgHDNonMOtEdWczzXt7BtQ';
var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/light-v10',
    scrollZoom: false
    //center: [-118.113491, 34.111745], //- Longitude and latitude. mapbox expects longitude and then latitude just like mongo DB. Have a look at mapbox GL JS documentation for various options
    //zoom: 10,
    //interactive: false
});
//- Create the id element called map and copy the snippet from mapbox. It will put the map on the element with the id of map

const bounds = new mapboxgl.LngLatBounds(); //- Area displayed on the map. We get access to mapbox gl, coz we included the library as part of the script in tour.pug

locations.forEach(loc => {
    //Create marker
    const el = document.createElement('div');
    el.className = 'marker' //- classname from css style
    
    //Add marker inside mapbox
    new mapboxgl.Marker({
        element: el,
        anchor: 'bottom' //bottom of pin located at the exact GPS location
    }).setLngLat(loc.coordinates).addTo(map);

    //Add popup
    new mapboxgl.Popup({
        offset: 30 //To avoid overlapping by the marker
    }).setLngLat(loc.coordinates).setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`).addTo(map);

    //Extend map bounds to include the current location
    bounds.extend(loc.coordinates);  
})

//Map to fit the bounds

map.fitBounds(bounds,{
    padding:{         
            top: 200, //Padding if necessary
            bottom: 150,
            left: 100,
            right: 100      
    }
});
*/