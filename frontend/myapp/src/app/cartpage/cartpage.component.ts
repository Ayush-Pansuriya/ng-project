import { Component, OnInit } from '@angular/core';
import { CartService } from '../cart.service';
import { Router, RouterLink } from '@angular/router';
import { CommonModule, NgFor, NgIf } from '@angular/common';

@Component({
  selector: 'app-cartpage',
  standalone: true,
  imports: [NgFor, NgIf, CommonModule, RouterLink],
  templateUrl: './cartpage.component.html',
  styleUrls: ['./cartpage.component.css']
})
export class CartPageComponent implements OnInit {
  cart: any = { items: [], totalPrice: 0, totalQuantity: 0 };
  isLoading = true;
  errorMessage: string | null = null;

  constructor(private cartService: CartService, private router: Router) {}

  ngOnInit(): void {
    this.checkAuthentication();
    this.loadCart();
  }

  checkAuthentication() {
    const token = localStorage.getItem('token');
    if (!token) {
      this.router.navigate(['/login']);
    }
  }

  loadCart() {
    this.isLoading = true;
    this.cartService.getCart().subscribe({
      next: (cart: any) => {
        console.log('Cart data:', JSON.stringify(cart, null, 2));
        this.cart = cart || { items: [], totalPrice: 0, totalQuantity: 0 };
        console.log('Assigned cart:', this.cart); // Debug to confirm assignment
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Error loading cart:', err);
        this.errorMessage = err.error?.message || 'Failed to load cart';
        this.isLoading = false;
      }
    });
  }

  incrementQuantity(id: string) {
    if (!id) {
      this.errorMessage = 'Product ID is undefined';
      console.warn('Attempted to increment with undefined ID');
      return;
    }
    this.isLoading = true;
    this.cartService.incrementQuantity(id).subscribe({
      next: (response: any) => {
        console.log('Increment response:', response);
        this.cart = response.cart || this.cart;
        this.errorMessage = null;
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Error incrementing quantity:', err);
        this.errorMessage = err.error?.message || 'Failed to increment quantity';
        this.isLoading = false;
      }
    });
  }

  decrementQuantity(id: string) {
    if (!id) {
      this.errorMessage = 'Product ID is undefined';
      console.warn('Attempted to decrement with undefined ID');
      return;
    }
    this.isLoading = true;
    this.cartService.decrementQuantity(id).subscribe({
      next: (response: any) => {
        console.log('Decrement response:', response);
        this.cart = response.cart || this.cart;
        this.errorMessage = null;
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Error decrementing quantity:', err);
        this.errorMessage = err.error?.message || 'Failed to decrement quantity';
        this.isLoading = false;
      }
    });
  }

  removeFromCart(pid: string) { // Use pid to match backend /remove endpoint
    if (!pid) {
      this.errorMessage = 'Product PID is undefined';
      console.warn('Attempted to remove with undefined PID');
      return;
    }
    this.isLoading = true;
    this.cartService.removeFromCart(pid).subscribe({
      next: (response: any) => {
        console.log('Remove response:', response);
        this.cart = response.cart || this.cart;
        this.errorMessage = null;
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Error removing from cart:', err);
        this.errorMessage = err.error?.message || 'Failed to remove from cart';
        this.isLoading = false;
      }
    });
  }

  navigateToCheckout() {
    this.router.navigate(['/checkout']);
  }

  navigateToHome(): void {
    this.router.navigate(['/mainpage']);
  }

  onImageError(event: Event) {
    console.error('Image failed to load:', (event.target as HTMLImageElement).src);
    (event.target as HTMLImageElement).src = '/assets/image-placeholder.png';
  }
}