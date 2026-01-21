import {useCallback} from 'react';
import type {
	TableDataInterface,
	PullRequestCheck,
} from '../types/task-progress.js';
import type {Pull} from '../contracts/Pull.js';
import {STATUS_PATTERNS} from '../constants/task.js';
import {useTicketOperations} from './useTicketOperations.js';

export const usePullRequestCheck = () => {
	const {handleCodeReviewTicket, handleCodeReviewFromHold} =
		useTicketOperations();

	const checkPullRequest = useCallback(
		async (
			ticket: TableDataInterface,
			pulls: Pull[],
		): Promise<PullRequestCheck> => {
			try {
				const validStates = ['closed', 'open'];
				const pullFiltered = pulls
					.filter(pull => validStates.includes(pull.state))
					.filter(pull => {
						const regex = new RegExp(`\\b${ticket.key}\\b`);
						return regex.test(pull.title);
					});

				if (pullFiltered.length > 0) {
					const pull = pullFiltered[0]!;

					if (STATUS_PATTERNS.HOLD.test(ticket.status)) {
						await handleCodeReviewFromHold(ticket, pull);
					} else {
						await handleCodeReviewTicket(ticket, pull);
					}

					return {hasValidPR: true, pull};
				}

				return {hasValidPR: false};
			} catch (error) {
				console.error('Failed to check pull request:', error);
				return {hasValidPR: false};
			}
		},
		[handleCodeReviewTicket, handleCodeReviewFromHold],
	);

	return {checkPullRequest};
};
