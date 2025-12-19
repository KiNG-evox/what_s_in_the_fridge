/**
 * This test suite validates the FavoritesComponent by ensuring authentication checks,
 * favorites loading, filtering, sorting, removal actions, and error handling work
 * correctly to provide a reliable favorites management experience.
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of, throwError } from 'rxjs';

import { FavoritesComponent } from './favorites.component';
import { FavoriteService } from '../../services/favorite.service';
import { AuthService } from '../../services/auth.service';
import { Favorite } from '../../models/favorite.model';

describe('FavoritesComponent', () => {
  let component: FavoritesComponent;
  let fixture: ComponentFixture<FavoritesComponent>;
  let favoriteService: jasmine.SpyObj<FavoriteService>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  const mockUser = {
    _id: 'user123',
    email: 'test@test.com'
  };

  const mockFavorites: Favorite[] = [
    {
      _id: 'fav1',
      createdAt: new Date().toISOString(),
      user: 'user123',
      recipe: {
        title: 'Pasta',
        description: 'Delicious pasta',
        category: 'Lunch',
        difficulty: 'Easy',
        tags: ['italian'],
        averageRating: 4,
        preparationTime: 15
      } as any
    },
    {
      _id: 'fav2',
      createdAt: new Date(Date.now() - 10000).toISOString(),
      user: 'user123',
      recipe: {
        title: 'Cake',
        description: 'Sweet cake',
        category: 'Dessert',
        difficulty: 'Medium',
        tags: ['sweet'],
        averageRating: 5,
        preparationTime: 60
      } as any
    }
  ];

  beforeEach(async () => {
    favoriteService = jasmine.createSpyObj('FavoriteService', [
      'getUserFavorites',
      'removeFromFavorites'
    ]);
    authService = jasmine.createSpyObj('AuthService', ['getCurrentUser']);
    router = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      declarations: [FavoritesComponent],
      providers: [
        { provide: FavoriteService, useValue: favoriteService },
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(FavoritesComponent);
    component = fixture.componentInstance;

    spyOn(console, 'log');
    spyOn(console, 'error');
    spyOn(window, 'alert');
    spyOn(window, 'confirm').and.returnValue(true);
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should redirect to login if user is not authenticated', () => {
    authService.getCurrentUser.and.returnValue(null);

    component.ngOnInit();

    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should load favorites when user is authenticated', () => {
    authService.getCurrentUser.and.returnValue(mockUser as any);
    favoriteService.getUserFavorites.and.returnValue(
      of({ data: mockFavorites })
    );

    component.ngOnInit();

    expect(favoriteService.getUserFavorites).toHaveBeenCalledWith('user123');
    expect(component.favorites.length).toBe(2);
    expect(component.filteredFavorites.length).toBe(2);
    expect(component.isLoading).toBeFalse();
  });

  it('should handle error when loading favorites fails', () => {
    authService.getCurrentUser.and.returnValue(mockUser as any);
    favoriteService.getUserFavorites.and.returnValue(
      throwError(() => new Error('Load error'))
    );

    component.ngOnInit();

    expect(component.errorMessage).toBe('Failed to load favorites');
    expect(component.isLoading).toBeFalse();
  });

  it('should filter favorites by search term', () => {
    component.favorites = mockFavorites;
    component.searchTerm = 'pasta';

    component.applyFilters();

    expect(component.filteredFavorites.length).toBe(1);
    expect(component.filteredFavorites[0]._id).toBe('fav1');
  });

  it('should filter favorites by category', () => {
    component.favorites = mockFavorites;
    component.selectedCategory = 'Dessert';

    component.applyFilters();

    expect(component.filteredFavorites.length).toBe(1);
    expect(component.filteredFavorites[0]._id).toBe('fav2');
  });

  it('should sort favorites by rating', () => {
    component.favorites = mockFavorites;
    component.sortBy = 'rating';

    component.applyFilters();

    expect(component.filteredFavorites[0]._id).toBe('fav2');
  });

  it('should clear all filters', () => {
    component.favorites = mockFavorites;
    component.searchTerm = 'test';
    component.selectedCategory = 'Lunch';
    component.selectedRating = 4;

    component.clearFilters();

    expect(component.searchTerm).toBe('');
    expect(component.selectedCategory).toBe('');
    expect(component.selectedRating).toBe(0);
    expect(component.filteredFavorites.length).toBe(2);
  });

  it('should remove a favorite successfully', () => {
    component.favorites = [...mockFavorites];
    component.filteredFavorites = [...mockFavorites];
    favoriteService.removeFromFavorites.and.returnValue(of({}));

    component.removeFromFavorites(mockFavorites[0]);

    expect(favoriteService.removeFromFavorites).toHaveBeenCalledWith('fav1');
    expect(component.favorites.length).toBe(1);
    expect(window.alert).toHaveBeenCalledWith('✅ Removed from favorites');
  });

  it('should not remove favorite if confirmation is cancelled', () => {
    (window.confirm as jasmine.Spy).and.returnValue(false);

    component.removeFromFavorites(mockFavorites[0]);

    expect(favoriteService.removeFromFavorites).not.toHaveBeenCalled();
  });

  it('should handle error when removing favorite fails', () => {
    favoriteService.removeFromFavorites.and.returnValue(
      throwError(() => new Error('Remove error'))
    );

    component.removeFromFavorites(mockFavorites[0]);

    expect(console.error).toHaveBeenCalled();
    expect(window.alert).toHaveBeenCalledWith('Failed to remove from favorites');
  });
});
