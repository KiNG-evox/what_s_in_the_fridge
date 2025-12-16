import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AdminService } from './admin.service';
import { environment } from '../../environments/environment';

describe('AdminService', () => {
  let service: AdminService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/admin`;
  const mockToken = 'mock-admin-jwt-token';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AdminService]
    });
    service = TestBed.inject(AdminService);
    httpMock = TestBed.inject(HttpTestingController);

    // Mock localStorage
    spyOn(localStorage, 'getItem').and.returnValue(mockToken);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getAllUsers', () => {
    it('should get all users with authentication', () => {
      const mockUsers = [
        {
          _id: 'user1',
          name: 'John',
          lastname: 'Doe',
          email: 'john@example.com',
          role: 'user'
        },
        {
          _id: 'user2',
          name: 'Jane',
          lastname: 'Smith',
          email: 'jane@example.com',
          role: 'admin'
        }
      ];

      service.getAllUsers().subscribe(response => {
        expect(response).toEqual(mockUsers);
        expect(response.length).toBe(2);
      });

      const req = httpMock.expectOne(`${apiUrl}/users`);
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
      req.flush(mockUsers);
    });

    it('should return empty array when no users exist', () => {
      service.getAllUsers().subscribe(response => {
        expect(response).toEqual([]);
      });

      const req = httpMock.expectOne(`${apiUrl}/users`);
      req.flush([]);
    });

    it('should handle unauthorized error', () => {
      service.getAllUsers().subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.status).toBe(401);
        }
      );

      const req = httpMock.expectOne(`${apiUrl}/users`);
      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    });

    it('should handle forbidden error when user is not admin', () => {
      service.getAllUsers().subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.status).toBe(403);
        }
      );

      const req = httpMock.expectOne(`${apiUrl}/users`);
      req.flush('Forbidden', { status: 403, statusText: 'Forbidden' });
    });
  });

  describe('deleteUser', () => {
    it('should delete user with authentication', () => {
      const userId = 'user123';
      const mockResponse = { message: 'User deleted successfully' };

      service.deleteUser(userId).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiUrl}/users/${userId}`);
      expect(req.request.method).toBe('DELETE');
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
      req.flush(mockResponse);
    });

    it('should handle user not found error', () => {
      const userId = 'nonexistent';

      service.deleteUser(userId).subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.status).toBe(404);
        }
      );

      const req = httpMock.expectOne(`${apiUrl}/users/${userId}`);
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });

    it('should handle error when deleting admin user', () => {
      const userId = 'admin123';

      service.deleteUser(userId).subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.status).toBe(400);
        }
      );

      const req = httpMock.expectOne(`${apiUrl}/users/${userId}`);
      req.flush('Cannot delete admin user', { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('getStats', () => {
    it('should get platform statistics with authentication', () => {
      const mockStats = {
        totalUsers: 150,
        totalRecipes: 300,
        pendingRecipes: 25,
        approvedRecipes: 250,
        rejectedRecipes: 25,
        totalReviews: 450,
        averageRating: 4.3
      };

      service.getStats().subscribe(response => {
        expect(response).toEqual(mockStats);
        expect(response.totalUsers).toBe(150);
        expect(response.totalRecipes).toBe(300);
      });

      const req = httpMock.expectOne(`${apiUrl}/stats`);
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
      req.flush(mockStats);
    });

    it('should handle empty stats', () => {
      const emptyStats = {
        totalUsers: 0,
        totalRecipes: 0,
        pendingRecipes: 0,
        approvedRecipes: 0,
        rejectedRecipes: 0,
        totalReviews: 0,
        averageRating: 0
      };

      service.getStats().subscribe(response => {
        expect(response).toEqual(emptyStats);
      });

      const req = httpMock.expectOne(`${apiUrl}/stats`);
      req.flush(emptyStats);
    });

    it('should handle error when fetching stats', () => {
      service.getStats().subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.status).toBe(500);
        }
      );

      const req = httpMock.expectOne(`${apiUrl}/stats`);
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('getPendingRecipes', () => {
    it('should get all pending recipes with authentication', () => {
      const mockPendingRecipes = [
        {
          _id: 'recipe1',
          title: 'Pending Recipe 1',
          status: 'pending',
          source: 'human',
          createdAt: '2024-01-01'
        },
        {
          _id: 'recipe2',
          title: 'Pending Recipe 2',
          status: 'pending',
          source: 'ai',
          createdAt: '2024-01-02'
        }
      ];

      service.getPendingRecipes().subscribe(response => {
        expect(response).toEqual(mockPendingRecipes);
        expect(response.length).toBe(2);
        expect(response.every((r: any) => r.status === 'pending')).toBeTrue();
      });

      const req = httpMock.expectOne(`${apiUrl}/recipes/pending`);
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
      req.flush(mockPendingRecipes);
    });

    it('should return empty array when no pending recipes', () => {
      service.getPendingRecipes().subscribe(response => {
        expect(response).toEqual([]);
      });

      const req = httpMock.expectOne(`${apiUrl}/recipes/pending`);
      req.flush([]);
    });

    it('should handle error when fetching pending recipes', () => {
      service.getPendingRecipes().subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.status).toBe(403);
        }
      );

      const req = httpMock.expectOne(`${apiUrl}/recipes/pending`);
      req.flush('Forbidden', { status: 403, statusText: 'Forbidden' });
    });
  });

  describe('getAllRecipes', () => {
    it('should get all recipes without filters', () => {
      const mockRecipes = [
        { _id: 'recipe1', title: 'Recipe 1', status: 'approved', source: 'human' },
        { _id: 'recipe2', title: 'Recipe 2', status: 'pending', source: 'ai' }
      ];

      service.getAllRecipes().subscribe(response => {
        expect(response).toEqual(mockRecipes);
      });

      const req = httpMock.expectOne(`${apiUrl}/recipes/all`);
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
      expect(req.request.params.keys().length).toBe(0);
      req.flush(mockRecipes);
    });

    it('should get recipes filtered by status', () => {
      const mockRecipes = [
        { _id: 'recipe1', title: 'Approved Recipe', status: 'approved', source: 'human' }
      ];

      service.getAllRecipes('approved').subscribe(response => {
        expect(response).toEqual(mockRecipes);
      });

      const req = httpMock.expectOne(request => 
        request.url === `${apiUrl}/recipes/all` &&
        request.params.get('status') === 'approved'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockRecipes);
    });

    it('should get recipes filtered by source', () => {
      const mockRecipes = [
        { _id: 'recipe1', title: 'AI Recipe', status: 'approved', source: 'ai' }
      ];

      service.getAllRecipes(undefined, 'ai').subscribe(response => {
        expect(response).toEqual(mockRecipes);
      });

      const req = httpMock.expectOne(request => 
        request.url === `${apiUrl}/recipes/all` &&
        request.params.get('source') === 'ai'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockRecipes);
    });

    it('should get recipes filtered by both status and source', () => {
      const mockRecipes = [
        { _id: 'recipe1', title: 'Human Pending Recipe', status: 'pending', source: 'human' }
      ];

      service.getAllRecipes('pending', 'human').subscribe(response => {
        expect(response).toEqual(mockRecipes);
      });

      const req = httpMock.expectOne(request => 
        request.url === `${apiUrl}/recipes/all` &&
        request.params.get('status') === 'pending' &&
        request.params.get('source') === 'human'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockRecipes);
    });

    it('should return empty array when no recipes match filters', () => {
      service.getAllRecipes('rejected', 'ai').subscribe(response => {
        expect(response).toEqual([]);
      });

      const req = httpMock.expectOne(request => 
        request.url === `${apiUrl}/recipes/all`
      );
      req.flush([]);
    });
  });

  describe('approveRecipe', () => {
    it('should approve recipe with authentication', () => {
      const recipeId = 'recipe123';
      const mockResponse = {
        _id: recipeId,
        title: 'Approved Recipe',
        status: 'approved',
        reviewedBy: 'admin123',
        reviewedAt: '2024-01-01T00:00:00Z'
      };

      service.approveRecipe(recipeId).subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(response.status).toBe('approved');
      });

      const req = httpMock.expectOne(`${apiUrl}/recipes/${recipeId}/approve`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
      expect(req.request.body).toEqual({});
      req.flush(mockResponse);
    });

    it('should handle recipe not found error', () => {
      const recipeId = 'nonexistent';

      service.approveRecipe(recipeId).subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.status).toBe(404);
        }
      );

      const req = httpMock.expectOne(`${apiUrl}/recipes/${recipeId}/approve`);
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });

    it('should handle error when recipe is already approved', () => {
      const recipeId = 'recipe123';

      service.approveRecipe(recipeId).subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.status).toBe(400);
        }
      );

      const req = httpMock.expectOne(`${apiUrl}/recipes/${recipeId}/approve`);
      req.flush('Recipe already approved', { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('rejectRecipe', () => {
    it('should reject recipe with reason and authentication', () => {
      const recipeId = 'recipe123';
      const reason = 'Inappropriate content';
      const mockResponse = {
        _id: recipeId,
        title: 'Rejected Recipe',
        status: 'rejected',
        rejectionReason: reason,
        reviewedBy: 'admin123',
        reviewedAt: '2024-01-01T00:00:00Z'
      };

      service.rejectRecipe(recipeId, reason).subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(response.status).toBe('rejected');
        expect(response.rejectionReason).toBe(reason);
      });

      const req = httpMock.expectOne(`${apiUrl}/recipes/${recipeId}/reject`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
      expect(req.request.body).toEqual({ reason });
      req.flush(mockResponse);
    });

    it('should handle rejection with empty reason', () => {
      const recipeId = 'recipe123';
      const reason = '';

      service.rejectRecipe(recipeId, reason).subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.status).toBe(400);
        }
      );

      const req = httpMock.expectOne(`${apiUrl}/recipes/${recipeId}/reject`);
      req.flush('Rejection reason is required', { status: 400, statusText: 'Bad Request' });
    });

    it('should handle recipe not found error', () => {
      const recipeId = 'nonexistent';
      const reason = 'Test reason';

      service.rejectRecipe(recipeId, reason).subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.status).toBe(404);
        }
      );

      const req = httpMock.expectOne(`${apiUrl}/recipes/${recipeId}/reject`);
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });

    it('should handle long rejection reasons', () => {
      const recipeId = 'recipe123';
      const longReason = 'This is a very long rejection reason that explains in detail why the recipe was rejected. It includes multiple points and detailed feedback for the user.';

      service.rejectRecipe(recipeId, longReason).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/recipes/${recipeId}/reject`);
      expect(req.request.body).toEqual({ reason: longReason });
      req.flush({ status: 'rejected' });
    });
  });

  describe('deleteRecipe', () => {
    it('should delete recipe with authentication', () => {
      const recipeId = 'recipe123';
      const mockResponse = { message: 'Recipe deleted successfully' };

      service.deleteRecipe(recipeId).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiUrl}/recipes/${recipeId}`);
      expect(req.request.method).toBe('DELETE');
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
      req.flush(mockResponse);
    });

    it('should handle recipe not found error', () => {
      const recipeId = 'nonexistent';

      service.deleteRecipe(recipeId).subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.status).toBe(404);
        }
      );

      const req = httpMock.expectOne(`${apiUrl}/recipes/${recipeId}`);
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });

    it('should handle unauthorized error', () => {
      const recipeId = 'recipe123';

      service.deleteRecipe(recipeId).subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.status).toBe(403);
        }
      );

      const req = httpMock.expectOne(`${apiUrl}/recipes/${recipeId}`);
      req.flush('Forbidden', { status: 403, statusText: 'Forbidden' });
    });
  });

  describe('getHeaders', () => {
    it('should include Authorization header with Bearer token', () => {
      const headers = (service as any).getHeaders();
      expect(headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
    });

    it('should handle missing token gracefully', () => {
      (localStorage.getItem as jasmine.Spy).and.returnValue(null);
      const headers = (service as any).getHeaders();
      expect(headers.get('Authorization')).toBe('Bearer null');
    });
  });

  describe('Integration scenarios', () => {
    it('should support complete recipe moderation workflow', () => {
      // Get pending recipes
      service.getPendingRecipes().subscribe();
      const pendingReq = httpMock.expectOne(`${apiUrl}/recipes/pending`);
      pendingReq.flush([{ _id: 'recipe123', status: 'pending' }]);

      // Approve recipe
      service.approveRecipe('recipe123').subscribe();
      const approveReq = httpMock.expectOne(`${apiUrl}/recipes/recipe123/approve`);
      approveReq.flush({ _id: 'recipe123', status: 'approved' });

      // Get all recipes to verify
      service.getAllRecipes('approved').subscribe();
      const allReq = httpMock.expectOne(req => req.url === `${apiUrl}/recipes/all`);
      allReq.flush([{ _id: 'recipe123', status: 'approved' }]);
    });

    it('should support recipe rejection workflow', () => {
      // Get pending recipes
      service.getPendingRecipes().subscribe();
      const pendingReq = httpMock.expectOne(`${apiUrl}/recipes/pending`);
      pendingReq.flush([{ _id: 'recipe456', status: 'pending' }]);

      // Reject recipe
      service.rejectRecipe('recipe456', 'Inappropriate content').subscribe();
      const rejectReq = httpMock.expectOne(`${apiUrl}/recipes/recipe456/reject`);
      expect(rejectReq.request.body).toEqual({ reason: 'Inappropriate content' });
      rejectReq.flush({ _id: 'recipe456', status: 'rejected' });
    });

    it('should support user management workflow', () => {
      // Get all users
      service.getAllUsers().subscribe();
      const usersReq = httpMock.expectOne(`${apiUrl}/users`);
      usersReq.flush([{ _id: 'user123' }, { _id: 'user456' }]);

      // Delete user
      service.deleteUser('user456').subscribe();
      const deleteReq = httpMock.expectOne(`${apiUrl}/users/user456`);
      deleteReq.flush({ message: 'User deleted' });

      // Get updated user list
      service.getAllUsers().subscribe();
      const updatedReq = httpMock.expectOne(`${apiUrl}/users`);
      updatedReq.flush([{ _id: 'user123' }]);
    });

    it('should support stats monitoring workflow', () => {
      // Get initial stats
      service.getStats().subscribe();
      const statsReq = httpMock.expectOne(`${apiUrl}/stats`);
      statsReq.flush({ totalRecipes: 100, pendingRecipes: 10 });

      // Approve a recipe
      service.approveRecipe('recipe123').subscribe();
      const approveReq = httpMock.expectOne(`${apiUrl}/recipes/recipe123/approve`);
      approveReq.flush({ status: 'approved' });

      // Get updated stats
      service.getStats().subscribe();
      const updatedStatsReq = httpMock.expectOne(`${apiUrl}/stats`);
      updatedStatsReq.flush({ totalRecipes: 100, pendingRecipes: 9 });
    });
  });

  describe('Error handling', () => {
    it('should handle network errors gracefully', () => {
      service.getStats().subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.status).toBe(0);
        }
      );

      const req = httpMock.expectOne(`${apiUrl}/stats`);
      req.error(new ProgressEvent('error'), { status: 0 });
    });

    it('should handle server errors with message', () => {
      service.getAllUsers().subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.status).toBe(500);
        }
      );

      const req = httpMock.expectOne(`${apiUrl}/users`);
      req.flush({ message: 'Database error' }, { status: 500, statusText: 'Internal Server Error' });
    });
  });
});