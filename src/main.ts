import { listBugActions } from "./actions/list-bugs-actions.js";
import { confirm, number, select } from "@inquirer/prompts";
import { listTaskActions } from "./actions/list-tasks-action.js";

const start = () => {
  const answer = select({
    message: "Select menu",
    choices: [
      {
        name: "list bugs",
        value: "bugs",
        description: "get list of bugs",
      },
      {
        name: "list tasks",
        value: "tasks",
        description: "get list of tasks"
      }
    ]
  })

  answer.then(async (answer: string) => {
    switch (answer) {
      case "bugs":
        let bugInterval = 0;
        const bugWatch = await confirm({
          message: "do you wanna watch it?",
        })

        if (bugWatch) bugInterval = await number({
          message: "please set interval in second"
        })

        await listBugActions({
          status: "To Do",
          interval: bugInterval,
          watch: bugWatch
        })

        if (!bugWatch) start();
        break;
      case "tasks":
        let interval = 0;
        const watch = await confirm({
          message: "do you wanna watch it?",
        })

        if (watch) interval = await number({
          message: "please set interval in second"
        })

        await listTaskActions({
          status: "In Progress",
          interval: interval,
          watch: watch
        })

        if (!watch) start();
      break;
    }
  });
}

start();

