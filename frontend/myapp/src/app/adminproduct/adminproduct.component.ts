import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ProductService } from '../services/product.service';

@Component({
  selector: 'app-adminproduct',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './adminproduct.component.html',
  styleUrls: ['./adminproduct.component.css']
})
export class AdminproductComponent implements OnInit {
  selectedProduct: any = {
    name: '',
    price: 0,
    image: null,
    description: '',
    category: '',
    stock: 0,
    pid: 0,
    imagePreviewUrl: ''
  };
  products: any[] = [];
  isEditMode: boolean = false;
  showImagePreview: boolean = false;
  formSubmitted: boolean = false;

  constructor(private productService: ProductService) {}

  ngOnInit() {
    this.getProducts();
  }

  getProducts() {
    this.productService.getProducts().subscribe({
      next: (products) => {
        this.products = products.map((product: { image: any; } ) => ({
          ...product,
          image: product.image ? product.image : '' // Ensure image is a string
        }));
        console.log('Products loaded:', this.products);
      },
      error: (err) => console.error('Error loading products:', err)
    });
  }

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedProduct.image = input.files[0];
      this.selectedProduct.imagePreviewUrl = URL.createObjectURL(input.files[0]);
      this.showImagePreview = true;
      console.log('Selected image preview URL:', this.selectedProduct.imagePreviewUrl);
    }
  }

  onSubmit(form: NgForm) {
    this.formSubmitted = true;

    if (!this.isEditMode && !this.selectedProduct.image) {
      console.log('No image selected for new product');
      return;
    }

    if (form.invalid) {
      console.log('Form invalid:', form);
      return;
    }

    const formData = new FormData();
    formData.append('name', this.selectedProduct.name);
    formData.append('price', this.selectedProduct.price.toString());
    if (this.selectedProduct.image instanceof File) {
      formData.append('image', this.selectedProduct.image);
    }
    formData.append('description', this.selectedProduct.description || '');
    formData.append('category', this.selectedProduct.category || '');
    formData.append('stock', this.selectedProduct.stock.toString());
    formData.append('pid', this.selectedProduct.pid.toString());

    if (this.isEditMode) {
      this.productService.updateProduct(formData, this.selectedProduct._id).subscribe({
        next: (response) => {
          console.log('Product updated:', response);
          this.getProducts();
          this.resetForm();
          this.isEditMode = false;
        },
        error: (err) => console.error('Error updating product:', err)
      });
    } else {
      this.productService.addProduct(formData).subscribe({
        next: (response) => {
          console.log('Product added:', response);
          // Add the new product to the list immediately and refresh
          this.products.push(response);
          this.getProducts(); // Ensure full sync with backend
          this.resetForm();
        },
        error: (err) => console.error('Error adding product:', err)
      });
    }
  }

  editProduct(product: any) {
    this.selectedProduct = { ...product, image: null, imagePreviewUrl: product.image };
    this.isEditMode = true;
    this.showImagePreview = !!product.image;
    this.formSubmitted = false;
  }

  deleteProduct(pid: string) {
    if (confirm('Are you sure you want to delete this product?')) {
      this.productService.deleteProduct(pid).subscribe({
        next: () => {
          console.log('Product deleted:', pid);
          this.getProducts();
        },
        error: (err) => console.error('Error deleting product:', err)
      });
    }
  }

  resetForm() {
    this.selectedProduct = {
      name: '',
      price: 0,
      image: null,
      description: '',
      category: '',
      stock: 0,
      pid: 0,
      imagePreviewUrl: ''
    };
    this.isEditMode = false;
    this.showImagePreview = false;
    this.formSubmitted = false;
  }
}