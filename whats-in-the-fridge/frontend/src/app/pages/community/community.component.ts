import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { RecipeService } from '../../services/recipe.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-community',
  standalone: false,
  templateUrl: './community.component.html',
  styleUrls: ['./community.component.css'],
})
export class CommunityComponent implements OnInit {
  recipeForm!: FormGroup;
  recipes: any[] = [];
  filteredRecipes: any[] = [];
  selectedRecipe: any = null;
  currentUser: any = null;
  isEditing = false;
  editingRecipeId: string | null = null;
  showCreateForm = false;
  selectedImage: File | null = null;
  imagePreview: string | null = null;

  // Search and Filter Properties
  searchTerm: string = '';
  selectedCategory: string = '';
  selectedDifficulty: string = '';
  selectedRating: number = 0;
  sortBy: string = 'newest';

  categories = ['Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Snack', 'Beverage'];
  difficulties = ['Easy', 'Medium', 'Hard'];
  ratings = [1, 2, 3, 4, 5];

  reviewForm!: FormGroup;
  showReviewForm: { [key: string]: boolean } = {};

  constructor(private fb: FormBuilder, private recipeService: RecipeService) {}

  ngOnInit(): void {
    this.initializeForms();
    this.loadCurrentUser();
    this.loadRecipes();
  }

  initializeForms(): void {
    this.recipeForm = this.fb.group({
      title: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(100),
        ],
      ],
      description: ['', [Validators.required, Validators.maxLength(500)]],
      ingredients: this.fb.array([]),
      instructions: this.fb.array([]),
      category: ['', Validators.required],
      difficulty: ['Medium', Validators.required],
      servings: ['', [Validators.required, Validators.min(1)]],
      preparationTime: ['', [Validators.required, Validators.min(1)]],
      cookingTime: ['', [Validators.required, Validators.min(1)]],
      tags: [''],
      nutritionalInfo: this.fb.group({
        calories: [null],
        protein: [null],
        carbs: [null],
        fat: [null],
      }),
      image: [null],
    });

    this.addIngredient();
    this.addInstruction();

    this.reviewForm = this.fb.group({
      rating: [5, [Validators.required, Validators.min(1), Validators.max(5)]],
      comment: [
        '',
        [
          Validators.required,
          Validators.minLength(10),
          Validators.maxLength(500),
        ],
      ],
    });
  }

  loadCurrentUser(): void {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        this.currentUser = JSON.parse(userStr);
      } catch (e) {
        console.error('Error parsing user data');
      }
    }
  }

  loadRecipes(): void {
    this.recipeService.getAllRecipes().subscribe({
      next: (res: any) => {
        this.recipes = res.data || [];
        this.applyFilters();
      },
      error: (err) => console.error('Error loading recipes', err),
    });
  }

  // Search and Filter Methods
  applyFilters(): void {
    let filtered = [...this.recipes];

    // Search by title or description
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (recipe) =>
          recipe.title.toLowerCase().includes(term) ||
          recipe.description.toLowerCase().includes(term) ||
          recipe.tags?.some((tag: string) => tag.toLowerCase().includes(term))
      );
    }

    // Filter by category
    if (this.selectedCategory) {
      filtered = filtered.filter(
        (recipe) => recipe.category === this.selectedCategory
      );
    }

    // Filter by difficulty
    if (this.selectedDifficulty) {
      filtered = filtered.filter(
        (recipe) => recipe.difficulty === this.selectedDifficulty
      );
    }

    // Filter by minimum rating
    if (this.selectedRating > 0) {
      filtered = filtered.filter(
        (recipe) => (recipe.averageRating || 0) >= this.selectedRating
      );
    }

    // Sort results
    this.sortRecipes(filtered);

    this.filteredRecipes = filtered;
  }

  sortRecipes(recipes: any[]): void {
    switch (this.sortBy) {
      case 'newest':
        recipes.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
      case 'oldest':
        recipes.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        break;
      case 'rating':
        recipes.sort(
          (a, b) => (b.averageRating || 0) - (a.averageRating || 0)
        );
        break;
      case 'title':
        recipes.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'prepTime':
        recipes.sort(
          (a, b) => (a.preparationTime || 0) - (b.preparationTime || 0)
        );
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

  get ingredients(): FormArray {
    return this.recipeForm.get('ingredients') as FormArray;
  }

  get instructions(): FormArray {
    return this.recipeForm.get('instructions') as FormArray;
  }

  createIngredient(): FormGroup {
    return this.fb.group({
      name: ['', Validators.required],
      quantity: ['', Validators.required],
      unit: ['g', Validators.required],
    });
  }

  createInstruction(): FormGroup {
    const stepNumber = this.instructions.length + 1;
    return this.fb.group({
      step: [stepNumber, Validators.required],
      description: ['', Validators.required],
    });
  }

  addIngredient(): void {
    this.ingredients.push(this.createIngredient());
  }

  removeIngredient(index: number): void {
    if (this.ingredients.length > 1) {
      this.ingredients.removeAt(index);
    }
  }

  addInstruction(): void {
    this.instructions.push(this.createInstruction());
  }

  removeInstruction(index: number): void {
    if (this.instructions.length > 1) {
      this.instructions.removeAt(index);
      this.updateInstructionSteps();
    }
  }

  updateInstructionSteps(): void {
    this.instructions.controls.forEach((control, index) => {
      control.patchValue({ step: index + 1 });
    });
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    this.selectedImage = input.files[0];

    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.imagePreview = e.target.result;
    };
    reader.readAsDataURL(this.selectedImage);
  }

  toggleCreateForm(): void {
    this.showCreateForm = !this.showCreateForm;
    if (!this.showCreateForm) {
      this.resetForm();
    } else {
      if (this.ingredients.length === 0) this.addIngredient();
      if (this.instructions.length === 0) this.addInstruction();
    }
  }

  submitRecipe(): void {
    if (!this.recipeForm.valid) {
      console.warn('Form is invalid or not initialized');
      return;
    }

    const formValue = this.recipeForm.value;
    const tagsArray = formValue.tags
      ? formValue.tags
          .split(',')
          .map((tag: string) => tag.trim())
          .filter((tag: string) => tag)
      : [];

    const formData = new FormData();
    formData.append('title', formValue.title);
    formData.append('description', formValue.description);
    formData.append('ingredients', JSON.stringify(formValue.ingredients));
    formData.append('instructions', JSON.stringify(formValue.instructions));
    formData.append('category', formValue.category);
    formData.append('difficulty', formValue.difficulty);
    formData.append('servings', formValue.servings.toString());
    formData.append('preparationTime', formValue.preparationTime.toString());
    formData.append('cookingTime', formValue.cookingTime.toString());
    formData.append('tags', JSON.stringify(tagsArray));
    formData.append(
      'nutritionalInfo',
      JSON.stringify(formValue.nutritionalInfo)
    );

    if (this.selectedImage) {
      formData.append('image', this.selectedImage, this.selectedImage.name);
    }

    if (this.isEditing && this.editingRecipeId) {
      this.recipeService
        .updateRecipe(this.editingRecipeId, formData)
        .subscribe({
          next: (res: any) => {
            alert('Recipe updated and submitted for approval!');
            this.loadRecipes();
            this.resetForm();
            this.showCreateForm = false;
          },
          error: (err: any) => {
            console.error('Error updating recipe', err);
            alert(
              'Failed to update recipe: ' +
                (err.error?.message || 'Unknown error')
            );
          },
        });
    } else {
      this.recipeService.createRecipe(formData).subscribe({
        next: (res: any) => {
          alert('Recipe submitted for approval! An admin will review it soon.');
          this.loadRecipes();
          this.resetForm();
          this.showCreateForm = false;
        },
        error: (err: any) => {
          console.error('Error creating recipe', err);
          alert(
            'Failed to create recipe: ' +
              (err.error?.message || 'Unknown error')
          );
        },
      });
    }
  }

  editRecipe(recipe: any): void {
    this.isEditing = true;
    this.editingRecipeId = recipe._id;
    this.showCreateForm = true;

    while (this.ingredients.length) this.ingredients.removeAt(0);
    while (this.instructions.length) this.instructions.removeAt(0);

    recipe.ingredients.forEach((ing: any) => {
      this.ingredients.push(
        this.fb.group({
          name: [ing.name, Validators.required],
          quantity: [ing.quantity, Validators.required],
          unit: [ing.unit, Validators.required],
        })
      );
    });

    recipe.instructions.forEach((inst: any) => {
      this.instructions.push(
        this.fb.group({
          step: [inst.step, Validators.required],
          description: [inst.description, Validators.required],
        })
      );
    });

    const tagsString = recipe.tags ? recipe.tags.join(', ') : '';

    this.recipeForm.patchValue({
      title: recipe.title,
      description: recipe.description,
      category: recipe.category,
      difficulty: recipe.difficulty,
      servings: recipe.servings,
      preparationTime: recipe.preparationTime,
      cookingTime: recipe.cookingTime,
      tags: tagsString,
      nutritionalInfo: recipe.nutritionalInfo || {},
    });

    if (recipe.image) {
      this.imagePreview = this.getImageUrl(recipe.image);
    }
  }

  deleteRecipe(recipeId: string): void {
    if (!confirm('Are you sure you want to delete this recipe?')) return;

    this.recipeService.deleteRecipe(recipeId).subscribe({
      next: () => {
        alert('Recipe deleted successfully!');
        this.loadRecipes();
        if (this.selectedRecipe?._id === recipeId) this.selectedRecipe = null;
      },
      error: (err) => {
        console.error('Error deleting recipe', err);
        alert('Failed to delete recipe');
      },
    });
  }

  viewRecipeDetails(recipe: any): void {
    this.recipeService.getRecipeById(recipe._id).subscribe({
      next: (res: any) => (this.selectedRecipe = res.data),
      error: (err) => console.error('Error loading recipe details', err),
    });
  }

  closeRecipeDetails(): void {
    this.selectedRecipe = null;
  }

  toggleReviewForm(recipeId: string): void {
    this.showReviewForm[recipeId] = !this.showReviewForm[recipeId];
    this.reviewForm.reset({ rating: 5, comment: '' });
  }

  submitReview(recipeId: string): void {
    if (!this.reviewForm.valid) return;

    this.recipeService.addReview(recipeId, this.reviewForm.value).subscribe({
      next: (res: any) => {
        this.loadRecipes();
        if (this.selectedRecipe?._id === recipeId)
          this.viewRecipeDetails(this.selectedRecipe);
        this.showReviewForm[recipeId] = false;
        this.reviewForm.reset({ rating: 5, comment: '' });
      },
      error: (err) => {
        console.error('Error adding review', err);
        if (err.error?.message) alert(err.error.message);
      },
    });
  }

  deleteReview(recipeId: string, reviewId: string): void {
    if (!confirm('Are you sure you want to delete this review?')) return;

    this.recipeService.deleteReview(reviewId).subscribe({
      next: () => {
        this.loadRecipes();
        if (this.selectedRecipe?._id === recipeId)
          this.viewRecipeDetails(this.selectedRecipe);
      },
      error: (err) => console.error('Error deleting review', err),
    });
  }

  canEditRecipe(recipe: any): boolean {
    if (!this.currentUser || !recipe.requestedBy) return false;
    return (
      recipe.requestedBy._id === this.currentUser._id ||
      this.currentUser.role === 'admin'
    );
  }

  canDeleteReview(review: any): boolean {
    if (!this.currentUser || !review.user) return false;
    return (
      review.user._id === this.currentUser._id ||
      this.currentUser.role === 'admin'
    );
  }

  getTotalTime(recipe: any): number {
    return (recipe.preparationTime || 0) + (recipe.cookingTime || 0);
  }

  getImageUrl(imagePath: string): string {
    if (!imagePath) return 'assets/default-recipe.jpg';
    if (imagePath.startsWith('http')) return imagePath;
    return `${environment.apiUrl.replace('/api', '')}${imagePath}`;
  }

  resetForm(): void {
    this.isEditing = false;
    this.editingRecipeId = null;
    this.selectedImage = null;
    this.imagePreview = null;

    this.recipeForm.reset({
      difficulty: 'Medium',
      category: '',
      tags: '',
      nutritionalInfo: {},
    });

    while (this.ingredients.length) this.ingredients.removeAt(0);
    this.addIngredient();

    while (this.instructions.length) this.instructions.removeAt(0);
    this.addInstruction();
  }

  selectRecipe(recipe: any) {
    this.selectedRecipe = recipe;
  }
}