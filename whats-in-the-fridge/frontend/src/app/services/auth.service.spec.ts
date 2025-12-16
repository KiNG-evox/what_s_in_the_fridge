import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { User } from '../models/user.model';

describe('AuthService', () => {
  let service: AuthService;
  let routerMock: any;

  const mockUser: User = {
    _id: '123',
    name: 'Test',
    lastname: 'User',
    pseudo: 'tester',
    email: 'test@example.com',
    role: 'user'
  };

  const mockAuthResponse = {
    success: true,
    message: 'Logged in successfully',
    token: 'fake-jwt-token',
    data: mockUser
  };

  beforeEach(() => {
    routerMock = { navigate: jasmine.createSpy('navigate') };

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        { provide: Router, useValue: routerMock }
      ]
    });
    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return false when not logged in', () => {
    localStorage.removeItem('token');
    expect(service.isLoggedIn()).toBeFalse();
  });

  it('should store token and user correctly', () => {
    service['saveAuthData']('fake-token', mockUser);
    expect(localStorage.getItem('token')).toBe('fake-token');
    expect(JSON.parse(localStorage.getItem('user')!)).toEqual(mockUser);
    expect(service.getCurrentUser()).toEqual(mockUser);
  });

  it('should logout and clear storage', () => {
    localStorage.setItem('token', 'token');
    localStorage.setItem('user', JSON.stringify(mockUser));
    service.logout();
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);
  });
});
