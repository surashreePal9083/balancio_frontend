import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CategoryService } from '../../shared/services/category.service';
import { ToastNotificationService } from '../../shared/services/toast-notification.service';
import { Category } from '../../shared/models/category.model';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-category-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './category-form.component.html',
  styleUrls: ['./category-form.component.scss']
})
export class CategoryFormComponent implements OnInit {
  category = {
    name: '',
    type: 'expense' as 'expense' | 'income',
    icon: 'category',
    color: '#3b82f6'
  };

  isEditMode = false;
  categoryId: string | null = null;
  isLoading = false;

  icons = [
    'restaurant', 'directions_car', 'shopping_bag', 'flash_on', 'movie', 
    'local_hospital', 'attach_money', 'home', 'school', 'fitness_center'
  ];

  colors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', 
    '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
  ];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private categoryService: CategoryService,
    private toastService: ToastNotificationService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.categoryId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.categoryId;
    
    if (this.isEditMode && this.categoryId) {
      this.loadCategory();
    }
  }

  loadCategory(): void {
    if (!this.categoryId) return;
    
    this.categoryService.getCategory(this.categoryId).subscribe({
      next: (category) => {
        this.category = {
          name: category.name,
          type: category.type,
          icon: category.icon,
          color: category.color
        };
      },
      error: (error) => {
        console.error('Error loading category:', error);
        this.toastService.error('Error', 'Failed to load category details. Please try again later.');
        this.router.navigate(['/categories']);
      }
    });
  }

  onSubmit(): void {
    if (!this.category.name.trim()) {
      this.toastService.warning('Validation Error', 'Please enter a category name');
      return;
    }
    
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.toastService.error('Authentication Required', 'You must be logged in to create or update a category.');
      this.router.navigate(['/auth/login']);
      return;
    }
    
    this.isLoading = true;
    const categoryData = {
      name: this.category.name.trim(),
      type: this.category.type,
      color: this.category.color,
      icon: this.category.icon
    };

    if (this.isEditMode && this.categoryId) {
      this.categoryService.updateCategory(this.categoryId, categoryData).subscribe({
        next: () => {
          this.toastService.success('Success', 'Category updated successfully!');
          this.router.navigate(['/categories']);
        },
        error: (error) => {
          console.error('Error updating category:', error);
          this.handleCategoryError(error, 'update');
          this.isLoading = false;
        }
      });
    } else {
      this.categoryService.createCategory(categoryData as Omit<Category, 'id' | 'createdAt' | 'updatedAt'>).subscribe({
        next: () => {
          this.toastService.success('Success', 'Category created successfully!');
          this.router.navigate(['/categories']);
        },
        error: (error) => {
          console.error('Error creating category:', error);
          this.handleCategoryError(error, 'create');
          this.isLoading = false;
        }
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/categories']);
  }

  private handleCategoryError(error: any, action: string): void {
    // Handle specific error cases
    if (error.status === 400) {
      // Validation errors
      if (error.error && typeof error.error === 'object') {
        // Show a general error message
        this.toastService.error('Validation Error', 'Please check your input and try again');
      } else {
        this.toastService.error('Invalid Data', 'Please check your input and try again');
      }
    } else if (error.status === 401) {
      this.toastService.error('Authentication Required', 'Please log in to continue');
    } else if (error.status === 403) {
      this.toastService.error('Access Denied', 'You do not have permission to perform this action');
    } else if (error.status === 404) {
      this.toastService.error('Not Found', 'The requested resource could not be found');
    } else if (error.status >= 500) {
      this.toastService.error('Server Error', 'An unexpected error occurred on the server. Please try again later.');
    } else {
      this.toastService.error('Error', `Failed to ${action} category. Please try again later.`);
    }
  }
}