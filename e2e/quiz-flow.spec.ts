import { test, expect, Page } from '@playwright/test';

// 학생 역할로 퀴즈 화면까지 진입한다.
async function goToQuiz(page: Page) {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.setItem('science_pokedex_role', 'student');
    localStorage.setItem('science_pokedex_student_name', 'E2E학생');
    localStorage.setItem('science_pokedex_student_avatar', '🦆');
  });
  await page.reload();
  await page.locator('button', { hasText: '퀴즈 시작' }).first().click();
  await expect(page.getByText('PROGRESS')).toBeVisible();
}

// 문항 타입(MC/OX/Short)에 무관하게 현재 문제에 응답한다.
// 셔플로 첫 문항 타입이 비결정적이므로 타입별로 분기 처리한다.
// Matching(단원당 1문항)은 처리하지 않으며, 호출부에서 재시도로 회피한다.
async function tryAnswerCurrentQuestion(page: Page): Promise<boolean> {
  const shortInput = page.getByPlaceholder('정답을 입력하세요...');
  if (await shortInput.isVisible().catch(() => false)) {
    await shortInput.fill('테스트');
    await page.getByRole('button', { name: '제출' }).click();
    return true;
  }

  const oxButton = page.getByRole('button', { name: '맞다 (O)' });
  if (await oxButton.isVisible().catch(() => false)) {
    await oxButton.click();
    return true;
  }

  const mcOption = page.getByTestId('mc-option').first();
  if (await mcOption.isVisible().catch(() => false)) {
    await mcOption.click();
    return true;
  }

  return false; // Matching 등 미지원 타입
}

test.describe('퀴즈 플로우', () => {
  test('퀴즈 진입 시 진행 표시·문제·QUIT 버튼이 보인다', async ({ page }) => {
    await goToQuiz(page);

    // 진행 표시기: 첫 문항은 "1 / 10" (단원당 10문항 샘플링)
    await expect(page.getByText('1 / 10', { exact: true })).toBeVisible();
    await expect(page.getByText(/QUESTION 1/)).toBeVisible();
    await expect(page.getByRole('button', { name: /QUIT/ })).toBeVisible();
  });

  test('QUIT 클릭 시 중단 확인 모달이 뜨고 "계속 풀기"로 닫힌다', async ({ page }) => {
    await goToQuiz(page);

    await page.getByRole('button', { name: /QUIT/ }).click();
    await expect(page.getByText('퀴즈를 중단하시겠습니까?')).toBeVisible();

    await page.getByRole('button', { name: '계속 풀기' }).click();
    await expect(page.getByText('퀴즈를 중단하시겠습니까?')).toBeHidden();
    // 퀴즈 화면이 유지된다
    await expect(page.getByText('PROGRESS')).toBeVisible();
  });

  test('"퀴즈 중단하기"를 누르면 퀴즈 화면을 벗어난다', async ({ page }) => {
    await goToQuiz(page);

    await page.getByRole('button', { name: /QUIT/ }).click();
    await page.getByRole('button', { name: '퀴즈 중단하기' }).click();

    // 퀴즈 화면 이탈 — 진행 표시기가 사라진다
    await expect(page.getByText('PROGRESS')).toBeHidden();
  });

  test('보기를 선택하면 정답/오답 해설이 표시된다', async ({ page }) => {
    // 첫 문항이 Matching이면 응답 불가 → 재진입하여 재시도 (최대 5회)
    let answered = false;
    for (let attempt = 0; attempt < 5 && !answered; attempt++) {
      await goToQuiz(page);
      answered = await tryAnswerCurrentQuestion(page);
    }
    expect(answered).toBeTruthy();

    // 해설 패널은 정답/오답 모두에서 항상 표시된다
    await expect(page.getByText(/정답입니다|오답입니다/)).toBeVisible();
  });
});
