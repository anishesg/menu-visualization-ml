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

async function fetchImageForItem(item: string, num: number = 3): Promise<string[]> {
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

  // Different search strategies to try
  const searchStrategies = [
    `${cleanItem} pinterest`,
    `${cleanItem} restaurant dish`,
    `${cleanItem} food blog`
  ];

  for (const strategy of searchStrategies) {
    try {
      // Get multiple images for this search
      const imageUrls = await getImagesFromSearch(strategy, num, GOOGLE_API_KEY!, GOOGLE_CSE_ID!);
      if (imageUrls.length < 2) { // Need at least 2 options
        continue;
      }

      // Let GPT analyze and pick the best URL
      const bestUrl = await getAiSelectedImage(cleanItem, imageUrls);
      if (bestUrl) {
        return [bestUrl];
      }
    } catch (error) {
      console.error(`Error with strategy '${strategy}' for ${item}:`, error);
      continue;
    }
  }

  // If all strategies fail, return the first valid URL from the last attempt
  try {
    const fallbackUrls = await getImagesFromSearch(`${cleanItem} food`, 1, GOOGLE_API_KEY!, GOOGLE_CSE_ID!);
    return fallbackUrls.slice(0, 1);
  } catch {
    return [];
  }
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

    const prompt = `Analyze these image URLs for the dish "${dishName}" and pick the BEST one for a menu visualization app.

URLs to analyze:
${urlList}

Look for URLs that indicate:
- High-quality food photography (recipe sites, food blogs, cooking websites)
- Professional presentation (restaurant sites, food magazines)
- Appetizing, well-plated dishes
- Clear, high-resolution images

AVOID URLs that suggest:
- Stock photos or generic images
- Menu screenshots or text-heavy images
- Low-quality or thumbnail images
- Irrelevant content

Respond with ONLY the number (1, 2, or 3) of the best URL. If none are suitable, respond with "NONE".`;

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