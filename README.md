# Content Delivery Network (CDN) System

A robust and scalable Content Delivery Network system

## Features

- 🚀 High-performance file delivery
- 🔒 Secure authentication system
- 📁 Support for multiple file types
- ⚡ Fast file streaming
- 📊 File management dashboard


## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/loma0531/ContentDeliveryNetwork-CDN.git
   cd ContentDeliveryNetwork-CDN
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

## Configuration

1. Create a `.env.local` file in the root directory:

   ```env
   # Database Configuration
   MONGODB_URI=mongodb://localhost:27017/cdn
   # Authentication Configuration
   NEXTAUTH_URL=https://example.com/
   ADMIN_EMAIL=admin@example.com
   ADMIN_PASSWORD=admin123
   # CDN Configuration
   CDN_BASE_URL=https://example.com/
   NEXT_PUBLIC_MAX_UPLOAD_SIZE_MB=10240  # 10GB in MB
   # Security (Add in production)
   # NEXTAUTH_SECRET=your-secret-key
   # JWT_SECRET=your-jwt-secret
   ```

   ⚠️ **Security Warning**: Never use default admin credentials in production!

## Setup Admin User

Initialize the admin user with:

```bash
npm run init-admin
```

## Development

Start the development server:

```bash
npm run dev
```

The server will be available at `http://localhost:3000`

## Production Deployment

1. Build the application:

   ```bash
   npm run build
   ```

2. Start the production server:

   ```bash
   npm start
   ```

## License

This project is licensed under the MIT License.