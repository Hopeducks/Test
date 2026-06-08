import { test, expect, Page } from '@playwright/test';

async function bypassPasswordGate(page: Page) {
  await page.evaluate(() => {
    sessionStorage.setItem('teacher_verified', 'true');
  });
}

test.describe('교사 비밀번호 게이트', () => {
  test('교사 create 페이지 접속 시 PIN 입력 화면이 표시된다', async ({ page }) => {
    await page.goto('/teacher/create');
    await expect(page.getByText('교사 / 관리자 잠금')).toBeVisible();
    await expect(page.getByRole('button', { name: '인증 확인 (CONFIRM)' })).toBeVisible();
  });

  test('잘못된 PIN 입력 시 오류 메시지가 표시된다', async ({ page }) => {
    await page.goto('/teacher/create');
    // 숫자 패드로 4자리 잘못된 PIN 입력
    await page.getByRole('button', { name: '1' }).click();
    await page.getByRole('button', { name: '2' }).click();
    await page.getByRole('button', { name: '3' }).click();
    await page.getByRole('button', { name: '4' }).click();
    await page.getByRole('button', { name: '인증 확인 (CONFIRM)' }).click();
    await expect(page.getByText('비밀번호가 올바르지 않습니다.')).toBeVisible();
  });

  test('올바른 PIN(2026) 입력 시 교사 세션 생성 폼이 표시된다', async ({ page }) => {
    await page.goto('/teacher/create');
    await page.getByRole('button', { name: '2' }).click();
    await page.getByRole('button', { name: '0' }).click();
    await page.getByRole('button', { name: '2' }).click();
    await page.getByRole('button', { name: '6' }).click();
    await page.getByRole('button', { name: '인증 확인 (CONFIRM)' }).click();
    await expect(page.getByText('신규 메타버스 교실 개설')).toBeVisible();
  });
});

test.describe('교사 세션 생성 페이지', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/teacher/create');
    await bypassPasswordGate(page);
    await page.reload();
  });

  test('세션 개설 폼의 주요 요소가 표시된다', async ({ page }) => {
    await expect(page.getByText('신규 메타버스 교실 개설')).toBeVisible();
    await expect(page.getByRole('button', { name: '코드 발급' })).toBeVisible();
    await expect(page.getByText('메타버스 세션 시작하기 (Start)')).toBeVisible();
  });

  test('코드 발급 버튼 클릭 시 세션 코드가 생성된다', async ({ page }) => {
    await page.getByRole('button', { name: '코드 발급' }).click();
    const codeInput = page.locator('input[readonly]');
    await expect(codeInput).not.toHaveValue('');
    const code = await codeInput.inputValue();
    expect(code).toHaveLength(6);
  });

  test('세션 코드 없이 시작 버튼이 비활성화 상태다', async ({ page }) => {
    const startBtn = page.getByRole('button', { name: /메타버스 세션 시작하기/ });
    await expect(startBtn).toBeDisabled();
  });
});

test.describe('교사 세션 페이지 - 인증 실패', () => {
  test.beforeEach(async ({ page }) => {
    // PIN 게이트는 session-page에서 로딩 스피너 이전에 세션 검증으로 bypass
    await page.goto('/teacher/demo');
    await bypassPasswordGate(page);
    await page.reload();
  });

  test('유효하지 않은 키로 접속 시 인증 실패 메시지가 표시된다', async ({ page }) => {
    await expect(page.getByText('보안 인증 실패')).toBeVisible({ timeout: 8000 });
  });

  test('인증 실패 시 새 세션 만들기 버튼이 표시된다', async ({ page }) => {
    await expect(page.getByRole('button', { name: '새로운 세션 만들기' })).toBeVisible({ timeout: 8000 });
  });
});
