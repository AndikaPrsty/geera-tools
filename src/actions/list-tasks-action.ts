import Table from "cli-table3";
import JQLApiRepository from "../repositories/JQLApiRepository.js";
import { notify } from "../app/notify.js";
import moment from "moment";
import { Pull } from "../contracts/Pull.js";

const notificationIds = new Map<any, any>();
let retryInterval: any = null;

type listTaskActionParams = {
  watch: boolean
  interval: number
  status: string
}

type StatusDuration = {
  minutes: number
  status: string
  duration: string
  diff: any
}

const onCheckPullRequest = async (ticketId = "", pulls: Pull[]) => {
  try {
    const jiraRepo = new JQLApiRepository();
    const pullFiltered = pulls.filter((pull: any) => ["closed", "open"].includes(pull.state)).filter((pull: any) => pull.title.match(new RegExp('\\b'+ticketId+'\\b')))
    if (pullFiltered.length) {
      await handleCodeReviewTicket(ticketId)
      const messagePayload = {
        content: "@here Hi everyone! Please review these PRs.",
        username: "Budak Faridho",
        embeds: [
          {
            title: "New Open Pull Requests",
            description: pullFiltered[0].title,
            color: 3066993,
            fields: pullFiltered.map(pull => {
              const splitTitle = pull.title.split("-");

              return {
                name: splitTitle[splitTitle.length - 1].trim(),
                value: pull._links.html.href,
                inline: false
              }
            })
          }
        ]
      }
      await jiraRepo.sendDiscordWebhook(JSON.stringify(messagePayload));
      return true
    }
    return false
  } catch (error) {
    console.error("failed to get pull request: ", error);
    return false
  }
}

const handleCodeReviewTicket = async (ticketId = "") => {
  try {
    const jiraRepo = new JQLApiRepository();
    const statuses = await jiraRepo.getTransitionByTicketId(ticketId)
    const codeReviewId = statuses.transitions.find((transition) => transition.name.toLowerCase().match(/review/))?.id

    if (codeReviewId) {
      await jiraRepo.codeReviewTicket(ticketId, codeReviewId);
      return true;
    }
    return false;
  } catch (error) {
    console.error("failed to review ticket: ", error);
    return false;
  }
}

const handleHoldticket = async (ticketId = "", pulls: Pull[] = []) => {
  try {
    const isCodeReview = onCheckPullRequest(ticketId, pulls);
    const jiraRepo = new JQLApiRepository();
    const statuses = await jiraRepo.getTransitionByTicketId(ticketId)
    const onHoldId = statuses.transitions.find((transition) => transition.name.toLowerCase().match(/hold/)).id

    if (isCodeReview) return;

    if (onHoldId) {
      await jiraRepo.holdTicket(ticketId, onHoldId);
    }
  } catch (error) {
    console.error("failed to hold ticket: ", error);
  }
}

export async function listTaskActions(args: listTaskActionParams) {
  clearInterval(retryInterval);
  try {
    const { watch, interval } = args;
    const JQLRepo = new JQLApiRepository();
    const isWatch = watch;
    const intervalMs = Number(interval) * 1000;

    console.log("fetching data...")

    const resp = await JQLRepo.onGoingTasks()
    const pulls = await JQLRepo.getOpenPullRequestByTicketId();
    const table = new Table({
      head: [
        "ID",
        "Title",
        "Assignee",
        "Type",
        "Story Point",
        "Status",
        "In Progress Time"
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
            duration: readable,
            minutes: diff.asMinutes(),
            diff: diffMs
          }
        }

        return {
          minutes: 0,
          status: fromStatus,
          duration: "-",
          diff: moment.duration(0)
        }
      })

      const inProgressDuration = statusDurations2.filter((duration) => duration.status === "In Progress").reduce((prev, curr) => {
        return prev + curr.minutes
      }, 0);
      const durationDiff = statusDurations2.filter((duration) => duration.status === "In Progress").reduce((prev, curr) => {
        return prev + curr.diff
      }, 0)

      const diff = moment.duration(durationDiff)

      const durationReadeble = [
        diff.hours() ? `${diff.hours()}h` : "",
        diff.minutes() ? `${diff.minutes()}m` : "",
        diff.seconds() ? `${diff.seconds()}s` : ""
      ]
      .filter(Boolean)
      .join(" ")


      return {
        ID: issue.key,
        Title: issue.fields.summary,
        Assignee: issue.fields.assignee,
        StoryPoint: issue.fields.customfield_10024 || 1,
        Status: issue.fields.status.name,
        InProgressDuration: inProgressDuration,
        Duration: durationReadeble,
        Durations: statusDurations2,
        Link: "https://lionparcel.atlassian.net/browse/"+issue.key,
        Type: issue.fields.issuetype.name
      }
    })

    columns.forEach((column) => {
      table.push([
        column.ID,
        column.Title.slice(0, 50)+"\n"+column.Link,
        column.Assignee.displayName,
        column.Type,
        column.StoryPoint,
        column.Status,
        column.Duration
      ] as any)

      const threshold = 80;

      const targetFinish = column.StoryPoint * threshold;

      const isEstimationExceeded = column.InProgressDuration >= targetFinish;

      // if (column.Type.toLowerCase().match(/bug/)) {
        onCheckPullRequest(column.ID, pulls);
      // }

      if (isEstimationExceeded) {
        notify(column.ID, column.Title + '\n Please Change Your Ticket Status !!!', "critical");
        handleHoldticket(column.ID, pulls);
      }

      if (!notificationIds.has(column.ID)) {
        notify(column.ID, column.Title + "\nIssues Started: " + column.Duration)
        notificationIds.set(column.ID, column.ID);
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
        listTaskActions(args)
      }, intervalMs)
    }
  } catch (error) {
    retryInterval = setInterval(() => {
      console.clear();
      console.log("Retrying....")
      listTaskActions(args);
    }, 10000)
  }
}
