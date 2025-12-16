import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-profile',
  standalone:false,
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  user: User | null = null;
  isEditing = false;
  
  formData = {
    name: '',
    lastname: '',
    pseudo: '',
    profilePicture: ''
  };

  passwordData = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  showPasswordForm = false;
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();
    if (!this.user) {
      this.router.navigate(['/login']);
      return;
    }

    this.formData = {
      name: this.user.name,
      lastname: this.user.lastname,
      pseudo: this.user.pseudo,
      profilePicture: this.user.profilePicture || ''
    };
  }

  toggleEdit(): void {
    this.isEditing = !this.isEditing;
    this.errorMessage = '';
    this.successMessage = '';
  }

  updateProfile(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.updateProfile(this.formData).subscribe({
      next: (response) => {
        console.log('Profile updated', response);
        this.successMessage = 'Profile updated successfully!';
        this.isEditing = false;
        this.isLoading = false;
        this.user = response.data;
      },
      error: (error) => {
        console.error('Error updating profile', error);
        this.errorMessage = error.error?.message || 'Failed to update profile';
        this.isLoading = false;
      }
    });
  }

  togglePasswordForm(): void {
    this.showPasswordForm = !this.showPasswordForm;
    this.passwordData = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    };
    this.errorMessage = '';
    this.successMessage = '';
  }

  changePassword(): void {
    if (this.passwordData.newPassword !== this.passwordData.confirmPassword) {
      this.errorMessage = 'Passwords do not match';
      return;
    }

    if (this.passwordData.newPassword.length < 6) {
      this.errorMessage = 'Password must be at least 6 characters';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.changePassword(
      this.passwordData.currentPassword,
      this.passwordData.newPassword
    ).subscribe({
      next: (response) => {
        console.log('Password changed', response);
        this.successMessage = 'Password changed successfully!';
        this.showPasswordForm = false;
        this.isLoading = false;
        this.passwordData = {
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        };
      },
      error: (error) => {
        console.error('Error changing password', error);
        this.errorMessage = error.error?.message || 'Failed to change password';
        this.isLoading = false;
      }
    });
  }

  cancelEdit(): void {
    if (this.user) {
      this.formData = {
        name: this.user.name,
        lastname: this.user.lastname,
        pseudo: this.user.pseudo,
        profilePicture: this.user.profilePicture || ''
      };
    }
    this.isEditing = false;
    this.errorMessage = '';
    this.successMessage = '';
  }
}