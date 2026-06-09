import { test, expect, Page } from '@playwright/test';

async function setupStudent(page: Page) {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.setItem('science_pokedex_role', 'student');
    localStorage.setItem('science_pokedex_student_name', 'E2E학생');
    localStorage.setItem('science_pokedex_student_avatar', '🦆');
    // Pre-unlock unit 1 legendary card to suppress the fullscreen CardUnlockAnim overlay
    const existing = JSON.parse(localStorage.getItem('science_pokedex_progress') || '{}');
    const progress = { ...existing, unlockedCardIds: [...(existing.unlockedCardIds || []), 'u1_c10'] };
    localStorage.setItem('science_pokedex_progress', JSON.stringify(progress));
  });
}

test.describe('단원 완료 화면', () => {
  test('?e2e=unitcomplete 진입 시 완료 헤딩이 표시된다', async ({ page }) => {
    await setupStudent(page);
    await page.goto('/?e2e=unitcomplete');
    await expect(page.getByText(/완료!/)).toBeVisible({ timeout: 5000 });
  });

  test('SCORE 섹션과 점수가 표시된다', async ({ page }) => {
    await setupStudent(page);
    await page.goto('/?e2e=unitcomplete');
    await expect(page.getByText('SCORE')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('UNIT CLEARANCE REPORT')).toBeVisible({ timeout: 5000 });
  });

  test('"다시 도전하기" 버튼이 클릭 가능하다 (regression: pointer-events 버그)', async ({ page }) => {
    await setupStudent(page);
    await page.goto('/?e2e=unitcomplete');
    const btn = page.getByRole('button', { name: '다시 도전하기' });
    await expect(btn).toBeVisible({ timeout: 5000 });
    await btn.click();
    await expect(page.locator('body')).toBeVisible();
  });

  test('"학습 결과 복사하여 공유하기" 버튼이 표시된다', async ({ page }) => {
    await setupStudent(page);
    await page.goto('/?e2e=unitcomplete');
    await expect(page.getByRole('button', { name: /공유/ })).toBeVisible({ timeout: 5000 });
  });

  test('교사용 제출 코드 섹션이 표시된다', async ({ page }) => {
    await setupStudent(page);
    await page.goto('/?e2e=unitcomplete');
    await expect(page.getByText(/TEACHER IMPORT CODE/)).toBeVisible({ timeout: 5000 });
  });
});
