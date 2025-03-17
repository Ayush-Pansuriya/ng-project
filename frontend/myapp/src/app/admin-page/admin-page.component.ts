import { Component } from '@angular/core';
import { AdminService } from '../services/admin.service';
import { Router, RouterLink } from '@angular/router';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { jwtDecode } from 'jwt-decode'; // Import jwtDecode

@Component({
  selector: 'app-admin-page',
  standalone: true,
  imports: [NgFor, NgIf, CommonModule,RouterLink],
  templateUrl: './admin-page.component.html',
  styleUrls: ['./admin-page.component.css']
})
export class AdminPageComponent {
  orders: any[] = [];
  isLoading = true;
  errorMessage: string | null = null;
  userEmail: string | null = null;

  constructor(private adminService: AdminService, private router: Router) {
    const token = localStorage.getItem('token');
    if (token) {
      const decoded: any = jwtDecode(token);
      this.userEmail = decoded.email || null;
    }
    this.loadOrders();
  }

  loadOrders() {
    this.isLoading = true;
    this.adminService.getOrders().subscribe({
      next: (orders: any[]) => {
        this.orders = orders;
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Error loading orders:', err);
        this.errorMessage = err.error?.message || 'Failed to load orders';
        this.isLoading = false;
      }
    });
  }

  updateStatus(orderId: string, event: Event) {
    const target = event.target as HTMLSelectElement;
    const status = target.value;
    this.adminService.updateOrderStatus(orderId, status).subscribe({
      next: () => this.loadOrders(),
      error: (err: any) => {
        console.error('Error updating status:', err);
        this.errorMessage = err.error?.message || 'Failed to update status';
      }
    });
  }
  navigateTo(route: string) {
    this.router.navigate([route]);
  }
  logout(){
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }
}