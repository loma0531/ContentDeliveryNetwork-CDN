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

## Environment Variables Explained

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| MONGODB_URI | MongoDB connection string | Yes | - |
| NEXTAUTH_URL | Full URL of your application | Yes | - |
| ADMIN_EMAIL | Administrator email | Yes | - |
| ADMIN_PASSWORD | Administrator password | Yes | - |
| CDN_BASE_URL | Base URL for CDN assets | Yes | - |
| NEXT_PUBLIC_MAX_UPLOAD_SIZE_MB | Maximum upload size in MB | No | 10240 |

## API Endpoints

- `GET /api/files` - List all files
- `POST /api/upload` - Upload new file
- `GET /api/files/:id` - Get file details
- `DELETE /api/files/:id` - Delete file

## Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   - Check if MongoDB is running
   - Verify connection string in .env.local
   - Ensure network connectivity

2. **Upload Fails**
   - Check file size limits
   - Verify storage permissions
   - Check network connectivity

3. **Authentication Issues**
   - Clear browser cookies
   - Verify admin credentials
   - Check NEXTAUTH_URL configuration

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For support, email support@example.com or open an issue in the repository.