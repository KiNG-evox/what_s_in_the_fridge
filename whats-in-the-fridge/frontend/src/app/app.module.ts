import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common'; // Add this import
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ToastrModule } from 'ngx-toastr';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HeaderComponent } from './components/header/header.component';
import { RecipeCardComponent } from './components/recipe-card/recipe-card.component';
import { LoaderComponent } from './components/loader/loader.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { HomeComponent } from './pages/home/home.component';
import { FavoritesComponent } from './pages/favorites/favorites.component';
import { RecipeDetailComponent } from './pages/recipe-detail/recipe-detail.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { ProfileComponent } from './pages/profile/profile.component';
import { FooterComponent } from './components/footer/footer.component';
import { AdminComponent } from './pages/admin/admin.component';
import { ReviewFormComponent } from './components/review-form/review-form.component';
import { ReviewListComponent } from './components/review-list/review-list.component';
import { ReviewItemComponent } from './components/review-item/review-item.component';
import { CommunityComponent } from './pages/community/community.component';

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    RecipeCardComponent,
    LoaderComponent,
    LoginComponent,
    RegisterComponent,
    HomeComponent,
    FavoritesComponent,
    RecipeDetailComponent,
    ProfileComponent,
    FooterComponent,
    AdminComponent,
    ReviewFormComponent,
    ReviewListComponent,
    ReviewItemComponent,
    CommunityComponent
  ],
  imports: [
    BrowserModule,
    CommonModule,             // Add this line - provides ngClass, date pipe, etc.
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    BrowserAnimationsModule,
    ToastrModule.forRoot({
      timeOut: 2000,
      positionClass: 'toast-top-right',
      preventDuplicates: true,
      progressBar: true,
    }),
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}