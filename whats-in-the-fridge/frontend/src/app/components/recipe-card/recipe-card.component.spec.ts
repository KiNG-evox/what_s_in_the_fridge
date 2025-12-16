import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { RecipeCardComponent } from './recipe-card.component';
import { Recipe } from '../../models/recipe.model';

describe('RecipeCardComponent', () => {
  let component: RecipeCardComponent;
  let fixture: ComponentFixture<RecipeCardComponent>;
  let router: jasmine.SpyObj<Router>;

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

  beforeEach(async () => {
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      declarations: [RecipeCardComponent],
      providers: [
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RecipeCardComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    // Set required input
    component.recipe = mockRecipe;

    // Clear sessionStorage before each test
    sessionStorage.clear();
    spyOn(console, 'log');
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.showFavoriteButton).toBe(true);
    expect(component.isFavorited).toBe(false);
  });

  describe('Input Properties', () => {
    it('should accept recipe input', () => {
      const testRecipe = { ...mockRecipe, title: 'New Recipe' };
      component.recipe = testRecipe;
      expect(component.recipe.title).toBe('New Recipe');
    });

    it('should accept showFavoriteButton input', () => {
      component.showFavoriteButton = false;
      expect(component.showFavoriteButton).toBe(false);
    });

    it('should have default value true for showFavoriteButton', () => {
      const newComponent = new RecipeCardComponent(router);
      expect(newComponent.showFavoriteButton).toBe(true);
    });
  });

  describe('Output Properties', () => {
    it('should have favoriteClick EventEmitter', () => {
      expect(component.favoriteClick).toBeDefined();
      expect(component.favoriteClick instanceof EventEmitter).toBe(true);
    });
  });

  describe('viewDetails - with recipe._id', () => {
    it('should navigate to recipe detail page with id', () => {
      component.recipe = mockRecipe;

      component.viewDetails();

      expect(console.log).toHaveBeenCalledWith('✅ Navigating to recipe by ID:', '123');
      expect(router.navigate).toHaveBeenCalledWith(['/recipe', '123']);
      expect(sessionStorage.getItem('tempRecipe')).toBeNull();
    });

    it('should navigate with correct id for different recipes', () => {
      component.recipe = { ...mockRecipe, _id: 'recipe-456' };

      component.viewDetails();

      expect(router.navigate).toHaveBeenCalledWith(['/recipe', 'recipe-456']);
    });
  });

  describe('viewDetails - without recipe._id', () => {
    beforeEach(() => {
      const recipeWithoutId = { ...mockRecipe };
      delete recipeWithoutId._id;
      component.recipe = recipeWithoutId;
    });

    it('should navigate to recipe-details with state', () => {
      component.viewDetails();

      expect(console.log).toHaveBeenCalledWith(
        '🔹 Navigating to temporary recipe via state:',
        component.recipe
      );
      expect(router.navigate).toHaveBeenCalledWith(
        ['/recipe-details'],
        { state: { recipe: component.recipe } }
      );
    });

    it('should save recipe to sessionStorage', () => {
      component.viewDetails();

      const stored = sessionStorage.getItem('tempRecipe');
      expect(stored).toBeTruthy();
      
      const parsedRecipe = JSON.parse(stored!);
      expect(parsedRecipe.title).toBe(mockRecipe.title);
      expect(parsedRecipe.description).toBe(mockRecipe.description);
    });

    it('should save complete recipe data to sessionStorage', () => {
      component.viewDetails();

      const stored = JSON.parse(sessionStorage.getItem('tempRecipe')!);
      expect(stored.ingredients).toEqual(mockRecipe.ingredients);
      expect(stored.instructions).toEqual(mockRecipe.instructions);
      expect(stored.preparationTime).toBe(mockRecipe.preparationTime);
    });
  });

  describe('onFavoriteClick', () => {
    let mockEvent: jasmine.SpyObj<Event>;

    beforeEach(() => {
      mockEvent = jasmine.createSpyObj('Event', ['stopPropagation']);
    });

    it('should stop event propagation', () => {
      component.onFavoriteClick(mockEvent);

      expect(mockEvent.stopPropagation).toHaveBeenCalled();
    });

    it('should toggle isFavorited from false to true', () => {
      component.isFavorited = false;

      component.onFavoriteClick(mockEvent);

      expect(component.isFavorited).toBe(true);
    });

    it('should toggle isFavorited from true to false', () => {
      component.isFavorited = true;

      component.onFavoriteClick(mockEvent);

      expect(component.isFavorited).toBe(false);
    });

    it('should emit favoriteClick event with recipe', () => {
      spyOn(component.favoriteClick, 'emit');

      component.onFavoriteClick(mockEvent);

      expect(component.favoriteClick.emit).toHaveBeenCalledWith(mockRecipe);
    });

    it('should log favorite status', () => {
      component.isFavorited = false;

      component.onFavoriteClick(mockEvent);

      expect(console.log).toHaveBeenCalledWith('Test Recipe favorite:', true);
    });

    it('should handle multiple clicks', () => {
      component.isFavorited = false;

      component.onFavoriteClick(mockEvent);
      expect(component.isFavorited).toBe(true);

      component.onFavoriteClick(mockEvent);
      expect(component.isFavorited).toBe(false);

      component.onFavoriteClick(mockEvent);
      expect(component.isFavorited).toBe(true);
    });
  });

  describe('hasValidImage getter', () => {
    it('should return true when recipe has valid image', () => {
      component.recipe = mockRecipe;

      expect(component.hasValidImage).toBe(true);
    });

    it('should return false when image is empty string', () => {
      component.recipe = { ...mockRecipe, image: '' };

      expect(component.hasValidImage).toBe(false);
    });

    it('should return false when image is null', () => {
      component.recipe = { ...mockRecipe, image: null as any };

      expect(component.hasValidImage).toBe(false);
    });

    it('should return false when image is undefined', () => {
      component.recipe = { ...mockRecipe, image: undefined as any };

      expect(component.hasValidImage).toBe(false);
    });

    it('should return false when recipe is null', () => {
      component.recipe = null as any;

      expect(component.hasValidImage).toBe(false);
    });

    it('should return false when recipe is undefined', () => {
      component.recipe = undefined as any;

      expect(component.hasValidImage).toBe(false);
    });

    it('should return true for any non-empty image string', () => {
      component.recipe = { ...mockRecipe, image: 'https://example.com/image.jpg' };

      expect(component.hasValidImage).toBe(true);
    });

    it('should return true even for single character image', () => {
      component.recipe = { ...mockRecipe, image: 'a' };

      expect(component.hasValidImage).toBe(true);
    });
  });

  describe('Integration Tests', () => {
    it('should handle favorite click without affecting navigation', () => {
      const mockEvent = jasmine.createSpyObj('Event', ['stopPropagation']);
      spyOn(component.favoriteClick, 'emit');

      component.onFavoriteClick(mockEvent);

      expect(mockEvent.stopPropagation).toHaveBeenCalled();
      expect(component.favoriteClick.emit).toHaveBeenCalled();
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should handle recipe with _id and valid image', () => {
      component.recipe = mockRecipe;

      expect(component.hasValidImage).toBe(true);
      component.viewDetails();
      expect(router.navigate).toHaveBeenCalledWith(['/recipe', '123']);
    });

    it('should handle recipe without _id and valid image', () => {
      const recipeWithoutId = { ...mockRecipe };
      delete recipeWithoutId._id;
      component.recipe = recipeWithoutId;

      expect(component.hasValidImage).toBe(true);
      component.viewDetails();
      expect(router.navigate).toHaveBeenCalledWith(
        ['/recipe-details'],
        { state: { recipe: component.recipe } }
      );
    });
  });
});