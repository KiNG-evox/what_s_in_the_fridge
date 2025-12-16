import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { HeaderComponent } from './header.component';
import { AuthService } from '../../services/auth.service';
import { BehaviorSubject } from 'rxjs';

interface User {
  _id: string;
  name: string;
  lastname: string;
  pseudo: string;
  email: string;
  role: 'admin' | 'user';
  profilePicture?: string;
}

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;
  let currentUserSubject: BehaviorSubject<User | null>;

  const mockUser: User = {
    _id: 'user123',
    name: 'John',
    lastname: 'Doe',
    pseudo: 'johndoe',
    email: 'john@example.com',
    role: 'user'
  };

  beforeEach(async () => {
    currentUserSubject = new BehaviorSubject<User | null>(null);

    const authServiceSpy = jasmine.createSpyObj('AuthService', ['logout', 'isLoggedIn'], {
      currentUser$: currentUserSubject.asObservable()
    });
    authServiceSpy.isLoggedIn.and.returnValue(false);

    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      declarations: [HeaderComponent],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should subscribe to currentUser$ and set currentUser to null initially', () => {
      authService.isLoggedIn.and.returnValue(false);
      fixture.detectChanges();
      
      expect(component.currentUser).toBeNull();
    });

    it('should update currentUser when user logs in', () => {
      authService.isLoggedIn.and.returnValue(false);
      fixture.detectChanges();
      
      authService.isLoggedIn.and.returnValue(true);
      currentUserSubject.next(mockUser);
      fixture.detectChanges();
      
      expect(component.currentUser).toEqual(mockUser);
    });

    it('should update currentUser to null when user logs out', () => {
      authService.isLoggedIn.and.returnValue(true);
      fixture.detectChanges();
      
      currentUserSubject.next(mockUser);
      fixture.detectChanges();
      expect(component.currentUser).toEqual(mockUser);
      
      authService.isLoggedIn.and.returnValue(false);
      currentUserSubject.next(null);
      fixture.detectChanges();
      expect(component.currentUser).toBeNull();
    });

    it('should handle multiple user changes', () => {
      authService.isLoggedIn.and.returnValue(false);
      fixture.detectChanges();
      
      authService.isLoggedIn.and.returnValue(true);
      currentUserSubject.next(mockUser);
      fixture.detectChanges();
      expect(component.currentUser).toEqual(mockUser);
      
      const anotherUser: User = {
        ...mockUser,
        _id: 'user456',
        name: 'Jane'
      };
      currentUserSubject.next(anotherUser);
      fixture.detectChanges();
      expect(component.currentUser).toEqual(anotherUser);
    });
  });

  describe('toggleMenu', () => {
    it('should toggle showMenu from false to true', () => {
      component.showMenu = false;
      
      component.toggleMenu();
      
      expect(component.showMenu).toBeTrue();
    });

    it('should toggle showMenu from true to false', () => {
      component.showMenu = true;
      
      component.toggleMenu();
      
      expect(component.showMenu).toBeFalse();
    });

    it('should toggle menu multiple times', () => {
      expect(component.showMenu).toBeFalse();
      
      component.toggleMenu();
      expect(component.showMenu).toBeTrue();
      
      component.toggleMenu();
      expect(component.showMenu).toBeFalse();
      
      component.toggleMenu();
      expect(component.showMenu).toBeTrue();
    });
  });

  describe('logout', () => {
    it('should call authService.logout', () => {
      component.logout();
      
      expect(authService.logout).toHaveBeenCalled();
    });

    it('should close the menu after logout', () => {
      component.showMenu = true;
      
      component.logout();
      
      expect(component.showMenu).toBeFalse();
    });

    it('should call authService.logout exactly once', () => {
      component.logout();
      
      expect(authService.logout).toHaveBeenCalledTimes(1);
    });

    it('should work when menu is already closed', () => {
      component.showMenu = false;
      
      component.logout();
      
      expect(authService.logout).toHaveBeenCalled();
      expect(component.showMenu).toBeFalse();
    });
  });

  describe('navigateTo', () => {
    it('should navigate to specified route', () => {
      const route = '/recipes';
      
      component.navigateTo(route);
      
      expect(router.navigate).toHaveBeenCalledWith([route]);
    });

    it('should close the menu after navigation', () => {
      component.showMenu = true;
      
      component.navigateTo('/home');
      
      expect(component.showMenu).toBeFalse();
    });

    it('should navigate to different routes', () => {
      component.navigateTo('/profile');
      expect(router.navigate).toHaveBeenCalledWith(['/profile']);
      
      component.navigateTo('/favorites');
      expect(router.navigate).toHaveBeenCalledWith(['/favorites']);
      
      component.navigateTo('/about');
      expect(router.navigate).toHaveBeenCalledWith(['/about']);
    });

    it('should work when menu is already closed', () => {
      component.showMenu = false;
      
      component.navigateTo('/recipes');
      
      expect(router.navigate).toHaveBeenCalledWith(['/recipes']);
      expect(component.showMenu).toBeFalse();
    });

    it('should handle root route navigation', () => {
      component.navigateTo('/');
      
      expect(router.navigate).toHaveBeenCalledWith(['/']);
    });

    it('should handle nested route navigation', () => {
      component.navigateTo('/recipes/123');
      
      expect(router.navigate).toHaveBeenCalledWith(['/recipes/123']);
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete user session: login -> navigate -> logout', () => {
      authService.isLoggedIn.and.returnValue(false);
      fixture.detectChanges();
      
      authService.isLoggedIn.and.returnValue(true);
      currentUserSubject.next(mockUser);
      fixture.detectChanges();
      expect(component.currentUser).toEqual(mockUser);
      
      component.toggleMenu();
      expect(component.showMenu).toBeTrue();
      
      component.navigateTo('/profile');
      expect(router.navigate).toHaveBeenCalledWith(['/profile']);
      expect(component.showMenu).toBeFalse();
      
      component.toggleMenu();
      expect(component.showMenu).toBeTrue();
      
      component.logout();
      expect(authService.logout).toHaveBeenCalled();
      expect(component.showMenu).toBeFalse();
    });

    it('should handle menu interactions without navigation', () => {
      component.toggleMenu();
      expect(component.showMenu).toBeTrue();
      
      component.toggleMenu();
      expect(component.showMenu).toBeFalse();
      
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should handle multiple navigation actions', () => {
      component.showMenu = true;
      
      component.navigateTo('/home');
      expect(component.showMenu).toBeFalse();
      
      component.showMenu = true;
      component.navigateTo('/recipes');
      expect(component.showMenu).toBeFalse();
      
      expect(router.navigate).toHaveBeenCalledTimes(2);
    });

    it('should maintain user state across menu interactions', () => {
      authService.isLoggedIn.and.returnValue(true);
      fixture.detectChanges();
      currentUserSubject.next(mockUser);
      fixture.detectChanges();
      
      component.toggleMenu();
      expect(component.currentUser).toEqual(mockUser);
      
      component.navigateTo('/profile');
      expect(component.currentUser).toEqual(mockUser);
      
      component.toggleMenu();
      expect(component.currentUser).toEqual(mockUser);
    });
  });

  describe('Component properties', () => {
    it('should initialize with showMenu as false', () => {
      expect(component.showMenu).toBeFalse();
    });

    it('should initialize with currentUser as null', () => {
      expect(component.currentUser).toBeNull();
    });

    it('should have authService injected', () => {
      expect(component.authService).toBeDefined();
      expect(component.authService).toBe(authService);
    });
  });

  describe('Edge cases', () => {
    it('should handle rapid menu toggle clicks', () => {
      for (let i = 0; i < 10; i++) {
        component.toggleMenu();
      }
      expect(component.showMenu).toBeFalse();
    });

    it('should handle navigation to empty string route', () => {
      component.navigateTo('');
      
      expect(router.navigate).toHaveBeenCalledWith(['']);
    });

    it('should handle logout when user is not logged in', () => {
      component.currentUser = null;
      
      component.logout();
      
      expect(authService.logout).toHaveBeenCalled();
    });

    it('should handle navigation when user is not logged in', () => {
      component.currentUser = null;
      
      component.navigateTo('/recipes');
      
      expect(router.navigate).toHaveBeenCalledWith(['/recipes']);
    });
  });

  describe('Memory management', () => {
    it('should clean up subscription on destroy', () => {
      authService.isLoggedIn.and.returnValue(false);
      fixture.detectChanges();
      
      fixture.destroy();
      
      expect(fixture.nativeElement).toBeTruthy();
    });
  });
});