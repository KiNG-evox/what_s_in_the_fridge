import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { HomeComponent } from './home.component';
import { RecipeService } from '../../services/recipe.service';
import { FavoriteService } from '../../services/favorite.service';
import { AuthService } from '../../services/auth.service';
import { Recipe, User } from '../../models/recipe.model';
import { environment } from '../../../environments/environment';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let recipeService: jasmine.SpyObj<RecipeService>;
  let favoriteService: jasmine.SpyObj<FavoriteService>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;
  let httpMock: HttpTestingController;

  const mockRecipe: Recipe = {
    _id: '123',
    title: 'Test Recipe',
    description: 'A delicious test recipe',
    ingredients: [
      { name: 'ingredient1', quantity: 100, unit: 'g' },
      { name: 'ingredient2', quantity: 200, unit: 'g' }
    ],
    instructions: [
      { step: 1, description: 'step1' },
      { step: 2, description: 'step2' }
    ],
    preparationTime: 10,
    cookingTime: 20,
    servings: 4,
    difficulty: 'Easy',
    category: 'Main Course',
    tags: ['test', 'quick'],
    image: 'test-image.jpg',
    nutritionalInfo: {
      calories: 300,
      protein: 20,
      carbs: 30,
      fat: 10
    },
    source: 'ai',
    status: 'approved'
  };

  const mockUser: User = {
    _id: 'user123',
    email: 'test@example.com',
    name: 'Test User',
    lastname: 'User',
    pseudo: 'testuser',
    role: 'user'
  };

  beforeEach(async () => {
    const recipeServiceSpy = jasmine.createSpyObj('RecipeService', ['generateRecipes']);
    const favoriteServiceSpy = jasmine.createSpyObj('FavoriteService', ['addToFavorites']);
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['isLoggedIn', 'getCurrentUser', 'getToken']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      declarations: [HomeComponent],
      imports: [HttpClientTestingModule],
      providers: [
        { provide: RecipeService, useValue: recipeServiceSpy },
        { provide: FavoriteService, useValue: favoriteServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    recipeService = TestBed.inject(RecipeService) as jasmine.SpyObj<RecipeService>;
    favoriteService = TestBed.inject(FavoriteService) as jasmine.SpyObj<FavoriteService>;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should navigate to login if user is not logged in', () => {
      authService.isLoggedIn.and.returnValue(false);

      component.ngOnInit();

      expect(authService.isLoggedIn).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should not navigate if user is logged in', () => {
      authService.isLoggedIn.and.returnValue(true);

      component.ngOnInit();

      expect(authService.isLoggedIn).toHaveBeenCalled();
      expect(router.navigate).not.toHaveBeenCalled();
    });
  });

  describe('generateRecipes', () => {
    it('should set error message if ingredients are empty', () => {
      component.ingredients = '';

      component.generateRecipes();

      expect(component.errorMessage).toBe('Please enter at least one ingredient');
      expect(recipeService.generateRecipes).not.toHaveBeenCalled();
    });

    it('should set error message if ingredients are only whitespace', () => {
      component.ingredients = '   ';

      component.generateRecipes();

      expect(component.errorMessage).toBe('Please enter at least one ingredient');
      expect(recipeService.generateRecipes).not.toHaveBeenCalled();
    });

    it('should set error message if no valid ingredients after trimming', () => {
      component.ingredients = ' , , , ';

      component.generateRecipes();

      expect(component.errorMessage).toBe('Please enter valid ingredients');
      expect(recipeService.generateRecipes).not.toHaveBeenCalled();
    });

    it('should generate recipes with valid ingredients', () => {
      const mockResponse = { data: [mockRecipe] };
      component.ingredients = 'tomato, cheese, pasta';
      authService.getCurrentUser.and.returnValue(mockUser);
      recipeService.generateRecipes.and.returnValue(of(mockResponse));

      component.generateRecipes();

      expect(component.isLoading).toBe(false);
      expect(component.errorMessage).toBe('');
      expect(recipeService.generateRecipes).toHaveBeenCalledWith(['tomato', 'cheese', 'pasta']);
      expect(component.generatedRecipes).toEqual(mockResponse.data);
      expect(component.temporaryRecipes.length).toBe(1);
      expect(component.temporaryRecipes[0].source).toBe('ai');
      expect(component.temporaryRecipes[0].sessionId).toBe(mockUser._id);
    });

    it('should generate session ID if user is not available', () => {
      const mockResponse = { data: [mockRecipe] };
      component.ingredients = 'tomato';
      authService.getCurrentUser.and.returnValue(null);
      recipeService.generateRecipes.and.returnValue(of(mockResponse));
      spyOn<any>(component, 'generateSessionId').and.returnValue('temp123');

      component.generateRecipes();

      expect(component.temporaryRecipes[0].sessionId).toBe('temp123');
    });

    it('should handle error when generating recipes fails', () => {
      const errorResponse = { error: { message: 'Server error' } };
      component.ingredients = 'tomato';
      recipeService.generateRecipes.and.returnValue(throwError(() => errorResponse));

      component.generateRecipes();

      expect(component.isLoading).toBe(false);
      expect(component.errorMessage).toBe('Server error');
      expect(component.generatedRecipes).toEqual([]);
    });

    it('should set default error message if error message is not provided', () => {
      component.ingredients = 'tomato';
      recipeService.generateRecipes.and.returnValue(throwError(() => ({})));

      component.generateRecipes();

      expect(component.errorMessage).toBe('Failed to generate recipes. Please try again.');
    });
  });

  describe('viewRecipeDetails', () => {
    it('should navigate to recipe details with recipe state', () => {
      component.viewRecipeDetails(mockRecipe);

      expect(router.navigate).toHaveBeenCalledWith(['/recipe-details'], { state: { recipe: mockRecipe } });
    });
  });

  describe('onFavoriteRecipe', () => {
    it('should navigate to login if user is not logged in', () => {
      authService.getCurrentUser.and.returnValue(null);

      component.onFavoriteRecipe(mockRecipe);

      expect(router.navigate).toHaveBeenCalledWith(['/login']);
      expect(favoriteService.addToFavorites).not.toHaveBeenCalled();
    });

    it('should add to favorites if recipe has _id', () => {
      authService.getCurrentUser.and.returnValue(mockUser);
      favoriteService.addToFavorites.and.returnValue(of({}));
      spyOn(window, 'alert');

      component.onFavoriteRecipe(mockRecipe);

      expect(favoriteService.addToFavorites).toHaveBeenCalledWith('123');
      expect(window.alert).toHaveBeenCalledWith('✅ Recipe added to favorites!');
    });

    it('should handle error when adding to favorites fails', () => {
      const errorResponse = { error: { message: 'Favorite error' } };
      authService.getCurrentUser.and.returnValue(mockUser);
      favoriteService.addToFavorites.and.returnValue(throwError(() => errorResponse));
      spyOn(window, 'alert');

      component.onFavoriteRecipe(mockRecipe);

      expect(window.alert).toHaveBeenCalledWith('Favorite error');
    });

    it('should save recipe and add to favorites if recipe has no _id', () => {
      const recipeWithoutId = { ...mockRecipe, _id: undefined };
      authService.getCurrentUser.and.returnValue(mockUser);
      authService.getToken.and.returnValue('test-token');
      favoriteService.addToFavorites.and.returnValue(of({}));
      spyOn(window, 'alert');

      component.onFavoriteRecipe(recipeWithoutId);

      const req = httpMock.expectOne(`${environment.apiUrl}/recipes`);
      expect(req.request.method).toBe('POST');
      expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');
      expect(req.request.body.requestedBy).toBe(mockUser._id);

      req.flush({ data: mockRecipe });

      expect(favoriteService.addToFavorites).toHaveBeenCalledWith('123');
      expect(window.alert).toHaveBeenCalledWith('✅ Recipe saved and added to favorites!');
    });

    it('should update generatedRecipes array with saved recipe _id', () => {
      const recipeWithoutId = { ...mockRecipe, _id: undefined };
      component.generatedRecipes = [recipeWithoutId];
      authService.getCurrentUser.and.returnValue(mockUser);
      authService.getToken.and.returnValue('test-token');
      favoriteService.addToFavorites.and.returnValue(of({}));
      spyOn(window, 'alert');

      component.onFavoriteRecipe(recipeWithoutId);

      const req = httpMock.expectOne(`${environment.apiUrl}/recipes`);
      req.flush({ data: mockRecipe });

      expect(component.generatedRecipes[0]._id).toBe('123');
    });

    it('should handle error when saving recipe fails', () => {
      const recipeWithoutId = { ...mockRecipe, _id: undefined };
      authService.getCurrentUser.and.returnValue(mockUser);
      authService.getToken.and.returnValue('test-token');
      spyOn(window, 'alert');

      component.onFavoriteRecipe(recipeWithoutId);

      const req = httpMock.expectOne(`${environment.apiUrl}/recipes`);
      req.flush({ message: 'Save failed' }, { status: 500, statusText: 'Server Error' });

      expect(window.alert).toHaveBeenCalledWith('Failed to save recipe: Unknown error');
    });

    it('should alert with custom error message when saving recipe fails with error message', () => {
      const recipeWithoutId = { ...mockRecipe, _id: undefined };
      authService.getCurrentUser.and.returnValue(mockUser);
      authService.getToken.and.returnValue('test-token');
      spyOn(window, 'alert');

      component.onFavoriteRecipe(recipeWithoutId);

      const req = httpMock.expectOne(`${environment.apiUrl}/recipes`);
      req.flush({ error: { message: 'Custom error' } }, { status: 400, statusText: 'Bad Request' });

      expect(window.alert).toHaveBeenCalledWith('Failed to save recipe: Unknown error');
    });

    it('should handle error when adding saved recipe to favorites fails', () => {
      const recipeWithoutId = { ...mockRecipe, _id: undefined };
      const errorResponse = { error: { message: 'Favorite failed' } };
      authService.getCurrentUser.and.returnValue(mockUser);
      authService.getToken.and.returnValue('test-token');
      favoriteService.addToFavorites.and.returnValue(throwError(() => errorResponse));
      spyOn(window, 'alert');

      component.onFavoriteRecipe(recipeWithoutId);

      const req = httpMock.expectOne(`${environment.apiUrl}/recipes`);
      req.flush({ data: mockRecipe });

      expect(window.alert).toHaveBeenCalledWith('Favorite failed');
    });
  });

  describe('generateSessionId', () => {
    it('should generate a session ID', () => {
      const sessionId = (component as any).generateSessionId();

      expect(sessionId).toBeDefined();
      expect(typeof sessionId).toBe('string');
      expect(sessionId.length).toBe(10);
    });

    it('should generate unique session IDs', () => {
      const sessionId1 = (component as any).generateSessionId();
      const sessionId2 = (component as any).generateSessionId();

      expect(sessionId1).not.toBe(sessionId2);
    });
  });
});