import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { RecipeService } from '../../services/recipe.service';
import { FavoriteService } from '../../services/favorite.service';
import { AuthService } from '../../services/auth.service';
import { Recipe, TemporaryRecipe } from '../../models/recipe.model';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  ingredients = '';
  isLoading = false;
  generatedRecipes: Recipe[] = [];
  temporaryRecipes: TemporaryRecipe[] = [];
  errorMessage = '';

  constructor(
    private recipeService: RecipeService,
    private favoriteService: FavoriteService,
    private authService: AuthService,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
    }
  }

  generateRecipes(): void {
    if (!this.ingredients.trim()) {
      this.errorMessage = 'Please enter at least one ingredient';
      return;
    }

    const ingredientArray = this.ingredients
      .split(',')
      .map(item => item.trim())
      .filter(item => item.length > 0);

    if (ingredientArray.length === 0) {
      this.errorMessage = 'Please enter valid ingredients';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.generatedRecipes = [];

    this.recipeService.generateRecipes(ingredientArray).subscribe({
      next: (response) => {
        console.log('Recipes generated', response);

        const sessionId = this.authService.getCurrentUser()?._id || this.generateSessionId();

        this.temporaryRecipes = response.data.map((r: Recipe) => ({
          ...r,
          source: 'ai',
          sessionId,
          createdAt: new Date(),
        }));

        this.generatedRecipes = response.data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error generating recipes', error);
        this.errorMessage = error.error?.message || 'Failed to generate recipes. Please try again.';
        this.isLoading = false;
      }
    });
  }

  /** VIEW DETAILS WITHOUT FAVORITES */
  viewRecipeDetails(recipe: Recipe) {
    this.router.navigate(['/recipe-details'], { state: { recipe } });
  }

  /** FAVORITE FUNCTION */
  onFavoriteRecipe(recipe: Recipe): void {
    const user = this.authService.getCurrentUser();
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    if (recipe._id) {
      this.favoriteService.addToFavorites(recipe._id).subscribe({
        next: () => alert('✅ Recipe added to favorites!'),
        error: (error) => alert(error.error?.message || 'Failed to add to favorites')
      });
    } else {
      this.saveRecipeAndAddToFavorites(recipe, user._id);
    }
  }

  private saveRecipeAndAddToFavorites(recipe: Recipe, userId: string): void {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    const recipeData = { ...recipe, requestedBy: userId };

    this.http.post<any>(`${environment.apiUrl}/recipes`, recipeData, { headers }).subscribe({
      next: (saveResponse) => {
        const savedRecipeId = saveResponse.data._id;

        const index = this.generatedRecipes.findIndex(r => r.title === recipe.title);
        if (index !== -1) this.generatedRecipes[index]._id = savedRecipeId;

        this.favoriteService.addToFavorites(savedRecipeId).subscribe({
          next: () => alert('✅ Recipe saved and added to favorites!'),
          error: (error) => alert(error.error?.message || 'Recipe saved but failed to add to favorites')
        });
      },
      error: (error) => alert('Failed to save recipe: ' + (error.error?.message || 'Unknown error'))
    });
  }

  /** Helper to generate temporary session ID */
  private generateSessionId(): string {
    return Math.random().toString(36).substring(2, 12);
  }
}
