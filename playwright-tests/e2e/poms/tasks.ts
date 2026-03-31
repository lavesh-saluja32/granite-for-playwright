import { Page, expect } from "@playwright/test";

import { CREATE_TASK_SELECTORS } from "../constants/selectors/createTask";

interface TaskName {
  taskName: string;
}

interface CreateNewTaskProps extends TaskName {
  userName?: string;
}

export default class TaskPage {
  constructor(private page: Page) {}

  createTaskAndVerify = async ({
    taskName,
    userName = "Oliver Smith",
  }: CreateNewTaskProps) => {
    await this.page.getByTestId("navbar-add-todo-link").click();
    await this.page
      .getByTestId(CREATE_TASK_SELECTORS.taskTitleField)
      .fill(taskName);

    await this.page.locator(CREATE_TASK_SELECTORS.memberSelectContainer).click();
    await this.page
      .locator(CREATE_TASK_SELECTORS.memberOptionField)
      .getByText(userName)
      .click();
    await this.page
      .getByTestId(CREATE_TASK_SELECTORS.createTaskButton)
      .click();
    const taskInDashboard = this.page
      .getByTestId("tasks-pending-table")
      .getByRole("row", {
        name: new RegExp(taskName, "i"),
      });
    await taskInDashboard.scrollIntoViewIfNeeded();
    await expect(taskInDashboard).toBeVisible();
  };
  markTaskAsCompletedAndVerify = async ({ taskName }: TaskName) => {
    await expect(
      this.page.getByRole("heading", { name: "Loading..." })
    ).toBeHidden();
    const completedTaskInDashboard = this.page
      .getByTestId("tasks-completed-table")
      .getByRole("row", { name: taskName });
    const isTaskCompleted = await completedTaskInDashboard.count();
    if (isTaskCompleted) return;
    await this.page
    .getByTestId("tasks-pending-table")
    .getByRole("row", { name: taskName })
    .getByRole("checkbox")
    .click();
    await completedTaskInDashboard.scrollIntoViewIfNeeded();
    await expect(completedTaskInDashboard).toBeVisible();
  };

  starTaskAndVerify = async ({ taskName }: TaskName) => {
    const starIcon = this.page
      .getByTestId("tasks-pending-table")
      .getByRole("row", { name: taskName })
      .getByTestId("pending-task-star-or-unstar-link");
    await starIcon.click();
    await expect(starIcon).toHaveClass(/ri-star-fill/i);
    await expect(
      this.page.getByTestId("tasks-pending-table").getByRole("row").nth(1) //// Using nth methods here since we want to verify the first row of the table
    ).toContainText(taskName);
  };
}
