# What's in the Fridge 🍽️

An AI-powered recipe generation application that helps users create delicious recipes based on available ingredients. Built with Node.js, Express, MongoDB, Angular, and Gemini AI.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)
![Angular](https://img.shields.io/badge/angular-19.x-red.svg)

## ✨ Features

- 🤖 **AI Recipe Generation** - Generate creative recipes using Gemini AI based on your ingredients
- 👥 **User Management** - Registration, login, and profile management with JWT authentication
- 📝 **Recipe CRUD** - Create, read, update, and delete recipes
- ✅ **Approval System** - Admin approval workflow for user-submitted recipes
- ⭐ **Favorites** - Save and manage your favorite recipes
- 💬 **Reviews & Ratings** - Rate and review recipes
- 🏘️ **Community Feed** - Browse approved recipes from other users
- 🎨 **Beautiful UI** - Modern, responsive Angular interface
- 🖼️ **Image Integration** - Automatic recipe images from Pexels API
- 🔒 **Secure** - JWT authentication, password hashing, role-based access

## 🏗️ Architecture

```
┌─────────────────┐
│   Angular SPA   │  (Frontend)
│   Port 4200     │
└────────┬────────┘
         │ HTTP/REST
         ▼
┌─────────────────┐
│  Express API    │  (Backend)
│   Port 3000     │
└────────┬────────┘
         │
    ┌────┴────┬──────────┐
    ▼         ▼          ▼
┌────────┐ ┌──────┐ ┌──────────┐
│MongoDB │ │Gemini│ │ Pexels   │
│  Atlas │ │  AI  │ │   API    │
└────────┘ └──────┘ └──────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js 20.x or higher
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/darif177/what_s_in_the_fridge.git
   cd what_s_in_the_fridge
   ```

2. **Backend Setup**
   ```bash
   cd whats-in-the-fridge/backEnd
   npm install
   cp .env.example .env
   # Edit .env with your configuration
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   cd whats-in-the-fridge/frontend
   npm install
   ng serve
   ```

4. **Access the application**
   - Frontend: http://localhost:4200
   - Backend API: http://localhost:3000

## 📁 Project Structure

```
what_s_in_the_fridge/
├── .github/
│   └── workflows/          # GitHub Actions CI/CD
│       ├── backend-deploy.yml
│       └── frontend-deploy.yml
├── whats-in-the-fridge/
│   ├── backEnd/
│   │   ├── controllers/    # Business logic
│   │   ├── models/         # MongoDB schemas
│   │   ├── routes/         # API endpoints
│   │   ├── middlewares/    # Auth & error handling
│   │   ├── utils/          # Helper functions
│   │   ├── server.js       # Server entry point
│   │   └── package.json
│   └── frontend/
│       ├── src/
│       │   ├── app/
│       │   │   ├── components/  # Reusable components
│       │   │   ├── pages/       # Route components
│       │   │   ├── services/    # HTTP services
│       │   │   ├── guards/      # Route guards
│       │   │   └── models/      # TypeScript interfaces
│       │   └── environments/    # Environment configs
│       └── package.json
└── README.md
```

## 🔧 Configuration

### Backend Environment Variables

Create a `.env` file in `whats-in-the-fridge/backEnd/`:

```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/whats_in_the_fridge
JWT_SECRET=your-secret-key
JWT_EXPIRE=7d
GEMINI_API_KEY=your-gemini-api-key
PEXELS_API_KEY=your-pexels-api-key
```

### Frontend Environment

Update `frontend/src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  uploadsUrl: 'http://localhost:3000'
};
```

## 📚 API Documentation

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/change-password` - Change password

### Recipes

- `POST /api/recipes/generate` - Generate AI recipes
- `GET /api/recipes` - Get all approved recipes
- `GET /api/recipes/:id` - Get recipe by ID
- `POST /api/recipes` - Create recipe (pending approval)
- `PUT /api/recipes/:id` - Update recipe
- `DELETE /api/recipes/:id` - Delete recipe

### Admin

- `GET /api/recipes/admin/pending` - Get pending recipes
- `PATCH /api/recipes/:id/approve` - Approve recipe
- `PATCH /api/recipes/:id/reject` - Reject recipe

### Reviews

- `POST /api/reviews` - Add review
- `GET /api/reviews/recipe/:id` - Get recipe reviews
- `PUT /api/reviews/:id` - Update review
- `DELETE /api/reviews/:id` - Delete review

### Favorites

- `POST /api/favorites` - Add to favorites
- `GET /api/favorites` - Get user favorites
- `DELETE /api/favorites/:recipeId` - Remove from favorites

## 🚀 Deployment

See [AZURE_DEPLOYMENT.md](./AZURE_DEPLOYMENT.md) for complete Azure deployment guide.

### Quick Deploy

1. Set up MongoDB Atlas
2. Create Azure Web App for backend
3. Create Azure Static Web App for frontend
4. Configure GitHub secrets
5. Push to main branch

```bash
git add .
git commit -m "Deploy to Azure"
git push origin main
```

## 🧪 Testing

### Backend Tests
```bash
cd whats-in-the-fridge/backEnd
npm test
```

### Frontend Tests
```bash
cd whats-in-the-fridge/frontend
ng test
```

## 🛠️ Built With

### Backend
- [Node.js](https://nodejs.org/) - Runtime environment
- [Express](https://expressjs.com/) - Web framework
- [MongoDB](https://www.mongodb.com/) - Database
- [Mongoose](https://mongoosejs.com/) - ODM
- [JWT](https://jwt.io/) - Authentication
- [Gemini AI](https://ai.google.dev/) - Recipe generation
- [Multer](https://github.com/expressjs/multer) - File uploads

### Frontend
- [Angular 19](https://angular.io/) - Frontend framework
- [TypeScript](https://www.typescriptlang.org/) - Programming language
- [RxJS](https://rxjs.dev/) - Reactive programming
- [ngx-toastr](https://www.npmjs.com/package/ngx-toastr) - Notifications

## 👥 User Roles

### Regular User
- Generate AI recipes
- Submit recipes for approval
- View approved recipes
- Add favorites
- Write reviews
- Edit own recipes

### Admin
- All user permissions
- Approve/reject recipes
- Manage all recipes
- View pending submissions

## 🔐 Security

- Password hashing with bcrypt
- JWT token authentication
- Protected routes with guards
- Role-based access control
- Input validation and sanitization
- CORS configuration
- Environment variable protection


## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👨‍💻 Author

**karimalahssini10**
- GitHub: [@karimalahssini10](https://github.com/karimalahssini10)

## 🙏 Acknowledgments

- Gemini AI for recipe generation
- Pexels for recipe images
- MongoDB Atlas for cloud database
- Azure for hosting

---

**Made with ❤️ and 🍕**
