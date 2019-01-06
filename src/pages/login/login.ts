import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, LoadingController } from 'ionic-angular';
import { RegisterPage } from '../register/register';
import { AngularFireAuth } from '@angular/fire/auth';
import { HomePage } from '../home/home';
import { Storage } from '@ionic/storage';
import { AngularFireDatabase } from '@angular/fire/database';
import { Observable } from 'rxjs';

@IonicPage()
@Component({
  selector: 'page-login',
  templateUrl: 'login.html',
})
export class LoginPage {

  data: Observable<any>;
  email = '';
  password = '';
  errorMessages = '';
  public loader;
  constructor(public navCtrl: NavController, public navParams: NavParams, public afAuth: AngularFireAuth, public loadingCtrl: LoadingController,  public afDb: AngularFireDatabase, private storage: Storage) {
    this.loader = this.loadingCtrl.create({
      content: 'Loading...'
    });
  }

  ionViewDidLoad() {
    
    console.log('ionViewDidLoad LoginPage');
  }

  goToRegisterPage() {
    this.navCtrl.push(RegisterPage);
  }

  login() {
    this.loader.present();
    this.afAuth.auth.signInAndRetrieveDataWithEmailAndPassword(this.email, this.password).then( (res) => {
      this.data = this.afDb.object('users/'+res.user.uid).valueChanges();
      this.storage.set('token', res.user.uid);
      this.data.forEach((r) => {
        for (let i in r){
          this.storage.set(i, r[i]);
        }        
      })
      this.errorMessages = '';
      this.loader.dismiss();
      this.navCtrl.setRoot(HomePage);
    }).catch( (e) => {
      this.loader.dismiss();
      this.errorMessages = e.message;
    })
  }
}
