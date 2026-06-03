# PhotoIngest - Photo Auto-Upload System

A full-stack application for automatically uploading photos from SD cards to internal drives.

## Project Structure

```
photoingest/
├── backend/           # Express.js API server
│   ├── server.js      # Main server entry point
│   ├── package.json   # Backend dependencies
│   ├── routes/        # API route handlers
│   ├── controllers/   # Business logic
│   ├── middleware/    # Express middleware
│   ├── config/        # Configuration files
│   └── .env.example   # Environment variables template
│
├── frontend/          # React + Vite application
│   ├── src/
│   │   ├── pages/     # Main pages (Dashboard, Upload, Settings)
│   │   ├── components/# Reusable components
│   │   ├── hooks/     # Custom React hooks
│   │   ├── api/       # API client
│   │   ├── App.jsx    # Main app component
│   │   └── main.jsx   # Entry point
│   ├── index.html     # HTML template
│   ├── vite.config.js # Vite configuration
│   └── package.json   # Frontend dependencies
│
└── README.md          # This file
```

## Features (v1)

- **Dashboard**: View upload history and statistics
- **Upload Page**: Manual file upload with drag-and-drop support
- **Settings Page**: Configure upload destination and file size limits
- **REST API**: Backend API for file management and configuration
- **Local Network**: No authentication required (trusted network only)
- **Direct-to-Drive**: Files uploaded directly to configured internal drives

## Getting Started

### Prerequisites

- Node.js 16+ and npm
- A text editor (VS Code recommended)

### Backend Setup

1. Navigate to the backend folder:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file (copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```

4. Edit `.env` to configure:
   - `PORT` - Server port (default: 5000)
   - `UPLOAD_DESTINATION_PATH` - Where files will be saved
   - `CORS_ORIGIN` - Frontend URL (default: http://localhost:5173)

5. Start the backend server:
   ```bash
   npm run dev
   ```
   Server will run on http://localhost:5000

### Frontend Setup

1. In a new terminal, navigate to the frontend folder:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```
   Application will be available at http://localhost:5173

## API Endpoints

### Upload Management
- `POST /api/upload` - Upload files
- `GET /api/upload/history` - Get upload history
- `GET /api/upload/stats` - Get upload statistics
- `DELETE /api/upload/history` - Clear upload history

### Settings
- `GET /api/settings` - Get current settings
- `PUT /api/settings` - Update settings

### System
- `GET /api/status` - Check server status

## Usage

1. **Dashboard**: View all uploaded files and statistics
2. **Upload**: 
   - Drag and drop files or click to select
   - Choose files from SD card or local drive
   - Click "Upload Files" to submit
3. **Settings**:
   - Set the destination path for uploaded files
   - Configure maximum file size
   - Toggle auto-upload (v1: disabled)

## Development

### Building Frontend
```bash
cd frontend
npm run build
```

### Environment Variables

**Backend (.env)**
```
PORT=5000
NODE_ENV=development
UPLOAD_DESTINATION_PATH=C:\uploads\photos
MAX_FILE_SIZE=5242880
CORS_ORIGIN=http://localhost:5173
```

## Project Decisions

- **Framework**: React with Vite for fast development
- **API**: REST endpoints with JSON
- **Upload**: Direct-to-drive writes using multer
- **Manual Upload Only**: No auto-detection in v1
- **Local Network**: No authentication (trusted environment)
- **Storage**: Settings stored in JSON file

## Next Steps (v2+)

- Auto-detection of SD card insertion
- Background upload service
- Advanced scheduling
- Multi-user authentication
- Database integration
- Logging and monitoring
- Configurable folder structure templates

## Troubleshooting

**Backend won't start**
- Check if port 5000 is in use
- Verify Node.js is installed
- Check .env configuration

**Frontend can't connect to backend**
- Ensure backend is running on port 5000
- Check CORS_ORIGIN in .env matches frontend URL
- Open browser console for detailed error messages

**Upload fails**
- Check destination path exists and is writable
- Verify file size doesn't exceed MAX_FILE_SIZE
- Check console for specific error messages

## License

ISC
