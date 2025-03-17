import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-addadmin',
  standalone: true,
  imports: [NgIf, ReactiveFormsModule, FormsModule],
  templateUrl: './addadmin.component.html',
  styleUrls: ['./addadmin.component.css']
})
export class AddadminComponent implements OnInit {
  registerForm: FormGroup;
  otpForm: FormGroup;
  errorMessage: string = '';
  successMessage: string = '';
  showOTPForm: boolean = false;
  constructor(
    private authService: AuthService,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    this.otpForm = this.fb.group({
      otp: ['', [Validators.required, Validators.pattern('^[0-9]{6}$')]]
    });
  }

  ngOnInit(): void {}

  onSubmit(): void {
    if (this.registerForm.valid) {
      const { email, password } = this.registerForm.value;
      console.log('Sending OTP for:', { email, password });
      this.authService.sendOTP(email, password).subscribe({
        next: (response: any) => {
          console.log('Send OTP response:', response);
          this.successMessage = response.message;
          this.errorMessage = '';
          this.showOTPForm = true;
        },
        error: (error: any) => {
          console.error('Send OTP error:', error);
          this.errorMessage = error.error?.message || 'Failed to send OTP';
          this.successMessage = '';
        }
      });
    } else {
      this.errorMessage = 'Please fill out the form correctly';
    }
  }

  onVerifyOTPadmin(): void {
    if (this.otpForm.valid) {
      const { email } = this.registerForm.value;
      const { otp } = this.otpForm.value;
      console.log('Verifying OTP:', { email, otp });
      this.authService.verifyOTPadmin(email, otp).subscribe({
        next: (response: any) => {
          console.log('Verify OTP response:', response);
          localStorage.setItem('token', response.token);
          this.successMessage = response.message;
          this.errorMessage = '';
          setTimeout(() => this.router.navigate(['/mainpage']), 1000);
        },
        error: (error: any) => {
          console.error('Verify OTP error:', error);
          this.errorMessage = error.error?.message || 'Failed to verify OTP';
          this.successMessage = '';
        }
      });
    } else {
      this.errorMessage = 'Please enter a valid 6-digit OTP';
    }
  }
}
