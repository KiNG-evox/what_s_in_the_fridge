import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Favorite } from '../models/favorite.model';
import { RecipeSearchParams } from '../models/recipe.model';

@Injectable({
  providedIn: 'root'
})
export class FavoriteService {
  private apiUrl = `${environment.apiUrl}/favorites`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  addToFavorites(recipeId: string, notes?: string): Observable<any> {
    return this.http.post<any>(
      this.apiUrl,
      { recipeId, notes },
      { headers: this.getHeaders() }
    );
  }

  getUserFavorites(userId: string): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/user/${userId}`,
      { headers: this.getHeaders() }
    );
  }

  removeFromFavorites(favoriteId: string): Observable<any> {
    return this.http.delete<any>(
      `${this.apiUrl}/${favoriteId}`,
      { headers: this.getHeaders() }
    );
  }

  checkFavorite(userId: string, recipeId: string): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/check/${userId}/${recipeId}`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * NEW - Search and filter favorites (client-side)
   * This filters the favorites array on the frontend
   */
  searchFavorites(favorites: any[], searchTerm: string, filters?: RecipeSearchParams): any[] {
    let filtered = favorites;

    // Search by title, description, or tags
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(fav => 
        fav.recipe.title.toLowerCase().includes(term) ||
        fav.recipe.description.toLowerCase().includes(term) ||
        fav.recipe.tags?.some((tag: string) => tag.toLowerCase().includes(term))
      );
    }

    // Filter by category
    if (filters?.category) {
      filtered = filtered.filter(fav => fav.recipe.category === filters.category);
    }

    // Filter by difficulty
    if (filters?.difficulty) {
      filtered = filtered.filter(fav => fav.recipe.difficulty === filters.difficulty);
    }

    // Filter by source (AI or Human)
    if (filters?.source) {
      filtered = filtered.filter(fav => fav.recipe.source === filters.source);
    }

    // Filter by minimum rating
    if (filters?.minRating) {
      filtered = filtered.filter(fav => (fav.recipe.averageRating || 0) >= filters.minRating!);
    }

    return filtered;
  }
}