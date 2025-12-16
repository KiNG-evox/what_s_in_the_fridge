import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ReviewListComponent } from './review-list.component';
import { ReviewService } from '../../services/review.service';

describe('ReviewListComponent', () => {
  let component: ReviewListComponent;
  let fixture: ComponentFixture<ReviewListComponent>;
  let reviewService: jasmine.SpyObj<ReviewService>;

  const mockReviews = [
    {
      _id: 'review1',
      userId: 'user1',
      recipeId: 'recipe123',
      rating: 5,
      comment: 'Great recipe!',
      createdAt: new Date()
    },
    {
      _id: 'review2',
      userId: 'user2',
      recipeId: 'recipe123',
      rating: 4,
      comment: 'Very good!',
      createdAt: new Date()
    }
  ];

  beforeEach(async () => {
    const reviewServiceSpy = jasmine.createSpyObj('ReviewService', [
      'getRecipeReviews',
      'deleteReview'
    ]);

    await TestBed.configureTestingModule({
      declarations: [ReviewListComponent],
      providers: [
        { provide: ReviewService, useValue: reviewServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ReviewListComponent);
    component = fixture.componentInstance;
    reviewService = TestBed.inject(ReviewService) as jasmine.SpyObj<ReviewService>;

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
    expect(component.reviews).toEqual([]);
    expect(component.isLoading).toBe(true);
  });

  describe('Input Properties', () => {
    it('should accept recipeId input', () => {
      component.recipeId = 'test-recipe-456';
      expect(component.recipeId).toBe('test-recipe-456');
    });
  });

  describe('ngOnInit', () => {
    it('should call loadReviews on initialization', () => {
      spyOn(component, 'loadReviews');
      reviewService.getRecipeReviews.and.returnValue(of({ success: true, data: [] }));

      component.ngOnInit();

      expect(component.loadReviews).toHaveBeenCalled();
    });
  });

  describe('loadReviews', () => {
    it('should load reviews successfully', () => {
      const response = { success: true, data: mockReviews };
      reviewService.getRecipeReviews.and.returnValue(of(response));

      component.loadReviews();

      expect(reviewService.getRecipeReviews).toHaveBeenCalledWith('recipe123');
      expect(component.reviews).toEqual(mockReviews);
      expect(component.isLoading).toBe(false);
      expect(console.log).toHaveBeenCalledWith('Reviews loaded', response);
    });

    it('should set isLoading to true when starting to load', () => {
      const response = { success: true, data: mockReviews };
      reviewService.getRecipeReviews.and.returnValue(of(response));
      component.isLoading = false;

      component.loadReviews();

      expect(reviewService.getRecipeReviews).toHaveBeenCalled();
    });

    it('should handle empty reviews array', () => {
      const response = { success: true, data: [] };
      reviewService.getRecipeReviews.and.returnValue(of(response));

      component.loadReviews();

      expect(component.reviews).toEqual([]);
      expect(component.isLoading).toBe(false);
    });

    it('should handle load reviews error', () => {
      const error = new Error('Failed to load reviews');
      reviewService.getRecipeReviews.and.returnValue(throwError(() => error));

      component.loadReviews();

      expect(component.isLoading).toBe(false);
      expect(console.error).toHaveBeenCalledWith('Error loading reviews', error);
    });

    it('should set isLoading to false on error', () => {
      reviewService.getRecipeReviews.and.returnValue(throwError(() => new Error('Error')));
      component.isLoading = true;

      component.loadReviews();

      expect(component.isLoading).toBe(false);
    });

    it('should not modify reviews on error', () => {
      component.reviews = mockReviews;
      reviewService.getRecipeReviews.and.returnValue(throwError(() => new Error('Error')));

      component.loadReviews();

      expect(component.reviews).toEqual(mockReviews);
    });

    it('should load reviews with different recipeId', () => {
      component.recipeId = 'recipe-999';
      const response = { success: true, data: mockReviews };
      reviewService.getRecipeReviews.and.returnValue(of(response));

      component.loadReviews();

      expect(reviewService.getRecipeReviews).toHaveBeenCalledWith('recipe-999');
    });
  });

  describe('onReviewDeleted', () => {
    beforeEach(() => {
      // Setup loadReviews to return data
      const response = { success: true, data: mockReviews };
      reviewService.getRecipeReviews.and.returnValue(of(response));
    });

    it('should delete review successfully and reload reviews', () => {
      const deleteResponse = { success: true, message: 'Deleted' };
      reviewService.deleteReview.and.returnValue(of(deleteResponse));
      spyOn(component, 'loadReviews');

      component.onReviewDeleted('review1');

      expect(reviewService.deleteReview).toHaveBeenCalledWith('review1');
      expect(window.alert).toHaveBeenCalledWith('✅ Review deleted successfully!');
      expect(component.loadReviews).toHaveBeenCalled();
    });

    it('should reload reviews after successful deletion', () => {
      const deleteResponse = { success: true, message: 'Deleted' };
      reviewService.deleteReview.and.returnValue(of(deleteResponse));
      component.reviews = [...mockReviews];

      component.onReviewDeleted('review1');

      expect(reviewService.deleteReview).toHaveBeenCalled();
      expect(reviewService.getRecipeReviews).toHaveBeenCalled();
    });

    it('should handle delete review error', () => {
      const error = new Error('Failed to delete');
      reviewService.deleteReview.and.returnValue(throwError(() => error));
      spyOn(component, 'loadReviews');

      component.onReviewDeleted('review1');

      expect(console.error).toHaveBeenCalledWith('Error deleting review', error);
      expect(window.alert).toHaveBeenCalledWith('Failed to delete review');
      expect(component.loadReviews).not.toHaveBeenCalled();
    });

    it('should not reload reviews on delete error', () => {
      reviewService.deleteReview.and.returnValue(throwError(() => new Error('Error')));
      const originalReviews = [...mockReviews];
      component.reviews = originalReviews;
      spyOn(component, 'loadReviews');

      component.onReviewDeleted('review1');

      expect(component.loadReviews).not.toHaveBeenCalled();
    });

    it('should delete review with correct id', () => {
      const deleteResponse = { success: true, message: 'Deleted' };
      reviewService.deleteReview.and.returnValue(of(deleteResponse));

      component.onReviewDeleted('review-xyz-789');

      expect(reviewService.deleteReview).toHaveBeenCalledWith('review-xyz-789');
    });
  });

  describe('onReviewAdded', () => {
    it('should reload reviews when new review is added', () => {
      spyOn(component, 'loadReviews');

      component.onReviewAdded();

      expect(component.loadReviews).toHaveBeenCalled();
    });

    it('should call loadReviews which fetches latest reviews', () => {
      const response = { success: true, data: mockReviews };
      reviewService.getRecipeReviews.and.returnValue(of(response));

      component.onReviewAdded();

      expect(reviewService.getRecipeReviews).toHaveBeenCalledWith('recipe123');
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete review lifecycle', () => {
      // Initial load
      const initialResponse = { success: true, data: [mockReviews[0]] };
      reviewService.getRecipeReviews.and.returnValue(of(initialResponse));

      component.loadReviews();
      expect(component.reviews.length).toBe(1);

      // Add review
      const updatedResponse = { success: true, data: mockReviews };
      reviewService.getRecipeReviews.and.returnValue(of(updatedResponse));

      component.onReviewAdded();
      expect(component.reviews.length).toBe(2);

      // Delete review
      const deleteResponse = { success: true, message: 'Deleted' };
      reviewService.deleteReview.and.returnValue(of(deleteResponse));
      reviewService.getRecipeReviews.and.returnValue(of(initialResponse));

      component.onReviewDeleted('review2');
      expect(component.reviews.length).toBe(1);
    });

    it('should maintain loading state correctly through operations', () => {
      const response = { success: true, data: mockReviews };
      reviewService.getRecipeReviews.and.returnValue(of(response));

      expect(component.isLoading).toBe(true);

      component.loadReviews();
      expect(component.isLoading).toBe(false);

      component.onReviewAdded();
      expect(component.isLoading).toBe(false);
    });

    it('should handle multiple rapid reload requests', () => {
      const response = { success: true, data: mockReviews };
      reviewService.getRecipeReviews.and.returnValue(of(response));

      component.loadReviews();
      component.loadReviews();
      component.loadReviews();

      expect(reviewService.getRecipeReviews).toHaveBeenCalledTimes(3);
      expect(component.reviews).toEqual(mockReviews);
    });
  });
});