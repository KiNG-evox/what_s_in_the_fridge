import { Component, Input, OnInit } from '@angular/core';
import { ReviewService } from '../../services/review.service';

@Component({
  selector: 'app-review-list',
  standalone: false,
  templateUrl: './review-list.component.html',
  styleUrls: ['./review-list.component.css']
})
export class ReviewListComponent implements OnInit {
  @Input() recipeId!: string;

  reviews: any[] = [];
  isLoading = true;

  constructor(private reviewService: ReviewService) {}

  ngOnInit(): void {
    this.loadReviews();
  }

  loadReviews(): void {
    this.isLoading = true;
    this.reviewService.getRecipeReviews(this.recipeId).subscribe({
      next: (response) => {
        console.log('Reviews loaded', response);
        this.reviews = response.data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading reviews', error);
        this.isLoading = false;
      }
    });
  }

  onReviewDeleted(reviewId: string): void {
    this.reviewService.deleteReview(reviewId).subscribe({
      next: () => {
        alert('✅ Review deleted successfully!');
        this.loadReviews();
      },
      error: (error) => {
        console.error('Error deleting review', error);
        alert('Failed to delete review');
      }
    });
  }

  onReviewAdded(): void {
    this.loadReviews();
  }
}