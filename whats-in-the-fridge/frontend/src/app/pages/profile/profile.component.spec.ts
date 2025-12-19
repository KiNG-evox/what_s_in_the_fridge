import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';

import { ProfileComponent } from './profile.component';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  const mockUser: User = {
    _id: 'user123',
    email: 'test@example.com',
    name: 'Test',
    lastname: 'User',
    pseudo: 'testuser',
    profilePicture: '',
    role: 'user' // ✅ required field
  };

  beforeEach(async () => {
    authService = jasmine.createSpyObj('AuthService', ['getCurrentUser', 'updateProfile', 'changePassword']);
    router = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      declarations: [ProfileComponent],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;

    spyOn(console, 'log');
  });

  it('should create component', () => {
    expect(component).toBeTruthy();
  });

  it('should redirect to login if user is not logged in', () => {
    authService.getCurrentUser.and.returnValue(null);

    component.ngOnInit();

    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should initialize formData when user is logged in', () => {
    authService.getCurrentUser.and.returnValue(mockUser);

    component.ngOnInit();

    expect(component.user).toEqual(mockUser);
    expect(component.formData.name).toBe('Test');
    expect(component.formData.lastname).toBe('User');
    expect(component.formData.pseudo).toBe('testuser');
    expect(component.formData.profilePicture).toBe('');
  });

  it('should toggle edit mode', () => {
    component.isEditing = false;

    component.toggleEdit();

    expect(component.isEditing).toBeTrue();
    expect(component.errorMessage).toBe('');
    expect(component.successMessage).toBe('');
  });

  it('should update profile successfully', () => {
    // ✅ include 'success' in mocked response
    authService.updateProfile.and.returnValue(of({ success: true, data: mockUser }));
    component.formData = { ...mockUser, profilePicture: '' };
    component.user = mockUser;

    component.updateProfile();

    expect(authService.updateProfile).toHaveBeenCalledWith(component.formData);
    expect(component.successMessage).toBe('Profile updated successfully!');
    expect(component.isEditing).toBeFalse();
    expect(component.user).toEqual(mockUser);
  });

  it('should handle profile update error', () => {
    authService.updateProfile.and.returnValue(
      throwError(() => ({ error: { message: 'Update failed' } }))
    );
    component.formData = { ...mockUser, profilePicture: '' };

    component.updateProfile();

    expect(component.errorMessage).toBe('Update failed');
    expect(component.isLoading).toBeFalse();
  });

  it('should toggle password form', () => {
    component.showPasswordForm = false;
    component.passwordData = { currentPassword: 'a', newPassword: 'b', confirmPassword: 'c' };
    component.errorMessage = 'error';
    component.successMessage = 'success';

    component.togglePasswordForm();

    expect(component.showPasswordForm).toBeTrue();
    expect(component.passwordData.currentPassword).toBe('');
    expect(component.errorMessage).toBe('');
    expect(component.successMessage).toBe('');
  });

  it('should not change password if passwords do not match', () => {
    component.passwordData.newPassword = '123456';
    component.passwordData.confirmPassword = '123457';

    component.changePassword();

    expect(component.errorMessage).toBe('Passwords do not match');
  });

  it('should not change password if new password is too short', () => {
    component.passwordData.newPassword = '123';
    component.passwordData.confirmPassword = '123';

    component.changePassword();

    expect(component.errorMessage).toBe('Password must be at least 6 characters');
  });

  it('should change password successfully', () => {
    // ✅ include 'success' and 'message' in mocked response
    authService.changePassword.and.returnValue(of({ success: true, message: 'Password changed' }));
    component.passwordData = { currentPassword: 'oldpass', newPassword: '123456', confirmPassword: '123456' };

    component.changePassword();

    expect(authService.changePassword).toHaveBeenCalledWith('oldpass', '123456');
    expect(component.successMessage).toBe('Password changed successfully!');
    expect(component.showPasswordForm).toBeFalse();
  });

  it('should handle error when changing password fails', () => {
    authService.changePassword.and.returnValue(
      throwError(() => ({ error: { message: 'Password error' } }))
    );
    component.passwordData = { currentPassword: 'old', newPassword: '123456', confirmPassword: '123456' };

    component.changePassword();

    expect(component.errorMessage).toBe('Password error');
    expect(component.isLoading).toBeFalse();
  });

  it('should cancel edit and reset formData', () => {
    component.user = mockUser;
    component.isEditing = true;
    component.formData.name = 'Changed';
    component.errorMessage = 'error';
    component.successMessage = 'success';

    component.cancelEdit();

    expect(component.formData.name).toBe('Test');
    expect(component.isEditing).toBeFalse();
    expect(component.errorMessage).toBe('');
    expect(component.successMessage).toBe('');
  });
});
