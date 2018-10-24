import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, LoadingController } from 'ionic-angular';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFireDatabase } from '@angular/fire/database';

import { HomePage } from '../home/home';

@IonicPage()
@Component({
  selector: 'page-register',
  templateUrl: 'register.html',
})
export class RegisterPage {

  registerForm: FormGroup;
  formInvalid = false;
  isSubmit = false;
  globalErrorMessages = [];
  public loader;
  public accountTypeOptions = [
    {
      slug: 'user',
      title: 'User'
    },
    {
      slug: 'parking-provider',
      title: 'Parking Provider'
    }
  ]
  
  constructor(public navCtrl: NavController, public navParams: NavParams, public formBuilder: FormBuilder, public afAuth: AngularFireAuth, public afDb: AngularFireDatabase, public loadingCtrl: LoadingController) {
    this.registerForm = formBuilder.group({
        name: ['', Validators.required],
        email: ['', Validators.required],
        password: ['', Validators.required],
        accountType: ['', Validators.required]
    });
    this.loader = this.loadingCtrl.create({
      content: 'Loading...'
    });
  }

  ionViewDidLoad() {
  }


  registration() {
    this.isSubmit = true;
    this.loader.present();
    if (this.registerForm.valid) {
      this.formInvalid = false;
      this.globalErrorMessages = [];
      this.afAuth.auth.createUserWithEmailAndPassword(this.registerForm.controls.email.value, this.registerForm.controls.password.value).then( (res) => {
          /* save user information */
          this.loader.dismiss();
          this.afDb.object(res.user.uid).set({name: this.registerForm.controls.name.value, email: this.registerForm.controls.email.value, accountType: this.registerForm.controls.accountType.value}).then( r => {
            this.navCtrl.setRoot(HomePage);
          }).catch( e => {
            this.loader.dismiss();
            this.formInvalid = true;
            this.globalErrorMessages = [];
            this.globalErrorMessages.push(e['message']);
          });
      }).catch( (e) => {
        this.loader.dismiss();
        this.formInvalid = true;
        this.globalErrorMessages = [];
        this.globalErrorMessages.push(e['message']);
      })
      // this.afAuth.auth.signInWithPopup(new auth.GoogleAuthProvider());
    } else {
      this.loader.dismiss();
      this.formInvalid = true;
      this.globalErrorMessages = [];
      this.globalErrorMessages.push('Please fill out all details accurately.');
    }
  }

}
