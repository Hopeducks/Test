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
});

test.describe('보스 레이드', () => {
  test('?e2e=raid 진입 시 보스 레이드 화면이 표시된다', async ({ page }) => {
    await setupStudent(page);
    await page.goto('/?e2e=raid');
    await expect(page.getByText('BOSS HP:')).toBeVisible({ timeout: 10000 });
  });
});
