import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommunityComponent } from './community.component';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RecipeService } from '../../services/recipe.service';
import { of } from 'rxjs';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

describe('CommunityComponent', () => {
  let component: CommunityComponent;
  let fixture: ComponentFixture<CommunityComponent>;
  let recipeServiceSpy: jasmine.SpyObj<RecipeService>;

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('RecipeService', [
      'getAllRecipes',
      'createRecipe',
      'updateRecipe',
      'deleteRecipe',
      'getRecipeById',
      'addReview',
      'deleteReview',
    ]);

    await TestBed.configureTestingModule({
      imports: [
        ReactiveFormsModule, // reactive forms (formGroup, formControlName)
        FormsModule,         // template-driven forms (ngModel)
        HttpClientTestingModule,
      ],
      declarations: [CommunityComponent],
      providers: [{ provide: RecipeService, useValue: spy }],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    recipeServiceSpy = TestBed.inject(
      RecipeService
    ) as jasmine.SpyObj<RecipeService>;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CommunityComponent);
    component = fixture.componentInstance;

    recipeServiceSpy.getAllRecipes.and.returnValue(of({ data: [] }));
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load recipes on init', () => {
    expect(recipeServiceSpy.getAllRecipes).toHaveBeenCalled();
    expect(component.recipes).toEqual([]);
  });

  it('should add a new ingredient', () => {
    const initialLength = component.ingredients.length;
    component.addIngredient();
    expect(component.ingredients.length).toBe(initialLength + 1);
  });

  it('should add a new instruction', () => {
    const initialLength = component.instructions.length;
    component.addInstruction();
    expect(component.instructions.length).toBe(initialLength + 1);
  });
});
