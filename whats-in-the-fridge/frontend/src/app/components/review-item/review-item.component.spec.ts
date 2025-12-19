import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EventEmitter } from '@angular/core';
import { ReviewItemComponent } from './review-item.component';
import { AuthService } from '../../services/auth.service';

interface User {
  _id: string;
  name: string;
  lastname: string;
  pseudo: string;
  email: string;
  role: 'admin' | 'user';
}

describe('ReviewItemComponent', () => {
  let component: ReviewItemComponent;
  let fixture: ComponentFixture<ReviewItemComponent>;
  let authService: jasmine.SpyObj<AuthService>;

  const mockUser: User = {
    _id: 'user123',
    name: 'John',
    lastname: 'Doe',
    pseudo: 'johndoe',
    email: 'john@example.com',
    role: 'user'
  };

  const mockAdminUser: User = {
    _id: 'admin123',
    name: 'Admin',
    lastname: 'User',
    pseudo: 'adminuser',
    email: 'admin@example.com',
    role: 'admin'
  };

  const mockReview = {
    _id: 'review123',
    user: {
      _id: 'user123',
      name: 'John',
      pseudo: 'johndoe'
    },
    recipe: 'recipe123',
    rating: 5,
    comment: 'Great recipe!',
    createdAt: '2024-01-01T00:00:00Z'
  };

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['getCurrentUser']);

    await TestBed.configureTestingModule({
      declarations: [ReviewItemComponent],
      providers: [
        { provide: AuthService, useValue: authServiceSpy }
      ]
    }).compileComponents();

    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    fixture = TestBed.createComponent(ReviewItemComponent);
    component = fixture.componentInstance;
    
    spyOn(window, 'confirm');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Input and Output properties', () => {
    it('should have review input property', () => {
      component.review = mockReview;
      expect(component.review).toEqual(mockReview);
    });

    it('should have deleteClick output emitter', () => {
      expect(component.deleteClick).toBeDefined();
      expect(component.deleteClick instanceof EventEmitter).toBeTrue();
    });

    it('should have editClick output emitter', () => {
      expect(component.editClick).toBeDefined();
      expect(component.editClick instanceof EventEmitter).toBeTrue();
    });
  });

  describe('isOwner getter', () => {
    beforeEach(() => {
      component.review = mockReview;
    });

    it('should return true when current user is the review owner', () => {
      authService.getCurrentUser.and.returnValue(mockUser);
      expect(component.isOwner).toBeTrue();
    });

    it('should return false when current user is not the review owner', () => {
      const differentUser: User = { ...mockUser, _id: 'user456' };
      authService.getCurrentUser.and.returnValue(differentUser);
      expect(component.isOwner).toBeFalse();
    });

    it('should return false when no user is logged in', () => {
      authService.getCurrentUser.and.returnValue(null);
      expect(component.isOwner).toBeFalse();
    });

    it('should handle review with different user ID', () => {
      component.review = { ...mockReview, user: { ...mockReview.user, _id: 'diff123' } };
      authService.getCurrentUser.and.returnValue(mockUser);
      expect(component.isOwner).toBeFalse();
    });
  });

  describe('isAdmin getter', () => {
    it('should return true when current user is an admin', () => {
      authService.getCurrentUser.and.returnValue(mockAdminUser);
      expect(component.isAdmin).toBeTrue();
    });

    it('should return false when current user is not an admin', () => {
      authService.getCurrentUser.and.returnValue(mockUser);
      expect(component.isAdmin).toBeFalse();
    });

    it('should return false when no user is logged in', () => {
      authService.getCurrentUser.and.returnValue(null);
      expect(component.isAdmin).toBeFalse();
    });
  });

  describe('onDelete', () => {
    beforeEach(() => {
      component.review = mockReview;
    });

    it('should emit deleteClick event when user confirms deletion', () => {
      (window.confirm as jasmine.Spy).and.returnValue(true);
      spyOn(component.deleteClick, 'emit');

      component.onDelete();

      expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this review?');
      expect(component.deleteClick.emit).toHaveBeenCalledWith('review123');
    });

    it('should not emit deleteClick event when user cancels deletion', () => {
      (window.confirm as jasmine.Spy).and.returnValue(false);
      spyOn(component.deleteClick, 'emit');

      component.onDelete();

      expect(component.deleteClick.emit).not.toHaveBeenCalled();
    });

    it('should handle undefined review gracefully', () => {
      component.review = undefined;
      expect(() => component.onDelete()).not.toThrow();
    });
  });

  describe('onEdit', () => {
    beforeEach(() => {
      component.review = mockReview;
    });

    it('should emit editClick event with review data', () => {
      spyOn(component.editClick, 'emit');
      component.onEdit();
      expect(component.editClick.emit).toHaveBeenCalledWith(mockReview);
    });

    it('should handle undefined review gracefully', () => {
      component.review = undefined;
      expect(() => component.onEdit()).not.toThrow();
    });
  });

  describe('Permissions matrix', () => {
    const testCases = [
      { userType: 'owner', user: mockUser, expectedOwner: true, expectedAdmin: false },
      { userType: 'admin', user: mockAdminUser, expectedOwner: false, expectedAdmin: true },
      { userType: 'different user', user: { ...mockUser, _id: 'user456' }, expectedOwner: false, expectedAdmin: false },
      { userType: 'null', user: null, expectedOwner: false, expectedAdmin: false }
    ];

    testCases.forEach(testCase => {
      it(`should have correct permissions for ${testCase.userType}`, () => {
        component.review = mockReview;
        authService.getCurrentUser.and.returnValue(testCase.user as any);

        expect(component.isOwner).toBe(testCase.expectedOwner);
        expect(component.isAdmin).toBe(testCase.expectedAdmin);
      });
    });
  });

  describe('Event emission verification', () => {
    beforeEach(() => {
      component.review = mockReview;
    });

    it('should emit delete events asynchronously', (done) => {
      component.deleteClick.subscribe((reviewId: string) => {
        expect(reviewId).toBe('review123');
        done();
      });

      (window.confirm as jasmine.Spy).and.returnValue(true);
      component.onDelete();
    });

    it('should emit edit events with complete data', (done) => {
      component.editClick.subscribe((review: any) => {
        expect(review).toEqual(mockReview);
        done();
      });

      component.onEdit();
    });
  });
});
