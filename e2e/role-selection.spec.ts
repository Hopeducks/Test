import { test, expect } from '@playwright/test';

test.describe('역할 선택 화면', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // localStorage 초기화로 항상 RoleSelector에서 시작
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('학생/교사 선택 버튼이 표시된다', async ({ page }) => {
    await expect(page.getByRole('button', { name: /학생 모드/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /교사/ })).toBeVisible();
  });

  test('학생을 선택하면 이름 입력 단계로 이동한다', async ({ page }) => {
    await page.getByRole('button', { name: /학생 모드/ }).click();
    await expect(page.getByPlaceholder('예: 홍길동')).toBeVisible();
  });

  test('이름을 입력하면 세션코드 입력 단계로 이동한다', async ({ page }) => {
    await page.getByRole('button', { name: /학생 모드/ }).click();
    await page.getByPlaceholder('예: 홍길동').fill('테스트학생');
    await page.getByRole('button', { name: '입장하기' }).first().click();
    await expect(page.getByPlaceholder('예: A1B2C3')).toBeVisible();
  });
});
