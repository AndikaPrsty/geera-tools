import type {Duration} from 'moment';
import type {Pull} from '../contracts/Pull.js';

export interface TableDataInterface {
	[key: string]: string | number | boolean | null | undefined;
	key: string;
	summary: string;
	assignee: string;
	storyPoint: string;
	inProgressTime: string;
	status: string;
}

export interface StatusDuration {
	minutes: number;
	status: string;
	duration: string;
	diff: Duration;
}

export interface TimerState {
	loading: boolean;
	tableData: TableDataInterface[];
	timer: string;
	notificationIds: Map<string, string>;
	retryInterval: NodeJS.Timeout | null;
	timeoutId: NodeJS.Timeout | null;
	retryCount: number;
}

export interface TicketOperationResult {
	success: boolean;
	error?: string;
}

export interface PullRequestCheck {
	hasValidPR: boolean;
	pull?: Pull;
}
