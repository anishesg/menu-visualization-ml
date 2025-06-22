import os
import base64
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS
from openai import OpenAI
import requests

# ── Load secrets from .env ─────────────────────────────────────────────────────
load_dotenv()

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
GOOGLE_CSE_ID  = os.getenv("GOOGLE_CSE_ID")

# ── Flask setup ───────────────────────────────────────────────────────────────
app = Flask(__name__)
CORS(app)

# ── 1) Extract menu items in one shot via gpt-4o-mini ─────────────────────────
def extract_menu_items(image_bytes):
    # Convert image bytes to base64
    base64_image = base64.b64encode(image_bytes).decode('utf-8')
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": "Extract each individual food and drink item from this menu image. List ONLY the specific dish names with their prices, one per line. Skip category headers like 'Appetizers', 'Entrees', etc. Format: 'Dish Name - $Price'. Focus on actual food items that customers can order."
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{base64_image}"
                            }
                        }
                    ]
                }
            ],
            max_tokens=1500
        )
        
        text = response.choices[0].message.content
        items = [line.strip() for line in text.splitlines() if line.strip()]
        return items
    except Exception as e:
        print(f"Error extracting menu items: {e}")
        return ["Unable to extract menu items"]

# ── 2) AI-powered image selection with multiple attempts ────────────────────
def fetch_image_for_item(item, num=3):
    if not GOOGLE_API_KEY or not GOOGLE_CSE_ID:
        return []
    
    # Clean up the item name to get just the dish name
    clean_item = item.split(' - $')[0].split(' $')[0].strip()
    clean_item = clean_item.replace('*', '').replace('-', '').strip()
    clean_item = clean_item.lstrip('0123456789.- ').strip()
    
    # Skip category headers and empty items
    if len(clean_item) < 3 or clean_item.lower() in ['soups', 'starters', 'salads', 'entrees', 'pastas', 'appetizers', 'mains', 'desserts']:
        return []
    
    # Different search strategies to try
    search_strategies = [
        f'{clean_item} pinterest',
        f'{clean_item} food blog',
        f'{clean_item} plated',
        f'{clean_item} restaurant'
    ]
    
    for strategy in search_strategies:
        try:
            # Get multiple images for this search
            image_urls = get_images_from_search(strategy, num)
            if len(image_urls) < 2:  # Need at least 2 options
                continue
                
            # Let GPT analyze and pick the best URL
            best_url = get_ai_selected_image(clean_item, image_urls)
            if best_url:
                print(f"✨ AI selected best image for '{clean_item}' from strategy '{strategy}'")
                return [best_url]
                
        except Exception as e:
            print(f"Error with strategy '{strategy}' for {item}: {e}")
            continue
    
    # If all strategies fail, return the first valid URL from the last attempt
    try:
        fallback_urls = get_images_from_search(f'{clean_item} food', 1)
        return fallback_urls[:1] if fallback_urls else []
    except:
        return []

def get_images_from_search(search_query, num):
    """Get image URLs from Google Custom Search"""
    url = "https://www.googleapis.com/customsearch/v1"
    params = {
        "key":        GOOGLE_API_KEY,
        "cx":         GOOGLE_CSE_ID,
        "q":          search_query,
        "searchType": "image",
        "num":        num,
        "safe":       "active",
        "imgSize":    "medium",
        "imgType":    "photo",
    }
    
    r = requests.get(url, params=params)
    r.raise_for_status()
    data = r.json()
    
    # Minimal filtering
    valid_images = []
    for img in data.get("items", []):
        img_url = img["link"]
        # Only filter out obvious non-food URLs
        skip_keywords = ['logo', 'sign', 'banner', 'icon']
        if not any(keyword in img_url.lower() for keyword in skip_keywords):
            valid_images.append(img_url)
    
    return valid_images

def get_ai_selected_image(dish_name, image_urls):
    """Use GPT to analyze URL text and pick the best image"""
    if not image_urls:
        return None
        
    try:
        # Create a prompt for GPT to analyze the URLs
        url_list = "\n".join([f"{i+1}. {url}" for i, url in enumerate(image_urls)])
        
        prompt = f"""Analyze these image URLs for the dish "{dish_name}" and pick the BEST one for a menu visualization app.

URLs to analyze:
{url_list}

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

Respond with ONLY the number (1, 2, or 3) of the best URL. If none are suitable, respond with "NONE"."""

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{
                "role": "user",
                "content": prompt
            }],
            max_tokens=10,
            temperature=0.1
        )
        
        choice = response.choices[0].message.content.strip()
        
        if choice == "NONE":
            return None
            
        # Parse the choice and return the corresponding URL
        try:
            choice_num = int(choice) - 1
            if 0 <= choice_num < len(image_urls):
                return image_urls[choice_num]
        except ValueError:
            pass
            
        return None
        
    except Exception as e:
        print(f"Error in AI image selection: {e}")
        # Fallback to first URL if AI selection fails
        return image_urls[0] if image_urls else None

# ── 3) Upload endpoint ──────────────────────────────────────────────────────
@app.route("/api/upload", methods=["POST"])
def upload_menu():
    try:
        file = request.files.get("menuImage")
        if not file:
            return jsonify({"error": "No file uploaded"}), 400

        # Read the file content
        image_bytes = file.read()
        
        # Extract menu items
        items = extract_menu_items(image_bytes)
        
        # Get AI-selected images for each item
        results = []
        for item in items:
            images = fetch_image_for_item(item)
            results.append({
                "item":  item,
                "image": images[0] if images else None
            })

        return jsonify({"menu": results})
    
    except Exception as e:
        print(f"Error processing upload: {e}")
        return jsonify({"error": "Failed to process menu"}), 500

@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({"status": "healthy"})

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5001)