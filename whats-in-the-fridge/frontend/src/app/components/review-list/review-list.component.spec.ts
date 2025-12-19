/**
 * This test suite validates the ReviewListComponent by ensuring correct
 * review loading, deletion handling, service interaction, and UI state
 * management to guarantee reliable review functionality.
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of, throwError } from 'rxjs';

import { ReviewListComponent } from './review-list.component';
import { ReviewService } from '../../services/review.service';

describe('ReviewListComponent', () => {
  let component: ReviewListComponent;
  let fixture: ComponentFixture<ReviewListComponent>;
  let reviewService: jasmine.SpyObj<ReviewService>;

  const mockReviews = [
    { _id: '1', comment: 'Great recipe!', rating: 5 },
    { _id: '2', comment: 'Nice and easy', rating: 4 }
  ];

  beforeEach(async () => {
    reviewService = jasmine.createSpyObj('ReviewService', [
      'getRecipeReviews',
      'deleteReview'
    ]);

    await TestBed.configureTestingModule({
      declarations: [ReviewListComponent],
      providers: [
        { provide: ReviewService, useValue: reviewService }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(ReviewListComponent);
    component = fixture.componentInstance;

    component.recipeId = 'recipe123';

    spyOn(console, 'log');
    spyOn(console, 'error');
    spyOn(window, 'alert');
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should load reviews on init', () => {
    reviewService.getRecipeReviews.and.returnValue(
      of({ data: mockReviews })
    );

    component.ngOnInit();

    expect(reviewService.getRecipeReviews).toHaveBeenCalledWith('recipe123');
    expect(component.reviews).toEqual(mockReviews);
    expect(component.isLoading).toBeFalse();
  });

  it('should handle error when loading reviews fails', () => {
    reviewService.getRecipeReviews.and.returnValue(
      throwError(() => new Error('Load error'))
    );

    component.loadReviews();

    expect(component.isLoading).toBeFalse();
    expect(console.error).toHaveBeenCalled();
  });

  it('should delete a review and reload reviews', () => {
    reviewService.deleteReview.and.returnValue(of({}));
    spyOn(component, 'loadReviews');

    component.onReviewDeleted('1');

    expect(reviewService.deleteReview).toHaveBeenCalledWith('1');
    expect(window.alert).toHaveBeenCalledWith('✅ Review deleted successfully!');
    expect(component.loadReviews).toHaveBeenCalled();
  });

  it('should handle error when deleting a review fails', () => {
    reviewService.deleteReview.and.returnValue(
      throwError(() => new Error('Delete error'))
    );

    component.onReviewDeleted('1');

    expect(console.error).toHaveBeenCalled();
    expect(window.alert).toHaveBeenCalledWith('Failed to delete review');
  });

  it('should reload reviews when a review is added', () => {
    spyOn(component, 'loadReviews');

    component.onReviewAdded();

    expect(component.loadReviews).toHaveBeenCalled();
  });
});
