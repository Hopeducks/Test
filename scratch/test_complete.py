import os
import sys
import time
from playwright.sync_api import sync_playwright

def run():
    print("Starting Playwright script...")
    console_logs = []
    errors = []

    with sync_playwright() as p:
        # Launch browser headlessly
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={'width': 1280, 'height': 800})

        # Capture console messages
        def handle_console(msg):
            log_str = f"[{msg.type}] {msg.text}"
            console_logs.append(log_str)
            print(f"Browser Console: {log_str}")
            if msg.type == "error":
                errors.append(msg.text)

        page.on("console", handle_console)
        page.on("pageerror", lambda err: errors.append(err.message))

        # Navigate to application
        print("Navigating to http://localhost:3000...")
        page.goto("http://localhost:3000")
        page.wait_for_load_state("networkidle")

        # Take screenshot of home page
        page.screenshot(path="scratch/home_page.png")
        print("Captured home page screenshot.")

        # Let's mock player session and role to student, and enter unit completion directly if possible,
        # or simulate clicking through the role selection and lobby.
        
        # Click Student Role
        print("Clicking Student role button...")
        student_btn = page.locator("text=학생 (Student)")
        if student_btn.count() > 0:
            student_btn.click()
            page.wait_for_timeout(1000)
        else:
            # Maybe already logged in
            print("Student role button not found, checking input...")
            
        # If nickname input exists
        nickname_input = page.locator("placeholder=닉네임 입력")
        if nickname_input.count() > 0:
            nickname_input.fill("테스터")
            page.click("text=입장하기")
            page.wait_for_timeout(1000)
            
        page.screenshot(path="scratch/lobby_page.png")
        print("Captured lobby page screenshot.")

        # Let's bypass the quiz by calling React state modifiers or localStorage mock
        # Wait, let's just trigger complete screen by setting state via window or local storage,
        # or let's start quiz for Unit 1 and solve it!
        # Answering 10 questions:
        # We can click "퀴즈 모의 시뮬레이션 개시" or similar.
        start_quiz_btn = page.locator("text=퀴즈 모의 시뮬레이션 개시")
        if start_quiz_btn.count() > 0:
            start_quiz_btn.click()
            page.wait_for_timeout(1000)
            print("Started mock quiz simulation.")

            # Loop to answer 10 questions
            for i in range(10):
                print(f"Answering question {i+1}...")
                page.wait_for_selector("text=QUESTION", timeout=5000)
                page.screenshot(path=f"scratch/quiz_q{i+1}.png")
                
                # Click the first option (A)
                options = page.locator("button.btn-cyber").all()
                # Find options that are A/B/C/D choices
                choice_options = []
                for opt in options:
                    txt = opt.text_content()
                    if txt and any(txt.strip().startswith(prefix) for prefix in ['A', 'B', 'C', 'D']):
                        choice_options.append(opt)
                
                if choice_options:
                    choice_options[0].click()
                    print(f"Clicked Option A for question {i+1}")
                else:
                    print("Options not found, clicking first button...")
                    options[0].click()
                
                # Wait for next question or continue
                page.wait_for_timeout(3500) # Wait for explanation and auto-advance
                
            print("Quiz completed, waiting for completion screen...")
            page.wait_for_timeout(2000)
            page.screenshot(path="scratch/complete_screen.png")
            print("Captured completion screen.")
            
            # Now let's try to click buttons on UnitComplete screen
            retry_btn = page.locator("text=다시 도전하기")
            home_btn = page.locator("text=단원 목록으로")
            lobby_btn = page.locator("text=로비로 이동")
            
            print(f"Retry button count: {retry_btn.count()}")
            print(f"Home button count: {home_btn.count()}")
            print(f"Lobby button count: {lobby_btn.count()}")
            
            if retry_btn.count() > 0:
                print("Clicking '다시 도전하기'...")
                retry_btn.click()
                page.wait_for_timeout(2000)
                page.screenshot(path="scratch/after_retry.png")
                print("Captured screen after retry click.")
                
        browser.close()

    print(f"Errors found: {errors}")
    print("Done.")

if __name__ == "__main__":
    run()
