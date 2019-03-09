import { Component, ViewChild, ElementRef } from '@angular/core';
import { NavController } from 'ionic-angular';
import leaflet from 'leaflet';
import { FabContainer } from 'ionic-angular';
import { AlertController, ModalController } from 'ionic-angular';
import { Storage } from '@ionic/storage';
import { AngularFireDatabase } from '@angular/fire/database';
import { Geolocation } from '@ionic-native/geolocation';
import moment from 'moment';

import { ReportPage } from '../report/report';
import { PaypopupPage } from '../paypopup/paypopup';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  @ViewChild('map') mapContainer: ElementRef;
  newm;
  initMarkers =[];
  map: any;
  accountType = 'user';
  newLatLng = {
    lat: 0,
    lng: 0
  };
  userLatLng = {
    lat: 0,
    lng: 0
  };
  userPaymentMarker;
  leafRC;


  constructor(public navCtrl: NavController, private el: ElementRef, private alertCtrl: AlertController, private storage: Storage, public afDb: AngularFireDatabase, private geolocation: Geolocation, public modalCtrl: ModalController  ) {
  }

  ionViewDidEnter() {
    this.loadmap();
    this.storage.get('accountType').then(r => {
      this.accountType = r;
      this.loadMarkersBasedOnAccount();
    });    
  }

  loadMarkersBasedOnAccount() {
    if(this.accountType === null){
      this.storage.get('accountType').then(r => {
        this.accountType = r;
      })
    }

    if(this.accountType == 'user'){
      this.renderUserPosition();
      this.chkCurrentParkedVehical();
    } else {
      this.renderUserMarker();
    }
  }

   /* Map Init*/
  loadmap() {
    this.map = leaflet.map("map").fitWorld();
    leaflet.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attributions: 'www.tphangout.com',
      maxZoom: 18
    }).addTo(this.map);
    this.map.locate({
      setView: true,
      maxZoom: 10
    }).on('locationfound', (e) => {
      
    }).on('locationerror', (err) => {
      alert(err.message);
    })
  }


  /* New parking popup */
  addParking(fab: FabContainer) {
    fab.close();
    var greenIcon = leaflet.icon({
      iconUrl: 'assets/imgs/new-marker.png',
      iconSize: [50, 50],
    });
    this.geolocation.getCurrentPosition().then((resp) => {
      // leaflet.marker([resp.coords.latitude, resp.coords.longitude], { icon: greenIcon, draggable: false }).addTo(this.map);
      
      this.newm = leaflet.marker([resp.coords.latitude, resp.coords.longitude], { icon: greenIcon, draggable: true }).addTo(this.map)
      .bindPopup('<strong>Select Location</strong><br>Pin the parking point<br/><button (click)="newParkingForm()" id="sunilTest" class="button-ios button-block" ion-button round>Select</button>.')
      .openPopup().on('dragend', (d) => {
          this.newLatLng = d.target._latlng;
          if(this.newm){
            this.newm.openPopup();
          }          
        });

    this.newm.on('popupopen', (d) => {
      this.subscribeToClickListeners();
    });
    this.subscribeToClickListeners();
    
    }).catch((error) => {
      });
    
  }

  /* lat lng select listener for new parking */
  subscribeToClickListeners() {
    this.el.nativeElement.querySelector('#sunilTest').addEventListener('click', (event) => this.newParkingForm(event));
  }

  newParkingForm(evt) {
    this.addParkingPrompt();
  }

  addParkingPrompt() {
    let alert = this.alertCtrl.create({
      title: 'Parking Details',
      inputs: [
        {
          name: 'name',
          placeholder: 'Parking Space Name'
        },
        {
          name: 'slots',
          placeholder: 'Parking Capacity'
        },
        {
          name: 'price',
          placeholder: 'Parking price per hour'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          handler: data => {
            this.map.removeLayer(this.newm);
          }
        },
        {
          text: 'Save',
          handler: data => {
            this.saveNewParking(data);
          }
        }
      ]
    });
    alert.present();
  }


  saveNewParking(data){
    let slug = data.name.toLowerCase().replace(/\ /g , '-');
    this.storage.get('token').then((uid) => {
      if(uid) {
        this.afDb.object('parking/'+uid+'/'+slug).set({
          uid: uid,
          lat: this.newLatLng.lat,
          lng: this.newLatLng.lng,
          name: data.name,
          slots: data.slots,
          available: data.slots,
          price: data.price,
          slug: slug
        }).then( (r) => {
          this.map.removeLayer(this.newm);
        })
      } else {
        let altr = this.alertCtrl.create({
          title: 'Something went wrong please try again!'
        })
        altr.present();
      }      
    });   
  }

  deleteParking(ele) {
    this.storage.get('token').then((uid) => {
      if(uid) {
      this.afDb.object('parking/'+uid+'/'+ele.path[0].dataset.value).remove().then( () => {
        this.renderUserMarker();
      });
      let deinit = this.initMarkers.filter((r) => {
        return r.slug == ele.path[0].dataset.value;
      })[0];
      this.map.removeLayer(deinit.ref);
      }
    });
  }

  editParking(ele){
    let isEdit = true;
    this.storage.get('token').then((uid) => {
      if(uid && isEdit) {
      let data = this.afDb.object('parking/'+uid+'/'+ele.path[0].dataset.value).valueChanges();
      data.forEach((r) => {
        if(isEdit){
          let alert = this.alertCtrl.create({
            title: 'Parking Details',
            inputs: [
              {
                name: 'name',
                value: r['name'],
                placeholder: 'Parking Space Name'
              },
              {
                name: 'slots',
                value: r['slots'],
                placeholder: 'Parking Capacity'
              },
              {
                name: 'price',
                value: r['price'],
                placeholder: 'Parking price per hour'
              }
            ],
            buttons: [
              {
                text: 'Cancel',
                role: 'cancel',
                handler: data => {
                 
                }
              },
              {
                text: 'Save',
                handler: res => {
                  isEdit = false;
                  this.updateParking(res, r);
                }
              }
            ]
          });          
          alert.present();
        }
        
      })
      }
    });   
  }

  updateParking(res, data){

    this.afDb.object('parking/'+data['uid']+'/'+data['slug']).set({
      uid: data['uid'],
      lat: data['lat'],
      lng: data['lng'],
      name: res.name,
      slots: res.slots,
      available: data.slots,
      price: res.price,
      slug: data['slug']
    }).then( () => {
      this.renderUserMarker();
      this.map.closePopup();
    })

  }

  renderUserMarker(){
    let parkings;
    let initMarkers = this.initMarkers;
    let greenIcon = leaflet.icon({
      iconUrl: 'assets/imgs/parking.png',
      iconSize: [35, 40],
    });
    this.storage.get('token').then((uid) => {
      if(uid) {
        parkings = this.afDb.object('parking/'+uid).valueChanges();
        parkings.forEach((r) => {
          for (let i in r){

            let nm = leaflet.marker([r[i].lat, r[i].lng], { icon: greenIcon, draggable: false }).addTo(
              this.map).bindPopup('<h3>'+r[i].name+'</h3><strong>Total Space: '+r[i].slots+'</strong><br><strong>Available Space: '+r[i].available+'</strong><br><strong>Price/hr:</strong> '+r[i].price+'<br/><button data-value="'+i+'" class="button-ios button-ios-info EditParkingCls" ion-button round>Edit</button><button data-value="'+i+'" class="button-ios button-ios-danger  DeleteParkingCls" ion-button round>Delete</button>.').on('popupopen', (d) => {
                    this.el.nativeElement.querySelector('button.DeleteParkingCls').addEventListener('click', (event) => this.deleteParking(event));
                    this.el.nativeElement.querySelector('button.EditParkingCls').addEventListener('click', (event) => this.editParking(event));
                  });
                  initMarkers.push({slug: r[i].slug, ref: nm});
          }
        })
      }     
    });
  }

  logout() {

    if(this.storage.clear()) {
      window.location.reload();
    }
    //this.navCtrl.setRoot(LoginPage);
  }




  /* user functionality */

  renderAllMarker() {
    this.renderCollegeMarker();
    let parkings;
    let initMarkers = this.initMarkers;
    let greenIcon = leaflet.icon({
      iconUrl: 'assets/imgs/parking.png',
      iconSize: [35, 40],
    });
        parkings = this.afDb.object('parking/').valueChanges();
        parkings.forEach((r) => {
          for (let i in r){
            let newD = r[i];
            for(let j in newD) {
              let md = newD[j];
              console.log(md.name);
              let nm = leaflet.marker([md.lat, md.lng], { icon: greenIcon, draggable: false }).addTo(
              this.map).bindPopup('<h3>'+md.name+'</h3><strong>Total Space: '+md.slots+'</strong><br><strong>Available Space: '+md.available+'</strong><br><strong>Price/hr:</strong> '+md.price+'<br/><button data-value="'+i+'" data-slug="'+md.slug+'" class="button-ios button-ios-info EditParkingCls" ion-button round>Book</button>').on('popupopen', (d) => {
                    // this.el.nativeElement.querySelector('button.DeleteParkingCls').addEventListener('click', (event) => this.deleteParking(event));
                    this.el.nativeElement.querySelector('button.EditParkingCls').addEventListener('click', (event) => this.bookParking(event));
                  });
                  initMarkers.push({slug: md.slug, ref: nm});
              console.log(nm);
            }
          }
        })
  }

  renderUserPosition(){
    let greenIcon = leaflet.icon({
      iconUrl: 'assets/imgs/CarMarker.png',
      iconSize: [30, 40],
    });
    this.geolocation.getCurrentPosition().then((resp) => {
     leaflet.marker([resp.coords.latitude, resp.coords.longitude], { icon: greenIcon, draggable: false }).addTo(this.map);
     }).catch((error) => {
     });
  }

  renderCollegeMarker(){
    let greenIcon = leaflet.icon({
      iconUrl: 'assets/imgs/clg.png',
      iconSize: [30, 40],
    });
      leaflet.marker([21.248337, 79.048064], { icon: greenIcon, draggable: false }).addTo(this.map).bindPopup('<h3>JIT Nagpur</h3>');
  }

  bookParking(evt) {
    let parkingUID = evt.path[0].dataset.value;
    let parkingSlug = evt.path[0].dataset.slug;
    this.storage.get('token').then(userId => {
      let parkingData = this.afDb.object('parking/'+parkingUID+'/'+parkingSlug).valueChanges();
      let cnt = 0;
      parkingData.forEach( (r) => {
        let available = r['available'];
        if(cnt == 0){
          +available--;
          cnt++;
        }
          r['available'] = available;
          this.afDb.object('parking/'+parkingUID+'/'+parkingSlug).set(r);
          r['startDate'] = moment().format();
          this.afDb.object('user-parking/'+userId + '/' + parkingSlug).set(r).then( () => {
            window.location.reload();
          });
      })
    })

    // this.afDb.object('users/'+res.user.uid).set({});
  }

  chkCurrentParkedVehical() {
    let __this = this;
    this.storage.get('token').then(userId => {
      let parkingData = this.afDb.object('user-parking/'+userId).valueChanges();
      if(Object.keys(parkingData).length <= 0){
        this.renderAllMarker();
      }
      parkingData.forEach( (r) => {
        if(r === null){
          this.renderAllMarker();
        }

        for(let s in r) {
          let d = r[s];
          var duration = moment.duration(moment().diff(moment(d.startDate)));
          var hours = Math.round(duration.asHours());
          let charge = d.price + (hours * d.price);
          this.geolocation.getCurrentPosition().then((resp) => {
            this.leafRC = leaflet.Routing.control({
              
              waypoints: [
                leaflet.latLng(resp.coords.latitude, resp.coords.longitude),
                leaflet.latLng(d['lat'], d['lng'])
              ],
              routeWhileDragging: true,
              createMarker: function(i, wp, nWps) {
                this.userPaymentMarker = leaflet.marker(wp.latLng).bindPopup('<h3>'+d.name+'</h3><strong>Total fff Space: '+d.slots+'</strong><br><strong>Parking Charge: Rs. '+charge+'</strong><br><strong>Price/hr:</strong> '+d.price+'<br/><button  data-uid="'+userId+'" data-price="'+charge+'" data-hour="'+hours+'" data-slug="'+d.slug+'" class="button-ios button-ios-info ExitParkingCls" id="find-me" ion-button round>Exit</button>').on('popupopen', (d) => {
                  document.getElementById("find-me").addEventListener('click', (event) => __this.exitParkingFn(event));
                })
                return i == 1 ? this.userPaymentMarker : '';
            }
          }).addTo(this.map);

           }).catch((error) => {
           });
        }
      })
    })
  }

  exitParkingFn(ev){
    let data = ev.toElement.dataset;
    let parkingData = this.afDb.object('user-parking/'+data.uid+'/'+data.slug).valueChanges();
    parkingData.forEach( (r) => {
      if(r){
        r['charge'] = data.price;
        r['exitDate'] = moment().format();
        this.afDb.object('user-report/'+data.uid+'/'+data.slug).set(r);
        r['hour'] = data.hour;
        this.showPaymentPopup(r);
        this.leafRC.spliceWaypoints(0, 2);
        this.afDb.object('user-parking/'+data.uid+'/'+data.slug).remove();
      }
    });
    
  }

  testfunction() {
  }

  goAnReportPage() {
    this.navCtrl.setRoot(ReportPage);
  }

  showPaymentPopup(data) {
    const modal = this.modalCtrl.create(PaypopupPage, data);
    modal.present();
  }
}

