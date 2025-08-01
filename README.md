# File Hosting CDN

A full-stack file hosting web application with CDN-like capabilities, built with Next.js, MongoDB, and Tailwind CSS.

## Features

### 🔐 Authentication & Security
- **Admin-only registration**: Only administrators can create new user accounts
- **JWT-based authentication** with HTTP-only cookies
- **Secure file access control** - users can only access their own files
- **Role-based access** (admin vs regular users)

### 📁 File Management
- **Drag-and-drop file upload** with progress tracking
- **Folder creation and organization** like Google Drive
- **File browser** with grid and list view modes
- **Public CDN URLs** for each uploaded file
- **File operations**: upload, download, delete, move, rename
- **File type validation** and size limits (100MB max)

### 🎨 User Interface
- **Responsive design** for desktop, tablet, and mobile
- **Dark/Light theme toggle**
- **Modern UI** with shadcn/ui components
- **File type icons** and metadata display
- **Search functionality**

### 👑 Admin Features
- **User management panel**
- **System statistics**
- **User creation interface**

## Tech Stack

- **Frontend**: React, Next.js 15, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT with bcryptjs
- **File Storage**: Local disk storage
- **Platform**: Cross-platform (Windows, Ubuntu, macOS)

## Prerequisites

- Node.js 18+ or Bun
- MongoDB (local or cloud)
- Git

## Installation

### 1. Clone the repository
```bash
git clone <repository-url>
cd file-hosting-cdn
```

### 2. Install dependencies
```bash
# Using Bun (recommended)
bun install

# Or using npm
npm install
```

### 3. Environment Setup
Create a `.env.local` file in the root directory:

```env
MONGODB_URI=mongodb://localhost:27017/file-hosting-cdn
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NEXTAUTH_SECRET=your-nextauth-secret-key
NEXTAUTH_URL=http://localhost:3000
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123
CDN_BASE_URL=http://localhost:3000
```

**Security Note**: Change the default admin credentials and JWT secrets before deploying to production!

### 4. Database Setup

#### Option A: Local MongoDB
1. Install MongoDB locally
2. Start MongoDB service
3. The app will automatically create the database and collections

#### Option B: MongoDB Atlas (Cloud)
1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a cluster and get the connection string
3. Replace the `MONGODB_URI` in `.env.local`

### 5. Initialize Admin User
```bash
# Using Bun
bun run init-admin

# Or using npm
npm run init-admin
```

This creates the initial admin user with credentials from your `.env.local` file.

### 6. Start Development Server
```bash
# Using Bun
bun run dev

# Or using npm
npm run dev
```

The application will be available at `http://localhost:3000`

## Usage

### First Login
1. Navigate to `http://localhost:3000`
2. You'll be redirected to the login page
3. Use the admin credentials from your `.env.local` file:
   - Email: `admin@example.com` (or your custom email)
   - Password: `admin123` (or your custom password)

### File Management
1. **Upload Files**: Drag and drop files or click "Choose Files"
2. **Create Folders**: Click "New Folder" button
3. **Navigate**: Click on folders to open them, use breadcrumbs to go back
4. **File Operations**: Right-click or use the menu button for download/delete options
5. **Search**: Use the search bar to find files by name

### Public File URLs
Every uploaded file gets a public URL in the format:
```
https://your-domain.com/api/files/public/{user_id}/{filename}
```

### Admin Functions
1. Click the "Admin" button in the header (only visible to admins)
2. **Create Users**: Add new users with optional admin privileges
3. **View Users**: See all registered users and their details

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/logout` - User logout

### File Management
- `POST /api/files/upload` - Upload files
- `GET /api/files/list` - List files and folders
- `POST /api/files/create-folder` - Create folder
- `DELETE /api/files/delete` - Delete file/folder
- `POST /api/files/move` - Move file/folder
- `GET /api/files/public/{userId}/{filename}` - Serve public files

### User Management (Admin Only)
- `POST /api/users/create` - Create new user
- `GET /api/users/list` - List all users

## File Structure

```
file-hosting-cdn/
├── src/
│   ├── app/                    # Next.js 13+ app directory
│   │   ├── api/               # API routes
│   │   │   ├── auth/          # Authentication endpoints
│   │   │   ├── files/         # File management endpoints
│   │   │   └── users/         # User management endpoints
│   │   ├── login/             # Login page
│   │   └── page.tsx           # Main dashboard
│   ├── components/            # React components
│   │   ├── ui/                # shadcn/ui components
│   │   ├── FileDashboard.tsx  # Main dashboard component
│   │   ├── FileUploadZone.tsx # Drag & drop upload
│   │   ├── FileGrid.tsx       # File browser
│   │   └── AdminPanel.tsx     # Admin management
│   ├── contexts/              # React contexts
│   │   ├── AuthContext.tsx    # Authentication state
│   │   └── ThemeContext.tsx   # Dark/light theme
│   ├── lib/                   # Utility libraries
│   │   └── mongoose.ts        # MongoDB connection
│   ├── models/                # Database models
│   │   ├── User.ts            # User schema
│   │   └── File.ts            # File/folder schema
│   ├── utils/                 # Utility functions
│   │   ├── auth.ts            # Authentication helpers
│   │   └── fileUtils.ts       # File management helpers
│   └── uploads/               # File storage directory
│       └── {user_id}/         # User-specific folders
├── scripts/
│   └── init-admin.js          # Admin initialization script
└── .env.local                 # Environment variables
```

## Production Deployment

### 1. Environment Variables
Update your production `.env.local`:
- Set secure `JWT_SECRET` and `NEXTAUTH_SECRET`
- Update `CDN_BASE_URL` to your domain
- Use production MongoDB URI

### 2. Build the Application
```bash
bun run build
# or
npm run build
```

### 3. Start Production Server
```bash
bun start
# or
npm start
```

### 4. File Storage Considerations
- For production, consider using cloud storage (AWS S3, Google Cloud Storage)
- Implement CDN for better performance
- Set up backup strategies for uploaded files

## Security Considerations

- **Authentication**: Users can only access their own files
- **File Validation**: Type and size restrictions
- **Admin Only Registration**: Prevents unauthorized account creation
- **Secure Cookies**: HTTP-only cookies for JWT tokens
- **Input Validation**: All inputs are validated on both client and server

## Browser Compatibility

- Chrome/Chromium 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
1. Check the existing issues
2. Create a new issue with detailed description
3. Include environment details and error messages

## Roadmap

- [ ] Cloud storage integration (AWS S3, Google Cloud)
- [ ] File sharing with expirable links
- [ ] File versioning
- [ ] Advanced admin analytics
- [ ] Bulk file operations
- [ ] API rate limiting
- [ ] File preview functionality
- [ ] Mobile app
