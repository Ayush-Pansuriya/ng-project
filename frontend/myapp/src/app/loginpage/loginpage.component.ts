import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgIf } from '@angular/common';
import { jwtDecode } from 'jwt-decode'; // Correct import

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [NgIf, FormsModule, ReactiveFormsModule,RouterLink],
  templateUrl: './loginpage.component.html',
  styleUrls: ['./loginpage.component.css']
})
export class LoginPageComponent implements OnInit {
  loginForm: FormGroup;
  errorMessage: string = '';
  isloggedIn: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    localStorage.removeItem('token');
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;
      this.authService.login(email, password).subscribe(
        (response: any) => {
          const token = response.token;
          localStorage.setItem('token', token);

          const decodedToken: any = jwtDecode(token);
          const role = decodedToken.role;

          if (role === 'admin') {
            this.router.navigate(['/admin']);
          } else if (role === 'user') {
            this.router.navigate(['/mainpage']);
          } else {
            this.errorMessage = 'Unknown role';
            localStorage.removeItem('token');
            this.router.navigate(['/login']);
          }
        },
        (error: any) => {
          this.errorMessage = 'Invalid email or password';
        }
      );
    }
  }
}