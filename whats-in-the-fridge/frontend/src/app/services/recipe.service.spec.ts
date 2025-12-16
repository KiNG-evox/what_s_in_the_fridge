import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RecipeService } from './recipe.service';
import { Recipe, RecipeSearchParams } from '../models/recipe.model';
import { environment } from '../../environments/environment';

describe('RecipeService', () => {
  let service: RecipeService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/recipes`;
  const authUrl = `${environment.apiUrl}/auth`;
  const mockToken = 'mock-jwt-token';
  const mockUser = {
    _id: 'user123',
    name: 'John',
    lastname: 'Doe',
    email: 'john@example.com',
    role: 'user'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [RecipeService]
    });
    service = TestBed.inject(RecipeService);
    httpMock = TestBed.inject(HttpTestingController);

    // Mock localStorage
    spyOn(localStorage, 'getItem').and.callFake((key: string) => {
      if (key === 'token') return mockToken;
      if (key === 'user') return JSON.stringify(mockUser);
      return null;
    });
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getCurrentUser', () => {
    it('should get current user with authentication', () => {
      const mockResponse = { ...mockUser };

      service.getCurrentUser().subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${authUrl}/me`);
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
      req.flush(mockResponse);
    });

    it('should handle unauthorized error', () => {
      service.getCurrentUser().subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.status).toBe(401);
        }
      );

      const req = httpMock.expectOne(`${authUrl}/me`);
      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    });
  });

  describe('generateRecipes', () => {
    it('should generate recipes from ingredients with authentication', () => {
      const ingredients = ['chicken', 'rice', 'garlic'];
      const mockResponse = {
        recipes: [
          { title: 'Chicken Rice', ingredients: ingredients }
        ]
      };

      service.generateRecipes(ingredients).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiUrl}/generate`);
      expect(req.request.method).toBe('POST');
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
      expect(req.request.body).toEqual({ ingredients });
      req.flush(mockResponse);
    });

    it('should handle error when AI generation fails', () => {
      const ingredients = ['invalid'];

      service.generateRecipes(ingredients).subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.status).toBe(500);
        }
      );

      const req = httpMock.expectOne(`${apiUrl}/generate`);
      req.flush('AI Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('getAllRecipes', () => {
    it('should get all approved recipes without authentication', () => {
      const mockRecipes = [
        {
          _id: 'recipe1',
          title: 'Recipe 1',
          status: 'approved',
          source: 'human'
        },
        {
          _id: 'recipe2',
          title: 'Recipe 2',
          status: 'approved',
          source: 'ai'
        }
      ];

      service.getAllRecipes().subscribe(response => {
        expect(response).toEqual(mockRecipes);
        expect(response.length).toBe(2);
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.has('Authorization')).toBeFalse();
      req.flush(mockRecipes);
    });

    it('should return empty array when no recipes exist', () => {
      service.getAllRecipes().subscribe(response => {
        expect(response).toEqual([]);
      });

      const req = httpMock.expectOne(apiUrl);
      req.flush([]);
    });
  });

  describe('searchRecipes', () => {
    it('should search recipes with all query parameters', () => {
      const searchParams: RecipeSearchParams = {
        q: 'chicken',
        category: 'Main Course',
        difficulty: 'Easy',
        source: 'human',
        minRating: 4
      };

      const mockResults = [
        { _id: 'recipe1', title: 'Chicken Soup', averageRating: 4.5 }
      ];

      service.searchRecipes(searchParams).subscribe(response => {
        expect(response).toEqual(mockResults);
      });

      const req = httpMock.expectOne(request => 
        request.url === `${apiUrl}/search` &&
        request.params.get('q') === 'chicken' &&
        request.params.get('category') === 'Main Course' &&
        request.params.get('difficulty') === 'Easy' &&
        request.params.get('source') === 'human' &&
        request.params.get('minRating') === '4'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResults);
    });

    it('should search recipes with partial parameters', () => {
      const searchParams: RecipeSearchParams = {
        q: 'pasta'
      };

      service.searchRecipes(searchParams).subscribe();

      const req = httpMock.expectOne(request => 
        request.url === `${apiUrl}/search` &&
        request.params.get('q') === 'pasta'
      );
      expect(req.request.params.keys().length).toBe(1);
      req.flush([]);
    });

    it('should search recipes with empty parameters', () => {
      service.searchRecipes({}).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/search`);
      expect(req.request.params.keys().length).toBe(0);
      req.flush([]);
    });
  });

  describe('getRecipeById', () => {
    it('should get recipe by ID without authentication', () => {
      const recipeId = 'recipe123';
      const mockRecipe = {
        _id: recipeId,
        title: 'Test Recipe',
        description: 'Description',
        status: 'approved'
      };

      service.getRecipeById(recipeId).subscribe(response => {
        expect(response).toEqual(mockRecipe);
        expect(response._id).toBe(recipeId);
      });

      const req = httpMock.expectOne(`${apiUrl}/${recipeId}`);
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.has('Authorization')).toBeFalse();
      req.flush(mockRecipe);
    });

    it('should handle recipe not found error', () => {
      const recipeId = 'nonexistent';

      service.getRecipeById(recipeId).subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.status).toBe(404);
        }
      );

      const req = httpMock.expectOne(`${apiUrl}/${recipeId}`);
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });
  });

  describe('getRecipesByCategory', () => {
    it('should get recipes by category', () => {
      const category = 'Dessert';
      const mockRecipes = [
        { _id: 'recipe1', title: 'Cake', category: 'Dessert' },
        { _id: 'recipe2', title: 'Cookie', category: 'Dessert' }
      ];

      service.getRecipesByCategory(category).subscribe(response => {
        expect(response).toEqual(mockRecipes);
        expect(response.length).toBe(2);
      });

      const req = httpMock.expectOne(`${apiUrl}/category/${category}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockRecipes);
    });

    it('should return empty array for category with no recipes', () => {
      const category = 'EmptyCategory';

      service.getRecipesByCategory(category).subscribe(response => {
        expect(response).toEqual([]);
      });

      const req = httpMock.expectOne(`${apiUrl}/category/${category}`);
      req.flush([]);
    });
  });

  describe('getUserRecipes', () => {
    it('should get current user recipes when no userId provided', () => {
      const mockRecipes = [
        { _id: 'recipe1', title: 'My Recipe 1', status: 'approved' },
        { _id: 'recipe2', title: 'My Recipe 2', status: 'pending' }
      ];

      service.getUserRecipes().subscribe(response => {
        expect(response).toEqual(mockRecipes);
      });

      const req = httpMock.expectOne(`${apiUrl}/my-recipes`);
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
      req.flush(mockRecipes);
    });

    it('should get specific user recipes when userId provided', () => {
      const userId = 'user456';
      const mockRecipes = [
        { _id: 'recipe1', title: 'User Recipe', status: 'approved' }
      ];

      service.getUserRecipes(userId).subscribe(response => {
        expect(response).toEqual(mockRecipes);
      });

      const req = httpMock.expectOne(`${apiUrl}/user/${userId}`);
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
      req.flush(mockRecipes);
    });
  });

  describe('createRecipe', () => {
    it('should create a new recipe with FormData and authentication', () => {
      const formData = new FormData();
      formData.append('title', 'New Recipe');
      formData.append('description', 'Description');

      const mockResponse = {
        _id: 'recipe123',
        title: 'New Recipe',
        status: 'pending',
        source: 'human'
      };

      service.createRecipe(formData).subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(response.status).toBe('pending');
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
      expect(req.request.body).toBe(formData);
      req.flush(mockResponse);
    });

    it('should handle validation error when creating recipe', () => {
      const formData = new FormData();

      service.createRecipe(formData).subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.status).toBe(400);
        }
      );

      const req = httpMock.expectOne(apiUrl);
      req.flush('Validation Error', { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('updateRecipe', () => {
    it('should update recipe with FormData and authentication', () => {
      const recipeId = 'recipe123';
      const formData = new FormData();
      formData.append('title', 'Updated Recipe');

      const mockResponse = {
        _id: recipeId,
        title: 'Updated Recipe',
        status: 'pending'
      };

      service.updateRecipe(recipeId, formData).subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(response.status).toBe('pending');
      });

      const req = httpMock.expectOne(`${apiUrl}/${recipeId}`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
      expect(req.request.body).toBe(formData);
      req.flush(mockResponse);
    });

    it('should handle unauthorized error when updating recipe', () => {
      const recipeId = 'recipe123';
      const formData = new FormData();

      service.updateRecipe(recipeId, formData).subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.status).toBe(403);
        }
      );

      const req = httpMock.expectOne(`${apiUrl}/${recipeId}`);
      req.flush('Forbidden', { status: 403, statusText: 'Forbidden' });
    });
  });

  describe('deleteRecipe', () => {
    it('should delete recipe with authentication', () => {
      const recipeId = 'recipe123';
      const mockResponse = { message: 'Recipe deleted successfully' };

      service.deleteRecipe(recipeId).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiUrl}/${recipeId}`);
      expect(req.request.method).toBe('DELETE');
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
      req.flush(mockResponse);
    });

    it('should handle recipe not found when deleting', () => {
      const recipeId = 'nonexistent';

      service.deleteRecipe(recipeId).subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.status).toBe(404);
        }
      );

      const req = httpMock.expectOne(`${apiUrl}/${recipeId}`);
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });
  });

  describe('addReview', () => {
    it('should add review to recipe with authentication', () => {
      const recipeId = 'recipe123';
      const reviewData = { rating: 5, comment: 'Excellent!' };
      const mockResponse = {
        _id: 'review123',
        user: mockUser._id,
        recipe: recipeId,
        ...reviewData
      };

      service.addReview(recipeId, reviewData).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/reviews`);
      expect(req.request.method).toBe('POST');
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
      expect(req.request.body).toEqual({
        userId: mockUser._id,
        recipeId: recipeId,
        rating: reviewData.rating,
        comment: reviewData.comment
      });
      req.flush(mockResponse);
    });

    it('should handle error when user is not authenticated', () => {
      const recipeId = 'recipe123';
      const reviewData = { rating: 5, comment: 'Test' };

      service.addReview(recipeId, reviewData).subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.status).toBe(401);
        }
      );

      const req = httpMock.expectOne(`${environment.apiUrl}/reviews`);
      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    });
  });

  describe('getRecipeReviews', () => {
    it('should get all reviews for a recipe', () => {
      const recipeId = 'recipe123';
      const mockReviews = [
        {
          _id: 'review1',
          user: { name: 'User1' },
          recipe: recipeId,
          rating: 5,
          comment: 'Great!'
        },
        {
          _id: 'review2',
          user: { name: 'User2' },
          recipe: recipeId,
          rating: 4,
          comment: 'Good'
        }
      ];

      service.getRecipeReviews(recipeId).subscribe(response => {
        expect(response).toEqual(mockReviews);
        expect(response.length).toBe(2);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/reviews/recipe/${recipeId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockReviews);
    });

    it('should return empty array when recipe has no reviews', () => {
      const recipeId = 'recipe123';

      service.getRecipeReviews(recipeId).subscribe(response => {
        expect(response).toEqual([]);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/reviews/recipe/${recipeId}`);
      req.flush([]);
    });
  });

  describe('updateReview', () => {
    it('should update review with authentication', () => {
      const reviewId = 'review123';
      const reviewData = { rating: 4, comment: 'Updated comment' };
      const mockResponse = {
        _id: reviewId,
        ...reviewData
      };

      service.updateReview(reviewId, reviewData).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/reviews/${reviewId}`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
      expect(req.request.body).toEqual(reviewData);
      req.flush(mockResponse);
    });

    it('should update review with partial data', () => {
      const reviewId = 'review123';
      const reviewData = { rating: 5 };

      service.updateReview(reviewId, reviewData).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/reviews/${reviewId}`);
      expect(req.request.body).toEqual({ rating: 5 });
      req.flush({ _id: reviewId, rating: 5 });
    });

    it('should handle forbidden error when updating other user review', () => {
      const reviewId = 'review123';
      const reviewData = { comment: 'Test' };

      service.updateReview(reviewId, reviewData).subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.status).toBe(403);
        }
      );

      const req = httpMock.expectOne(`${environment.apiUrl}/reviews/${reviewId}`);
      req.flush('Forbidden', { status: 403, statusText: 'Forbidden' });
    });
  });

  describe('deleteReview', () => {
    it('should delete review with authentication', () => {
      const reviewId = 'review123';
      const mockResponse = { message: 'Review deleted successfully' };

      service.deleteReview(reviewId).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/reviews/${reviewId}`);
      expect(req.request.method).toBe('DELETE');
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
      req.flush(mockResponse);
    });

    it('should handle review not found error', () => {
      const reviewId = 'nonexistent';

      service.deleteReview(reviewId).subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.status).toBe(404);
        }
      );

      const req = httpMock.expectOne(`${environment.apiUrl}/reviews/${reviewId}`);
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
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

  describe('getCurrentUserId', () => {
    it('should extract user ID from localStorage', () => {
      const userId = (service as any).getCurrentUserId();
      expect(userId).toBe(mockUser._id);
    });

    it('should return empty string when user data is invalid', () => {
      (localStorage.getItem as jasmine.Spy).and.returnValue('invalid-json');
      const userId = (service as any).getCurrentUserId();
      expect(userId).toBe('');
    });

    it('should return empty string when user is not in localStorage', () => {
      (localStorage.getItem as jasmine.Spy).and.returnValue(null);
      const userId = (service as any).getCurrentUserId();
      expect(userId).toBe('');
    });
  });

  describe('Integration scenarios', () => {
    it('should support full recipe creation and review workflow', () => {
      // Create recipe
      const formData = new FormData();
      formData.append('title', 'New Recipe');

      service.createRecipe(formData).subscribe();
      const createReq = httpMock.expectOne(apiUrl);
      createReq.flush({ _id: 'recipe123', title: 'New Recipe', status: 'pending' });

      // Get recipe
      service.getRecipeById('recipe123').subscribe();
      const getReq = httpMock.expectOne(`${apiUrl}/recipe123`);
      getReq.flush({ _id: 'recipe123', title: 'New Recipe' });

      // Add review
      service.addReview('recipe123', { rating: 5, comment: 'Great!' }).subscribe();
      const reviewReq = httpMock.expectOne(`${environment.apiUrl}/reviews`);
      expect(reviewReq.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
      reviewReq.flush({ _id: 'review123' });
    });

    it('should support search and filter workflow', () => {
      // Search recipes
      service.searchRecipes({ q: 'pasta', difficulty: 'Easy' }).subscribe();
      const searchReq = httpMock.expectOne(req => 
        req.url === `${apiUrl}/search` && 
        req.params.get('q') === 'pasta'
      );
      searchReq.flush([{ _id: 'recipe1', title: 'Easy Pasta' }]);

      // Get by category
      service.getRecipesByCategory('Italian').subscribe();
      const catReq = httpMock.expectOne(`${apiUrl}/category/Italian`);
      catReq.flush([{ _id: 'recipe1', category: 'Italian' }]);
    });
  });
});