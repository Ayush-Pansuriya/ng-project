import { Component } from '@angular/core';
import { AdminService } from '../services/admin.service';
import { CommonModule, NgFor } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-adminuserdashbord',
  imports: [CommonModule,ReactiveFormsModule,NgFor],
  templateUrl: './adminuserdashbord.component.html',
  styleUrl: './adminuserdashbord.component.css'
})
export class AdminuserdashbordComponent {
  users: any[] = [];

  constructor(private adminservice: AdminService) { }
    ngOnInit() {
    this.getallusers();
  }
  deleteUser(email: any) {
    this.adminservice.deleteUser(email).subscribe({
      next: (response) => {
        this.getallusers();
        console.log('User deleted:', response);
      }
    });
    }
   getallusers() {
    this.adminservice.getallusers().subscribe({
      next: (users) => {
        this.users = users;
        console.log('Users loaded:', this.users);
      },
      error: (error) => console.error('Error fetching users:', error)
    });
    }

}
