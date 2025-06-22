import React from "react";
import MenuUploader from "./MenuUploader";

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto py-4 sm:py-8 px-2 sm:px-4">
        <div className="text-center mb-6 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-2 sm:mb-4">
            🍽️ Menu Visualizer
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto px-4">
            Upload a menu image or take a photo to see each item with AI-generated visuals
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2 text-xs sm:text-sm text-gray-500">
            <span className="bg-white px-3 py-1 rounded-full">📱 Mobile Friendly</span>
            <span className="bg-white px-3 py-1 rounded-full">📷 Camera Support</span>
            <span className="bg-white px-3 py-1 rounded-full">🤖 AI Powered</span>
          </div>
        </div>
        <MenuUploader />
      </div>
    </div>
  );
}

export default App;