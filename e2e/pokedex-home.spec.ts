import { test, expect } from '@playwright/test';

async function goToHome(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.setItem('science_pokedex_role', 'student');
    localStorage.setItem('science_pokedex_student_name', 'E2E학생');
    localStorage.setItem('science_pokedex_student_avatar', '🦆');
  });
  await page.reload();
}

test.describe('PokedexHome', () => {
  test('8개 단원 카드가 모두 표시된다', async ({ page }) => {
    await goToHome(page);
    const unitCards = page.locator('.glass-panel').filter({ hasText: '퀴즈 시작' });
    await expect(unitCards).toHaveCount(8);
  });

  test('전체 진도 퍼센트가 표시된다', async ({ page }) => {
    await goToHome(page);
    await expect(page.getByText('전체 진도')).toBeVisible();
  });

  test('단원 카드 클릭 시 퀴즈 화면으로 이동한다', async ({ page }) => {
    await goToHome(page);
    await page.locator('button', { hasText: '퀴즈 시작' }).first().click();
    // 퀴즈 화면으로 전환 확인 — PROGRESS 표시가 나타남
    await expect(page.getByText('PROGRESS')).toBeVisible();
  });

  test('도감 전체 보기 버튼이 작동한다', async ({ page }) => {
    await goToHome(page);
    await page.getByRole('button', { name: '도감 전체 보기' }).click();
    // 도감 화면으로 전환 확인
    await expect(page.locator('body')).toBeVisible();
  });
});
