import moment from "moment";
import ExcelJS from "exceljs";
import JQLApiRepository from "../repositories/JQLApiRepository.js";

const updateExcel = async (keyToFind: string, timeAssigneeValue: string, readyToTestValue: string, diff: string) => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile("data.xlsx");

  const sheet = workbook.worksheets[0];

  // Find column indexes
  const headerRow = sheet.getRow(1) as any;

  const colKey = headerRow.values.indexOf("Key");
  const colTimeAssignee = headerRow.values.indexOf("time assigne");
  const colReadyToTest = headerRow.values.indexOf("Ready to Test");
  const colDiff = headerRow.values.indexOf("Diff");

  if (colKey < 0) {
    console.error("Column 'Key' not found");
    return;
  }

  // Loop rows
  sheet.eachRow((row) => {
    const keyValue = row.getCell(colKey).value;

    if (keyValue === keyToFind) {
      console.log(`found: ${keyValue}`)
      row.getCell(colTimeAssignee).value = timeAssigneeValue;
      row.getCell(colReadyToTest).value = readyToTestValue;
      row.getCell(colDiff).value = diff

      row.commit();
    }
  });

  await workbook.xlsx.writeFile("data.xlsx");

  console.log("Excel updated!");
}

export const getBugs = async (issues = "") => {
  const JQLRepo = new JQLApiRepository();

  const resp = await JQLRepo.getBugs(issues);
  const mappesIssues = resp.issues.map((issue) => {
    const assignees = issue.changelog.histories.filter(history => history.items[0].field === "assignee");
    let statuses =  issue.changelog.histories
        .filter(history => !!history.items
          .filter(item => item.field === "status").length)
          .sort((a, b) => new Date(a.created).getTime() - new Date(b.created).getTime())
        .filter(history => history.items[0].toString?.toLowerCase()?.includes("ready"));
    const startInProgress = assignees
    const toReadyTOTest = statuses
    let assigneeVal = assignees;
    let diff: any = null;
    if (startInProgress.length) {
      const startTime = moment(startInProgress[0].created);
      const endTime = moment(toReadyTOTest[0].created);
      const diffMs = endTime.diff(startTime);
      diff = moment.duration(diffMs);
    }

    if (!assigneeVal.length) {
      assigneeVal = startInProgress
    }

    if (!statuses.length) {
      statuses =  issue.changelog.histories.filter(history => history.items.find(h => h.field === "status")?.field === "status").filter(h => h.items[0].toString?.toLowerCase().includes("done")) || []
    }

    return {
      key: issue.key,
      history: {
        assignee: moment(assigneeVal[0]?.created).format("YYYY-MM-DD HH:mm"),
        status: statuses.length ? moment(statuses[statuses.length - 1].created).format("YYYY-MM-DD HH:mm"): "-",
        diff: diff ? `${diff.days()}days ${diff.hours()}hours ${diff.minutes()}minutes` : '-'
      }
    }
  });

  for (const issue of mappesIssues) {
    await updateExcel(issue.key, issue.history.assignee, issue.history.status, issue.history.diff)
  }
}
