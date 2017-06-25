import { Component, ViewChild, ElementRef } from '@angular/core';
import { NavController } from 'ionic-angular';
import { Geolocation, GeolocationOptions, Geoposition, PositionError } from '@ionic-native/geolocation';

declare var google;

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  private options: GeolocationOptions;
  private currentPos: Geoposition;
  public places: Array<any>;
  public abierto = false;
  public tamanio = "90%";
  public ubicacionVal = 0;
  private lat;
  private long;
  public radio = 500;

  @ViewChild('map') mapElement: ElementRef;
  map: any;

  constructor(public navCtrl: NavController,
              private geolocation: Geolocation) {

  }

  show() {
    if (this.abierto == false) {
      this.abierto = true;
      this.tamanio = "50%";
    }
    else {
      this.abierto = false;
      this.tamanio = "90%";
    }
    this.getUserPosition();
  }

  ionViewDidEnter() {
    this.getUserPosition();
  }

  ubicacion(val) {
    this.ubicacionVal = val;
    this.getUserPosition();
  }

  radioB(val) {
    if (val == 1) {
        // SUMAR
        if (this.radio <= 4900) {
            this.radio += 100;
            this.getUserPosition();
        }
    }
    else {
        // RESTAR
        if (this.radio >= 200) {
            this.radio -= 100;
            this.getUserPosition();
        }
    }
  }

  getUserPosition() {
    this.options = {enableHighAccuracy: true};

    this.geolocation.getCurrentPosition(this.options)
    .then((pos:Geoposition) => {
      this.currentPos = pos;
      
      if(this.ubicacionVal == 0) {
        this.addMap(19.3579779, -99.2803551);
        this.lat = 19.3579779;
        this.long = -99.2803551;
      }
      else if (this.ubicacionVal == 1) {
        this.addMap(pos.coords.latitude, pos.coords.longitude);
        this.lat = pos.coords.latitude;
        this.long = pos.coords.longitude;
      }
      
    },
    (err: PositionError) => {
      console.log("Error: " + err.message);
    });
  }

  addMap(lat, long) {
    let latLng = new google.maps.LatLng(lat, long);

    let mapOptions = {
      center: latLng,
      zoom: 15,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    }

    this.map = new google.maps.Map(this.mapElement.nativeElement, mapOptions);
    
    this.getPlace(latLng).then((results: Array<any>) => {
      this.places = results;
      for(let i=0; i<results.length; i++) {
        var distancia = this.getDistancia(results[i].geometry.location.lat(), results[i].geometry.location.lng()).toFixed(2);
        this.places[i].distancia = distancia;
        this.createMarker(results[i]);
        if (results[i].opening_hours) {
          this.places[i].abierto = results[i].opening_hours.open_now;
        }
        else {
          this.places[i].abierto = "";
        }
      }
    }, 
    (status) => {
        this.places = [];
      console.log(status);
    });

    this.addMarker();
  }

  getDistancia(lat, long) {
    let R = 6371000; // EARTH RADIUS EN METROS
    let lat1 = this.lat
    let lon1 = this.long;
    let lat2 = lat;
    let lon2 = long;

    let dLat = this.toRad((lat2 - lat1));
    let dLon = this.toRad((lon2 - lon1));
    let a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
    let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    let d = R * c;

    return d;
  }

  toRad(x) {
    return x * Math.PI / 180;
  }

  addMarker() {
    let marker = new google.maps.Marker({
      map: this.map,
      animation: google.maps.Animation.DROP,
      position: this.map.getCenter()
    });

    let content = "<p>Esta es tu posicion actual!</p>";
    let infoWindow = new google.maps.InfoWindow({
      content: content
    });

    google.maps.event.addListener(marker, 'click', () => {
      infoWindow.open(this.map, marker);
    });
  }

  getPlace(latLng) {
    var service = new google.maps.places.PlacesService(this.map);

    let request = {
      location: latLng,
      radius: this.radio,
      // types: ["restaurant"]
      name: "krispy kreme"
    };

    return new Promise((resolve, reject) => {
      service.nearbySearch(request, function(results, status) {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
          resolve(results);
        }
        else {
          reject(status);
        }
      });
    });
  }

  getData(place) {
    var service = new google.maps.places.PlacesService(this.map);

    let request = {
      placeId: place.place_id
    };

    var tel = "";

    return new Promise((resolve, reject) => {
      service.getDetails(request, function(results, status) {
        if (status == google.maps.places.PlacesServiceStatus.OK) {
          if (results.formatted_phone_number && results.international_phone_number) {
            tel = '<a href="tel:' + results.international_phone_number + '">' + results.formatted_phone_number + '</a>'
          }
          resolve(tel);
        }
        else {
          reject(status);
        }
      });
    });
  }

  createMarker(place) {
    let marker = new google.maps.Marker({
      map: this.map,
      animation: google.maps.Animation.DROP,
      position: place.geometry.location
    });
    var abierto = "";

    if (place.opening_hours) {
      if (place.opening_hours.open_now === true) {
        abierto = "Abierto";
      }
      else if (place.opening_hours.open_now === false) {
        abierto = "Cerrado";
      }
    }

    this.getData(place).then((results) => {
      let content = "<h3>" + place.name + "</h3><p>" + place.vicinity + "</p><small>" + abierto + " " + results + "</small>";
      let infoWindow = new google.maps.InfoWindow({
        content: content
      });

      google.maps.event.addListener(marker, 'click', () => {
        infoWindow.open(this.map, marker);
      });
    });
  }

  ir(place) {
      console.log(place);
      this.ubicacionVal = 3;
      this.lat = 18.3579779;
      this.long = -98.2803551;
      this.getUserPosition();
  }

}