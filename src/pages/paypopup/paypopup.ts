import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';

/**
 * Generated class for the PaypopupPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-paypopup',
  templateUrl: 'paypopup.html',
})
export class PaypopupPage {

  price;
  uid;
  exitDate
  hour;
  constructor(public navCtrl: NavController, public navParams: NavParams) {
    this.price = navParams.get('price');
    this.uid = navParams.get('uid');
    this.exitDate = navParams.get('exitDate');
    this.hour = navParams.get('hour');
    console.log(navParams.get('price'));
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad PaypopupPage');
  }

  dismiss() {
    console.log('dismiss')
    this.navCtrl.pop();
  }

}
