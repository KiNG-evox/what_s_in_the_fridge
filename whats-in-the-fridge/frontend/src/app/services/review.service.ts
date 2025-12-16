import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Review {
  _id?: string;
  user: any;
  recipe: string;
  rating: number;
  comment: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AddReviewRequest {
  userId: string;
  recipeId: string;
  rating: number;
  comment: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  private apiUrl = `${environment.apiUrl}/reviews`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  /**
   * Add review to recipe
   */
  addReview(data: AddReviewRequest): Observable<any> {
    return this.http.post<any>(this.apiUrl, data, { headers: this.getHeaders() });
  }

  /**
   * Get all reviews for a recipe
   */
  getRecipeReviews(recipeId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/recipe/${recipeId}`);
  }

  /**
   * Update review
   */
  updateReview(reviewId: string, rating: number, comment: string): Observable<any> {
    return this.http.put<any>(
      `${this.apiUrl}/${reviewId}`,
      { rating, comment },
      { headers: this.getHeaders() }
    );
  }

  /**
   * Delete review
   */
  deleteReview(reviewId: string): Observable<any> {
    return this.http.delete<any>(
      `${this.apiUrl}/${reviewId}`,
      { headers: this.getHeaders() }
    );
  }
}