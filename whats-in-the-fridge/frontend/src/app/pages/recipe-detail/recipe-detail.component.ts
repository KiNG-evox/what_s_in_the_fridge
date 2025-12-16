import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RecipeService } from '../../services/recipe.service';
import { FavoriteService } from '../../services/favorite.service';
import { AuthService } from '../../services/auth.service';
import { Recipe } from '../../models/recipe.model';

@Component({
  selector: 'app-recipe-detail',
  standalone: false,
  templateUrl: './recipe-detail.component.html',
  styleUrls: ['./recipe-detail.component.css']
})
export class RecipeDetailComponent implements OnInit {
  recipe: Recipe | null = null;
  isLoading = true;
  errorMessage = '';
  isFavorited = false;
  tempId: string | null = null;
  isTempRecipe = false; 

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private recipeService: RecipeService,
    private favoriteService: FavoriteService,
    private authService: AuthService
  ) {}

ngOnInit(): void {

  // 1️⃣ Check navigation state (AI temp recipe)
  const nav = this.router.getCurrentNavigation();
  const navRecipe = nav?.extras?.state?.['recipe'] as Recipe | undefined;

  if (navRecipe) {
    this.recipe = navRecipe;
    this.isTempRecipe = true;
    this.isLoading = false;

    // create tempId
    this.tempId = this.generateTempId(this.recipe.title);
    sessionStorage.setItem('tempRecipe', JSON.stringify({ ...this.recipe, _id: this.tempId }));

    return;
  }

  // 2️⃣ Check sessionStorage
  const temp = sessionStorage.getItem('tempRecipe');
  if (temp) {
    const parsed = JSON.parse(temp) as Recipe;
    this.recipe = parsed;
    this.tempId = parsed._id ?? null;
    this.isTempRecipe = true;
    this.isLoading = false;
    return;
  }

  // 3️⃣ Load real recipe from DB
  const recipeId = this.route.snapshot.paramMap.get('id');
  if (recipeId) {
    this.loadRecipe(recipeId);
  } else {
    this.router.navigate(['/home']);
  }
}


  loadRecipe(recipeId: string): void {
    this.isLoading = true;
    this.recipeService.getRecipeById(recipeId).subscribe({
      next: (response) => {
        this.recipe = response.data!;
        this.isTempRecipe = false;
        this.isLoading = false;
        this.checkIfFavorited(recipeId);
      },
      error: () => {
        this.errorMessage = 'Failed to load recipe';
        this.isLoading = false;
      }
    });
  }

  checkIfFavorited(recipeId: string): void {
    const user = this.authService.getCurrentUser();
    if (!user) return;

    this.favoriteService.checkFavorite(user._id, recipeId).subscribe({
      next: (res) => (this.isFavorited = res.isFavorited),
      error: (err) => console.error('Error checking favorite status', err)
    });
  }

  toggleFavorite(): void {
    const user = this.authService.getCurrentUser();
    if (!user) {
      alert('Login required to save favorites');
      this.router.navigate(['/login']);
      return;
    }

    if (!this.recipe) return;

    // use DB id OR temp id
    const recipeId = this.recipe._id || this.tempId;

    if (!recipeId) return;

    if (this.isFavorited) {
      alert('Remove from favorites feature coming soon!');
      return;
    }

    this.favoriteService.addToFavorites(recipeId).subscribe({
      next: () => {
        this.isFavorited = true;
        alert('✅ Added to favorites!');
      },
      error: (error) => {
        console.error('Error adding to favorites', error);
        alert(error.error?.message || 'Failed to add to favorites');
      }
    });
  }

  goBack(): void {
    window.history.back();
  }

  private generateTempId(title: string): string {
    return 'temp-' + btoa(title + '-' + Date.now()).slice(0, 12);
  }
}
