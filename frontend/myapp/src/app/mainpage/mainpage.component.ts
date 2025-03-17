import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CartService } from '../cart.service';
import { ProductService } from '../services/product.service';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NgFor } from '@angular/common';

@Component({
  selector: 'app-mainpage',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './mainpage.component.html',
  styleUrls: ['./mainpage.component.css']
})
export class MainPageComponent {
  products: any[] = [];
  filteredProducts: any[] = [];

  constructor(
    private router: Router,
    private cartService: CartService,
    private productService: ProductService
  ) {
    this.checkAuthentication();
  }

  ngOnInit() {
    this.productService.getProducts().subscribe(
      (data) => {
        this.products = data;
        this.filteredProducts = [...this.products];
      },
      (error) => console.error('Error fetching products:', error)
    );
  }

  checkAuthentication() {
    const token = localStorage.getItem('token');
    if (!token) {
      this.router.navigate(['/login']);
    }
  }

  addToCart(_id: string, quantity: Number = 1) {
    this.cartService.addToCart(_id, quantity).subscribe({
      next: (response: any) => {
        console.log('Added to cart:', response);
        alert('Product added to cart successfully!');
      },
      error: (error: any) => {
        console.error('Error adding to cart:', error);
        alert('Failed to add product to cart. Please try again.');
      }
    });
  }

  filterByCategory(category: string) {
    if (category === 'All') {
      this.filteredProducts = [...this.products];
    } else {
      this.filteredProducts = this.products.filter(product => product.category === category);
    }
  }
}