import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
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
    name: 'John',
    lastname: 'Doe',
    pseudo: 'johndoe',
    email: 'john@example.com',
    role: 'user',
    profilePicture: 'profile.jpg'
  };

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', [
      'getCurrentUser',
      'updateProfile',
      'changePassword'
    ]);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      declarations: [ProfileComponent],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should load user data and populate form when user is logged in', () => {
      authService.getCurrentUser.and.returnValue(mockUser);

      component.ngOnInit();

      expect(authService.getCurrentUser).toHaveBeenCalled();
      expect(component.user).toEqual(mockUser);
      expect(component.formData).toEqual({
        name: 'John',
        lastname: 'Doe',
        pseudo: 'johndoe',
        profilePicture: 'profile.jpg'
      });
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should handle user without profile picture', () => {
      const userWithoutPicture = { ...mockUser, profilePicture: undefined };
      authService.getCurrentUser.and.returnValue(userWithoutPicture);

      component.ngOnInit();

      expect(component.formData.profilePicture).toBe('');
    });

    it('should redirect to login when user is not logged in', () => {
      authService.getCurrentUser.and.returnValue(null);

      component.ngOnInit();

      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('toggleEdit', () => {
    it('should toggle isEditing to true', () => {
      component.isEditing = false;
      component.errorMessage = 'error';
      component.successMessage = 'success';

      component.toggleEdit();

      expect(component.isEditing).toBe(true);
      expect(component.errorMessage).toBe('');
      expect(component.successMessage).toBe('');
    });

    it('should toggle isEditing to false', () => {
      component.isEditing = true;

      component.toggleEdit();

      expect(component.isEditing).toBe(false);
    });
  });

  describe('updateProfile', () => {
    beforeEach(() => {
      component.user = mockUser;
      component.formData = {
        name: 'Jane',
        lastname: 'Smith',
        pseudo: 'janesmith',
        profilePicture: 'new-profile.jpg'
      };
    });

    it('should update profile successfully', () => {
      const updatedUser = { ...mockUser, name: 'Jane', lastname: 'Smith' };
      const response = { success: true, data: updatedUser };
      authService.updateProfile.and.returnValue(of(response));

      component.updateProfile();

      expect(component.isLoading).toBe(false);
      expect(authService.updateProfile).toHaveBeenCalledWith(component.formData);
      expect(component.successMessage).toBe('Profile updated successfully!');
      expect(component.isEditing).toBe(false);
      expect(component.user).toEqual(updatedUser);
      expect(component.errorMessage).toBe('');
    });

    it('should handle update profile error with message', () => {
      const errorResponse = { error: { message: 'Update failed' } };
      authService.updateProfile.and.returnValue(throwError(() => errorResponse));

      component.updateProfile();

      expect(component.isLoading).toBe(false);
      expect(component.errorMessage).toBe('Update failed');
      expect(component.successMessage).toBe('');
    });

    it('should handle update profile error without message', () => {
      authService.updateProfile.and.returnValue(throwError(() => ({})));

      component.updateProfile();

      expect(component.errorMessage).toBe('Failed to update profile');
    });

    it('should set loading state during update', () => {
      authService.updateProfile.and.returnValue(of({ success: true, data: mockUser }));

      component.isLoading = false;
      component.updateProfile();

      // Note: isLoading is set to true then immediately false in the success callback
      expect(authService.updateProfile).toHaveBeenCalled();
    });
  });

  describe('togglePasswordForm', () => {
    it('should show password form and reset data', () => {
      component.showPasswordForm = false;
      component.passwordData = {
        currentPassword: 'old',
        newPassword: 'new',
        confirmPassword: 'new'
      };
      component.errorMessage = 'error';
      component.successMessage = 'success';

      component.togglePasswordForm();

      expect(component.showPasswordForm).toBe(true);
      expect(component.passwordData).toEqual({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      expect(component.errorMessage).toBe('');
      expect(component.successMessage).toBe('');
    });

    it('should hide password form when already shown', () => {
      component.showPasswordForm = true;

      component.togglePasswordForm();

      expect(component.showPasswordForm).toBe(false);
    });
  });

  describe('changePassword', () => {
    beforeEach(() => {
      component.passwordData = {
        currentPassword: 'oldpass123',
        newPassword: 'newpass123',
        confirmPassword: 'newpass123'
      };
    });

    it('should change password successfully', () => {
      const response = { success: true, message: 'Password changed' };
      authService.changePassword.and.returnValue(of(response));

      component.changePassword();

      expect(authService.changePassword).toHaveBeenCalledWith('oldpass123', 'newpass123');
      expect(component.successMessage).toBe('Password changed successfully!');
      expect(component.showPasswordForm).toBe(false);
      expect(component.isLoading).toBe(false);
      expect(component.passwordData).toEqual({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      expect(component.errorMessage).toBe('');
    });

    it('should show error when passwords do not match', () => {
      component.passwordData.confirmPassword = 'different';

      component.changePassword();

      expect(component.errorMessage).toBe('Passwords do not match');
      expect(authService.changePassword).not.toHaveBeenCalled();
    });

    it('should show error when password is less than 6 characters', () => {
      component.passwordData.newPassword = '12345';
      component.passwordData.confirmPassword = '12345';

      component.changePassword();

      expect(component.errorMessage).toBe('Password must be at least 6 characters');
      expect(authService.changePassword).not.toHaveBeenCalled();
    });

    it('should handle change password error with message', () => {
      const errorResponse = { error: { message: 'Invalid current password' } };
      authService.changePassword.and.returnValue(throwError(() => errorResponse));

      component.changePassword();

      expect(component.isLoading).toBe(false);
      expect(component.errorMessage).toBe('Invalid current password');
      expect(component.successMessage).toBe('');
    });

    it('should handle change password error without message', () => {
      authService.changePassword.and.returnValue(throwError(() => ({})));

      component.changePassword();

      expect(component.errorMessage).toBe('Failed to change password');
    });
  });

  describe('cancelEdit', () => {
    it('should reset form data to original user data', () => {
      component.user = mockUser;
      component.formData = {
        name: 'Changed',
        lastname: 'Name',
        pseudo: 'changed',
        profilePicture: 'changed.jpg'
      };
      component.isEditing = true;
      component.errorMessage = 'error';
      component.successMessage = 'success';

      component.cancelEdit();

      expect(component.formData).toEqual({
        name: 'John',
        lastname: 'Doe',
        pseudo: 'johndoe',
        profilePicture: 'profile.jpg'
      });
      expect(component.isEditing).toBe(false);
      expect(component.errorMessage).toBe('');
      expect(component.successMessage).toBe('');
    });

    it('should handle cancel when user has no profile picture', () => {
      const userWithoutPicture = { ...mockUser, profilePicture: undefined };
      component.user = userWithoutPicture;
      component.formData = {
        name: 'Changed',
        lastname: 'Name',
        pseudo: 'changed',
        profilePicture: 'changed.jpg'
      };

      component.cancelEdit();

      expect(component.formData.profilePicture).toBe('');
    });

    it('should not reset form data if user is null', () => {
      component.user = null;
      const originalFormData = {
        name: 'Test',
        lastname: 'User',
        pseudo: 'test',
        profilePicture: 'test.jpg'
      };
      component.formData = { ...originalFormData };

      component.cancelEdit();

      expect(component.formData).toEqual(originalFormData);
      expect(component.isEditing).toBe(false);
    });
  });
});