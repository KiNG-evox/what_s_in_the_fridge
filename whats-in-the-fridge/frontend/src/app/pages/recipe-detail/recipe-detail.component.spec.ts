import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, Navigation } from '@angular/router';
import { of, throwError } from 'rxjs';
import { RecipeDetailComponent } from './recipe-detail.component';
import { RecipeService } from '../../services/recipe.service';
import { FavoriteService } from '../../services/favorite.service';
import { AuthService } from '../../services/auth.service';
import { Recipe } from '../../models/recipe.model';
import { User } from '../../models/user.model';

describe('RecipeDetailComponent', () => {
  let component: RecipeDetailComponent;
  let fixture: ComponentFixture<RecipeDetailComponent>;
  let recipeService: jasmine.SpyObj<RecipeService>;
  let favoriteService: jasmine.SpyObj<FavoriteService>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;
  let activatedRoute: any;

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
    name: 'John',
    lastname: 'Doe',
    pseudo: 'johndoe',
    email: 'john@example.com',
    role: 'user'
  };

  beforeEach(async () => {
    const recipeServiceSpy = jasmine.createSpyObj('RecipeService', ['getRecipeById']);
    const favoriteServiceSpy = jasmine.createSpyObj('FavoriteService', ['addToFavorites', 'checkFavorite']);
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['getCurrentUser']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate', 'getCurrentNavigation']);

    activatedRoute = {
      snapshot: {
        paramMap: {
          get: jasmine.createSpy('get')
        }
      }
    };

    await TestBed.configureTestingModule({
      declarations: [RecipeDetailComponent],
      providers: [
        { provide: RecipeService, useValue: recipeServiceSpy },
        { provide: FavoriteService, useValue: favoriteServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: activatedRoute }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RecipeDetailComponent);
    component = fixture.componentInstance;
    recipeService = TestBed.inject(RecipeService) as jasmine.SpyObj<RecipeService>;
    favoriteService = TestBed.inject(FavoriteService) as jasmine.SpyObj<FavoriteService>;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    // Clear sessionStorage before each test
    sessionStorage.clear();
    spyOn(window, 'alert');
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit - Navigation State', () => {
    it('should load recipe from navigation state', () => {
      const navigation = {
        extras: {
          state: {
            recipe: mockRecipe
          }
        }
      } as unknown as Navigation;

      router.getCurrentNavigation.and.returnValue(navigation);

      component.ngOnInit();

      expect(component.recipe).toEqual(mockRecipe);
      expect(component.isTempRecipe).toBe(true);
      expect(component.isLoading).toBe(false);
      expect(component.tempId).toBeTruthy();
      expect(sessionStorage.getItem('tempRecipe')).toBeTruthy();
    });

    it('should generate tempId and store in sessionStorage', () => {
      const navigation = {
        extras: {
          state: {
            recipe: mockRecipe
          }
        }
      } as unknown as Navigation;

      router.getCurrentNavigation.and.returnValue(navigation);
      spyOn<any>(component, 'generateTempId').and.returnValue('temp-abc123');

      component.ngOnInit();

      expect(component.tempId).toBe('temp-abc123');
      const stored = JSON.parse(sessionStorage.getItem('tempRecipe')!);
      expect(stored._id).toBe('temp-abc123');
    });
  });

  describe('ngOnInit - SessionStorage', () => {
    it('should load recipe from sessionStorage when no navigation state', () => {
      router.getCurrentNavigation.and.returnValue(null);
      const tempRecipeWithId = { ...mockRecipe, _id: 'temp-stored' };
      sessionStorage.setItem('tempRecipe', JSON.stringify(tempRecipeWithId));

      component.ngOnInit();

      expect(component.recipe).toEqual(tempRecipeWithId);
      expect(component.tempId).toBe('temp-stored');
      expect(component.isTempRecipe).toBe(true);
      expect(component.isLoading).toBe(false);
    });

    it('should handle sessionStorage recipe without _id', () => {
      router.getCurrentNavigation.and.returnValue(null);
      const tempRecipeNoId = { ...mockRecipe };
      delete tempRecipeNoId._id;
      sessionStorage.setItem('tempRecipe', JSON.stringify(tempRecipeNoId));

      component.ngOnInit();

      expect(component.tempId).toBeNull();
    });
  });

  describe('ngOnInit - Route Params', () => {
    it('should load recipe from route params when no state or sessionStorage', () => {
      router.getCurrentNavigation.and.returnValue(null);
      activatedRoute.snapshot.paramMap.get.and.returnValue('recipe123');
      recipeService.getRecipeById.and.returnValue(of({ success: true, data: mockRecipe }));
      authService.getCurrentUser.and.returnValue(mockUser);
      favoriteService.checkFavorite.and.returnValue(of({ isFavorited: false }));

      component.ngOnInit();

      expect(activatedRoute.snapshot.paramMap.get).toHaveBeenCalledWith('id');
      expect(recipeService.getRecipeById).toHaveBeenCalledWith('recipe123');
    });

    it('should navigate to home when no recipe id in route params', () => {
      router.getCurrentNavigation.and.returnValue(null);
      activatedRoute.snapshot.paramMap.get.and.returnValue(null);

      component.ngOnInit();

      expect(router.navigate).toHaveBeenCalledWith(['/home']);
    });
  });

  describe('loadRecipe', () => {
    it('should load recipe successfully', () => {
      const response = { success: true, data: mockRecipe };
      recipeService.getRecipeById.and.returnValue(of(response));
      authService.getCurrentUser.and.returnValue(mockUser);
      favoriteService.checkFavorite.and.returnValue(of({ isFavorited: true }));

      component.loadRecipe('recipe123');

      expect(component.isLoading).toBe(false);
      expect(component.recipe).toEqual(mockRecipe);
      expect(component.isTempRecipe).toBe(false);
      expect(favoriteService.checkFavorite).toHaveBeenCalledWith('user123', 'recipe123');
      expect(component.isFavorited).toBe(true);
    });

    it('should handle load recipe error', () => {
      recipeService.getRecipeById.and.returnValue(throwError(() => new Error('Load failed')));

      component.loadRecipe('recipe123');

      expect(component.isLoading).toBe(false);
      expect(component.errorMessage).toBe('Failed to load recipe');
    });

    it('should set loading to true when starting to load', () => {
      const response = { success: true, data: mockRecipe };
      recipeService.getRecipeById.and.returnValue(of(response));
      authService.getCurrentUser.and.returnValue(mockUser);
      favoriteService.checkFavorite.and.returnValue(of({ isFavorited: false }));

      component.isLoading = false;
      component.loadRecipe('recipe123');

      expect(recipeService.getRecipeById).toHaveBeenCalled();
    });
  });

  describe('checkIfFavorited', () => {
    it('should check if recipe is favorited', () => {
      authService.getCurrentUser.and.returnValue(mockUser);
      favoriteService.checkFavorite.and.returnValue(of({ isFavorited: true }));

      component.checkIfFavorited('recipe123');

      expect(favoriteService.checkFavorite).toHaveBeenCalledWith('user123', 'recipe123');
      expect(component.isFavorited).toBe(true);
    });

    it('should not check favorite if user is not logged in', () => {
      authService.getCurrentUser.and.returnValue(null);

      component.checkIfFavorited('recipe123');

      expect(favoriteService.checkFavorite).not.toHaveBeenCalled();
    });

    it('should handle checkFavorite error', () => {
      authService.getCurrentUser.and.returnValue(mockUser);
      favoriteService.checkFavorite.and.returnValue(throwError(() => new Error('Check failed')));
      spyOn(console, 'error');

      component.checkIfFavorited('recipe123');

      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('toggleFavorite', () => {
    beforeEach(() => {
      component.recipe = mockRecipe;
    });

    it('should redirect to login if user is not logged in', () => {
      authService.getCurrentUser.and.returnValue(null);

      component.toggleFavorite();

      expect(window.alert).toHaveBeenCalledWith('Login required to save favorites');
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should not do anything if recipe is null', () => {
      component.recipe = null;
      authService.getCurrentUser.and.returnValue(mockUser);

      component.toggleFavorite();

      expect(favoriteService.addToFavorites).not.toHaveBeenCalled();
    });

    it('should add to favorites using recipe _id', () => {
      authService.getCurrentUser.and.returnValue(mockUser);
      component.isFavorited = false;
      favoriteService.addToFavorites.and.returnValue(of({ success: true }));

      component.toggleFavorite();

      expect(favoriteService.addToFavorites).toHaveBeenCalledWith('123');
      expect(component.isFavorited).toBe(true);
      expect(window.alert).toHaveBeenCalledWith('✅ Added to favorites!');
    });

    it('should add to favorites using tempId when recipe has no _id', () => {
      const recipeNoId = { ...mockRecipe };
      delete recipeNoId._id;
      component.recipe = recipeNoId;
      component.tempId = 'temp-456';
      authService.getCurrentUser.and.returnValue(mockUser);
      component.isFavorited = false;
      favoriteService.addToFavorites.and.returnValue(of({ success: true }));

      component.toggleFavorite();

      expect(favoriteService.addToFavorites).toHaveBeenCalledWith('temp-456');
    });

    it('should show coming soon message if already favorited', () => {
      authService.getCurrentUser.and.returnValue(mockUser);
      component.isFavorited = true;

      component.toggleFavorite();

      expect(window.alert).toHaveBeenCalledWith('Remove from favorites feature coming soon!');
      expect(favoriteService.addToFavorites).not.toHaveBeenCalled();
    });

    it('should handle add to favorites error', () => {
      authService.getCurrentUser.and.returnValue(mockUser);
      component.isFavorited = false;
      const errorResponse = { error: { message: 'Failed to add' } };
      favoriteService.addToFavorites.and.returnValue(throwError(() => errorResponse));
      spyOn(console, 'error');

      component.toggleFavorite();

      expect(console.error).toHaveBeenCalled();
      expect(window.alert).toHaveBeenCalledWith('Failed to add');
    });

    it('should handle add to favorites error without message', () => {
      authService.getCurrentUser.and.returnValue(mockUser);
      component.isFavorited = false;
      favoriteService.addToFavorites.and.returnValue(throwError(() => ({})));

      component.toggleFavorite();

      expect(window.alert).toHaveBeenCalledWith('Failed to add to favorites');
    });

    it('should not add to favorites if no recipeId or tempId', () => {
      const recipeNoId = { ...mockRecipe };
      delete recipeNoId._id;
      component.recipe = recipeNoId;
      component.tempId = null;
      authService.getCurrentUser.and.returnValue(mockUser);
      component.isFavorited = false;

      component.toggleFavorite();

      expect(favoriteService.addToFavorites).not.toHaveBeenCalled();
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
    it('should generate a temp id from title', () => {
      const tempId = (component as any).generateTempId('Test Recipe');

      expect(tempId).toContain('temp-');
      expect(tempId.length).toBeGreaterThan(5);
    });

    it('should generate unique ids for different titles', () => {
      const tempId1 = (component as any).generateTempId('Recipe 1');
      const tempId2 = (component as any).generateTempId('Recipe 2');

      expect(tempId1).not.toBe(tempId2);
    });
  });
});