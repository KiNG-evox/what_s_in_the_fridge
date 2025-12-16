import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: false,
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss'
})
export class FooterComponent {
    showMenu = false;

  constructor(
    public authService: AuthService,
    private router: Router
  ) {}
    currentYear = new Date().getFullYear();
      navigateTo(route: string): void {
    this.router.navigate([route]);
    this.showMenu = false;
  }


}
