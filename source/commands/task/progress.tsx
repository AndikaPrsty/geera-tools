import React from "react";
import { option } from "pastel";
import { useEffect, useState } from "react";
import zod from "zod";
import JQLApiRepository from "../../repositories/JQLApiRepository.js";
import Table from "../../components/table.js";
import moment from "moment";
import { Box, Text } from "ink";
import { Pull } from "../../contracts/Pull.js";
import OctoApiRepository from "../../repositories/OctoApiRepository.js";
import { notify } from "../../utils/notify.js";

const JQLRepo = new JQLApiRepository();
const OctoRepo = new OctoApiRepository();

interface TableDataInterface {
	key: string;
	summary: string;
	assignee: string;
	storyPoint: string;
	inProgressTime: string;
	status: string;
}

type StatusDuration = {
	minutes: number
	status: string
	duration: string
	diff: any
}

export const options = zod.object({
	watch: zod.boolean().default(false).describe(option({description: 'interval refetching', defaultValueDescription: 'false'})),
	interval: zod.number().default(60).describe(option({description: 'interval in second (s)', defaultValueDescription: '60'}))
})

type Props = {
	options: zod.infer<typeof options>;
}

export default function Progress({options}: Props) {
	const [loading, setLoading] = useState(true);
	const [tableData, setTableData] = useState<any[]>([]);
	const [timer, setTimer] = useState("");
	const [notificationIds, setNotificationIds] = useState(new Map())
	const [retryInterval, setRetryInterval] = useState<any>(null);

	const handleDoneTicket = async (ticketId = "") => {
		try {
			const statuses = await JQLRepo.getTransitionByTicketId(ticketId)
			const doneId = statuses.transitions.find((transition) => transition.name.toLowerCase().match(/done/))?.id

			if (doneId) {
				await JQLRepo.codeReviewTicket(ticketId, doneId);
				return true;
			}
			return false;
		} catch (error) {
			console.error("failed to done ticket: ", error);
			return false;
		}
	}

	const handleCodeReviewTicket = async (ticket: TableDataInterface, pull: Pull) => {
		try {
			const statuses = await JQLRepo.getTransitionByTicketId(ticket.key)
			const codeReviewId = statuses.transitions.find((transition) => transition.name.toLowerCase().match(/review/))?.id

			if (codeReviewId) {
				await JQLRepo.codeReviewTicket(ticket.key, codeReviewId);
				if (pull.merged_at && ticket.storyPoint) await handleDoneTicket(ticket.key);
				return true;
			}
			return false;
		} catch (error) {
			console.error("failed to review ticket: ", error);
			return false;
		}
	}

	const handleHoldticket = async (ticket: TableDataInterface, pulls: Pull[]) => {
		try {
			const isCodeReview = await onCheckPullRequest(ticket, pulls);
			const statuses = await JQLRepo.getTransitionByTicketId(ticket.key)
			const onHoldId = statuses.transitions.find((transition) => transition.name.toLowerCase().match(/hold/))?.id

			if (isCodeReview) return;

			if (onHoldId && ticket.status.toLowerCase().includes("progress")) {
				await JQLRepo.holdTicket(ticket.key, onHoldId);
			}
		} catch (error) {
			console.error("failed to hold ticket: ", error);
		}
	}

	const handleCodeReviewFromHoldTicket = async (ticket: TableDataInterface, pull: Pull) => {
		try {
			let statuses = await JQLRepo.getTransitionByTicketId(ticket.key)
			const inProgressId = statuses.transitions.find((transition) => transition.name.toLowerCase().match(/progress/))?.id;

			if (inProgressId) {
				await JQLRepo.codeReviewTicket(ticket.key, inProgressId)

				statuses = await JQLRepo.getTransitionByTicketId(ticket.key)
				const codeReviewId = statuses.transitions.find((transition) => transition.name.toLowerCase().match(/review/))?.id

				if (codeReviewId) {
					await JQLRepo.codeReviewTicket(ticket.key, codeReviewId);
					if (pull.merged_at && ticket.storyPoint) await handleDoneTicket(ticket.key);
					return true;
				}
				return true;
			}
			return false;
		} catch (error) {
			console.error("failed to review ticket: ", error);
			return false;
		}
	}

	const onCheckPullRequest = async (ticket: TableDataInterface, pulls: Pull[]) => {
		try {
			const pullFiltered = pulls.filter((pull: any) => ["closed", "open"].includes(pull.state)).filter((pull: any) => pull.title.match(new RegExp('\\b'+ticket.key+'\\b')))
			if (pullFiltered.length) {
				if (ticket.status.toLowerCase().includes("hold")) handleCodeReviewFromHoldTicket(ticket, pullFiltered[0]!)
				else await handleCodeReviewTicket(ticket, pullFiltered[0]!)
				return true
			}
			return false
		} catch (error) {
			console.error("failed to get pull request: ", error);
			return false
		}
	}

	const fetchInprogressTask = async () => {
		clearInterval(retryInterval);
		try {
			setLoading(true);
			const pullResp = await OctoRepo.getPullRequests()
			const resp = await JQLRepo.onGoingTasks();


			const data = resp.issues.map((issue) => {
				const sorted = issue.changelog.histories
				.filter(history => history.items[0]?.field === "status")
				.sort((a, b) => moment(a.created).unix() - moment(b.created).unix())

				const statusDurations: StatusDuration[] = sorted.map((status, index) => {
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

				const inProgressDuration = statusDurations.filter((duration) => duration.status === "In Progress").reduce((prev, curr) => {
					return prev + curr.minutes
				}, 0);
				const durationDiff = statusDurations.filter((duration) => duration.status === "In Progress").reduce((prev, curr) => {
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

				const data = {
					key: issue.key,
					summary: issue.fields.summary,
					assignee: issue.fields.assignee.displayName,
					storyPoint: issue.fields.customfield_10024?.toString() || "",
					status: issue.fields.status.name,
					inProgressTime: durationReadeble
				} as TableDataInterface


				const storyPoint = issue.fields.customfield_10024;
				const threshold = 80;

				const targetFinish = Number(storyPoint || 1) * threshold;

				const isEstimationExceeded = inProgressDuration >= targetFinish;

				if (!storyPoint) {
					onCheckPullRequest(data, pullResp);
				}

				if (isEstimationExceeded) {
					notify(data.key, data.summary + '\n Please Change Your Ticket Status !!!', "critical");
					handleHoldticket(data, pullResp);
				}

				if (!notificationIds.has(data.key)) {
					notify(data.key, data.summary + "\nIssues Started: " + durationReadeble)
					notificationIds.set(data.key, data.key);
					setNotificationIds(notificationIds);
				}

				if (!options.watch) {
					notify(data.key, data.summary, "critical");
				}

				return data;
			});

			setTableData(data)
			if (!options.watch) return;

			const fa = moment(new Date().getTime() + (options.interval * 1000));

			const intervalId = setInterval(() => {
				const endTime = moment(fa);
				const now = moment();
				const diff = endTime.diff(now);
				setTimer(moment(diff).format("mm:ss"))
			}, 100)

			setTimeout(() => {
				clearInterval(intervalId);
				fetchInprogressTask();
			}, options.interval * 1000)
		} catch (error) {
			console.error(error)
			const retryIntrvl = setInterval(() => {
				fetchInprogressTask();
			}, 10*1000) // retry every 10 sec if error
			setRetryInterval(retryIntrvl);
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		console.clear();
		fetchInprogressTask();
	}, [])

	if (loading) {
		return <Text>loading...</Text>
	}

	if (!tableData.length) {
		return (
			<Box flexDirection="column">
				{ options.watch ? <Text>refecthing in {timer}</Text> : null}
				<Text>no data found...</Text>
			</Box>
		)
	}

	return (
		<Box flexDirection="column">
			{ options.watch ? <Text>refecthing in {timer}</Text> : null}
			<Table data={tableData} />
		</Box>
	)
}
