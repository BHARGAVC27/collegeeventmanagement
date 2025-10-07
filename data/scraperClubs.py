import requests
from bs4 import BeautifulSoup
import json
import time
import re
from urllib.parse import urljoin

def clean_text(text):
    """Clean and normalize text content"""
    if not text:
        return None
    return re.sub(r'\s+', ' ', text.strip())

def scrape_club_details(club_url):
    """Scrape detailed information from individual club page"""
    try:
        print(f"Fetching details for: {club_url}")
        response = requests.get(club_url, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.content, "html.parser")
        
        details = {}
        
        # Try to extract club title
        title_selectors = [
            "h1.entry-title",
            "h1",
            ".geodir-entry-title",
            ".listing-title h1",
            "title"
        ]
        
        for selector in title_selectors:
            title_elem = soup.select_one(selector)
            if title_elem:
                details['title'] = clean_text(title_elem.get_text())
                break
        
        # Extract description/about section
        desc_selectors = [
            ".geodir-entry-content",
            ".listing-content",
            ".entry-content",
            ".club-description",
            "div[class*='content']",
            "div[class*='description']"
        ]
        
        for selector in desc_selectors:
            desc_elem = soup.select_one(selector)
            if desc_elem:
                # Get text and clean it
                desc_text = desc_elem.get_text(separator=' ', strip=True)
                if len(desc_text) > 50:  # Only if it's substantial content
                    details['description'] = clean_text(desc_text)
                    break
        
        # Extract contact information
        contact_info = {}
        
        # Look for email
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        emails = re.findall(email_pattern, response.text)
        if emails:
            contact_info['emails'] = list(set(emails))
        
        # Look for phone numbers
        phone_pattern = r'(\+91[\s-]?)?[789]\d{9}|(\+91[\s-]?)?[0-9]{10}'
        phones = re.findall(phone_pattern, response.text)
        if phones:
            contact_info['phones'] = list(set([p[0] + p[1] if p[0] else p[1] for p in phones]))
        
        if contact_info:
            details['contact'] = contact_info
        
        # Extract social media links
        social_links = {}
        social_patterns = {
            'instagram': r'https?://(?:www\.)?instagram\.com/[\w\./]+',
            'facebook': r'https?://(?:www\.)?facebook\.com/[\w\./]+',
            'twitter': r'https?://(?:www\.)?twitter\.com/[\w\./]+',
            'linkedin': r'https?://(?:www\.)?linkedin\.com/[\w\./]+',
            'youtube': r'https?://(?:www\.)?youtube\.com/[\w\./]+',
            'github': r'https?://(?:www\.)?github\.com/[\w\./]+'
        }
        
        for platform, pattern in social_patterns.items():
            matches = re.findall(pattern, response.text, re.IGNORECASE)
            if matches:
                social_links[platform] = list(set(matches))
        
        if social_links:
            details['social_media'] = social_links
        
        # Extract images
        images = []
        img_tags = soup.find_all('img')
        for img in img_tags:
            src = img.get('src')
            if src and not src.startswith('data:') and '/static/images/def-cover.jpg' not in src:
                full_url = urljoin(club_url, src)
                images.append(full_url)
        
        if images:
            details['images'] = list(set(images))
        
        # Extract any additional metadata
        meta_tags = soup.find_all('meta')
        metadata = {}
        for meta in meta_tags:
            name = meta.get('name') or meta.get('property')
            content = meta.get('content')
            if name and content and name in ['description', 'keywords', 'og:description']:
                metadata[name] = content
        
        if metadata:
            details['metadata'] = metadata
        
        return details
        
    except Exception as e:
        print(f"Error scraping {club_url}: {str(e)}")
        return {'error': str(e)}

def main():
    print("Starting to scrape PESU clubs...")
    
    # Scrape the main clubs listing page
    url = "https://clubs.pes.edu/campus/pesu-ec-campus/"
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
    except Exception as e:
        print(f"Error fetching main page: {e}")
        return
    
    soup = BeautifulSoup(response.content, "html.parser")
    clubs = []
    
    print("Found clubs on main page, extracting basic info...")
    
    for club in soup.find_all("div", class_="listing-item"):
        # Extract basic information
        link_tag = club.find("a", class_="geodir-category-img_item")
        link = "https://clubs.pes.edu" + link_tag["href"] if link_tag else None
        
        img_tag = club.find("img")
        img = img_tag["src"] if img_tag else None
        if img and not img.startswith('http'):
            img = urljoin("https://clubs.pes.edu", img)
        
        name_div = club.find("div", class_="geodir-category-content")
        name = clean_text(name_div.get_text()) if name_div else None
        
        club_data = {
            "basic_info": {
                "name": name,
                "link": link,
                "image": img
            }
        }
        
        # Scrape detailed information from club page
        if link:
            time.sleep(1)  # Be respectful to the server
            detailed_info = scrape_club_details(link)
            club_data["detailed_info"] = detailed_info
        
        clubs.append(club_data)
    
    # Save to JSON file
    output_file = "clubs_data.json"
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(clubs, f, indent=2, ensure_ascii=False)
        print(f"\nSuccessfully saved {len(clubs)} clubs to {output_file}")
    except Exception as e:
        print(f"Error saving to JSON: {e}")
    
    # Print summary
    print(f"\nScraping completed!")
    print(f"Total clubs processed: {len(clubs)}")
    
    # Print sample of first club for verification
    if clubs:
        print(f"\nSample data for first club:")
        print(json.dumps(clubs[0], indent=2, ensure_ascii=False)[:1000] + "...")

if __name__ == "__main__":
    main()
