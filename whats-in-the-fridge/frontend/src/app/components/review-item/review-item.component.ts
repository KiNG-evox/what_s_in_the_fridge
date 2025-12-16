import { Component, Input, Output, EventEmitter } from '@angular/core';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-review-item',
  standalone: false,
  templateUrl: './review-item.component.html',
  styleUrls: ['./review-item.component.css']
})
export class ReviewItemComponent {
  @Input() review: any;
  @Output() deleteClick = new EventEmitter<string>();
  @Output() editClick = new EventEmitter<any>();

  constructor(private authService: AuthService) {}

  get isOwner(): boolean {
    const currentUser = this.authService.getCurrentUser();
    return currentUser?._id === this.review.user._id;
  }

  get isAdmin(): boolean {
    const currentUser = this.authService.getCurrentUser();
    return currentUser?.role === 'admin';
  }

  onDelete(): void {
    if (confirm('Are you sure you want to delete this review?')) {
      this.deleteClick.emit(this.review._id);
    }
  }

  onEdit(): void {
    this.editClick.emit(this.review);
  }
}