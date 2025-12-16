import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ReviewFormComponent } from './review-form.component';
import { ReviewService } from '../../services/review.service';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';

describe('ReviewFormComponent', () => {
  let component: ReviewFormComponent;
  let fixture: ComponentFixture<ReviewFormComponent>;
  let reviewService: jasmine.SpyObj<ReviewService>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  const mockUser: User = {
    _id: 'user123',
    name: 'John',
    lastname: 'Doe',
    pseudo: 'johndoe',
    email: 'john@example.com',
    role: 'user'
  };

  beforeEach(async () => {
    const reviewServiceSpy = jasmine.createSpyObj('ReviewService', ['addReview']);
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['getCurrentUser']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      declarations: [ReviewFormComponent],
      providers: [
        { provide: ReviewService, useValue: reviewServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ReviewFormComponent);
    component = fixture.componentInstance;
    reviewService = TestBed.inject(ReviewService) as jasmine.SpyObj<ReviewService>;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    // Set required input
    component.recipeId = 'recipe123';

    spyOn(window, 'alert');
    spyOn(console, 'log');
    spyOn(console, 'error');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.rating).toBe(0);
    expect(component.comment).toBe('');
    expect(component.hoveredRating).toBe(0);
    expect(component.isSubmitting).toBe(false);
    expect(component.errorMessage).toBe('');
  });

  describe('setRating', () => {
    it('should set the rating value', () => {
      component.setRating(4);
      expect(component.rating).toBe(4);
    });

    it('should update rating when called multiple times', () => {
      component.setRating(3);
      expect(component.rating).toBe(3);

      component.setRating(5);
      expect(component.rating).toBe(5);
    });

    it('should accept rating of 1', () => {
      component.setRating(1);
      expect(component.rating).toBe(1);
    });

    it('should accept rating of 5', () => {
      component.setRating(5);
      expect(component.rating).toBe(5);
    });
  });

  describe('setHoveredRating', () => {
    it('should set the hovered rating value', () => {
      component.setHoveredRating(3);
      expect(component.hoveredRating).toBe(3);
    });

    it('should update hovered rating when called multiple times', () => {
      component.setHoveredRating(2);
      expect(component.hoveredRating).toBe(2);

      component.setHoveredRating(4);
      expect(component.hoveredRating).toBe(4);
    });

    it('should set hovered rating to 0', () => {
      component.setHoveredRating(3);
      component.setHoveredRating(0);
      expect(component.hoveredRating).toBe(0);
    });
  });

  describe('submitReview - Validation', () => {
    it('should redirect to login if user is not logged in', () => {
      authService.getCurrentUser.and.returnValue(null);

      component.submitReview();

      expect(router.navigate).toHaveBeenCalledWith(['/login']);
      expect(reviewService.addReview).not.toHaveBeenCalled();
    });

    it('should show error when rating is 0', () => {
      authService.getCurrentUser.and.returnValue(mockUser);
      component.rating = 0;
      component.comment = 'This is a valid comment with enough characters';

      component.submitReview();

      expect(component.errorMessage).toBe('Please select a rating');
      expect(reviewService.addReview).not.toHaveBeenCalled();
    });

    it('should show error when comment is empty', () => {
      authService.getCurrentUser.and.returnValue(mockUser);
      component.rating = 5;
      component.comment = '';

      component.submitReview();

      expect(component.errorMessage).toBe('Comment must be at least 10 characters');
      expect(reviewService.addReview).not.toHaveBeenCalled();
    });

    it('should show error when comment is less than 10 characters', () => {
      authService.getCurrentUser.and.returnValue(mockUser);
      component.rating = 5;
      component.comment = 'Short';

      component.submitReview();

      expect(component.errorMessage).toBe('Comment must be at least 10 characters');
      expect(reviewService.addReview).not.toHaveBeenCalled();
    });

    it('should show error when comment is only whitespace', () => {
      authService.getCurrentUser.and.returnValue(mockUser);
      component.rating = 5;
      component.comment = '     ';

      component.submitReview();

      expect(component.errorMessage).toBe('Comment must be at least 10 characters');
      expect(reviewService.addReview).not.toHaveBeenCalled();
    });

    it('should accept comment with exactly 10 characters', () => {
      authService.getCurrentUser.and.returnValue(mockUser);
      component.rating = 5;
      component.comment = '1234567890';
      const response = { success: true, message: 'Review added' };
      reviewService.addReview.and.returnValue(of(response));

      component.submitReview();

      expect(reviewService.addReview).toHaveBeenCalled();
    });
  });

  describe('submitReview - Successful Submission', () => {
    beforeEach(() => {
      authService.getCurrentUser.and.returnValue(mockUser);
      component.rating = 5;
      component.comment = 'This is a great recipe! Very delicious.';
    });

    it('should submit review successfully', () => {
      const response = { success: true, message: 'Review added' };
      reviewService.addReview.and.returnValue(of(response));

      component.submitReview();

      expect(component.isSubmitting).toBe(false);
      expect(component.errorMessage).toBe('');
      expect(reviewService.addReview).toHaveBeenCalledWith({
        userId: 'user123',
        recipeId: 'recipe123',
        rating: 5,
        comment: 'This is a great recipe! Very delicious.'
      });
      expect(window.alert).toHaveBeenCalledWith('✅ Review added successfully!');
    });

    it('should reset form after successful submission', () => {
      const response = { success: true, message: 'Review added' };
      reviewService.addReview.and.returnValue(of(response));

      component.submitReview();

      expect(component.rating).toBe(0);
      expect(component.comment).toBe('');
    });

    it('should emit reviewAdded event after successful submission', () => {
      const response = { success: true, message: 'Review added' };
      reviewService.addReview.and.returnValue(of(response));
      spyOn(component.reviewAdded, 'emit');

      component.submitReview();

      expect(component.reviewAdded.emit).toHaveBeenCalled();
    });

    it('should clear error message on successful submission', () => {
      component.errorMessage = 'Previous error';
      const response = { success: true, message: 'Review added' };
      reviewService.addReview.and.returnValue(of(response));

      component.submitReview();

      expect(component.errorMessage).toBe('');
    });

    it('should set isSubmitting to true then false', () => {
      const response = { success: true, message: 'Review added' };
      reviewService.addReview.and.returnValue(of(response));

      expect(component.isSubmitting).toBe(false);
      component.submitReview();
      expect(component.isSubmitting).toBe(false);
    });
  });

  describe('submitReview - Error Handling', () => {
    beforeEach(() => {
      authService.getCurrentUser.and.returnValue(mockUser);
      component.rating = 5;
      component.comment = 'This is a great recipe!';
    });

    it('should handle error with message', () => {
      const errorResponse = { error: { message: 'Review already exists' } };
      reviewService.addReview.and.returnValue(throwError(() => errorResponse));

      component.submitReview();

      expect(component.isSubmitting).toBe(false);
      expect(component.errorMessage).toBe('Review already exists');
      expect(console.error).toHaveBeenCalled();
    });

    it('should handle error without message', () => {
      reviewService.addReview.and.returnValue(throwError(() => ({})));

      component.submitReview();

      expect(component.isSubmitting).toBe(false);
      expect(component.errorMessage).toBe('Failed to add review');
    });

    it('should not reset form on error', () => {
      const errorResponse = { error: { message: 'Server error' } };
      reviewService.addReview.and.returnValue(throwError(() => errorResponse));
      const originalRating = component.rating;
      const originalComment = component.comment;

      component.submitReview();

      expect(component.rating).toBe(originalRating);
      expect(component.comment).toBe(originalComment);
    });

    it('should not emit reviewAdded event on error', () => {
      const errorResponse = { error: { message: 'Server error' } };
      reviewService.addReview.and.returnValue(throwError(() => errorResponse));
      spyOn(component.reviewAdded, 'emit');

      component.submitReview();

      expect(component.reviewAdded.emit).not.toHaveBeenCalled();
    });

    it('should not show alert on error', () => {
      const errorResponse = { error: { message: 'Server error' } };
      reviewService.addReview.and.returnValue(throwError(() => errorResponse));

      component.submitReview();

      expect(window.alert).not.toHaveBeenCalled();
    });
  });

  describe('Input/Output', () => {
    it('should have recipeId input', () => {
      component.recipeId = 'test-recipe-123';
      expect(component.recipeId).toBe('test-recipe-123');
    });

    it('should have reviewAdded output', () => {
      expect(component.reviewAdded).toBeDefined();
      expect(component.reviewAdded instanceof EventEmitter).toBe(true);
    });
  });
});