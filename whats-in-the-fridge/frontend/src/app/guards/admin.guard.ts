import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    const user = this.authService.getCurrentUser();
    
    // Check if user is logged in AND is admin
    if (user && user.role === 'admin') {
      return true;
    }
    
    // Not admin, redirect to home
    alert('Access denied. Admin only.');
    this.router.navigate(['/home']);
    return false;
  }
}