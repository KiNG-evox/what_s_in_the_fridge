export interface Recipe {
  _id?: string;
  title: string;
  description: string;
  ingredients: Ingredient[];
  instructions: Instruction[];
  cookingTime: number;
  preparationTime: number;
  servings: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  tags: string[];
  image: string;
  nutritionalInfo: NutritionalInfo;
  averageRating?: number;
  totalReviews?: number;
  requestedBy?: string | User;
  
  // NEW FIELDS
  source: 'human' | 'ai'; // Indicates if recipe is AI-generated or human-created
  status: 'pending' | 'approved' | 'rejected'; // Approval status
  reviewedBy?: string | User; // Admin who reviewed the recipe
  reviewedAt?: Date | string; // When it was reviewed
  rejectionReason?: string; // Reason for rejection if status is 'rejected'
  
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface TemporaryRecipe {
  _id?: string;
  title: string;
  description: string;
  ingredients: Ingredient[];
  instructions: Instruction[];
  cookingTime: number;
  preparationTime: number;
  servings: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  tags: string[];
  image: string;
  nutritionalInfo: NutritionalInfo;
  source: 'ai';
  sessionId: string;
  expiresAt?: Date | string;
  createdAt?: Date | string;
}

export interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
}

export interface Instruction {
  step: number;
  description: string;
}

export interface NutritionalInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface User {
  _id: string;
  name: string;
  lastname: string;
  pseudo: string;
  email: string;
  role: 'admin' | 'user';
  profilePicture?: string;
}

// Search parameters interface
export interface RecipeSearchParams {
  q?: string; // Search query
  category?: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  source?: 'human' | 'ai';
  minRating?: number;
}