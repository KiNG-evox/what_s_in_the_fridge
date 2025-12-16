import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Recipe, RecipeSearchParams } from '../models/recipe.model';

@Injectable({
  providedIn: 'root'
})
export class RecipeService {
  private apiUrl = `${environment.apiUrl}/recipes`;
  private authUrl = `${environment.apiUrl}/auth`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  /**
   * Get current user information
   */
  getCurrentUser(): Observable<any> {
    return this.http.get<any>(`${this.authUrl}/me`, { headers: this.getHeaders() });
  }

  /**
   * Generate recipes with AI (existing method)
   */
  generateRecipes(ingredients: string[]): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/generate`, 
      { ingredients },
      { headers: this.getHeaders() }
    );
  }

  /**
   * Get all recipes (community feed) - ONLY APPROVED RECIPES
   */
  getAllRecipes(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }

  /**
   * NEW - Search recipes with filters
   */
  searchRecipes(params: RecipeSearchParams): Observable<any> {
    let httpParams = new HttpParams();
    
    if (params.q) httpParams = httpParams.set('q', params.q);
    if (params.category) httpParams = httpParams.set('category', params.category);
    if (params.difficulty) httpParams = httpParams.set('difficulty', params.difficulty);
    if (params.source) httpParams = httpParams.set('source', params.source);
    if (params.minRating) httpParams = httpParams.set('minRating', params.minRating.toString());

    return this.http.get<any>(`${this.apiUrl}/search`, { params: httpParams });
  }

  /**
   * Get recipe by ID with full details
   */
  getRecipeById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  /**
   * Get recipes by category
   */
  getRecipesByCategory(category: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/category/${category}`);
  }

  /**
   * Get recipes by user (includes their PENDING recipes if it's their profile)
   */
  getUserRecipes(userId?: string): Observable<any> {
    const url = userId 
      ? `${this.apiUrl}/user/${userId}` 
      : `${this.apiUrl}/my-recipes`;
    return this.http.get<any>(url, { headers: this.getHeaders() });
  }

  /**
   * Create a new recipe (will be PENDING until admin approves)
   * Expects FormData with image file
   */
  createRecipe(formData: FormData): Observable<any> {
    return this.http.post<any>(this.apiUrl, formData, { headers: this.getHeaders() });
  }

  /**
   * Update a recipe (will reset to PENDING)
   * Expects FormData with image file
   */
  updateRecipe(id: string, formData: FormData): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, formData, { headers: this.getHeaders() });
  }

  /**
   * Delete a recipe
   */
  deleteRecipe(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }

  /**
   * Add a review to a recipe
   */
  addReview(recipeId: string, reviewData: { rating: number, comment: string }): Observable<any> {
    return this.http.post<any>(
      `${environment.apiUrl}/reviews`, 
      {
        userId: this.getCurrentUserId(),
        recipeId: recipeId,
        rating: reviewData.rating,
        comment: reviewData.comment
      }, 
      { headers: this.getHeaders() }
    );
  }

  /**
   * Get reviews for a recipe
   */
  getRecipeReviews(recipeId: string): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/reviews/recipe/${recipeId}`);
  }

  /**
   * Update a review
   */
  updateReview(reviewId: string, reviewData: { rating?: number, comment?: string }): Observable<any> {
    return this.http.put<any>(
      `${environment.apiUrl}/reviews/${reviewId}`, 
      reviewData, 
      { headers: this.getHeaders() }
    );
  }

  /**
   * Delete a review
   */
  deleteReview(reviewId: string): Observable<any> {
    return this.http.delete<any>(
      `${environment.apiUrl}/reviews/${reviewId}`, 
      { headers: this.getHeaders() }
    );
  }

  /**
   * Helper: Get current user ID from localStorage
   */
  private getCurrentUserId(): string {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        return user._id || user.id;
      } catch (e) {
        console.error('Error parsing user data');
      }
    }
    return '';
  }
}