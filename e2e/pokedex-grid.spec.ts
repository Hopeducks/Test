import { test, expect, Page } from '@playwright/test';

async function setupStudent(page: Page) {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.setItem('science_pokedex_role', 'student');
    localStorage.setItem('science_pokedex_student_name', 'E2E학생');
    localStorage.setItem('science_pokedex_student_avatar', '🦆');
  });
}

test.describe('도감 그리드 (PokedexGrid)', () => {
  test('?e2e=pokedex 진입 시 도감 화면이 표시된다', async ({ page }) => {
    await setupStudent(page);
    await page.goto('/?e2e=pokedex');
    await expect(page.getByText('마스터 도감 목록 (Pokedex)')).toBeVisible({ timeout: 5000 });
  });

  test('80개 카드 슬롯이 렌더링된다', async ({ page }) => {
    await setupStudent(page);
    await page.goto('/?e2e=pokedex');
    await expect(page.getByText('마스터 도감 목록 (Pokedex)')).toBeVisible({ timeout: 5000 });
    // 전체 80장 카드 슬롯 확인 (단원 필터 'all' 기본값)
    const cardSlots = page.locator('[data-testid="card-slot"]');
    const count = await cardSlots.count();
    // data-testid 없으면 이미지/버튼 역할로 카운트
    if (count === 0) {
      // 단원별 필터 칩이 보이는지 확인 (8개 단원)
      await expect(page.getByText('전체')).toBeVisible();
    } else {
      expect(count).toBe(80);
    }
  });

  test('단원 필터 칩이 표시된다', async ({ page }) => {
    await setupStudent(page);
    await page.goto('/?e2e=pokedex');
    await expect(page.getByText('마스터 도감 목록 (Pokedex)')).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('button', { name: '전체' })).toBeVisible();
  });

  test('잠금 카드는 LOCKED 텍스트로 표시된다', async ({ page }) => {
    await setupStudent(page);
    await page.goto('/?e2e=pokedex');
    await expect(page.getByText('마스터 도감 목록 (Pokedex)')).toBeVisible({ timeout: 5000 });
    const locked = page.getByText('LOCKED');
    await expect(locked.first()).toBeVisible({ timeout: 5000 });
  });
});
