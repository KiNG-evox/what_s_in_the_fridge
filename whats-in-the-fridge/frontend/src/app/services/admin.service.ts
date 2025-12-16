import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = `${environment.apiUrl}/admin`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  /**
   * Get all users
   */
  getAllUsers(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/users`, { headers: this.getHeaders() });
  }

  /**
   * Delete a user
   */
  deleteUser(userId: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/users/${userId}`, { headers: this.getHeaders() });
  }

  /**
   * Get platform statistics
   */
  getStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/stats`, { headers: this.getHeaders() });
  }

  /**
   * Get all pending recipes awaiting approval
   */
  getPendingRecipes(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/recipes/pending`, { headers: this.getHeaders() });
  }

  /**
   * Get all recipes (with optional filters)
   */
  getAllRecipes(status?: string, source?: string): Observable<any> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    if (source) params = params.set('source', source);
    
    return this.http.get<any>(`${this.apiUrl}/recipes/all`, { 
      headers: this.getHeaders(),
      params 
    });
  }

  /**
   * Approve a recipe
   */
  approveRecipe(recipeId: string): Observable<any> {
    return this.http.put<any>(
      `${this.apiUrl}/recipes/${recipeId}/approve`, 
      {}, 
      { headers: this.getHeaders() }
    );
  }

  /**
   * Reject a recipe with reason
   */
  rejectRecipe(recipeId: string, reason: string): Observable<any> {
    return this.http.put<any>(
      `${this.apiUrl}/recipes/${recipeId}/reject`, 
      { reason }, 
      { headers: this.getHeaders() }
    );
  }

  /**
   * Delete any recipe (admin power)
   */
  deleteRecipe(recipeId: string): Observable<any> {
    return this.http.delete<any>(
      `${this.apiUrl}/recipes/${recipeId}`, 
      { headers: this.getHeaders() }
    );
  }
}