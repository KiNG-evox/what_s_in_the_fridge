import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminComponent } from './admin.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

// Mock Router
const routerMock = {
  navigate: jasmine.createSpy('navigate')
};

// Mock AuthService
const authSpy = {
  getCurrentUser: jasmine.createSpy(),
  getToken: jasmine.createSpy().and.returnValue('fake-token')
};

describe('AdminComponent', () => {
  let component: AdminComponent;
  let fixture: ComponentFixture<AdminComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [AdminComponent],
      providers: [
        { provide: AuthService, useValue: authSpy },
        { provide: Router, useValue: routerMock }
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA] // <-- fixes unknown elements like <app-header>
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    authSpy.getCurrentUser.and.returnValue({
      _id: '1',
      name: 'Admin',
      lastname: 'User',
      pseudo: 'adminuser',
      email: 'admin@test.com',
      role: 'admin'
    });
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should navigate away if non-admin user', () => {
    authSpy.getCurrentUser.and.returnValue({
      _id: '2',
      name: 'Normal',
      lastname: 'User',
      pseudo: 'normaluser',
      email: 'user@test.com',
      role: 'user'
    });
    fixture.detectChanges();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/home']);
  });

  it('should delete a user', () => {
    authSpy.getCurrentUser.and.returnValue({
      _id: '1',
      name: 'Admin',
      lastname: 'User',
      pseudo: 'adminuser',
      email: 'admin@test.com',
      role: 'admin'
    });
    fixture.detectChanges();

    spyOn(window, 'confirm').and.returnValue(true);
    spyOn(window, 'alert');
    spyOn(component['http'], 'delete').and.returnValue(of({}));

    component.deleteUser('123');
    expect(window.alert).toHaveBeenCalledWith('User deleted successfully');
  });

  it('should approve a recipe', () => {
    authSpy.getCurrentUser.and.returnValue({
      _id: '1',
      name: 'Admin',
      lastname: 'User',
      pseudo: 'adminuser',
      email: 'admin@test.com',
      role: 'admin'
    });
    fixture.detectChanges();

    const recipe = { _id: 'r1', status: 'pending' };
    component.recipes = [recipe];

    spyOn(window, 'confirm').and.returnValue(true);
    spyOn(window, 'alert');
    spyOn(component['http'], 'put').and.returnValue(of({}));

    component.approveRecipe('r1');
    expect(recipe.status).toBe('approved');
    expect(window.alert).toHaveBeenCalledWith('Recipe approved successfully!');
  });

  it('should reject a recipe with reason', () => {
    authSpy.getCurrentUser.and.returnValue({
      _id: '1',
      name: 'Admin',
      lastname: 'User',
      pseudo: 'adminuser',
      email: 'admin@test.com',
      role: 'admin'
    });
    fixture.detectChanges();

    const recipe = { _id: 'r2', status: 'pending' };
    component.recipes = [recipe];
    component.openRejectModal(recipe);
    component.rejectionReason = 'Bad recipe';

    spyOn(window, 'alert');
    spyOn(component['http'], 'put').and.returnValue(of({}));

    component.submitRejection();
    expect(recipe.status).toBe('rejected');
    expect(window.alert).toHaveBeenCalledWith('Recipe rejected');
  });

  it('should load data on init for admin', () => {
    authSpy.getCurrentUser.and.returnValue({
      _id: '1',
      name: 'Admin',
      lastname: 'User',
      pseudo: 'adminuser',
      email: 'admin@test.com',
      role: 'admin'
    });

    spyOn(component, 'loadData');

    fixture.detectChanges();
    expect(component.loadData).toHaveBeenCalled();
  });
});
