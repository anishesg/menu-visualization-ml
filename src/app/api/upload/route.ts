import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

interface MenuItem {
  item: string;
  image: string | null;
}

interface GoogleSearchResult {
  link: string;
  title?: string;
}

interface GoogleSearchResponse {
  items?: GoogleSearchResult[];
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('menuImage') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString('base64');

    // Extract menu items using OpenAI
    const menuItems = await extractMenuItems(base64Image);
    
    // Get AI-selected images for each item
    const results: MenuItem[] = [];
    for (const item of menuItems) {
      const images = await fetchImageForItem(item);
      results.push({
        item,
        image: images.length > 0 ? images[0] : null
      });
    }

    return NextResponse.json({ menu: results });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function extractMenuItems(base64Image: string): Promise<string[]> {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract each individual food and drink item from this menu image. List ONLY the specific dish names with their prices, one per line. Skip category headers like 'Appetizers', 'Entrees', etc. Format: 'Dish Name - $Price'. Focus on actual food items that customers can order."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ]
        }
      ],
      max_tokens: 1500
    });

    const text = response.choices[0]?.message?.content || '';
    const items = text.split('\n').filter((line: string) => line.trim());
    return items;
  } catch (error) {
    console.error('Error extracting menu items:', error);
    return ['Unable to extract menu items'];
  }
}

async function fetchImageForItem(item: string): Promise<string[]> {
  const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
  const GOOGLE_CSE_ID = process.env.GOOGLE_CSE_ID;
  
  if (!GOOGLE_API_KEY || !GOOGLE_CSE_ID) {
    return [];
  }

  // Clean up the item name to get just the dish name
  let cleanItem = item.split(' - $')[0].split(' $')[0].trim();
  cleanItem = cleanItem.replace(/\*/g, '').replace(/-/g, '').trim();
  cleanItem = cleanItem.replace(/^[0-9.-\s]+/, '').trim();

  // Skip category headers and empty items
  const categoryHeaders = ['soups', 'starters', 'salads', 'entrees', 'pastas', 'appetizers', 'mains', 'desserts'];
  if (cleanItem.length < 3 || categoryHeaders.includes(cleanItem.toLowerCase())) {
    return [];
  }

  console.log(`🔍 Searching for images for: "${cleanItem}"`);

  try {
    // Get 3 images using enhanced search strategy
    const allImageUrls = await getEnhancedImagesForDish(cleanItem, GOOGLE_API_KEY, GOOGLE_CSE_ID);
    
    if (allImageUrls.length === 0) {
      console.log(`❌ No images found for: "${cleanItem}"`);
      return [];
    }

    console.log(`📷 Found ${allImageUrls.length} candidate images for: "${cleanItem}"`);

    // Let GPT analyze and pick the best URL from all candidates
    const bestUrl = await getAiSelectedImage(cleanItem, allImageUrls);
    if (bestUrl) {
      console.log(`✨ AI selected best image for: "${cleanItem}"`);
      return [bestUrl];
    }

    console.log(`⚠️ AI couldn't select a good image for: "${cleanItem}", using first available`);
    return allImageUrls.slice(0, 1);
  } catch (error) {
    console.error(`Error fetching images for ${item}:`, error);
    return [];
  }
}

async function getEnhancedImagesForDish(dishName: string, apiKey: string, cseId: string): Promise<string[]> {
  // Enhanced search strategies with better terms for food photography
  const searchStrategies = [
    // Pinterest - great for food photography
    `${dishName} pinterest recipe food photography`,
    `${dishName} pinterest food blog beautiful`,
    
    // Food blogs and recipe sites - professional food photos
    `${dishName} food blog recipe site:allrecipes.com OR site:foodnetwork.com`,
    `${dishName} cooking blog gourmet photography`,
    `${dishName} recipe blog professional food photography`,
    
    // Restaurant and professional sources
    `${dishName} restaurant menu dish plated professional`,
    `${dishName} gourmet restaurant presentation food styling`,
    `${dishName} chef prepared restaurant quality`,
    
    // Food photography specific terms
    `${dishName} food photography styled appetizing`,
    `${dishName} culinary arts food styling photography`,
    
    // Backup searches
    `${dishName} delicious food photo high quality`,
    `${dishName} homemade recipe beautiful presentation`
  ];

  const allImageUrls: string[] = [];
  const targetImagesCount = 3;

  console.log(`🔍 Running enhanced search for: "${dishName}"`);

  for (const strategy of searchStrategies) {
    try {
      console.log(`   🔎 Trying: "${strategy}"`);
      const urls = await getImagesFromSearch(strategy, 3, apiKey, cseId);
      
      // Add unique URLs only
      for (const url of urls) {
        if (!allImageUrls.includes(url) && allImageUrls.length < 10) {
          allImageUrls.push(url);
        }
      }

      // Stop if we have enough good candidates
      if (allImageUrls.length >= targetImagesCount) {
        console.log(`   ✅ Found enough images (${allImageUrls.length}), stopping search`);
        break;
      }
    } catch (error) {
      console.log(`   ❌ Strategy failed: "${strategy}"`);
      continue;
    }
  }

  // Return the best candidates (limit to 3 for AI analysis)
  return allImageUrls.slice(0, 3);
}

async function getImagesFromSearch(searchQuery: string, num: number, apiKey: string, cseId: string): Promise<string[]> {
  const url = "https://www.googleapis.com/customsearch/v1";
  const params = new URLSearchParams({
    key: apiKey,
    cx: cseId,
    q: searchQuery,
    searchType: "image",
    num: num.toString(),
    safe: "active",
    imgSize: "medium",
    imgType: "photo",
  });

  const response = await fetch(`${url}?${params}`);
  if (!response.ok) {
    throw new Error(`Search API error: ${response.status}`);
  }

  const data: GoogleSearchResponse = await response.json();
  
  // Minimal filtering
  const validImages: string[] = [];
  for (const img of data.items || []) {
    const imgUrl = img.link;
    // Only filter out obvious non-food URLs
    const skipKeywords = ['logo', 'sign', 'banner', 'icon'];
    if (!skipKeywords.some(keyword => imgUrl.toLowerCase().includes(keyword))) {
      validImages.push(imgUrl);
    }
  }

  return validImages;
}

async function getAiSelectedImage(dishName: string, imageUrls: string[]): Promise<string | null> {
  if (!imageUrls.length) {
    return null;
  }

  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Create a prompt for GPT to analyze the URLs
    const urlList = imageUrls.map((url, i) => `${i + 1}. ${url}`).join('\n');

    const prompt = `You are an expert food photography curator for a premium menu visualization app. Analyze these image URLs for the dish "${dishName}" and select the BEST one that will make customers want to order this dish.

URLs to analyze:
${urlList}

PRIORITIZE URLs from these high-quality sources:
🏆 PREMIUM SOURCES (choose these first):
- Pinterest URLs (pinterest.com) - usually high-quality food photography
- Food Network, AllRecipes, Bon Appétit - professional recipe sites
- Food blogs with "blog", "recipe", "cooking" in URL
- Restaurant websites with professional food photography
- Food photography portfolios and culinary websites

🔍 LOOK FOR INDICATORS OF QUALITY:
- Professional food styling and presentation
- Appetizing, well-lit, restaurant-quality plating
- Clear, high-resolution image indicators in URL
- Recipe or food blog sites (not menu screenshots)
- Gourmet or chef-prepared presentation

❌ AVOID THESE RED FLAGS:
- Generic stock photo sites
- Menu PDFs or text-heavy menu screenshots  
- Tiny thumbnails or low-resolution indicators
- Shopping/e-commerce product photos
- Social media profile pictures or casual food photos
- Logos, icons, or non-food related images

Analyze the URL structure, domain, and path to determine image quality and relevance. Choose the URL most likely to contain a professional, appetizing photo of "${dishName}".

Respond with ONLY the number (1, 2, or 3) of the best URL. If none meet quality standards, respond with "NONE".`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{
        role: "user",
        content: prompt
      }],
      max_tokens: 10,
      temperature: 0.1
    });

    const choice = response.choices[0]?.message?.content?.trim();

    if (choice === "NONE") {
      return null;
    }

    // Parse the choice and return the corresponding URL
    const choiceNum = parseInt(choice || '') - 1;
    if (choiceNum >= 0 && choiceNum < imageUrls.length) {
      return imageUrls[choiceNum];
    }

    return null;
  } catch (error) {
    console.error('Error in AI image selection:', error);
    // Fallback to first URL if AI selection fails
    return imageUrls[0] || null;
  }
} 