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

	const getPullRequestByKey = (key = "", pulls: Pull[]) => {
		const validStates = ['closed', 'open'];
		return pulls
		.filter(pull => validStates.includes(pull.state))
		.filter(pull => ["development", "staging"].includes(pull.base.ref))
		.find(pull => {
			const regex = new RegExp(`\\b${key}\\b`);
			return regex.test(pull.title);
		});
}

	const checkPullRequest = useCallback(
		async (
			ticket: TableDataInterface,
			pulls: Pull[],
		): Promise<PullRequestCheck> => {
			try {
				const pullFiltered = getPullRequestByKey(ticket.key, pulls);;

				if (pullFiltered) {
					const pull = pullFiltered!;

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

	return {checkPullRequest, getPullRequestByKey};
};
