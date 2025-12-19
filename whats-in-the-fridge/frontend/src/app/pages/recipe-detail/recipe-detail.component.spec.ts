import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, Navigation } from '@angular/router';
import { of, throwError } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { RecipeDetailComponent } from './recipe-detail.component';
import { RecipeService } from '../../services/recipe.service';
import { FavoriteService } from '../../services/favorite.service';
import { AuthService } from '../../services/auth.service';
import { Recipe } from '../../models/recipe.model';
import { User } from '../../models/user.model';

describe('RecipeDetailComponent', () => {
  let component: RecipeDetailComponent;
  let fixture: ComponentFixture<RecipeDetailComponent>;
  let mockRecipeService: jasmine.SpyObj<RecipeService>;
  let mockFavoriteService: jasmine.SpyObj<FavoriteService>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockActivatedRoute: any;

  const mockRecipe: Recipe = {
    _id: '123',
    title: 'Test Recipe',
    description: 'Test Description',
    ingredients: [
      { name: 'ingredient1', quantity: 100, unit: 'g' },
      { name: 'ingredient2', quantity: 200, unit: 'ml' }
    ],
    instructions: [
      { step: 1, description: 'step1' },
      { step: 2, description: 'step2' }
    ],
    cookingTime: 20,
    preparationTime: 10,
    servings: 4,
    difficulty: 'Easy',
    category: 'Italian',
    tags: ['pasta', 'dinner'],
    image: 'test.jpg',
    nutritionalInfo: {
      calories: 500,
      protein: 20,
      carbs: 60,
      fat: 15
    },
    source: 'human',
    status: 'approved'
  };

  const mockUser: User = {
    _id: 'user123',
    name: 'Test',
    lastname: 'User',
    pseudo: 'testuser',
    email: 'test@example.com',
    role: 'user'
  };

  beforeEach(async () => {
    mockRecipeService = jasmine.createSpyObj('RecipeService', ['getRecipeById']);
    mockFavoriteService = jasmine.createSpyObj('FavoriteService', [
      'checkFavorite',
      'addToFavorites'
    ]);
    mockAuthService = jasmine.createSpyObj('AuthService', ['getCurrentUser']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate', 'getCurrentNavigation']);
    mockActivatedRoute = {
      snapshot: {
        paramMap: {
          get: jasmine.createSpy('get')
        }
      }
    };

    await TestBed.configureTestingModule({
      declarations: [RecipeDetailComponent],
      providers: [
        { provide: RecipeService, useValue: mockRecipeService },
        { provide: FavoriteService, useValue: mockFavoriteService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(RecipeDetailComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should load recipe from navigation state when available', () => {
      const mockNavigation: Partial<Navigation> = {
        extras: {
          state: { recipe: mockRecipe }
        }
      };
      mockRouter.getCurrentNavigation.and.returnValue(mockNavigation as Navigation);

      component.ngOnInit();

      expect(component.recipe).toEqual(mockRecipe);
      expect(component.isTempRecipe).toBe(true);
      expect(component.isLoading).toBe(false);
      expect(component.tempId).toBeTruthy();
      expect(sessionStorage.getItem('tempRecipe')).toBeTruthy();
    });

    it('should load recipe from sessionStorage when navigation state is not available', () => {
      const tempRecipe = { ...mockRecipe, _id: 'temp-123' };
      sessionStorage.setItem('tempRecipe', JSON.stringify(tempRecipe));
      mockRouter.getCurrentNavigation.and.returnValue(null);

      component.ngOnInit();

      expect(component.recipe).toEqual(tempRecipe);
      expect(component.tempId).toBe('temp-123');
      expect(component.isTempRecipe).toBe(true);
      expect(component.isLoading).toBe(false);
    });

    it('should load recipe from DB when no temp recipe exists', () => {
      mockRouter.getCurrentNavigation.and.returnValue(null);
      mockActivatedRoute.snapshot.paramMap.get.and.returnValue('123');
      mockRecipeService.getRecipeById.and.returnValue(
        of({ success: true, data: mockRecipe })
      );
      mockAuthService.getCurrentUser.and.returnValue(mockUser);
      mockFavoriteService.checkFavorite.and.returnValue(
        of({ isFavorited: false })
      );

      component.ngOnInit();

      expect(mockRecipeService.getRecipeById).toHaveBeenCalledWith('123');
    });

    it('should navigate to home when no recipe ID is provided', () => {
      mockRouter.getCurrentNavigation.and.returnValue(null);
      mockActivatedRoute.snapshot.paramMap.get.and.returnValue(null);

      component.ngOnInit();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/home']);
    });
  });

  describe('loadRecipe', () => {
    it('should load recipe successfully', () => {
      mockRecipeService.getRecipeById.and.returnValue(
        of({ success: true, data: mockRecipe })
      );
      mockAuthService.getCurrentUser.and.returnValue(mockUser);
      mockFavoriteService.checkFavorite.and.returnValue(
        of({ isFavorited: true })
      );

      component.loadRecipe('123');

      expect(component.recipe).toEqual(mockRecipe);
      expect(component.isLoading).toBe(false);
      expect(component.isTempRecipe).toBe(false);
      expect(mockFavoriteService.checkFavorite).toHaveBeenCalledWith('user123', '123');
    });

    it('should handle recipe load error', () => {
      mockRecipeService.getRecipeById.and.returnValue(
        throwError(() => new Error('Load failed'))
      );

      component.loadRecipe('123');

      expect(component.errorMessage).toBe('Failed to load recipe');
      expect(component.isLoading).toBe(false);
    });
  });

  describe('checkIfFavorited', () => {
    it('should check if recipe is favorited for logged-in user', () => {
      mockAuthService.getCurrentUser.and.returnValue(mockUser);
      mockFavoriteService.checkFavorite.and.returnValue(
        of({ isFavorited: true })
      );

      component.checkIfFavorited('123');

      expect(mockFavoriteService.checkFavorite).toHaveBeenCalledWith('user123', '123');
      expect(component.isFavorited).toBe(true);
    });

    it('should not check favorite status when user is not logged in', () => {
      mockAuthService.getCurrentUser.and.returnValue(null);

      component.checkIfFavorited('123');

      expect(mockFavoriteService.checkFavorite).not.toHaveBeenCalled();
    });

    it('should handle error when checking favorite status', () => {
      mockAuthService.getCurrentUser.and.returnValue(mockUser);
      mockFavoriteService.checkFavorite.and.returnValue(
        throwError(() => new Error('Check failed'))
      );
      spyOn(console, 'error');

      component.checkIfFavorited('123');

      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('toggleFavorite', () => {
    beforeEach(() => {
      component.recipe = mockRecipe;
    });

    it('should navigate to login when user is not logged in', () => {
      mockAuthService.getCurrentUser.and.returnValue(null);
      spyOn(window, 'alert');

      component.toggleFavorite();

      expect(window.alert).toHaveBeenCalledWith('Login required to save favorites');
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should add recipe to favorites successfully', () => {
      mockAuthService.getCurrentUser.and.returnValue(mockUser);
      component.isFavorited = false;
      mockFavoriteService.addToFavorites.and.returnValue(of({ success: true }));
      spyOn(window, 'alert');

      component.toggleFavorite();

      expect(mockFavoriteService.addToFavorites).toHaveBeenCalledWith('123');
      expect(component.isFavorited).toBe(true);
      expect(window.alert).toHaveBeenCalledWith('✅ Added to favorites!');
    });

    it('should use tempId when recipe has no _id', () => {
      mockAuthService.getCurrentUser.and.returnValue(mockUser);
      component.recipe = { ...mockRecipe, _id: undefined };
      component.tempId = 'temp-123';
      component.isFavorited = false;
      mockFavoriteService.addToFavorites.and.returnValue(of({ success: true }));

      component.toggleFavorite();

      expect(mockFavoriteService.addToFavorites).toHaveBeenCalledWith('temp-123');
    });

    it('should show alert when trying to remove from favorites', () => {
      mockAuthService.getCurrentUser.and.returnValue(mockUser);
      component.isFavorited = true;
      spyOn(window, 'alert');

      component.toggleFavorite();

      expect(window.alert).toHaveBeenCalledWith('Remove from favorites feature coming soon!');
    });

    it('should handle error when adding to favorites', () => {
      mockAuthService.getCurrentUser.and.returnValue(mockUser);
      component.isFavorited = false;
      const errorResponse = { error: { message: 'Failed to add' } };
      mockFavoriteService.addToFavorites.and.returnValue(
        throwError(() => errorResponse)
      );
      spyOn(window, 'alert');
      spyOn(console, 'error');

      component.toggleFavorite();

      expect(console.error).toHaveBeenCalled();
      expect(window.alert).toHaveBeenCalledWith('Failed to add');
    });

    it('should not toggle favorite when recipe is null', () => {
      mockAuthService.getCurrentUser.and.returnValue(mockUser);
      component.recipe = null;

      component.toggleFavorite();

      expect(mockFavoriteService.addToFavorites).not.toHaveBeenCalled();
    });

    it('should not toggle favorite when recipeId is null', () => {
      mockAuthService.getCurrentUser.and.returnValue(mockUser);
      component.recipe = { ...mockRecipe, _id: undefined };
      component.tempId = null;

      component.toggleFavorite();

      expect(mockFavoriteService.addToFavorites).not.toHaveBeenCalled();
    });
  });

  describe('goBack', () => {
    it('should call window.history.back', () => {
      spyOn(window.history, 'back');

      component.goBack();

      expect(window.history.back).toHaveBeenCalled();
    });
  });

  describe('generateTempId', () => {
    it('should generate a temporary ID based on title', () => {
      const tempId = (component as any).generateTempId('Test Recipe');

      expect(tempId).toContain('temp-');
      expect(tempId.length).toBeGreaterThan(5);
    });
  });
});