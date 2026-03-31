import { test } from "../fixtures";
import { expect } from "@playwright/test";
import { faker } from "@faker-js/faker";
import LoginPage from "../poms/login";

let taskName: string;
let comment:string;

test.describe("Comments section",()=>{
    test.beforeEach(async ({ page, taskPage }, testInfo) => {
        taskName = faker.word.words({ count: 5 });
        comment = faker.word.words({ count: 15 });
        await page.goto("/");

        if (testInfo.title.includes("[SKIP_SETUP]")) return;

        await taskPage.createTaskAndVerify({ taskName });
    })
    test("should be able to add comment as creator", async ({ page }) => {

        await page.getByText(taskName).click();

        const commentRows = page.getByTestId("task-comment");
        const countBefore = await commentRows.count();

        await page.getByTestId('comments-text-field').click();
        await page.getByTestId('comments-text-field').fill(comment);
        await page.getByTestId('comments-submit-button').click();

        // Scope to the list row so we don't match the textarea during submit/refetch.
        await expect(commentRows.filter({ hasText: comment })).toBeVisible();
        await expect(commentRows).toHaveCount(countBefore + 1);
    })

    test("should be able to see comment as assignee [SKIP_SETUP]", async ({ page, taskPage, browser }) => {
        await taskPage.createTaskAndVerify({ taskName, userName: "Sam Smith" });
        await page.getByText(taskName).click();

        const commentRows = page.getByTestId("task-comment");
        const countBefore = await commentRows.count();

        await page.getByTestId('comments-text-field').click();
        await page.getByTestId('comments-text-field').fill(comment);
        await page.getByTestId('comments-submit-button').click();

        await expect(commentRows.filter({ hasText: comment })).toBeVisible();
        await expect(commentRows).toHaveCount(countBefore + 1);

    const newUserContext = await browser.newContext({
      storageState: { cookies: [], origins: [] },
    });
    const newUserPage = await newUserContext.newPage();

    const loginPage = new LoginPage(newUserPage);

    await newUserPage.goto("/");
    await loginPage.loginAndVerifyUser({
      email: "sam@example.com",
      password: "welcome",
      username: "Sam Smith",
    });
    await newUserPage.getByText(taskName).click()
    await
    await page.getByTestId('comments-submit-button').click();expect(newUserPage.getByTestId("task-comment").filter({ hasText: comment })).toBeVisible();
    })
})