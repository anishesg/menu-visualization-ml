import os
import base64
import json
from openai import OpenAI
import requests
from http.server import BaseHTTPRequestHandler

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            # Set CORS headers
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            self.end_headers()
            
            # Get content length and read request body
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            # Parse multipart form data (simplified for this use case)
            # In production, you might want to use a proper multipart parser
            boundary = self.headers['Content-Type'].split('boundary=')[1]
            parts = post_data.split(f'--{boundary}'.encode())
            
            # Find the image data part
            image_data = None
            for part in parts:
                if b'Content-Disposition: form-data; name="menuImage"' in part:
                    # Extract image data after the headers
                    header_end = part.find(b'\r\n\r\n')
                    if header_end != -1:
                        image_data = part[header_end + 4:].rstrip(b'\r\n')
                        break
            
            if not image_data:
                self.wfile.write(json.dumps({"error": "No image data found"}).encode())
                return
            
            # Process the menu
            menu_items = extract_menu_items(image_data)
            
            # Get AI-selected images for each item
            results = []
            for item in menu_items:
                images = fetch_image_for_item(item)
                results.append({
                    "item": item,
                    "image": images[0] if images else None
                })
            
            response_data = {"menu": results}
            self.wfile.write(json.dumps(response_data).encode())
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())
    
    def do_OPTIONS(self):
        # Handle preflight requests
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

def extract_menu_items(image_bytes):
    """Extract menu items using OpenAI GPT-4o-mini"""
    client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
    
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

def fetch_image_for_item(item, num=3):
    """Fetch and select the best image for a menu item"""
    GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY")
    GOOGLE_CSE_ID = os.environ.get("GOOGLE_CSE_ID")
    
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
        f'{clean_item} restaurant dish',
        f'{clean_item} food blog'
    ]
    
    for strategy in search_strategies:
        try:
            # Get multiple images for this search
            image_urls = get_images_from_search(strategy, num, GOOGLE_API_KEY, GOOGLE_CSE_ID)
            if len(image_urls) < 2:  # Need at least 2 options
                continue
                
            # Let GPT analyze and pick the best URL
            best_url = get_ai_selected_image(clean_item, image_urls)
            if best_url:
                return [best_url]
                
        except Exception as e:
            print(f"Error with strategy '{strategy}' for {item}: {e}")
            continue
    
    # If all strategies fail, return the first valid URL from the last attempt
    try:
        fallback_urls = get_images_from_search(f'{clean_item} food', 1, GOOGLE_API_KEY, GOOGLE_CSE_ID)
        return fallback_urls[:1] if fallback_urls else []
    except:
        return []

def get_images_from_search(search_query, num, api_key, cse_id):
    """Get image URLs from Google Custom Search"""
    url = "https://www.googleapis.com/customsearch/v1"
    params = {
        "key": api_key,
        "cx": cse_id,
        "q": search_query,
        "searchType": "image",
        "num": num,
        "safe": "active",
        "imgSize": "medium",
        "imgType": "photo",
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
        client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
        
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