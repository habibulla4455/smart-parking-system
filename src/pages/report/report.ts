import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { Storage } from '@ionic/storage';
import { AngularFireDatabase } from '@angular/fire/database';
import { HomePage } from '../home/home';

@IonicPage()
@Component({
  selector: 'page-report',
  templateUrl: 'report.html',
})
export class ReportPage {

  uid = '';
  reports = [];
  constructor(
    public navCtrl: NavController, 
    public navParams: NavParams, 
    private storage: Storage, 
    public afDb: AngularFireDatabase
    ) {
  }

  ionViewDidLoad() {
    this.storage.get('token').then(r => {
      this.uid = r;
    })
    
    let reports = this.afDb.object('user-report/'+this.uid).valueChanges();
    reports.forEach((r) => {          
      for (let i in r) {
        let newD = r[i];
        for( let j in newD ) {
          this.reports.push(newD[j]);
        }
      }
    });
  }

  goToHomePage() {
    this.navCtrl.setRoot(HomePage);
  }
}
