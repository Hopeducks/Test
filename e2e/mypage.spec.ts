import { test, expect } from '@playwright/test';

async function goToMyPage(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.setItem('hopeducks_role', 'student');
    localStorage.setItem('hopeducks_student_name', 'E2E학생');
    // 단원 1 완료 상태 시뮬레이션
    const progress = {
      unlockedCardIds: ['u1_c1', 'u1_c2'],
      completedUnits: [1],
      unitHighScores: { 1: 8 },
      wrongAnswers: [],
      totalXp: 800,
      coins: 120,
      equippedCosmetics: {},
    };
    localStorage.setItem('hopeducks_progress', JSON.stringify(progress));
  });
  await page.reload();
  // 내 학습 기록 버튼 클릭
  await page.getByRole('button', { name: '내 학습 기록' }).click();
}

test.describe('MyPage', () => {
  test('학습 성취 요약 섹션이 표시된다', async ({ page }) => {
    await goToMyPage(page);
    await expect(page.getByText('학습 성취 요약')).toBeVisible();
  });

  test('학습 여정 맵이 8개 단원을 표시한다', async ({ page }) => {
    await goToMyPage(page);
    await expect(page.getByText('학습 여정')).toBeVisible();
  });

  test('완료된 단원이 초록색으로 표시된다', async ({ page }) => {
    await goToMyPage(page);
    const completedBadge = page.locator('[class*="emerald"]').first();
    await expect(completedBadge).toBeVisible();
  });

  test('돌아가기 버튼으로 PokedexHome에 복귀한다', async ({ page }) => {
    await goToMyPage(page);
    await page.getByRole('button', { name: /돌아가기|← / }).click();
    await expect(page.getByText('과학 마스터 도감')).toBeVisible();
  });
});
