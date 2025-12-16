import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FavoriteService } from '../../services/favorite.service';
import { AuthService } from '../../services/auth.service';
import { Favorite } from '../../models/favorite.model';
import { Recipe } from '../../models/recipe.model';

@Component({
  selector: 'app-favorites',
  standalone: false, 
  templateUrl: './favorites.component.html',
  styleUrls: ['./favorites.component.css']
})
export class FavoritesComponent implements OnInit {
  favorites: Favorite[] = [];
  filteredFavorites: Favorite[] = [];
  isLoading = true;
  errorMessage = '';

  // Search and Filter Properties
  searchTerm: string = '';
  selectedCategory: string = '';
  selectedDifficulty: string = '';
  selectedRating: number = 0;
  sortBy: string = 'newest';

  categories = ['Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Snack', 'Beverage'];
  difficulties = ['Easy', 'Medium', 'Hard'];
  ratings = [1, 2, 3, 4, 5];

  constructor(
    private favoriteService: FavoriteService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    this.loadFavorites(user._id);
  }

  loadFavorites(userId: string): void {
    this.isLoading = true;
    this.favoriteService.getUserFavorites(userId).subscribe({
      next: (response) => {
        console.log('Favorites loaded', response);
        this.favorites = response.data;
        this.isLoading = false;
        this.applyFilters();
      },
      error: (error) => {
        console.error('Error loading favorites', error);
        this.errorMessage = 'Failed to load favorites';
        this.isLoading = false;
      }
    });
  }

  // Search and Filter Methods
  applyFilters(): void {
    let filtered = [...this.favorites];

    // Search by title or description
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter((favorite) => {
        const recipe = this.getRecipe(favorite);
        return (
          recipe.title.toLowerCase().includes(term) ||
          recipe.description.toLowerCase().includes(term) ||
          recipe.tags?.some((tag: string) => tag.toLowerCase().includes(term))
        );
      });
    }

    // Filter by category
    if (this.selectedCategory) {
      filtered = filtered.filter((favorite) => {
        const recipe = this.getRecipe(favorite);
        return recipe.category === this.selectedCategory;
      });
    }

    // Filter by difficulty
    if (this.selectedDifficulty) {
      filtered = filtered.filter((favorite) => {
        const recipe = this.getRecipe(favorite);
        return recipe.difficulty === this.selectedDifficulty;
      });
    }

    // Filter by minimum rating
    if (this.selectedRating > 0) {
      filtered = filtered.filter((favorite) => {
        const recipe = this.getRecipe(favorite);
        return (recipe.averageRating || 0) >= this.selectedRating;
      });
    }

    // Sort results
    this.sortFavorites(filtered);

    this.filteredFavorites = filtered;
  }

  sortFavorites(favorites: Favorite[]): void {
    switch (this.sortBy) {
      case 'newest':
        favorites.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
      case 'oldest':
        favorites.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        break;
      case 'rating':
        favorites.sort((a, b) => {
          const recipeA = this.getRecipe(a);
          const recipeB = this.getRecipe(b);
          return (recipeB.averageRating || 0) - (recipeA.averageRating || 0);
        });
        break;
      case 'title':
        favorites.sort((a, b) => {
          const recipeA = this.getRecipe(a);
          const recipeB = this.getRecipe(b);
          return recipeA.title.localeCompare(recipeB.title);
        });
        break;
      case 'prepTime':
        favorites.sort((a, b) => {
          const recipeA = this.getRecipe(a);
          const recipeB = this.getRecipe(b);
          return (recipeA.preparationTime || 0) - (recipeB.preparationTime || 0);
        });
        break;
    }
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onCategoryChange(): void {
    this.applyFilters();
  }

  onDifficultyChange(): void {
    this.applyFilters();
  }

  onRatingChange(): void {
    this.applyFilters();
  }

  onSortChange(): void {
    this.applyFilters();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedCategory = '';
    this.selectedDifficulty = '';
    this.selectedRating = 0;
    this.sortBy = 'newest';
    this.applyFilters();
  }

  removeFromFavorites(favorite: Favorite): void {
    if (!confirm('Are you sure you want to remove this recipe from favorites?')) {
      return;
    }

    this.favoriteService.removeFromFavorites(favorite._id).subscribe({
      next: (response) => {
        console.log('Removed from favorites', response);
        // Remove from both arrays
        this.favorites = this.favorites.filter(f => f._id !== favorite._id);
        this.filteredFavorites = this.filteredFavorites.filter(f => f._id !== favorite._id);
        alert('✅ Removed from favorites');
      },
      error: (error) => {
        console.error('Error removing from favorites', error);
        alert('Failed to remove from favorites');
      }
    });
  }

  getRecipe(favorite: Favorite): Recipe {
    return favorite.recipe as Recipe;
  }
}