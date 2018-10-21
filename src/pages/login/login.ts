import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
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
  constructor(public navCtrl: NavController, public navParams: NavParams, public afAuth: AngularFireAuth) {
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad LoginPage');
  }

  goToRegisterPage() {
    this.navCtrl.push(RegisterPage);
  }

  login() {
    this.afAuth.auth.signInAndRetrieveDataWithEmailAndPassword(this.email, this.password).then( (res) => {
      this.errorMessages = '';
      this.navCtrl.setRoot(HomePage);
    }).catch( (e) => {
      this.errorMessages = e.message;
    })
    console.log(this.email);
  }
}
