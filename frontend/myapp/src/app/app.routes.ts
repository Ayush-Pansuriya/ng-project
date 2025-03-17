import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginPageComponent } from './loginpage/loginpage.component';
import { MainPageComponent } from './mainpage/mainpage.component';
import { CartPageComponent } from './cartpage/cartpage.component';
import { RegisterComponent } from './register/register.component';
import { AuthGuard } from './auth.guard';
import { CheckoutComponent } from './checkout/checkout.component';
import { AdminPageComponent } from './admin-page/admin-page.component';
import { AddadminComponent } from './addadmin/addadmin.component';
import { AdminproductComponent } from './adminproduct/adminproduct.component';
import { AdminuserdashbordComponent } from './adminuserdashbord/adminuserdashbord.component';

 export  const routes: Routes = [
  { path: 'login', component: LoginPageComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'mainpage', component: MainPageComponent, canActivate: [AuthGuard] },
  { path: 'cart', component: CartPageComponent, canActivate: [AuthGuard] },
  { path: 'checkout', component: CheckoutComponent, canActivate: [AuthGuard] },
  { path: 'admin', component: AdminPageComponent, canActivate: [AuthGuard] },
  { path: 'addadmin', component: AddadminComponent, canActivate: [AuthGuard] },
  { path: 'adminproduct', component: AdminproductComponent, canActivate: [AuthGuard] },
  { path: 'adminuserdashbord', component: AdminuserdashbordComponent, canActivate: [AuthGuard] },
  { path: '', redirectTo: '/login', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

