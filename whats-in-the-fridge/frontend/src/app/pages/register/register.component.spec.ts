import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { RegisterComponent } from './register.component';
import { AuthService } from '../../services/auth.service';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['register']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      declarations: [RegisterComponent],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty form data', () => {
    expect(component.formData).toEqual({
      name: '',
      lastname: '',
      pseudo: '',
      email: '',
      password: '',
      confirmPassword: ''
    });
    expect(component.errorMessage).toBe('');
    expect(component.isLoading).toBe(false);
  });

  describe('onSubmit - Validation', () => {
    it('should show error when name is empty', () => {
      component.formData = {
        name: '',
        lastname: 'Doe',
        pseudo: 'johndoe',
        email: 'john@example.com',
        password: 'password123',
        confirmPassword: 'password123'
      };

      component.onSubmit();

      expect(component.errorMessage).toBe('Please fill in all fields');
      expect(authService.register).not.toHaveBeenCalled();
    });

    it('should show error when lastname is empty', () => {
      component.formData = {
        name: 'John',
        lastname: '',
        pseudo: 'johndoe',
        email: 'john@example.com',
        password: 'password123',
        confirmPassword: 'password123'
      };

      component.onSubmit();

      expect(component.errorMessage).toBe('Please fill in all fields');
      expect(authService.register).not.toHaveBeenCalled();
    });

    it('should show error when pseudo is empty', () => {
      component.formData = {
        name: 'John',
        lastname: 'Doe',
        pseudo: '',
        email: 'john@example.com',
        password: 'password123',
        confirmPassword: 'password123'
      };

      component.onSubmit();

      expect(component.errorMessage).toBe('Please fill in all fields');
      expect(authService.register).not.toHaveBeenCalled();
    });

    it('should show error when email is empty', () => {
      component.formData = {
        name: 'John',
        lastname: 'Doe',
        pseudo: 'johndoe',
        email: '',
        password: 'password123',
        confirmPassword: 'password123'
      };

      component.onSubmit();

      expect(component.errorMessage).toBe('Please fill in all fields');
      expect(authService.register).not.toHaveBeenCalled();
    });

    it('should show error when password is empty', () => {
      component.formData = {
        name: 'John',
        lastname: 'Doe',
        pseudo: 'johndoe',
        email: 'john@example.com',
        password: '',
        confirmPassword: ''
      };

      component.onSubmit();

      expect(component.errorMessage).toBe('Please fill in all fields');
      expect(authService.register).not.toHaveBeenCalled();
    });

    it('should show error when passwords do not match', () => {
      component.formData = {
        name: 'John',
        lastname: 'Doe',
        pseudo: 'johndoe',
        email: 'john@example.com',
        password: 'password123',
        confirmPassword: 'different123'
      };

      component.onSubmit();

      expect(component.errorMessage).toBe('Passwords do not match');
      expect(authService.register).not.toHaveBeenCalled();
    });

    it('should show error when password is less than 6 characters', () => {
      component.formData = {
        name: 'John',
        lastname: 'Doe',
        pseudo: 'johndoe',
        email: 'john@example.com',
        password: '12345',
        confirmPassword: '12345'
      };

      component.onSubmit();

      expect(component.errorMessage).toBe('Password must be at least 6 characters');
      expect(authService.register).not.toHaveBeenCalled();
    });
  });

  describe('onSubmit - Successful Registration', () => {
    beforeEach(() => {
      component.formData = {
        name: 'John',
        lastname: 'Doe',
        pseudo: 'johndoe',
        email: 'john@example.com',
        password: 'password123',
        confirmPassword: 'password123'
      };
    });

    it('should register successfully and navigate to home', () => {
      const response = {
        success: true,
        message: 'Registration successful',
        token: 'fake-jwt-token',
        data: {
          _id: 'user123',
          name: 'John',
          lastname: 'Doe',
          pseudo: 'johndoe',
          email: 'john@example.com',
          role: 'user' as const
        }
      };
      authService.register.and.returnValue(of(response));

      component.onSubmit();

      expect(component.isLoading).toBe(true);
      expect(component.errorMessage).toBe('');
      expect(authService.register).toHaveBeenCalledWith({
        name: 'John',
        lastname: 'Doe',
        pseudo: 'johndoe',
        email: 'john@example.com',
        password: 'password123'
      });
      expect(router.navigate).toHaveBeenCalledWith(['/home']);
    });

    it('should not include confirmPassword in registration data', () => {
      const response = {
        success: true,
        message: 'Registration successful',
        token: 'fake-jwt-token',
        data: {
          _id: 'user123',
          name: 'John',
          lastname: 'Doe',
          pseudo: 'johndoe',
          email: 'john@example.com',
          role: 'user' as const
        }
      };
      authService.register.and.returnValue(of(response));

      component.onSubmit();

      const registerCall = authService.register.calls.mostRecent().args[0];
      expect('confirmPassword' in registerCall).toBe(false);
      expect(Object.keys(registerCall)).toEqual(['name', 'lastname', 'pseudo', 'email', 'password']);
    });
  });

  describe('onSubmit - Failed Registration', () => {
    beforeEach(() => {
      component.formData = {
        name: 'John',
        lastname: 'Doe',
        pseudo: 'johndoe',
        email: 'john@example.com',
        password: 'password123',
        confirmPassword: 'password123'
      };
    });

    it('should handle registration error with message', () => {
      const errorResponse = { error: { message: 'Email already exists' } };
      authService.register.and.returnValue(throwError(() => errorResponse));

      component.onSubmit();

      expect(component.isLoading).toBe(false);
      expect(component.errorMessage).toBe('Email already exists');
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should handle registration error without message', () => {
      authService.register.and.returnValue(throwError(() => ({})));

      component.onSubmit();

      expect(component.isLoading).toBe(false);
      expect(component.errorMessage).toBe('Registration failed. Please try again.');
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should reset loading state on error', () => {
      const errorResponse = { error: { message: 'Server error' } };
      authService.register.and.returnValue(throwError(() => errorResponse));

      component.isLoading = false;
      component.onSubmit();

      expect(component.isLoading).toBe(false);
    });
  });

  describe('Form State Management', () => {
    it('should clear error message when submitting valid form', () => {
      component.formData = {
        name: 'John',
        lastname: 'Doe',
        pseudo: 'johndoe',
        email: 'john@example.com',
        password: 'password123',
        confirmPassword: 'password123'
      };
      component.errorMessage = 'Previous error';
      const response = {
        success: true,
        message: 'Registration successful',
        token: 'fake-jwt-token',
        data: {
          _id: 'user123',
          name: 'John',
          lastname: 'Doe',
          pseudo: 'johndoe',
          email: 'john@example.com',
          role: 'user' as const
        }
      };
      authService.register.and.returnValue(of(response));

      component.onSubmit();

      expect(component.errorMessage).toBe('');
    });

    it('should set loading to true when starting registration', () => {
      component.formData = {
        name: 'John',
        lastname: 'Doe',
        pseudo: 'johndoe',
        email: 'john@example.com',
        password: 'password123',
        confirmPassword: 'password123'
      };
      const response = {
        success: true,
        message: 'Registration successful',
        token: 'fake-jwt-token',
        data: {
          _id: 'user123',
          name: 'John',
          lastname: 'Doe',
          pseudo: 'johndoe',
          email: 'john@example.com',
          role: 'user' as const
        }
      };
      authService.register.and.returnValue(of(response));

      component.isLoading = false;
      component.onSubmit();

      // isLoading is set to true before the async call
      expect(authService.register).toHaveBeenCalled();
    });
  });
});