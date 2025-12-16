import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TemporaryRecipe } from '../models/recipe.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TemporaryRecipeService {
  private apiUrl = `${environment.apiUrl}/temporary-recipes`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  /**
   * Generate a unique session ID for this browser session
   * Used to track AI-generated recipes before user logs in
   */
  getSessionId(): string {
    let sessionId = sessionStorage.getItem('recipe_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('recipe_session_id', sessionId);
    }
    return sessionId;
  }

  /**
   * Create temporary AI-generated recipe (no auth required)
   * This allows AI to generate recipes before user logs in
   */
  createTemporaryRecipe(recipeData: TemporaryRecipe): Observable<any> {
    return this.http.post<any>(this.apiUrl, recipeData);
  }

  /**
   * Get temporary recipe by ID (no auth required)
   * Anyone with the ID can view the temp recipe
   */
  getTemporaryRecipeById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  /**
   * Get all temporary recipes for current session
   */
  getSessionRecipes(sessionId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/session/${sessionId}`);
  }

  /**
   * Save temporary recipe as permanent (requires auth)
   * User must be logged in to save the AI recipe
   */
  saveTemporaryRecipe(id: string): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/${id}/save`, 
      {}, 
      { headers: this.getHeaders() }
    );
  }

  /**
   * Delete temporary recipe
   */
  deleteTemporaryRecipe(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}