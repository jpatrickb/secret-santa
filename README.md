# Secret Santa Gift Exchange Planner

A modern, beautiful web application for organizing Secret Santa gift exchanges with family and friends. Built with React, TypeScript, Node.js, and Prisma.

![Secret Santa](https://img.shields.io/badge/Secret%20Santa-Gift%20Planner-red?style=for-the-badge)

## Features

### 🎁 Gift Exchange Management
- **Create Groups**: Start new Secret Santa groups for family, friends, or coworkers
- **Invite System**: Share unique invite codes or links to add members to your group
- **Three Assignment Modes**:
  - **Random**: Automatically generate Secret Santa assignments
  - **Manual**: Admin manually assigns who buys for whom
  - **Open**: No assignments - everyone can view all wishlists

### 🎯 Smart Wishlist System
- Add items with titles, URLs, and notes
- Paste links from Amazon or any online store
- Members can view others' wishlists (except in assigned mode)
- Claim items you plan to purchase
- **Privacy Protection**: Gift claims are hidden from the wishlist owner to maintain surprise

### 👥 User Management
- Secure authentication with JWT
- Admin and member roles
- View all group members
- Easy invite link sharing

### 🎨 Beautiful UI
- Modern, clean design with Tailwind CSS
- Responsive layout for mobile and desktop
- Festive color scheme (red and green)
- Smooth animations and transitions

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Lucide React** for icons

### Backend
- **Node.js** with Express
- **TypeScript** for type safety
- **Prisma ORM** with SQLite
- **JWT** for authentication
- **bcryptjs** for password hashing
- **Zod** for validation

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd secret-santa
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   ```

4. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

### Running the Application

You'll need two terminal windows:

**Terminal 1 - Backend Server:**
```bash
cd backend
npm run dev
```
The backend will run on `http://localhost:3001`

**Terminal 2 - Frontend Dev Server:**
```bash
cd frontend
npm run dev
```
The frontend will run on `http://localhost:3000`

Open your browser and navigate to `http://localhost:3000`

## Usage Guide

### Creating Your First Group

1. **Sign Up**: Create an account with your email and password
2. **Create Group**: Click "Create Group" and give it a name
3. **Invite Members**: Share the invite code or copy the invite link
4. **Add Wishlist**: Add items you'd like to receive with links and notes

### Managing Assignments

As a group admin, you can:

1. **Choose Assignment Mode** in Settings:
   - Random: Click "Generate Assignments" to automatically assign Secret Santas
   - Manual: Manually select who buys for whom
   - Open: No specific assignments

2. **View Assignments** in the Assignments tab
3. Members will see who they're buying for (but not who's buying for them)

### Creating Wishlists

1. Go to your group
2. Click "Add Item" in the Wishlist tab
3. Enter:
   - Item name (required)
   - URL to product page (optional)
   - Notes about size, color, preferences (optional)
4. Other members can now see your wishlist

### Claiming Gifts

1. Browse other members' wishlists
2. Click "Claim" on an item you want to purchase
3. The owner won't see you claimed it (keeps it a surprise!)
4. Other members will see it's claimed (prevents duplicates)

## Project Structure

```
secret-santa/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma       # Database schema
│   ├── src/
│   │   ├── index.ts           # Express server & API routes
│   │   └── auth.ts            # Authentication utilities
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── contexts/          # React contexts (Auth)
│   │   ├── lib/              # Utilities and API client
│   │   ├── pages/            # Page components
│   │   ├── App.tsx           # Main app with routing
│   │   ├── main.tsx          # Entry point
│   │   └── index.css         # Global styles
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Groups
- `POST /api/groups` - Create group
- `GET /api/groups` - List user's groups
- `GET /api/groups/:groupId` - Get group details
- `POST /api/groups/:inviteCode/join` - Join group with invite code
- `PATCH /api/groups/:groupId/assignment-mode` - Update assignment mode

### Assignments
- `POST /api/groups/:groupId/assignments/generate` - Generate random assignments
- `POST /api/groups/:groupId/assignments` - Create manual assignment
- `GET /api/groups/:groupId/assignments` - Get assignments
- `DELETE /api/groups/:groupId/assignments/:assignmentId` - Delete assignment

### Wishlist
- `POST /api/groups/:groupId/wishlist` - Add wishlist item
- `GET /api/groups/:groupId/wishlist` - Get group wishlist
- `PATCH /api/wishlist/:itemId` - Update wishlist item
- `DELETE /api/wishlist/:itemId` - Delete wishlist item
- `POST /api/wishlist/:itemId/claim` - Claim item
- `DELETE /api/wishlist/:itemId/claim` - Unclaim item

## Database Schema

### Models
- **User**: Email, password (hashed), name
- **Group**: Name, description, invite code, assignment mode
- **GroupMembership**: Links users to groups with roles (ADMIN/MEMBER)
- **Assignment**: Maps givers to receivers within groups
- **WishlistItem**: Gift items with title, URL, notes
- **GiftClaim**: Tracks who claimed which items

## Security Features

- Password hashing with bcrypt
- JWT-based authentication
- Protected API routes
- Input validation with Zod
- Role-based access control

## Environment Variables

### Backend (.env)
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secret-key-change-in-production"
PORT=3001
```

## Building for Production

### Backend
```bash
cd backend
npm run build
npm start
```

### Frontend
```bash
cd frontend
npm run build
npm run preview
```

The frontend build will be in `frontend/dist/`

## Future Enhancements

- Email notifications
- Budget tracking
- Gift suggestions
- Mobile app
- Social login (Google, Facebook)
- Image uploads for wishlist items
- Group chat
- Gift exchange history

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the MIT License.

## Support

If you encounter any issues or have questions, please open an issue on GitHub.

---

Made with ❤️ for spreading holiday cheer!
