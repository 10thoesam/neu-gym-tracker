from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from datetime import datetime, timezone, timedelta

EST = timezone(timedelta(hours=-5))

def get_gym_count():

    options = Options()
    options.add_argument('--headless')
    driver = webdriver.Chrome(options=options)

    try:
        driver.get("https://www.connect2mycloud.com/Widgets/Data/locationCount?type=circle&key=2a2be0d8-df10-4a48-bedd-b3bc0cd628e7&loc_status=false")

        wait = WebDriverWait(driver, 20)
        elements = wait.until(
            EC.presence_of_all_elements_located((By.CSS_SELECTOR, '.circleChart'))
        )
        results = []
        for element in elements:
            parent = element.find_element(By.XPATH, '..')
            lines = parent.text.strip().split('\n')
            name = lines[1]
            count = int(lines[3].split(': ')[1])
            if '3rd Floor Weight Room' in name or '1st Floor Weight Room' in name:
                results.append({'name': name, 'count': count, 'timestamp': datetime.now(EST)})

        return results
    
    except Exception as e:
        print(f"Scraper error: {e}")
        return []

    finally:
        driver.quit()

if __name__ == "__main__":
    data = get_gym_count()
    print(data)
    