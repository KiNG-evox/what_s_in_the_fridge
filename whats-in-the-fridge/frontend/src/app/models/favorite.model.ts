import { Recipe } from './recipe.model';

export interface Favorite {
  _id: string;
  user: string;
  recipe: Recipe;
  notes?: string;
  createdAt: string;
}