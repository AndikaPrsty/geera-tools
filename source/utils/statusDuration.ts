import moment from 'moment';
import type {StatusDuration} from '../types/task-progress.js';
import type {History} from '../contracts/Issues.js';

export const calculateStatusDurations = (
	histories: History[],
): StatusDuration[] => {
	const sorted = histories
		.filter(history => history.items[0]?.field === 'status')
		.sort((a, b) => moment(a.created).unix() - moment(b.created).unix());

	return sorted.map((status, index) => {
		const current = status;
		const next = sorted[index + 1];

		const fromStatus = current.items[0]!.toString || '';
		const startTime = moment(current.created);
		const endTime = next ? moment(next.created) : moment();

		const diffMs = endTime.diff(startTime);
		const diff = moment.duration(diffMs);

		const readable = [
			diff.hours() ? `${diff.hours()}h` : '',
			diff.minutes() ? `${diff.minutes()}m` : '',
			diff.seconds() ? `${diff.seconds()}s` : '',
		]
			.filter(Boolean)
			.join(' ');

		return {
			status: fromStatus,
			duration: readable,
			minutes: diff.asMinutes(),
			diff: diff,
		};
	});
};

export const calculateInProgressDuration = (
	statusDurations: StatusDuration[],
): {
	totalMinutes: number;
	readableDuration: string;
	totalDiffMs: number;
} => {
	const inProgressDurations = statusDurations.filter(
		duration => duration.status === 'In Progress',
	);

	const totalMinutes = inProgressDurations.reduce(
		(prev, curr) => prev + curr.minutes,
		0,
	);

	const totalDiffMs = inProgressDurations.reduce(
		(prev, curr) => prev + curr.diff.asMilliseconds(),
		0,
	);

	const diff = moment.duration(totalDiffMs);
	const readableDuration = [
		diff.hours() ? `${diff.hours()}h` : '',
		diff.minutes() ? `${diff.minutes()}m` : '',
		diff.seconds() ? `${diff.seconds()}s` : '',
	]
		.filter(Boolean)
		.join(' ');

	return {
		totalMinutes,
		readableDuration,
		totalDiffMs,
	};
};
