/**
 * This test suite validates the HomeComponent by ensuring correct authentication handling,
 * recipe generation logic, API communication, navigation flow, favorites management,
 * session handling, and error processing to guarantee a stable and reliable user experience.
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
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
    name: 'Test',
    lastname: 'User',
    pseudo: 'testuser',
    role: 'user'
  };

  beforeEach(async () => {
    recipeService = jasmine.createSpyObj('RecipeService', ['generateRecipes']);
    favoriteService = jasmine.createSpyObj('FavoriteService', ['addToFavorites']);
    authService = jasmine.createSpyObj('AuthService', ['isLoggedIn', 'getCurrentUser', 'getToken']);
    router = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      declarations: [HomeComponent],
      imports: [HttpClientTestingModule],
      providers: [
        { provide: RecipeService, useValue: recipeService },
        { provide: FavoriteService, useValue: favoriteService },
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);

    spyOn(window, 'alert');
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should redirect to login if user is not logged in', () => {
    authService.isLoggedIn.and.returnValue(false);

    component.ngOnInit();

    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should not redirect if user is logged in', () => {
    authService.isLoggedIn.and.returnValue(true);

    component.ngOnInit();

    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should show error if ingredients are empty', () => {
    component.ingredients = '';

    component.generateRecipes();

    expect(component.errorMessage).toBe('Please enter at least one ingredient');
  });

  it('should generate recipes successfully', () => {
    component.ingredients = 'tomato, cheese';
    authService.getCurrentUser.and.returnValue(mockUser);
    recipeService.generateRecipes.and.returnValue(of({ data: [mockRecipe] }));

    component.generateRecipes();

    expect(recipeService.generateRecipes).toHaveBeenCalledWith(['tomato', 'cheese']);
    expect(component.generatedRecipes.length).toBe(1);
    expect(component.temporaryRecipes[0].sessionId).toBe(mockUser._id);
  });

  it('should handle recipe generation error', () => {
    component.ingredients = 'tomato';
    recipeService.generateRecipes.and.returnValue(
      throwError(() => ({ error: { message: 'Server error' } }))
    );

    component.generateRecipes();

    expect(component.errorMessage).toBe('Server error');
    expect(component.generatedRecipes).toEqual([]);
  });

  it('should navigate to recipe details', () => {
    component.viewRecipeDetails(mockRecipe);

    expect(router.navigate).toHaveBeenCalledWith(
      ['/recipe-details'],
      { state: { recipe: mockRecipe } }
    );
  });

  it('should redirect to login when favoriting without authentication', () => {
    authService.getCurrentUser.and.returnValue(null);

    component.onFavoriteRecipe(mockRecipe);

    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should add recipe to favorites', () => {
    authService.getCurrentUser.and.returnValue(mockUser);
    favoriteService.addToFavorites.and.returnValue(of({}));

    component.onFavoriteRecipe(mockRecipe);

    expect(favoriteService.addToFavorites).toHaveBeenCalledWith('123');
    expect(window.alert).toHaveBeenCalledWith('✅ Recipe added to favorites!');
  });

  it('should save recipe then add it to favorites if it has no ID', () => {
    const recipeWithoutId = { ...mockRecipe, _id: undefined };
    authService.getCurrentUser.and.returnValue(mockUser);
    authService.getToken.and.returnValue('token');
    favoriteService.addToFavorites.and.returnValue(of({}));

    component.onFavoriteRecipe(recipeWithoutId);

    const req = httpMock.expectOne(`${environment.apiUrl}/recipes`);
    expect(req.request.method).toBe('POST');
    req.flush({ data: mockRecipe });

    expect(favoriteService.addToFavorites).toHaveBeenCalledWith('123');
    expect(window.alert).toHaveBeenCalledWith('✅ Recipe saved and added to favorites!');
  });

  it('should generate a valid session ID', () => {
    const sessionId = (component as any).generateSessionId();

    expect(sessionId).toBeDefined();
    expect(sessionId.length).toBe(10);
  });
});
