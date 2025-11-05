import Table from "cli-table3";
import JQLApiRepository from "../repositories/JQLApiRepository.js";
import { notify } from "../app/notify.js";
import moment from "moment";

const notificationIds = new Map<any, any>();

type listBugActionParams = {
  watch: boolean
  interval: number
  status: string
}

type StatusDuration = {
  status: string
  duration: string
}

export async function listBugActions(args: listBugActionParams) {
  const {watch, interval, status} = args;
  const JQLRepo = new JQLApiRepository();
  const isWatch = watch;
  const intervalMs = Number(interval) * 1000;
  console.clear();

  console.log("fetching data...")

  const resp = await JQLRepo.assignedBugs(status)
  const table = new Table({
    head: [
      "ID",
      "Title",
      "Assignee",
      "Status",
      "Story Point",
      "Duration"
    ]
  })


  const columns = resp.issues.map((issue) => {
    const sorted = issue.changelog.histories
    .filter(history => history.items[0]?.field === "status")
    .sort((a, b) => moment(a.created).unix() - moment(b.created).unix())

    const statusDurations2: StatusDuration[] = sorted.map((status, index) => {
      const current = status
      const next = sorted[index + 1]

      const fromStatus = current.items[0]!.toString || "";
      const startTime = moment(current.created);
      const endTime = next ? moment(next.created) : moment()

      if (endTime) {
        const diffMs = endTime.diff(startTime)
        const diff = moment.duration(diffMs)
        const readable = [
          diff.hours() ? `${diff.hours()}h` : "",
          diff.minutes() ? `${diff.minutes()}m` : "",
          diff.seconds() ? `${diff.seconds()}s` : ""
        ]
        .filter(Boolean)
        .join(" ");

        return {
          status: fromStatus,
          duration: readable
        }
      }

      return {
        status: fromStatus,
        duration: "-"
      }
    })
    return {
      ID: issue.key,
      Title: issue.fields.summary,
      Assignee: issue.fields.assignee,
      Status: issue.fields.status.name,
      StoryPoint: issue.fields.customfield_10024,
      Durations: statusDurations2.find(status => status.status === "To Do")
    }
  })

  columns.forEach((column) => {
    table.push([
      column.ID,
      column.Title.slice(0, 50),
      column.Assignee.displayName,
      column.Status,
      column.StoryPoint,
      column.Durations.duration
    ] as any)

    if (!notificationIds.has(column.ID)) {
      notificationIds.set(column.ID, column.ID);
      notify(column.ID, column.Title, "critical");
    }

    if (!isWatch) {
      notify(column.ID, column.Title, "critical");
    }
  })

  console.clear();

  if (columns.length) console.log(table.toString());
    else console.log("No Issues Found");

  if (isWatch) {
    setTimeout(() => {
      listBugActions(args)
    }, intervalMs)
  }
}
