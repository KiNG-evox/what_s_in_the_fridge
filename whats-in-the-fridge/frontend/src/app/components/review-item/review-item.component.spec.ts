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
      const differentUser: User = {
        ...mockUser,
        _id: 'user456'
      };
      authService.getCurrentUser.and.returnValue(differentUser);

      expect(component.isOwner).toBeFalse();
    });

    it('should return false when no user is logged in', () => {
      authService.getCurrentUser.and.returnValue(null);

      expect(component.isOwner).toBeFalse();
    });

    it('should return false when current user is undefined', () => {
      authService.getCurrentUser.and.returnValue(null);

      expect(component.isOwner).toBeFalsy();
    });

    it('should handle review with different user ID', () => {
      component.review = {
        ...mockReview,
        user: {
          ...mockReview.user,
          _id: 'different123'
        }
      };
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

    it('should return false when current user is undefined', () => {
      authService.getCurrentUser.and.returnValue(null);

      expect(component.isAdmin).toBeFalsy();
    });

    it('should handle user with role property', () => {
      const userWithRole: User = {
        ...mockUser,
        role: 'user'
      };
      authService.getCurrentUser.and.returnValue(userWithRole);

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

      expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this review?');
      expect(component.deleteClick.emit).not.toHaveBeenCalled();
    });

    it('should emit correct review ID', () => {
      (window.confirm as jasmine.Spy).and.returnValue(true);
      spyOn(component.deleteClick, 'emit');
      component.review = { ...mockReview, _id: 'different456' };

      component.onDelete();

      expect(component.deleteClick.emit).toHaveBeenCalledWith('different456');
    });

    it('should show confirmation dialog with correct message', () => {
      (window.confirm as jasmine.Spy).and.returnValue(true);

      component.onDelete();

      expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this review?');
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

    it('should emit the entire review object', () => {
      spyOn(component.editClick, 'emit');
      const customReview = {
        ...mockReview,
        _id: 'custom123',
        rating: 4,
        comment: 'Updated comment'
      };
      component.review = customReview;

      component.onEdit();

      expect(component.editClick.emit).toHaveBeenCalledWith(customReview);
    });

    it('should not require confirmation dialog', () => {
      spyOn(component.editClick, 'emit');

      component.onEdit();

      expect(window.confirm).not.toHaveBeenCalled();
      expect(component.editClick.emit).toHaveBeenCalled();
    });
  });

  describe('Integration scenarios', () => {
    beforeEach(() => {
      component.review = mockReview;
    });

    it('should allow owner to edit and delete their review', () => {
      authService.getCurrentUser.and.returnValue(mockUser);
      (window.confirm as jasmine.Spy).and.returnValue(true);
      spyOn(component.deleteClick, 'emit');
      spyOn(component.editClick, 'emit');

      expect(component.isOwner).toBeTrue();

      component.onEdit();
      expect(component.editClick.emit).toHaveBeenCalledWith(mockReview);

      component.onDelete();
      expect(component.deleteClick.emit).toHaveBeenCalledWith('review123');
    });

    it('should allow admin to delete any review', () => {
      authService.getCurrentUser.and.returnValue(mockAdminUser);
      (window.confirm as jasmine.Spy).and.returnValue(true);
      spyOn(component.deleteClick, 'emit');

      expect(component.isAdmin).toBeTrue();
      expect(component.isOwner).toBeFalse();

      component.onDelete();
      expect(component.deleteClick.emit).toHaveBeenCalledWith('review123');
    });

    it('should prevent non-owner from editing review', () => {
      const differentUser: User = {
        ...mockUser,
        _id: 'user456'
      };
      authService.getCurrentUser.and.returnValue(differentUser);

      expect(component.isOwner).toBeFalse();
      expect(component.isAdmin).toBeFalse();
    });

    it('should handle review operations when not logged in', () => {
      authService.getCurrentUser.and.returnValue(null);

      expect(component.isOwner).toBeFalse();
      expect(component.isAdmin).toBeFalse();
    });
  });

  describe('Edge cases', () => {
    it('should handle review with missing user ID', () => {
      component.review = {
        ...mockReview,
        user: {
          name: 'John',
          pseudo: 'johndoe'
        }
      };
      authService.getCurrentUser.and.returnValue(mockUser);

      expect(component.isOwner).toBeFalse();
    });

    it('should handle multiple delete attempts', () => {
      (window.confirm as jasmine.Spy).and.returnValue(true);
      spyOn(component.deleteClick, 'emit');

      component.onDelete();
      component.onDelete();

      expect(component.deleteClick.emit).toHaveBeenCalledTimes(2);
      expect(window.confirm).toHaveBeenCalledTimes(2);
    });

    it('should handle multiple edit clicks', () => {
      spyOn(component.editClick, 'emit');

      component.onEdit();
      component.onEdit();
      component.onEdit();

      expect(component.editClick.emit).toHaveBeenCalledTimes(3);
    });

    it('should handle review update after initialization', () => {
      authService.getCurrentUser.and.returnValue(mockUser);
      component.review = mockReview;

      expect(component.isOwner).toBeTrue();

      const newReview = {
        ...mockReview,
        user: {
          ...mockReview.user,
          _id: 'different123'
        }
      };
      component.review = newReview;

      expect(component.isOwner).toBeFalse();
    });

    it('should handle review with null values', () => {
      component.review = {
        _id: null,
        user: {
          _id: null
        },
        rating: 0,
        comment: ''
      };
      authService.getCurrentUser.and.returnValue(null);

      expect(component.isOwner).toBeFalsy();
      expect(component.isAdmin).toBeFalsy();
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

    it('should emit events asynchronously', (done) => {
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
        expect(review.rating).toBe(5);
        expect(review.comment).toBe('Great recipe!');
        done();
      });

      component.onEdit();
    });
  });
});