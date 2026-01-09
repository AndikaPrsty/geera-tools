import { useState, useCallback, useRef, useEffect } from 'react';
import moment from 'moment';
import JQLApiRepository from '../repositories/JQLApiRepository.js';
import OctoApiRepository from '../repositories/OctoApiRepository.js';
import { notify } from '../utils/notify.js';
import { TASK_CONSTANTS, STATUS_PATTERNS } from '../constants/task.js';
import type { TableDataInterface, TimerState } from '../types/task-progress.js';
import { calculateStatusDurations, calculateInProgressDuration } from '../utils/statusDuration.js';
import { usePullRequestCheck } from './usePullRequestCheck.js';
import { useTicketOperations } from './useTicketOperations.js';

const jqlRepo = new JQLApiRepository();
const octoRepo = new OctoApiRepository();

interface UseTaskFetchingProps {
	watch: boolean;
	interval: number;
}

export const useTaskFetching = ({ watch, interval }: UseTaskFetchingProps) => {
	const [state, setState] = useState<TimerState>({
		loading: true,
		tableData: [],
		timer: '',
		notificationIds: new Map(),
		retryInterval: null,
		timeoutId: null,
		retryCount: 0
	});

	const { checkPullRequest } = usePullRequestCheck();
	const { handleHoldTicket } = useTicketOperations();
	const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
	const watchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const retryIntervalRef = useRef<NodeJS.Timeout | null>(null);

	// Clear all timers function
	const clearAllTimers = useCallback(() => {
		if (timerIntervalRef.current) {
			clearInterval(timerIntervalRef.current);
			timerIntervalRef.current = null;
		}
		if (watchTimeoutRef.current) {
			clearTimeout(watchTimeoutRef.current);
			watchTimeoutRef.current = null;
		}
		if (retryIntervalRef.current) {
			clearInterval(retryIntervalRef.current);
			retryIntervalRef.current = null;
		}
	}, []);

	// Process individual issue data
	const processIssueData = useCallback(async (issue: any, pulls: any[]) => {
		const statusDurations = calculateStatusDurations(issue.changelog.histories);
		const { totalMinutes: inProgressMinutes, readableDuration } = calculateInProgressDuration(statusDurations);

		const data: TableDataInterface = {
			key: issue.key,
			summary: issue.fields.summary,
			assignee: issue.fields.assignee.displayName,
			storyPoint: issue.fields.customfield_10024?.toString() || '',
			status: issue.fields.status.name,
			inProgressTime: readableDuration
		};

		const storyPoint = issue.fields.customfield_10024;
		const targetFinish = Number(storyPoint || 1) * TASK_CONSTANTS.THRESHOLD_MINUTES_PER_STORY_POINT;
		const isEstimationExceeded = inProgressMinutes >= targetFinish;

		// Handle notifications and actions
		if (!storyPoint) {
			await checkPullRequest(data, pulls);
		}

		if (isEstimationExceeded) {
			if (STATUS_PATTERNS.PROGRESS.test(data.status)) {
				notify(data.key, data.summary + '\n Please Change Your Ticket Status !!!', 'critical');
			}

			const {hasValidPR} = await checkPullRequest(data, pulls);

			if (!hasValidPR) {
				await handleHoldTicket(data);
			}
		}

		// Track notifications to avoid duplicates
		setState(prev => {
			if (!prev.notificationIds.has(data.key)) {
				notify(data.key, data.summary + '\nIssues Started: ' + readableDuration);
				const newNotificationIds = new Map(prev.notificationIds);
				newNotificationIds.set(data.key, data.key);
				return { ...prev, notificationIds: newNotificationIds };
			}
			return prev;
		});

		if (!watch) {
			notify(data.key, data.summary, 'critical');
		}

		return data;
	}, [checkPullRequest, handleHoldTicket, watch]);

	// Main fetch function
	const fetchInProgressTasks = useCallback(async (): Promise<void> => {
		// Clear existing timers first
		clearAllTimers();

		try {
			setState(prev => ({ ...prev, loading: true }));

			const [pullResp, issuesResp] = await Promise.all([
				octoRepo.getPullRequests(),
				jqlRepo.onGoingTasks(),
			]);

			const processedData = await Promise.all(
				issuesResp.issues.map((issue: any) => processIssueData(issue, pullResp)),
			);

			setState(prev => ({...prev, tableData: processedData}));

			// Setup watch timer if needed
			if (watch) {
				const futureTime = moment().add(interval, 'seconds');

				// Timer display updater
				const timerInterval = setInterval(() => {
					const endTime = moment(futureTime);
					const now = moment();
					const diff = endTime.diff(now);
					if (diff > 0) {
						setState(prev => ({...prev, timer: moment(diff).format('mm:ss')}));
					} else {
						setState(prev => ({...prev, timer: '00:00'}));
					}
				}, TASK_CONSTANTS.TIMER_UPDATE_INTERVAL);

				// Next fetch timeout
				const nextFetchTimeout = setTimeout(() => {
					clearInterval(timerInterval);
					void fetchInProgressTasks();
				}, interval * 1000);

				timerIntervalRef.current = timerInterval;
				watchTimeoutRef.current = nextFetchTimeout;
			}
		} catch (error) {
			console.error('Failed to fetch tasks:', error);

			// Setup retry mechanism only if not already retrying
			if (!retryIntervalRef.current) {
				const retry = setInterval(() => {
					void fetchInProgressTasks();
				}, TASK_CONSTANTS.RETRY_INTERVAL_MS);

				retryIntervalRef.current = retry;
			}
		} finally {
			setState(prev => ({...prev, loading: false}));
		}
	}, [processIssueData, watch, interval, clearAllTimers]);

	// Cleanup on unmount
	useEffect(() => {
		return clearAllTimers;
	}, [clearAllTimers]);

	const startFetching = useCallback(() => {
		void fetchInProgressTasks();
	}, [fetchInProgressTasks]);

	return {
		state,
		startFetching,
		cleanupTimers: clearAllTimers
	};
};
