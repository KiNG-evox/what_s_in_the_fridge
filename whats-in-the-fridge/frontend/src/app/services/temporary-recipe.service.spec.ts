import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TemporaryRecipeService } from './temporary-recipe.service';
import { TemporaryRecipe } from '../models/recipe.model';
import { environment } from '../../environments/environment';

describe('TemporaryRecipeService', () => {
  let service: TemporaryRecipeService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/temporary-recipes`;
  const mockToken = 'mock-jwt-token';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TemporaryRecipeService]
    });
    service = TestBed.inject(TemporaryRecipeService);
    httpMock = TestBed.inject(HttpTestingController);

    // Clear storage before each test
    sessionStorage.clear();
    localStorage.clear();
    
    // Mock localStorage for authentication tests
    spyOn(localStorage, 'getItem').and.returnValue(mockToken);
  });

  afterEach(() => {
    httpMock.verify();
    sessionStorage.clear();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getSessionId', () => {
    it('should generate a new session ID when none exists', () => {
      spyOn(sessionStorage, 'getItem').and.returnValue(null);
      spyOn(sessionStorage, 'setItem');

      const sessionId = service.getSessionId();

      expect(sessionId).toContain('session_');
      expect(sessionStorage.setItem).toHaveBeenCalledWith('recipe_session_id', sessionId);
    });

    it('should return existing session ID when available', () => {
      const existingSessionId = 'session_123456_abc';
      spyOn(sessionStorage, 'getItem').and.returnValue(existingSessionId);
      spyOn(sessionStorage, 'setItem');

      const sessionId = service.getSessionId();

      expect(sessionId).toBe(existingSessionId);
      expect(sessionStorage.setItem).not.toHaveBeenCalled();
    });

    it('should generate unique session IDs', () => {
      spyOn(sessionStorage, 'getItem').and.returnValue(null);
      spyOn(sessionStorage, 'setItem');

      const sessionId1 = service.getSessionId();
      (sessionStorage.getItem as jasmine.Spy).calls.reset();
      (sessionStorage.setItem as jasmine.Spy).calls.reset();
      
      const sessionId2 = service.getSessionId();

      expect(sessionId1).not.toBe(sessionId2);
    });

    it('should format session ID correctly', () => {
      spyOn(sessionStorage, 'getItem').and.returnValue(null);
      
      const sessionId = service.getSessionId();
      const parts = sessionId.split('_');

      expect(parts.length).toBe(3);
      expect(parts[0]).toBe('session');
      expect(parts[1]).toMatch(/^\d+$/); // timestamp
      expect(parts[2].length).toBeGreaterThan(0); // random string
    });
  });

  describe('createTemporaryRecipe', () => {
    it('should create a temporary recipe without authentication', () => {
      const mockRecipe: TemporaryRecipe = {
        title: 'AI Generated Recipe',
        description: 'Test description',
        ingredients: [
          { name: 'ingredient1', quantity: 100, unit: 'g' },
          { name: 'ingredient2', quantity: 200, unit: 'ml' }
        ],
        instructions: [
          { step: 1, description: 'step1' },
          { step: 2, description: 'step2' }
        ],
        sessionId: 'session_123',
        cookingTime: 30,
        preparationTime: 15,
        servings: 4,
        difficulty: 'Medium',
        category: 'Main Course',
        tags: ['dinner', 'healthy'],
        image: '',
        nutritionalInfo: {
          calories: 350,
          protein: 25,
          carbs: 40,
          fat: 10
        },
        source: 'ai'
      };

      const mockResponse = {
        _id: 'temp123',
        ...mockRecipe,
        createdAt: '2024-01-01T00:00:00Z'
      };

      service.createTemporaryRecipe(mockRecipe).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.headers.has('Authorization')).toBeFalse();
      expect(req.request.body).toEqual(mockRecipe);
      req.flush(mockResponse);
    });

    it('should handle error when creating temporary recipe fails', () => {
      const mockRecipe: Partial<TemporaryRecipe> = {
        title: 'Test Recipe',
        sessionId: 'session_123'
      };

      service.createTemporaryRecipe(mockRecipe as TemporaryRecipe).subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.status).toBe(400);
        }
      );

      const req = httpMock.expectOne(apiUrl);
      req.flush('Bad Request', { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('getTemporaryRecipeById', () => {
    it('should retrieve temporary recipe by ID without authentication', () => {
      const recipeId = 'temp123';
      const mockRecipe = {
        _id: recipeId,
        title: 'AI Recipe',
        description: 'Test description',
        ingredients: [{ name: 'item1', quantity: 100, unit: 'g' }],
        instructions: [{ step: 1, description: 'Mix ingredients' }],
        sessionId: 'session_123',
        cookingTime: 20,
        preparationTime: 10,
        servings: 2,
        difficulty: 'Easy',
        category: 'Breakfast',
        tags: ['quick', 'easy'],
        image: '',
        nutritionalInfo: {
          calories: 200,
          protein: 15,
          carbs: 25,
          fat: 8
        },
        source: 'ai',
        createdAt: '2024-01-01T00:00:00Z'
      };

      service.getTemporaryRecipeById(recipeId).subscribe(response => {
        expect(response).toEqual(mockRecipe);
        expect(response._id).toBe(recipeId);
      });

      const req = httpMock.expectOne(`${apiUrl}/${recipeId}`);
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.has('Authorization')).toBeFalse();
      req.flush(mockRecipe);
    });

    it('should handle error when recipe not found', () => {
      const recipeId = 'nonexistent';

      service.getTemporaryRecipeById(recipeId).subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.status).toBe(404);
        }
      );

      const req = httpMock.expectOne(`${apiUrl}/${recipeId}`);
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });
  });

  describe('getSessionRecipes', () => {
    it('should retrieve all recipes for a session', () => {
      const sessionId = 'session_123';
      const mockRecipes = [
        {
          _id: 'temp1',
          title: 'Recipe 1',
          sessionId: sessionId,
          description: 'Description 1',
          ingredients: [{ name: 'item1', quantity: 100, unit: 'g' }],
          instructions: [{ step: 1, description: 'Step 1' }],
          cookingTime: 30,
          preparationTime: 15,
          servings: 4,
          difficulty: 'Medium',
          category: 'Lunch',
          tags: ['italian'],
          image: '',
          nutritionalInfo: {
            calories: 300,
            protein: 20,
            carbs: 35,
            fat: 12
          },
          source: 'ai',
          createdAt: '2024-01-01T00:00:00Z'
        },
        {
          _id: 'temp2',
          title: 'Recipe 2',
          sessionId: sessionId,
          description: 'Description 2',
          ingredients: [{ name: 'item2', quantity: 200, unit: 'g' }],
          instructions: [{ step: 1, description: 'Step 1' }],
          cookingTime: 45,
          preparationTime: 20,
          servings: 6,
          difficulty: 'Hard',
          category: 'Dinner',
          tags: ['french', 'vegetarian'],
          image: '',
          nutritionalInfo: {
            calories: 500,
            protein: 30,
            carbs: 60,
            fat: 18
          },
          source: 'ai',
          createdAt: '2024-01-02T00:00:00Z'
        }
      ];

      service.getSessionRecipes(sessionId).subscribe(response => {
        expect(response).toEqual(mockRecipes);
        expect(response.length).toBe(2);
      });

      const req = httpMock.expectOne(`${apiUrl}/session/${sessionId}`);
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.has('Authorization')).toBeFalse();
      req.flush(mockRecipes);
    });

    it('should return empty array when session has no recipes', () => {
      const sessionId = 'session_empty';

      service.getSessionRecipes(sessionId).subscribe(response => {
        expect(response).toEqual([]);
      });

      const req = httpMock.expectOne(`${apiUrl}/session/${sessionId}`);
      req.flush([]);
    });

    it('should handle error when fetching session recipes fails', () => {
      const sessionId = 'session_123';

      service.getSessionRecipes(sessionId).subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.status).toBe(500);
        }
      );

      const req = httpMock.expectOne(`${apiUrl}/session/${sessionId}`);
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('saveTemporaryRecipe', () => {
    it('should save temporary recipe as permanent with authentication', () => {
      const recipeId = 'temp123';
      const mockResponse = {
        _id: 'perm456',
        title: 'Saved Recipe',
        message: 'Recipe saved successfully'
      };

      service.saveTemporaryRecipe(recipeId).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiUrl}/${recipeId}/save`);
      expect(req.request.method).toBe('POST');
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
      expect(req.request.body).toEqual({});
      req.flush(mockResponse);
    });

    it('should handle unauthorized error when user is not logged in', () => {
      const recipeId = 'temp123';

      service.saveTemporaryRecipe(recipeId).subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.status).toBe(401);
        }
      );

      const req = httpMock.expectOne(`${apiUrl}/${recipeId}/save`);
      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    });

    it('should handle error when temporary recipe not found', () => {
      const recipeId = 'nonexistent';

      service.saveTemporaryRecipe(recipeId).subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.status).toBe(404);
        }
      );

      const req = httpMock.expectOne(`${apiUrl}/${recipeId}/save`);
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });
  });

  describe('deleteTemporaryRecipe', () => {
    it('should delete a temporary recipe', () => {
      const recipeId = 'temp123';
      const mockResponse = { message: 'Temporary recipe deleted successfully' };

      service.deleteTemporaryRecipe(recipeId).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiUrl}/${recipeId}`);
      expect(req.request.method).toBe('DELETE');
      req.flush(mockResponse);
    });

    it('should handle error when recipe not found', () => {
      const recipeId = 'nonexistent';

      service.deleteTemporaryRecipe(recipeId).subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.status).toBe(404);
        }
      );

      const req = httpMock.expectOne(`${apiUrl}/${recipeId}`);
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });

    it('should delete without requiring authentication', () => {
      const recipeId = 'temp123';

      service.deleteTemporaryRecipe(recipeId).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/${recipeId}`);
      expect(req.request.headers.has('Authorization')).toBeFalse();
      req.flush({ message: 'Deleted' });
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

  describe('Integration scenarios', () => {
    it('should support full workflow: generate session -> create recipe -> retrieve -> save', () => {
      // Generate session ID
      spyOn(sessionStorage, 'getItem').and.returnValue(null);
      spyOn(sessionStorage, 'setItem');
      const sessionId = service.getSessionId();
      expect(sessionId).toContain('session_');

      // Create temporary recipe
      const tempRecipe: TemporaryRecipe = {
        title: 'AI Recipe',
        description: 'AI generated recipe',
        sessionId: sessionId,
        ingredients: [{ name: 'item1', quantity: 100, unit: 'g' }],
        instructions: [{ step: 1, description: 'Mix well' }],
        cookingTime: 25,
        preparationTime: 10,
        servings: 3,
        difficulty: 'Easy',
        category: 'Snack',
        tags: ['quick'],
        image: '',
        nutritionalInfo: {
          calories: 250,
          protein: 18,
          carbs: 30,
          fat: 9
        },
        source: 'ai'
      };

      service.createTemporaryRecipe(tempRecipe).subscribe();
      const createReq = httpMock.expectOne(apiUrl);
      createReq.flush({ _id: 'temp123', ...tempRecipe });

      // Retrieve recipe
      service.getTemporaryRecipeById('temp123').subscribe();
      const getReq = httpMock.expectOne(`${apiUrl}/temp123`);
      getReq.flush({ _id: 'temp123', ...tempRecipe });

      // Save as permanent
      service.saveTemporaryRecipe('temp123').subscribe();
      const saveReq = httpMock.expectOne(`${apiUrl}/temp123/save`);
      expect(saveReq.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
      saveReq.flush({ _id: 'perm456', message: 'Saved' });
    });
  });
});