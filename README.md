# 🍽️ Menu Visualizer App

An AI-powered application that extracts menu items from images and displays them with automatically found food images.

## Features

- 📷 Upload menu images (JPG, PNG, etc.)
- 🤖 AI-powered menu item extraction using GPT-4o-mini
- 🖼️ Automatic image search for each menu item using Google Custom Search
- 📱 Responsive web interface built with React and Tailwind CSS
- ⚡ Real-time processing with error handling

## Prerequisites

- Python 3.8+ 
- Node.js 14+
- OpenAI API key
- Google Custom Search API key and Search Engine ID

## Setup Instructions

### 1. Clone and Navigate
```bash
cd menu_images_ML_app
```

### 2. Backend Setup
```bash
# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install Python dependencies
cd backend
pip install -r requirements.txt

# Create .env file with your API keys
# Copy the following into backend/.env:
OPENAI_API_KEY=your-openai-api-key-here
GOOGLE_API_KEY=your-google-api-key-here
GOOGLE_CSE_ID=your-google-cse-id-here
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
```

## Running the Application

### 1. Start the Backend Server
```bash
cd backend
source ../venv/bin/activate
python app.py
```
The backend will start on http://localhost:5001

### 2. Start the Frontend (in a new terminal)
```bash
cd frontend
npm start
```
The frontend will start on http://localhost:3000

## Usage

1. Open http://localhost:3000 in your web browser
2. Click "Choose File" and select a menu image
3. Click "Upload & Process Menu"
4. Wait for AI processing (may take 30-60 seconds)
5. View extracted menu items with automatically found images

## API Endpoints

- `GET /api/health` - Health check endpoint
- `POST /api/upload` - Upload menu image for processing

## Technologies Used

- **Backend**: Flask, OpenAI API, Google Custom Search API
- **Frontend**: React, Tailwind CSS, Axios
- **AI**: GPT-4o-mini for image analysis

## Troubleshooting

- **Port 5000 conflict**: The app uses port 5001 for the backend to avoid conflicts with macOS AirPlay
- **API key errors**: Ensure your `.env` file is in the `backend/` directory with valid API keys
- **CORS errors**: Make sure both frontend and backend are running
- **Image loading errors**: Some Google image URLs may not work due to CORS restrictions

## File Structure
```
menu_images_ML_app/
├── backend/
│   ├── app.py              # Flask server
│   ├── requirements.txt    # Python dependencies
│   ├── .env               # API keys (create this)
│   └── .gitignore
├── frontend/
│   ├── src/
│   │   ├── App.js         # Main React component
│   │   ├── MenuUploader.js # Upload and display component
│   │   └── index.css      # Tailwind CSS
│   ├── package.json
│   └── tailwind.config.js
└── venv/                  # Virtual environment
```

## License

MIT License 