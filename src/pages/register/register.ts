import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AngularFireAuth } from '@angular/fire/auth';
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
  
  constructor(public navCtrl: NavController, public navParams: NavParams, public formBuilder: FormBuilder, public afAuth: AngularFireAuth) {
    this.registerForm = formBuilder.group({
        name: ['', Validators.required],
        email: ['', Validators.required],
        password: ['', Validators.required],
        accountType: ['', Validators.required]
    });
  }

  ionViewDidLoad() {
  }


  registration() {
    this.isSubmit = true;
    if (this.registerForm.valid) {
      this.formInvalid = false;
      this.globalErrorMessages = [];
      this.afAuth.auth.createUserWithEmailAndPassword(this.registerForm.controls.email.value, this.registerForm.controls.password.value).then( (res) => {
          // this.navCtrl.push(HomePage);
          this.navCtrl.setRoot(HomePage);
          console.log('successfully logged in')
      }).catch( (e) => {
        this.formInvalid = true;
          this.globalErrorMessages = [];
          this.globalErrorMessages.push(e['message']);
      })
      // this.afAuth.auth.signInWithPopup(new auth.GoogleAuthProvider());
    } else {
      this.formInvalid = true;
      this.globalErrorMessages = [];
      this.globalErrorMessages.push('Please fill out all details accurately.');
    }
  }

}
