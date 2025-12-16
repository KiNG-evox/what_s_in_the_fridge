import { Component, Input, Output, EventEmitter } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { ReviewService } from '../../services/review.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-review-form',
  standalone: false,
  templateUrl: './review-form.component.html',
  styleUrls: ['./review-form.component.css']
})
export class ReviewFormComponent {
  @Input() recipeId!: string;
  @Output() reviewAdded = new EventEmitter<void>();

  rating = 0;
  comment = '';
  hoveredRating = 0;
  isSubmitting = false;
  errorMessage = '';

  constructor(
    private reviewService: ReviewService,
    private authService: AuthService,
    private router: Router
  ) {}

  setRating(rating: number): void {
    this.rating = rating;
  }

  setHoveredRating(rating: number): void {
    this.hoveredRating = rating;
  }

  submitReview(): void {
    const user = this.authService.getCurrentUser();
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    if (this.rating === 0) {
      this.errorMessage = 'Please select a rating';
      return;
    }

    if (this.comment.trim().length < 10) {
      this.errorMessage = 'Comment must be at least 10 characters';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    const reviewData = {
      userId: user._id,
      recipeId: this.recipeId,
      rating: this.rating,
      comment: this.comment
    };

    this.reviewService.addReview(reviewData).subscribe({
      next: (response) => {
        console.log('Review added', response);
        alert('✅ Review added successfully!');
        this.rating = 0;
        this.comment = '';
        this.isSubmitting = false;
        this.reviewAdded.emit();
      },
      error: (error) => {
        console.error('Error adding review', error);
        this.errorMessage = error.error?.message || 'Failed to add review';
        this.isSubmitting = false;
      }
    });
  }
}