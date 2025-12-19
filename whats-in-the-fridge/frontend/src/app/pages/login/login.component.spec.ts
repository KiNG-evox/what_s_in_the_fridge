import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { CommonModule } from '@angular/common';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let router: Router;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['login']);

    await TestBed.configureTestingModule({
      declarations: [LoginComponent],
      imports: [CommonModule, FormsModule, RouterTestingModule],
      providers: [{ provide: AuthService, useValue: authServiceSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should login successfully', () => {
    component.email = 'test@example.com';
    component.password = '123456';

    const mockResponse = {
      success: true,
      message: 'Login successful',
      token: 'fake-jwt-token',
      data: {
        _id: '123',
        email: 'test@example.com',
        role: 'user' as 'user',
        name: 'Test',
        lastname: 'User',
        pseudo: 'testuser',
      },
    };

    authServiceSpy.login.and.returnValue(of(mockResponse));

    component.onSubmit();

    expect(authServiceSpy.login).toHaveBeenCalledWith('test@example.com', '123456');
    expect(router.navigate).toHaveBeenCalledWith(['/home']);
    expect(component.errorMessage).toBe('');
  });

  it('should handle login error', () => {
    component.email = 'test@example.com';
    component.password = 'wrongpassword';

    authServiceSpy.login.and.returnValue(
      throwError(() => ({ error: { message: 'Invalid credentials' } }))
    );

    component.onSubmit();

    expect(authServiceSpy.login).toHaveBeenCalledWith('test@example.com', 'wrongpassword');
    expect(component.errorMessage).toBe('Invalid credentials');
    expect(component.isLoading).toBeFalse();
  });

  it('should show error if fields are empty', () => {
    component.email = '';
    component.password = '';

    component.onSubmit();

    expect(component.errorMessage).toBe('Please fill in all fields');
    expect(authServiceSpy.login).not.toHaveBeenCalled();
  });
});
