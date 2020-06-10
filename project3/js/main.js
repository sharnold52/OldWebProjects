//*** VARIABLES ***//
let restaurants = [];
let currentIndex = -1;
let markers = [];


//*** INITIALIZATION ***//
//* FireBase *//
var config = {
    apiKey: "AIzaSyD_3SGhSXoE4NpGttSHuAGBZiLEEC6UcRQ",
    authDomain: "project2-a4793.firebaseapp.com",
    databaseURL: "https://project2-a4793.firebaseio.com",
    projectId: "project2-a4793",
    storageBucket: "project2-a4793.appspot.com",
    messagingSenderId: "273103760608"
};
firebase.initializeApp(config);

// get reference to firebase database
let database = firebase.database();

// get reference to score on firebase and keep track of score
let searchRecord = database.ref("searches");

//* Google Maps *//
let map, geocoder, infoWindow, directionsService, directionsDisplay;
function initMap() {
    let mapOptions = {
        center: {lat:43.083848, lng:-77.6799},
        zoom:16,
        mapTypeId: 'roadmap'
    };
    map = new google.maps.Map(document.querySelector('#map'), mapOptions);
    geocoder = new google.maps.Geocoder();

    // directions
    directionsService = new google.maps.DirectionsService;
    directionsDisplay = new google.maps.DirectionsRenderer;
    directionsDisplay.setMap(map);

    // Set location of map to User Location (Basic Code grabbed from Google's documentation)
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            var pos = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            map.setCenter(pos);

            // set origin and address to user location (Convert coordinates to address)
            geocoder.geocode({'location': pos}, function(location, status) {
                if (status === 'OK') {
                    if (location[0]) {
                        app.origin = location[0].formatted_address;
                        // Don't use current location if address is not empty (Local Storage)
                        if(app.address == ""){
                            app.address = location[0].formatted_address;
                        }
                    } else {
                        window.alert('No results found');
                    }
                } else {
                    window.alert('Geocoder failed due to: ' + status);
                }
            });

        });
    }
}

var mapSettings = {
    type: 'POST',
    "async": true,
    "crossDomain": true,
    "url": "https://cors-anywhere.herokuapp.com/https://maps.googleapis.com/maps/api/geocode/json?address=1600%20Amphitheatre%20Parkway,%20Mountain%20View,%20CA&key=AIzaSyDsc2e-0M5MikNbkMaLNRO8qbMgCa7JveE",
    "method": "GET",
    "headers": {
        "cache-control": "no-cache",
        "Postman-Token": "1ccba0fe-22b4-4d8d-9490-dd3dad6f414a"
    }
}

//* Yelp *//
var settings = {
    "async": true,
    "crossDomain": true,
    "url": "https://cors-anywhere.herokuapp.com/https://api.yelp.com/v3/businesses/search?location=Costa%20Mesa&radius=2000",
    "method": "GET",
    "headers": {
        "Authorization": "Bearer FKN0e9VjIA0rrV-HDFB0cgAim_pwH1jG1IYAf5WhAHuwiR4FVYD7PZiKsAnTikGjlvdtkG-g15nI0fGEOW6v0z5fPT8kK9IgXF3NmE3MZJPUT_7uDvzm8Nr8lgumXHYx",
        "cache-control": "no-cache",
        "Access-Control-Allow-Origin":"*"
    }
}

//*** CLASSES ***//
class Pathfinder{
    constructor(origin, destination){
        this.origin = origin;
        this.destination = destination;
    }

    findPath(){
        directionsService.route({
            origin: app.origin,
            destination: app.destination,
            travelMode: app.travelMode
        }, function(response, status) {
            if (status === 'OK') {
                directionsDisplay.setDirections(response);
            } else {
                window.alert('Directions request failed due to ' + status);
            }
        });
    }
}


//* Make New Vue App *//
path = new Pathfinder("", "");
const app = new Vue({
    el: '#app',
    data: {
        title: "Restaurant Finder",
        searchTerm: "",
        address: "",
        radius: 5,
        rating: 3,
        price: "1, 2",
        results: [],
        origin: "",
        destination: "",
        travelMode: "DRIVING",
        seen: false
    },
    methods:{
        search(){
            // clear restaurants if it is not null
            if(restaurants.length > 0){
                restaurants = [];
                currentIndex = -1;

                // Clear previous markers and close infoWindow
                for(let i= 0; i < markers.length; i++){
                    markers[i].setMap(null);
                }
                infoWindow.close();
                markers = [];
            }

            // if origin is empty, set to address
            if(this.origin == ""){
                this.origin = this.address;
            }

            //* Yelp *//
            // build URL
            let url = "https://cors-anywhere.herokuapp.com/https://api.yelp.com/v3/businesses/search";

            if(this.address != ""){                                            // Location
                url += `?location=${encodeURIComponent(this.address.trim())}`;
            }

            // Search Term, Radius, and Price
            url += `&term=${this.searchTerm}&radius=${this.radius * 1600}&price=${this.price}`;

            // set URL
            settings.url = url;

            // array of results
            let res = [];
            let rating = this.rating;

            // Request Results
            $.ajax(settings).done(function (response) {
                // sort out businesses with rating that is lower than requested
                for(let i = 0; i < response.businesses.length; i++){                    
                    if(response.businesses[i].rating >= rating){
                        // push to results array
                        res[i] = response.businesses[i];

                        // Create Markers and push to restaurants array
                        addMarker(res[i].coordinates.latitude, res[i].coordinates.longitude, res[i].name);
                        restaurants.push(res[i]);
                    }
                }

                // set results
                this.results = res;

                // Move to first restaurant
                app.toRight();

                // Alert user if response is empty
                if(restaurants.length <= 0){
                    alert("No Restauarants found! Check search terms!");
                }
            });

            //* Google Maps *//
            // Check if Address isn't empty
            if(this.address != ""){
                // build URL
                url = "https://cors-anywhere.herokuapp.com/https://maps.googleapis.com/maps/api/geocode/json?address=";
                url += `${encodeURIComponent(this.address.trim())}&key=AIzaSyDsc2e-0M5MikNbkMaLNRO8qbMgCa7JveE`
                mapSettings.url = url;

                // set URL and search
                $.ajax(mapSettings).done(function (response) {
                    // check if response was successful
                    if(response.results[0] != null){
                        // set lat and long of map
                        map.setCenter(response.results[0].geometry.location);
                    }
                    else{
                        app.address = "";
                    }
                });
            }

            // Loop through results and Create Markers
            for(let i = 0; i < this.results.length; i++){
                addMarker(this.results[i].coordinates.latitude, this.results[i].coordinates.longitude, this.results[i].name);
            }

            // Store Search Terms
            saveSearch();
        },   // end search
        toRight(){
            // check if restaurants is empty
            if(restaurants.length > 0){
                // increment index
                if(currentIndex < restaurants.length - 1){
                    currentIndex++;
                }
                else{
                    currentIndex = 0;
                }

                // jump to restaurant location
                map.setCenter(new google.maps.LatLng(restaurants[currentIndex].coordinates.latitude, restaurants[currentIndex].coordinates.longitude));
                makeInfoWindow(markers[currentIndex].position, markers[currentIndex].title);
            }
        },  // end toRight
        toLeft(){
            // check if restaurants is empty
            if(restaurants.length > 0){
                // decrement index
                if(currentIndex > 0){
                    currentIndex--;
                }
                else{
                    currentIndex = restaurants.length - 1;
                }

                // jump to restaurant location
                map.setCenter(new google.maps.LatLng(restaurants[currentIndex].coordinates.latitude, restaurants[currentIndex].coordinates.longitude));
                makeInfoWindow(markers[currentIndex].position, markers[currentIndex].title);
            }
        },     // end toLeft
        findPath(){
            path.findPath();
        }   // end findPath
    }   // end Methods
});

// Get Local Storage
getLocal();

// Helper Functions
function addMarker(latitude, longitude, title){
    let position = {lat: latitude, lng: longitude};
    let marker = new google.maps.Marker({position: position, map: map});
    marker.setTitle(title);

    // push to markers
    markers.push(marker);

    // add a listener for the click event
    google.maps.event.addListener(marker, 'click', function(e){
        makeInfoWindow(this.position, this.title);
    })
}

function makeInfoWindow(position, msg){
    // close old infowindow if it exists
    if(infoWindow){
        infoWindow.close();
    }

    // loop through markers to set current index
    for(let i = 0; i < markers.length; i++){
        if(position == markers[i].position){
            currentIndex = i;
            setDestination(currentIndex);
            break;
        }
    }

    // make a new infowindow
    infoWindow = new google.maps.InfoWindow({
        map: map,
        position: position,
        content: `<div><a class='imgTitle' href='${restaurants[currentIndex].url}' target='_blank'>${msg}<img class="imgTitle" src='${restaurants[currentIndex].image_url}' /></a><p class='imgText'>${restaurants[currentIndex].categories[0].title} <br> Rating: ${restaurants[currentIndex].rating} <br> Price: ${restaurants[currentIndex].price}</p></div>`
    });

    // show directions
    app.seen = true;

    // hide directions when window is closed
    google.maps.event.addListener(infoWindow,'closeclick',function(){
        app.seen = false;
    });
}

function setDestination(index){
    // set the destination to the address of the currently selected marker
    let address = "";
    for(let i = 0; i < restaurants[index].location.display_address.length; i++){
        // build address
        address += restaurants[index].location.display_address[i]+ " ";
    }
    address = address.trim();
    app.destination = address;
}

function saveSearch(){  
    // Save Whole Search
    let path = 'searches';
    database.ref(path).push({
        searchTerm: app.searchTerm,
        address: app.address,
        radius: app.radius,
        rating: app.rating,
        price: app.price,
        origin: app.origin
    });

    // increment Price
    let ref = database.ref('priceCount/1');
    if(app.rating == "1"){
        ref = database.ref('priceCount/1');
        ref.transaction(function(currentCount) {
            return ((currentCount || 0) + 1);
        })
    }
    else if(app.price == "1, 2"){
        ref = database.ref('priceCount/2');
        ref.transaction(function(currentCount) {
            return ((currentCount || 0) + 1);
        })
    }
    else if(app.price == "1, 2, 3"){
        ref = database.ref('priceCount/3');
        ref.transaction(function(currentCount) {
            return ((currentCount || 0) + 1);
        })
    }
    else{
        ref = database.ref('priceCount/4');
        ref.transaction(function(currentCount) {
            return ((currentCount || 0) + 1);
        })
    }

    // increment Rating
    ref = database.ref('ratingCount/1');
    if(app.price == 1){
        ref = database.ref('ratingCount/1');
        ref.transaction(function(currentCount) {
            return ((currentCount || 0) + 1);
        })
    }
    else if(app.rating == 2){
        ref = database.ref('ratingCount/2');
        ref.transaction(function(currentCount) {
            return ((currentCount || 0) + 1);
        })
    }
    else if(app.rating == 3){
        ref = database.ref('ratingCount/3');
        ref.transaction(function(currentCount) {
            return ((currentCount || 0) + 1);
        })
    }
    else if(app.rating == 4){
        ref = database.ref('ratingCount/4');
        ref.transaction(function(currentCount) {
            return ((currentCount || 0) + 1);
        })
    }
    else{
        ref = database.ref('ratingCount/5');
        ref.transaction(function(currentCount) {
            return ((currentCount || 0) + 1);
        })
    }

    // save locally
    storeLocal();
}


// HELPER FUNCTIONS
function storeLocal(){
    // store search stuff locally
    window.localStorage.setItem('arnoldSearchTerm', app.searchTerm);
    window.localStorage.setItem('arnoldAddress', app.address);
    window.localStorage.setItem('arnoldRadius', app.radius);
    window.localStorage.setItem('arnoldRating', app.rating);
    window.localStorage.setItem('arnoldPrice', app.price);
}

function getLocal(){
    // check if data was stored
    if(window.localStorage.getItem('arnoldPrice')){
        // set search to data stored locally
        app.searchTerm = window.localStorage.getItem('arnoldSearchTerm');
        app.radius = window.localStorage.getItem('arnoldRadius');
        app.rating = window.localStorage.getItem('arnoldRating');
        app.price = window.localStorage.getItem('arnoldPrice');
    } 
}

//* Materialize Button *//
$(document).ready(function(){
    $('select').formSelect();
});

