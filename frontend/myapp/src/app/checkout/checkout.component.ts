import { Component } from '@angular/core';
import { CartService } from '../cart.service';
import { Router } from '@angular/router';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { animate, state, style, transition, trigger } from '@angular/animations';
interface CartItem {
  product: {
    _id: string;
    name: string;
    price: number;
    image: string;
    description: string;
    category: string;
    stock: number;
    pid: number;
  };
  quantity: number;
  price: number;
}

interface PaymentDetails {
  cardNumber?: string;
  expiryDate?: string;
  cvv?: string;
  accountNumber?: string;
  routingNumber?: string;
  paypalEmail?: string;
}

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [NgFor, NgIf, CommonModule, ReactiveFormsModule],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css'],
  animations: [
    trigger('fadeInOut', [
      state('void', style({ opacity: 0 })),
      transition(':enter, :leave', [animate(500)]),
    ]),
  ]
  
})

export class CheckoutComponent {
  cartItems: CartItem[] = [];
  checkoutForm: FormGroup;
  isLoading = false;
  successMessage: string | null = null;

  constructor(private cartService: CartService, private router: Router, private fb: FormBuilder) {
    this.checkoutForm = this.fb.group({
      shippingAddress: ['', [Validators.required]],
      paymentMethod: ['', [Validators.required]],
      cardNumber: [''],
      expiryDate: [''],
      cvv: [''],
      accountNumber: [''],
      routingNumber: [''],
      paypalEmail: ['']
    });
    this.loadCart();
  }

  loadCart() {
    this.cartService.getCart().subscribe({
      next: (cart) => {
        this.cartItems = cart.items || [];
      },
      error: (err) => console.error('Error loading cart:', err)
    });
  }

  onPaymentMethodChange() {
    const paymentMethod = this.checkoutForm.get('paymentMethod')?.value;
    // Clear previous payment details
    this.checkoutForm.get('cardNumber')?.reset();
    this.checkoutForm.get('expiryDate')?.reset();
    this.checkoutForm.get('cvv')?.reset();
    this.checkoutForm.get('accountNumber')?.reset();
    this.checkoutForm.get('routingNumber')?.reset();
    this.checkoutForm.get('paypalEmail')?.reset();

    // Add validators based on payment method
    if (paymentMethod === 'credit-card') {
      this.checkoutForm.get('cardNumber')?.setValidators([Validators.required, Validators.pattern('^[0-9]{16}$')]);
      this.checkoutForm.get('expiryDate')?.setValidators([Validators.required, Validators.pattern('^(0[1-9]|1[0-2])\/[0-9]{2}$')]);
      this.checkoutForm.get('cvv')?.setValidators([Validators.required, Validators.pattern('^[0-9]{3,4}$')]);
    } else if (paymentMethod === 'bank-transfer') {
      this.checkoutForm.get('accountNumber')?.setValidators([Validators.required, Validators.pattern('^[0-9]{8,17}$')]);
      this.checkoutForm.get('routingNumber')?.setValidators([Validators.required, Validators.pattern('^[0-9]{9}$')]);
    } else if (paymentMethod === 'paypal') {
      this.checkoutForm.get('paypalEmail')?.setValidators([Validators.required, Validators.email]);
    }

    // Update validators
    this.checkoutForm.get('cardNumber')?.updateValueAndValidity();
    this.checkoutForm.get('expiryDate')?.updateValueAndValidity();
    this.checkoutForm.get('cvv')?.updateValueAndValidity();
    this.checkoutForm.get('accountNumber')?.updateValueAndValidity();
    this.checkoutForm.get('routingNumber')?.updateValueAndValidity();
    this.checkoutForm.get('paypalEmail')?.updateValueAndValidity();
  }

  onSubmit() {
    if (this.checkoutForm.valid) {
      this.isLoading = true;
      const { shippingAddress, paymentMethod, cardNumber, expiryDate, cvv, accountNumber, routingNumber, paypalEmail } = this.checkoutForm.value;
      const paymentDetails: PaymentDetails = {};
      if (paymentMethod === 'credit-card') {
        paymentDetails.cardNumber = cardNumber;
        paymentDetails.expiryDate = expiryDate;
        paymentDetails.cvv = cvv;
      } else if (paymentMethod === 'bank-transfer') {
        paymentDetails.accountNumber = accountNumber;
        paymentDetails.routingNumber = routingNumber;
      } else if (paymentMethod === 'paypal') {
        paymentDetails.paypalEmail = paypalEmail;
      }

      this.cartService.checkout(shippingAddress, paymentMethod, paymentDetails).subscribe({
        next: (response) => {
          this.successMessage = response.message;
          this.isLoading = false;
          setTimeout(() => this.router.navigate(['/mainpage']), 2000);
        },
        error: (err) => {
          console.error('Checkout error:', err);
          this.isLoading = false;
        }
      });
    }
  }

  getTotal(): number {
    return this.cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  }
  navigatetohome(){
    this.router.navigate(['/mainpage']);
  }
}
