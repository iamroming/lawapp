"""Fetch eCourts districts data for all states."""
import asyncio
import httpx
import re
import json

STATES = {
    "28": "Andaman and Nicobar", "2": "Andhra Pradesh", "36": "Arunachal Pradesh",
    "6": "Assam", "8": "Bihar", "32": "Chandigarh", "18": "Chhattisgarh",
    "7": "Delhi", "37": "Goa", "17": "Gujarat", "10": "Haryana",
    "5": "Himachal Pradesh", "12": "Jammu and Kashmir", "33": "Jharkhand",
    "3": "Karnataka", "4": "Kerala", "38": "Ladakh", "35": "Lakshadweep",
    "23": "Madhya Pradesh", "27": "Maharashtra", "25": "Manipur",
    "21": "Meghalaya", "34": "Mizoram", "39": "Nagaland", "11": "Odisha",
    "31": "Puducherry", "22": "Punjab", "9": "Rajasthan", "24": "Sikkim",
    "30": "Tamil Nadu", "29": "Telangana", "40": "Dadra and Nagar Haveli and Daman and Diu",
    "20": "Tripura", "13": "Uttar Pradesh", "15": "Uttarakhand", "16": "West Bengal",
}

async def fetch_all():
    async with httpx.AsyncClient(verify=False, follow_redirects=True, timeout=30) as client:
        # Load home page
        resp = await client.get(
            'https://services.ecourts.gov.in/ecourtindia_v6/',
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'}
        )
        
        # Get delimeter
        import sys
        sys.path.insert(0, '.')
        from bharat_courts.districtcourts import endpoints
        js_url = endpoints.components_js_url(resp.text)
        js_resp = await client.get(js_url, headers={'Referer': 'https://services.ecourts.gov.in/ecourtindia_v6/'})
        delimeter = endpoints.parse_delimeter(js_resp.text)
        print(f'Delimeter: {delimeter[:20]}', flush=True)
        
        headers = {
            'Referer': 'https://services.ecourts.gov.in/ecourtindia_v6/',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
            'X-Requested-With': 'XMLHttpRequest',
            'Accept': '*/*',
            'abc': 'xyz',
        }
        if delimeter:
            headers['delimeter'] = delimeter
        
        # Try to get captcha first
        captcha_resp = await client.post(
            endpoints.ajax_url('casestatus/getCaptcha'),
            data={'ajax_req': 'true', 'app_token': ''},
            headers=headers
        )
        cdata = captcha_resp.json()
        app_token = cdata.get('app_token', '')
        print(f'Captcha token: {app_token[:30] if app_token else "EMPTY"}', flush=True)
        
        # Try a few states
        for state_code in ['29', '7', '27', '3', '13']:
            state_name = STATES.get(state_code, state_code)
            try:
                form_data = endpoints.fill_district_form(state_code=state_code)
                form_data['ajax_req'] = 'true'
                form_data['app_token'] = app_token
                
                dist_resp = await client.post(
                    endpoints.ajax_url('casestatus/fillDistrict'),
                    data=form_data,
                    headers=headers
                )
                ddata = dist_resp.json()
                dist_html = ddata.get('dist_list', '')
                if dist_html:
                    # Parse option tags
                    options = re.findall(r'<option[^>]*value="([^"]*)"[^>]*>([^<]*)</option>', dist_html)
                    print(f'{state_name}: {len(options)} districts')
                    for code, name in options[:3]:
                        print(f'  {code}: {name}')
                    print(f'  ...')
                else:
                    print(f'{state_name}: NO DISTRICTS - err={ddata.get("errormsg", "")[:50]}')
                # Update token
                new_token = ddata.get('app_token', '')
                if new_token:
                    app_token = new_token
            except Exception as e:
                print(f'{state_name}: ERROR {e}')
            await asyncio.sleep(1)

asyncio.run(fetch_all())
