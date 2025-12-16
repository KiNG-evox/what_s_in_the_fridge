import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-admin',
  standalone: false,
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit {
  users: any[] = [];
  recipes: any[] = [];
  pendingRecipes: any[] = [];
  approvedRecipes: any[] = [];
  rejectedRecipes: any[] = [];

  stats = {
    totalUsers: 0,
    totalRecipes: 0,
    approvedRecipes: 0,
    pendingRecipes: 0,
    rejectedRecipes: 0,
    totalFavorites: 0,
    totalReviews: 0
  };

  activeTab = 'users';
  recipeFilterTab = 'pending';
  isLoading = true;
  selectedRecipe: any = null;
  showRejectModal = false;
  rejectionReason = '';

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (!user || user.role !== 'admin') {
      alert('Access denied. Admin only.');
      this.router.navigate(['/home']);
      return;
    }

    this.loadData();
  }

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  loadData(): void {
    this.isLoading = true;

    // Load statistics from backend (optional)
    this.http.get<any>(`${environment.apiUrl}/admin/stats`, { headers: this.getHeaders() })
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.stats.totalUsers = response.data.totalUsers || 0;
            this.stats.totalRecipes = response.data.totalRecipes || 0;
            this.stats.totalFavorites = response.data.totalFavorites || 0;
            this.stats.totalReviews = response.data.totalReviews || 0;
          }
        },
        error: (error) => console.error('Error loading stats', error)
      });

    // Load users
    this.http.get<any>(`${environment.apiUrl}/admin/users`, { headers: this.getHeaders() })
      .subscribe({
        next: (response) => {
          this.users = response.data || [];
        },
        error: (error) => console.error('Error loading users', error)
      });

    // Load recipes
    this.loadRecipes();
  }

  loadRecipes(): void {
    this.isLoading = true;

    this.http.get<any>(`${environment.apiUrl}/admin/recipes/all`, { headers: this.getHeaders() })
      .subscribe({
        next: (response) => {
          this.recipes = response.data || [];
          this.updateRecipeStats();
          this.filterRecipes();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading recipes', error);
          this.isLoading = false;
        }
      });
  }

  filterRecipes(): void {
    if (this.recipeFilterTab === 'all') {
      this.pendingRecipes = this.recipes;
    } else {
      this.pendingRecipes = this.recipes.filter(r => r.status === this.recipeFilterTab);
    }
  }

  updateRecipeStats(): void {
    this.stats.pendingRecipes = this.recipes.filter(r => r.status === 'pending').length;
    this.stats.approvedRecipes = this.recipes.filter(r => r.status === 'approved').length;
    this.stats.rejectedRecipes = this.recipes.filter(r => r.status === 'rejected').length;
    this.stats.totalRecipes = this.recipes.length;
  }

  switchTab(tab: string): void {
    this.activeTab = tab;
  }

  switchRecipeFilter(filter: string): void {
    this.recipeFilterTab = filter;
    this.filterRecipes();
  }

  deleteUser(userId: string): void {
    if (!confirm('Are you sure you want to delete this user? This will also delete all their recipes, favorites, and reviews.')) return;

    this.http.delete(`${environment.apiUrl}/admin/users/${userId}`, { headers: this.getHeaders() })
      .subscribe({
        next: () => {
          alert('User deleted successfully');
          this.loadData();
        },
        error: (error) => {
          console.error('Error deleting user', error);
          alert('Failed to delete user');
        }
      });
  }

  deleteRecipe(recipeId: string): void {
    if (!confirm('Are you sure you want to delete this recipe?')) return;

    this.http.delete(`${environment.apiUrl}/admin/recipes/${recipeId}`, { headers: this.getHeaders() })
      .subscribe({
        next: () => {
          alert('Recipe deleted successfully');
          this.recipes = this.recipes.filter(r => r._id !== recipeId);
          this.updateRecipeStats();
          this.filterRecipes();
        },
        error: (error) => {
          console.error('Error deleting recipe', error);
          alert('Failed to delete recipe');
        }
      });
  }

  approveRecipe(recipeId: string): void {
    if (!confirm('Are you sure you want to approve this recipe?')) return;

    this.http.put(`${environment.apiUrl}/admin/recipes/${recipeId}/approve`, {}, { headers: this.getHeaders() })
      .subscribe({
        next: () => {
          alert('Recipe approved successfully!');
          const recipe = this.recipes.find(r => r._id === recipeId);
          if (recipe) recipe.status = 'approved';
          this.updateRecipeStats();
          this.filterRecipes();
        },
        error: (error) => {
          console.error('Error approving recipe', error);
          alert('Failed to approve recipe: ' + (error.error?.message || 'Unknown error'));
        }
      });
  }

  openRejectModal(recipe: any): void {
    this.selectedRecipe = recipe;
    this.showRejectModal = true;
    this.rejectionReason = '';
  }

  closeRejectModal(): void {
    this.showRejectModal = false;
    this.selectedRecipe = null;
    this.rejectionReason = '';
  }

  submitRejection(): void {
    if (!this.rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    if (!this.selectedRecipe) return;

    this.http.put(
      `${environment.apiUrl}/admin/recipes/${this.selectedRecipe._id}/reject`,
      { reason: this.rejectionReason },
      { headers: this.getHeaders() }
    ).subscribe({
      next: () => {
        alert('Recipe rejected');
        const recipe = this.recipes.find(r => r._id === this.selectedRecipe!._id);
        if (recipe) recipe.status = 'rejected';
        this.closeRejectModal();
        this.updateRecipeStats();
        this.filterRecipes();
      },
      error: (error) => {
        console.error('Error rejecting recipe', error);
        alert('Failed to reject recipe: ' + (error.error?.message || 'Unknown error'));
      }
    });
  }

  viewRecipeDetails(recipe: any): void {
    this.selectedRecipe = recipe;
  }

  closeRecipeDetails(): void {
    this.selectedRecipe = null;
  }

  getImageUrl(imagePath: string): string {
    if (!imagePath) return 'assets/default-recipe.jpg';
    if (imagePath.startsWith('http')) return imagePath;
    return `${environment.apiUrl.replace('/api', '')}${imagePath}`;
  }

  getStatusBadgeClass(status: string): string {
    switch(status) {
      case 'approved': return 'status-approved';
      case 'pending': return 'status-pending';
      case 'rejected': return 'status-rejected';
      default: return '';
    }
  }
}
