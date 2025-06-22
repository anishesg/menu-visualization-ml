# 🍽️ Menu Visualizer

An AI-powered web application that extracts menu items from photos and finds beautiful food images to visualize them. Built with Next.js, OpenAI GPT-4o-mini, and Google Custom Search.

![Menu Visualizer Demo](https://via.placeholder.com/800x400/4F46E5/FFFFFF?text=Menu+Visualizer+Demo)

## ✨ Features

- **📸 Photo Upload & Camera Capture**: Upload menu photos or take pictures directly
- **🤖 AI Menu Extraction**: Uses OpenAI GPT-4o-mini to extract menu items and prices
- **🔍 Smart Image Search**: Enhanced search across Pinterest, food blogs, and restaurant sites
- **🎯 AI Image Curation**: GPT-4o analyzes and selects the best food photography
- **📱 Responsive Design**: Works perfectly on mobile and desktop
- **⚡ Next.js Performance**: Fast, optimized, and ready for production

## 🚀 Getting Started

### Prerequisites

You'll need API keys for:
- [OpenAI](https://platform.openai.com/account/api-keys) - for menu text extraction
- [Google Custom Search](https://console.developers.google.com/) - for image search
- [Google Custom Search Engine](https://cse.google.com/cse/) - create a search engine

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/anishesg/menu-visualization-ml.git
   cd menu-visualization-ml
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` with your API keys:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   GOOGLE_API_KEY=your_google_api_key_here
   GOOGLE_CSE_ID=your_google_cse_id_here
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000)** in your browser

## 🛠️ How It Works

### 1. **Menu Extraction** 
   - Upload or capture a menu photo
   - OpenAI GPT-4o-mini analyzes the image
   - Extracts dish names and prices in structured format

### 2. **Enhanced Image Search**
   - 12+ search strategies targeting high-quality sources:
     - Pinterest food photography
     - Professional recipe sites (AllRecipes, Food Network)
     - Food blogs and cooking websites
     - Restaurant presentation photos
     - Culinary photography portfolios

### 3. **AI Image Curation**
   - GPT-4o analyzes URL structures and domains
   - Prioritizes professional food photography
   - Avoids stock photos and menu screenshots
   - Selects most appetizing, restaurant-quality images

## 🌐 Deploy on Vercel

The easiest way to deploy is using Vercel:

1. **Push to GitHub** (already done)

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Vercel will auto-detect Next.js

3. **Set Environment Variables**
   In Vercel dashboard → Settings → Environment Variables:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   GOOGLE_API_KEY=your_google_api_key_here
   GOOGLE_CSE_ID=your_google_cse_id_here
   ```

4. **Deploy**
   - Vercel will automatically deploy on every push to main
   - Your app will be live at `your-app.vercel.app`

## 🧠 Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes (serverless functions)
- **AI**: OpenAI GPT-4o-mini for vision and text analysis
- **Search**: Google Custom Search API for image discovery
- **Deployment**: Vercel (optimized for Next.js)

## 📊 Performance

- **Response Time**: 25-40 seconds per menu (API processing time)
- **Image Quality**: Curated high-quality food photography
- **Mobile Optimized**: Camera capture and responsive design
- **Scalable**: Serverless architecture handles traffic spikes

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- OpenAI for powerful vision and language models
- Google for comprehensive image search capabilities
- Vercel for seamless deployment platform
- Next.js team for the amazing framework
