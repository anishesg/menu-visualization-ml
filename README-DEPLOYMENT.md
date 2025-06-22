# 🍽️ Menu Visualizer - Deployment Guide

This guide covers how to deploy the Menu Visualizer app to Vercel with responsive design and mobile camera functionality.

## 🏗️ App Architecture

The app has been restructured for Vercel deployment:

### Frontend (React)
- **Location**: `/frontend/`
- **Features**: 
  - 📱 Fully responsive design (mobile-first)
  - 📷 Camera capture for mobile devices
  - 🎨 Custom CSS utilities (Tailwind-like)
  - 🔧 Environment variable support

### Backend (Serverless Functions)
- **Location**: `/api/`
- **Features**:
  - 🚀 Vercel serverless functions
  - 🤖 OpenAI GPT-4o-mini integration
  - 🔍 Google Custom Search API
  - 🛡️ CORS enabled

## 🚀 Deployment Steps

### 1. Prerequisites

- GitHub account
- Vercel account (free tier available)
- OpenAI API key
- Google Custom Search API key + Custom Search Engine ID

### 2. Environment Variables

Set these environment variables in your Vercel dashboard:

```bash
# Required API Keys
OPENAI_API_KEY=sk-your-openai-key-here
GOOGLE_API_KEY=your-google-api-key-here
GOOGLE_CSE_ID=your-custom-search-engine-id

# Frontend Environment (will be prefixed with REACT_APP_)
REACT_APP_API_URL=https://your-app-name.vercel.app
```

### 3. Deploy to Vercel

#### Option A: GitHub Integration (Recommended)

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

2. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will automatically detect the configuration

3. **Configure Environment Variables**:
   - In your Vercel project dashboard
   - Go to Settings → Environment Variables
   - Add all the required environment variables listed above

4. **Deploy**:
   - Vercel will automatically deploy on every push to main
   - Initial deployment typically takes 2-3 minutes

#### Option B: Vercel CLI

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Login and Deploy**:
   ```bash
   vercel login
   vercel --prod
   ```

3. **Set Environment Variables**:
   ```bash
   vercel env add OPENAI_API_KEY
   vercel env add GOOGLE_API_KEY
   vercel env add GOOGLE_CSE_ID
   vercel env add REACT_APP_API_URL
   ```

## 📱 Mobile Features

### Camera Functionality
- **Auto-detection**: Camera button appears on mobile devices
- **Back Camera**: Automatically uses rear camera when available
- **Responsive UI**: Touch-friendly interface
- **Error Handling**: Graceful fallback to file upload

### Responsive Design
- **Mobile First**: Optimized for phones and tablets
- **Breakpoints**:
  - Mobile: < 640px
  - Tablet: 640px - 1024px
  - Desktop: > 1024px
- **Touch Interactions**: Large buttons, easy navigation

## 🔧 Configuration Files

### `vercel.json`
```json
{
  "version": 2,
  "builds": [
    {
      "src": "frontend/package.json",
      "use": "@vercel/static-build",
      "config": { "distDir": "build" }
    }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "/api/$1" },
    { "src": "/(.*)", "dest": "/frontend/$1" }
  ]
}
```

### API Functions Structure
```
api/
├── upload.py      # Main menu processing endpoint
└── health.py      # Health check endpoint
```

### Frontend Structure
```
frontend/
├── src/
│   ├── App.js           # Main app component
│   ├── MenuUploader.js  # Camera + upload component
│   └── index.css        # Responsive utilities
├── public/
└── build/              # Built files (auto-generated)
```

## 🎯 Key Features

### Responsive UI
- ✅ Mobile-optimized layout
- ✅ Touch-friendly buttons
- ✅ Adaptive image grids
- ✅ Flexible typography
- ✅ Modern gradients and animations

### Camera Integration
- ✅ getUserMedia API
- ✅ Environment-facing camera preference
- ✅ Photo capture to canvas
- ✅ Automatic file conversion
- ✅ Stream cleanup on unmount

### AI-Powered Backend
- ✅ GPT-4o-mini for menu extraction
- ✅ Intelligent image selection
- ✅ Multiple search strategies
- ✅ Quality URL analysis

## 🔍 Testing

### Local Development
```bash
# Frontend
cd frontend
npm start

# Backend (local Flask - for development only)
cd backend
python app.py
```

### Production Testing
- Test camera functionality on actual mobile devices
- Verify responsive design across different screen sizes
- Check API endpoints are working correctly
- Validate environment variables are set

## 🚨 Troubleshooting

### Common Issues

1. **Camera Not Working**:
   - Ensure HTTPS (required for camera access)
   - Check browser permissions
   - Verify getUserMedia support

2. **API Errors**:
   - Check environment variables in Vercel
   - Verify API keys are valid
   - Check function logs in Vercel dashboard

3. **Build Failures**:
   - Ensure all dependencies are in package.json
   - Check for syntax errors in code
   - Verify file paths are correct

4. **CORS Issues**:
   - Headers are set in API functions
   - Preflight requests are handled

### Monitoring
- Use Vercel Analytics for performance monitoring
- Check function logs for errors
- Monitor API usage for rate limits

## 📊 Performance

### Optimizations
- Image lazy loading
- Component code splitting
- CSS minification
- API response caching (where appropriate)
- Mobile-first responsive images

### Limits
- Vercel Function timeout: 10 seconds (Hobby plan)
- Request size limit: 4.5MB
- OpenAI API rate limits apply
- Google Search API quotas apply

## 🔐 Security

### Environment Variables
- Never commit API keys to repository
- Use Vercel environment variables
- Rotate keys regularly

### API Security
- CORS properly configured
- Input validation on file uploads
- Error handling without exposing internals

## 📈 Scaling

For higher usage:
- Upgrade to Vercel Pro for better limits
- Implement request queuing
- Add Redis caching
- Consider database for persistent storage
- Monitor API quotas

## 🎉 Success!

Once deployed, your Menu Visualizer will be available at:
`https://your-app-name.vercel.app`

Features available:
- 📱 Mobile camera capture
- 🖥️ Desktop file upload
- 🤖 AI menu extraction
- 🍽️ Smart food image selection
- ⚡ Fast serverless backend 