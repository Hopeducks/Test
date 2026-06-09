import { test, expect, Page } from '@playwright/test';

async function setupStudent(page: Page) {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.setItem('science_pokedex_role', 'student');
    localStorage.setItem('science_pokedex_student_name', 'E2E학생');
    localStorage.setItem('science_pokedex_student_avatar', '🦆');
  });
}

test.describe('배틀 스타디움', () => {
  test('?e2e=battle 진입 시 매치메이킹 화면이 표시된다', async ({ page }) => {
    await setupStudent(page);
    await page.goto('/?e2e=battle');
    await expect(page.getByText('배틀 상대 찾는 중...')).toBeVisible();
  });

  test('?e2e=battle 전체 배틀 완주 — 매치메이킹→덱선택→전투→결과', async ({ page }) => {
    // ?e2e=battle activates accelerated timers in the component
    await setupStudent(page);
    // E2E auto-deck mode: component auto-selects + confirms deck when ?e2e=battle is active
    await page.goto('/?e2e=battle');

    // 1. Matchmaking screen appears immediately
    await expect(page.getByText('배틀 상대 찾는 중...')).toBeVisible();

    // 2. Wait for deck select screen (AI match ~100ms + countdown ~600ms)
    await expect(page.getByText('출전 카드 덱 편성')).toBeVisible({ timeout: 5000 });

    // 3. Component auto-selects 3 cards and auto-confirms in E2E mode (within 200ms)
    //    Wait for battle combat screen
    await expect(page.getByText('전투 카드를 제시하세요!')).toBeVisible({ timeout: 5000 });

    // 4. Battle runs with accelerated timers (each round ~0.7s x 3 = ~2s)
    //    Wait for result screen with any outcome
    const resultHeading = page.getByText(/VICTORY!|DEFEAT\.|DRAW\./);
    await expect(resultHeading).toBeVisible({ timeout: 20000 });

    // 5. XP reward is shown (not coins)
    await expect(page.getByText(/획득 카드 경험치/)).toBeVisible();
  });

  test('베스트오브3 모드 선택 버튼이 덱선택 화면에 표시된다', async ({ page }) => {
    await setupStudent(page);
    await page.goto('/?e2e=battle');
    await expect(page.getByTestId('mode-bestof3')).toBeVisible({ timeout: 5000 });
    // Verify mode buttons render
    await expect(page.getByTestId('mode-standard')).toBeVisible();
  });
});

test.describe('보스 레이드', () => {
  test('?e2e=raid 진입 시 보스 레이드 화면이 표시된다', async ({ page }) => {
    await setupStudent(page);
    await page.goto('/?e2e=raid');
    await expect(page.getByText('BOSS HP:')).toBeVisible({ timeout: 10000 });
  });
});
