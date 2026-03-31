import { test } from "@fixtures";
import { expect } from "@playwright/test";
import { faker } from "@faker-js/faker";

import { TASKS_TABLE_SELECTORS } from "@selectors";
import { DASHBOARD_TEXTS, SPEC_MARKERS } from "@texts";
import LoginPage from "@poms/login";

test.describe("Tasks page", () => {
  let taskName: string;

  test.beforeEach(async ({ page, taskPage }, testInfo) => {
    await test.step("Generate task name and open dashboard", async () => {
      taskName = faker.word.words({ count: 5 });
      await page.goto("/");
    });

    if (testInfo.title.includes(SPEC_MARKERS.skipTasksBeforeEachSetup)) return;

    await test.step("Create task as default user", async () => {
      await taskPage.createTaskAndVerify({ taskName });
    });
  });

  test.afterEach(async ({ page, taskPage }) => {
    await test.step("Open dashboard for teardown", async () => {
      await page.goto("/");
    });

    await test.step("Mark task completed if still pending", async () => {
      await taskPage.markTaskAsCompletedAndVerify({ taskName });
    });

    const pendingTable = page.getByTestId(
      TASKS_TABLE_SELECTORS.pendingTasksTable
    );
    const completedTable = page.getByTestId(
      TASKS_TABLE_SELECTORS.completedTasksTable
    );

    await test.step("Delete completed task and verify removal", async () => {
      const completedRow = completedTable.getByRole("row", { name: taskName });

      await completedRow
        .getByTestId(TASKS_TABLE_SELECTORS.completedTaskDeleteLink)
        .click();

      await expect(completedRow).toBeHidden();
      await expect(
        pendingTable.getByRole("row", { name: taskName })
      ).toBeHidden();
    });
  });

  test("should be able to mark a task as completed", async ({ taskPage }) => {
    await test.step("Mark pending task as completed", async () => {
      await taskPage.markTaskAsCompletedAndVerify({ taskName });
    });
  });

  test("should be able to un-star a pending task", async ({
    page,
    taskPage,
  }) => {
    await test.step("Star the task first", async () => {
      await taskPage.starTaskAndVerify({ taskName });
    });

    await test.step("Un-star and verify icon class", async () => {
      const starIcon = page
        .getByTestId(TASKS_TABLE_SELECTORS.pendingTasksTable)
        .getByRole("row", { name: taskName })
        .getByTestId(TASKS_TABLE_SELECTORS.starUnstarButton);
      await starIcon.click();
      await expect(starIcon).toHaveClass(DASHBOARD_TEXTS.unstarredTaskClass);
    });
  });

  test(`should create a new task with a different user as the assignee ${SPEC_MARKERS.skipTasksBeforeEachSetup}`, async ({
    browser,
    taskPage,
  }) => {
    const samSmithEmail = process.env.SAM_SMITH_EMAIL!;
    const samSmithPassword = process.env.SAM_SMITH_PASSWORD!;
    const samSmithUsername = process.env.SAM_SMITH_USERNAME!;

    await test.step("Create task assigned to alternate user", async () => {
      await taskPage.createTaskAndVerify({
        taskName,
        userName: samSmithUsername,
      });
    });

    await test.step("Log in as assignee in a fresh context", async () => {
      const newUserContext = await browser.newContext({
        storageState: { cookies: [], origins: [] },
      });
      try {
        const newUserPage = await newUserContext.newPage();
        const loginPage = new LoginPage(newUserPage);

        await newUserPage.goto("/");
        await loginPage.loginAndVerifyUser({
          email: samSmithEmail,
          password: samSmithPassword,
          username: samSmithUsername,
        });

        await expect(
          newUserPage
            .getByTestId(TASKS_TABLE_SELECTORS.pendingTasksTable)
            .getByRole("row", { name: taskName })
        ).toBeVisible();
      } finally {
        await newUserContext.close();
      }
    });
  });
});
