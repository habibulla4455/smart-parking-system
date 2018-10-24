import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, LoadingController } from 'ionic-angular';
import { RegisterPage } from '../register/register';
import { AngularFireAuth } from '@angular/fire/auth';
import { HomePage } from '../home/home';

@IonicPage()
@Component({
  selector: 'page-login',
  templateUrl: 'login.html',
})
export class LoginPage {

  email = '';
  password = '';
  errorMessages = '';
  public loader;
  constructor(public navCtrl: NavController, public navParams: NavParams, public afAuth: AngularFireAuth, public loadingCtrl: LoadingController) {
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
      this.errorMessages = '';
      this.loader.dismiss();
      this.navCtrl.setRoot(HomePage);
    }).catch( (e) => {
      this.loader.dismiss();
      this.errorMessages = e.message;
    })
  }
}
