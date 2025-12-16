import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ReviewService, Review, AddReviewRequest } from './review.service';
import { environment } from '../../environments/environment';

describe('ReviewService', () => {
  let service: ReviewService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/reviews`;
  const mockToken = 'mock-jwt-token';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ReviewService]
    });
    service = TestBed.inject(ReviewService);
    httpMock = TestBed.inject(HttpTestingController);
    
    // Mock localStorage
    spyOn(localStorage, 'getItem').and.returnValue(mockToken);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('addReview', () => {
    it('should add a new review with authentication headers', () => {
      const mockRequest: AddReviewRequest = {
        userId: 'user123',
        recipeId: 'recipe456',
        rating: 5,
        comment: 'Excellent recipe!'
      };

      const mockResponse: Review = {
        _id: 'review789',
        user: { _id: 'user123', name: 'John Doe' },
        recipe: 'recipe456',
        rating: 5,
        comment: 'Excellent recipe!',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      };

      service.addReview(mockRequest).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
      expect(req.request.body).toEqual(mockRequest);
      req.flush(mockResponse);
    });

    it('should handle error when adding review fails', () => {
      const mockRequest: AddReviewRequest = {
        userId: 'user123',
        recipeId: 'recipe456',
        rating: 5,
        comment: 'Test comment'
      };

      service.addReview(mockRequest).subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.status).toBe(500);
        }
      );

      const req = httpMock.expectOne(apiUrl);
      req.flush('Error', { status: 500, statusText: 'Server Error' });
    });
  });

  describe('getRecipeReviews', () => {
    it('should retrieve all reviews for a recipe without authentication', () => {
      const recipeId = 'recipe456';
      const mockReviews: Review[] = [
        {
          _id: 'review1',
          user: { _id: 'user1', name: 'User One' },
          recipe: recipeId,
          rating: 5,
          comment: 'Great!',
          createdAt: '2024-01-01T00:00:00Z'
        },
        {
          _id: 'review2',
          user: { _id: 'user2', name: 'User Two' },
          recipe: recipeId,
          rating: 4,
          comment: 'Good recipe',
          createdAt: '2024-01-02T00:00:00Z'
        }
      ];

      service.getRecipeReviews(recipeId).subscribe(reviews => {
        expect(reviews).toEqual(mockReviews);
        expect(reviews.length).toBe(2);
      });

      const req = httpMock.expectOne(`${apiUrl}/recipe/${recipeId}`);
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.has('Authorization')).toBeFalse();
      req.flush(mockReviews);
    });

    it('should return empty array when recipe has no reviews', () => {
      const recipeId = 'recipe789';

      service.getRecipeReviews(recipeId).subscribe(reviews => {
        expect(reviews).toEqual([]);
      });

      const req = httpMock.expectOne(`${apiUrl}/recipe/${recipeId}`);
      req.flush([]);
    });

    it('should handle error when fetching reviews fails', () => {
      const recipeId = 'recipe456';

      service.getRecipeReviews(recipeId).subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.status).toBe(404);
        }
      );

      const req = httpMock.expectOne(`${apiUrl}/recipe/${recipeId}`);
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });
  });

  describe('updateReview', () => {
    it('should update an existing review with authentication headers', () => {
      const reviewId = 'review789';
      const updatedRating = 4;
      const updatedComment = 'Updated comment';

      const mockResponse: Review = {
        _id: reviewId,
        user: { _id: 'user123', name: 'John Doe' },
        recipe: 'recipe456',
        rating: updatedRating,
        comment: updatedComment,
        updatedAt: '2024-01-03T00:00:00Z'
      };

      service.updateReview(reviewId, updatedRating, updatedComment).subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(response.rating).toBe(updatedRating);
        expect(response.comment).toBe(updatedComment);
      });

      const req = httpMock.expectOne(`${apiUrl}/${reviewId}`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
      expect(req.request.body).toEqual({ rating: updatedRating, comment: updatedComment });
      req.flush(mockResponse);
    });

    it('should handle unauthorized error when token is invalid', () => {
      const reviewId = 'review789';

      service.updateReview(reviewId, 5, 'Test').subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.status).toBe(401);
        }
      );

      const req = httpMock.expectOne(`${apiUrl}/${reviewId}`);
      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    });
  });

  describe('deleteReview', () => {
    it('should delete a review with authentication headers', () => {
      const reviewId = 'review789';
      const mockResponse = { message: 'Review deleted successfully' };

      service.deleteReview(reviewId).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiUrl}/${reviewId}`);
      expect(req.request.method).toBe('DELETE');
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
      req.flush(mockResponse);
    });

    it('should handle error when review not found', () => {
      const reviewId = 'nonexistent';

      service.deleteReview(reviewId).subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.status).toBe(404);
        }
      );

      const req = httpMock.expectOne(`${apiUrl}/${reviewId}`);
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });

    it('should handle forbidden error when user is not the review owner', () => {
      const reviewId = 'review789';

      service.deleteReview(reviewId).subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.status).toBe(403);
        }
      );

      const req = httpMock.expectOne(`${apiUrl}/${reviewId}`);
      req.flush('Forbidden', { status: 403, statusText: 'Forbidden' });
    });
  });

  describe('getHeaders', () => {
    it('should include Authorization header with Bearer token', () => {
      const headers = (service as any).getHeaders();
      expect(headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
    });

    it('should handle missing token gracefully', () => {
      (localStorage.getItem as jasmine.Spy).and.returnValue(null);
      const headers = (service as any).getHeaders();
      expect(headers.get('Authorization')).toBe('Bearer null');
    });
  });
});