import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AdminGuard } from './admin.guard';
import { AuthService } from '../services/auth.service';

describe('AdminGuard', () => {
  let guard: AdminGuard;
  let authServiceMock: any;
  let routerMock: any;

  beforeEach(() => {
    authServiceMock = {
      getCurrentUser: jasmine.createSpy('getCurrentUser')
    };
    routerMock = {
      navigate: jasmine.createSpy('navigate')
    };

    TestBed.configureTestingModule({
      providers: [
        AdminGuard,
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock }
      ]
    });

    guard = TestBed.inject(AdminGuard);
  });

  it('should allow access if user is admin', () => {
    authServiceMock.getCurrentUser.and.returnValue({ role: 'admin' });
    expect(guard.canActivate()).toBe(true);
  });

  it('should deny access and navigate if user is not admin', () => {
    authServiceMock.getCurrentUser.and.returnValue({ role: 'user' });
    expect(guard.canActivate()).toBe(false);
    expect(routerMock.navigate).toHaveBeenCalledWith(['/home']);
  });
});
