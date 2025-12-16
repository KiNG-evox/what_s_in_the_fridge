import { TestBed } from '@angular/core/testing';

import { TemporaryRecipeService } from './temporary-recipe.service';

describe('TemporaryRecipeService', () => {
  let service: TemporaryRecipeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TemporaryRecipeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
