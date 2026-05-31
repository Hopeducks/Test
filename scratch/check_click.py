from playwright.sync_api import sync_playwright
import time

url = 'http://localhost:3000'
console_logs = []

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    # Use mobile or desktop context
    context = browser.new_context(viewport={'width': 1280, 'height': 800})
    page = context.new_page()

    def handle_console_message(msg):
        console_logs.append(f"[{msg.type}] {msg.text}")
        print(f"Console: [{msg.type}] {msg.text}")

    page.on("console", handle_console_message)

    try:
        print("Navigating to local dev server...")
        page.goto(url)
        page.wait_for_load_state('networkidle')
        print("Page loaded successfully.")
        
        # Take initial screenshot
        page.screenshot(path='scratch/step1_initial.png')
        
        # Check if we are on role selector screen
        if page.locator('text=학생용').count() > 0:
            print("Role selector screen found. Entering profile...")
            # Click Student Button to join lobby
            page.locator('text=학생용').click()
            page.wait_for_timeout(1000)
            
            # Type name in modal if visible
            if page.locator('input[placeholder*="닉네임"]').count() > 0:
                page.locator('input[placeholder*="닉네임"]').fill("테스터")
                page.locator('text=입장하기').click()
                page.wait_for_timeout(2000)
                
        page.screenshot(path='scratch/step2_lobby.png')
        
        # We can mock the activeScreen by setting window state or completing a unit.
        # But wait! We can directly evaluate JavaScript to change the React state if we expose it,
        # or we can inspect the DOM structure.
        # Let's check what elements are rendered on the screen.
        print("Page content length:", len(page.content()))
        
    except Exception as e:
        print("Error during test:", e)
        
    browser.close()
