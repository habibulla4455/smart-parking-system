import { Component, ViewChild, ElementRef } from '@angular/core';
import { NavController } from 'ionic-angular';
import leaflet from 'leaflet';
import { FabContainer } from 'ionic-angular';
import { AlertController } from 'ionic-angular';
import { Storage } from '@ionic/storage';
import { AngularFireDatabase } from '@angular/fire/database';

import { LoginPage } from '../login/login';

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
  constructor(public navCtrl: NavController, private el: ElementRef, private alertCtrl: AlertController, private storage: Storage, public afDb: AngularFireDatabase) {
    //storage.clear();
    storage.get('accountType').then(r => {
      this.accountType = r;
      console.log(this.accountType);
    })
  }

  ionViewDidEnter() {
    this.loadmap();
    //this.presentPrompt();
    this.renderUserMarker();
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
    this.newm = leaflet.marker([this.userLatLng.lat, this.userLatLng.lng], { icon: greenIcon, draggable: true }).addTo(this.map)
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
    console.log('Event: add parking');
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
    console.log(ele);
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
    console.log(ele);
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
              this.map).bindPopup('<h3>'+r[i].name+'</h3><strong>Total Space: '+r[i].slots+'</strong><br><strong>Available Space: '+r[i].available+'</strong><br><strong>Price/hr:</strong> '+r[i].price+'<br/><button class="button-ios button-ios-secondary" ion-button round>Details</button><button data-value="'+i+'" class="button-ios button-ios-info EditParkingCls" ion-button round>Edit</button><button data-value="'+i+'" class="button-ios button-ios-danger  DeleteParkingCls" ion-button round>Delete</button>.').on('popupopen', (d) => {
                    this.el.nativeElement.querySelector('button.DeleteParkingCls').addEventListener('click', (event) => this.deleteParking(event));
                    this.el.nativeElement.querySelector('button.EditParkingCls').addEventListener('click', (event) => this.editParking(event));
                  });
                  initMarkers.push({slug: r[i].slug, ref: nm});
          }
        })
      } else {
        let altr = this.alertCtrl.create({
          title: 'Something went wrong please try again!'
        })
        altr.present();
      }      
    });
  }

  logout() {
    this.storage.clear();
    this.navCtrl.setRoot(LoginPage);
  }
}

