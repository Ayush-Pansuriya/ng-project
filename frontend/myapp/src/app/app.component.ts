import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { isPlatformBrowser } from '@angular/common';
import { CartService } from './cart.service';  //  Import Cart Service

@Component({
  selector: 'app-root',
  standalone: true,  //  Add this for standalone components
  imports: [RouterModule, ReactiveFormsModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']  //  Fix `styleUrl` to `styleUrls`
})
export class AppComponent implements OnInit {
  cart: any[] = [];
  title = 'myapp';

  constructor(
    private cartService: CartService,
    private router: Router,  //  Inject Router correctly
    @Inject(PLATFORM_ID) private platformId: any
  ) {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('key', 'value');
    }
  }

  ngOnInit() {
    //  Ensure this runs only in the browser
    if (isPlatformBrowser(this.platformId)) {
      this.cartService.getCart().subscribe(cart => {
        this.cart = cart;
      });
      console.log('User Cart:', this.cart);

      if (localStorage.getItem('authToken')) {
        this.router.navigate(['/app-mainpage']);
      }
    }
  }
}
