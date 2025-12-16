import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { Recipe } from '../../models/recipe.model';

@Component({
  selector: 'app-recipe-card',
  standalone: false,
  templateUrl: './recipe-card.component.html',
  styleUrls: ['./recipe-card.component.css']
})
export class RecipeCardComponent {
  @Input() recipe!: Recipe;
  @Input() showFavoriteButton = true;
  @Output() favoriteClick = new EventEmitter<Recipe>();

  isFavorited = false;

  constructor(private router: Router) {}

viewDetails(): void {
  if (this.recipe._id) {
    console.log('✅ Navigating to recipe by ID:', this.recipe._id);
    this.router.navigate(['/recipe', this.recipe._id]);
  } else {
    console.log('🔹 Navigating to temporary recipe via state:', this.recipe);
    // Save to sessionStorage for refresh persistence
    sessionStorage.setItem('tempRecipe', JSON.stringify(this.recipe));
    this.router.navigate(['/recipe-details'], { state: { recipe: this.recipe } });
  }
}


  onFavoriteClick(event: Event): void {
    event.stopPropagation(); // prevent parent click
    this.isFavorited = !this.isFavorited;
    this.favoriteClick.emit(this.recipe);
    console.log(`${this.recipe.title} favorite:`, this.isFavorited);
  }

  get hasValidImage() {
    return this.recipe && this.recipe.image && this.recipe.image.length > 0;
  }
}
