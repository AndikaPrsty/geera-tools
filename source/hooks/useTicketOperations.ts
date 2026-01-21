import {useCallback} from 'react';
import JQLApiRepository from '../repositories/JQLApiRepository.js';
import type {
	TableDataInterface,
	TicketOperationResult,
} from '../types/task-progress.js';
import type {Pull} from '../contracts/Pull.js';
import {STATUS_PATTERNS} from '../constants/task.js';

const jqlRepo = new JQLApiRepository();

export const useTicketOperations = () => {
	const handleDoneTicket = useCallback(
		async (ticketId: string): Promise<TicketOperationResult> => {
			try {
				const statuses = await jqlRepo.getTransitionByTicketId(ticketId);
				const doneId = statuses.transitions.find(transition =>
					STATUS_PATTERNS.DONE.test(transition.name),
				)?.id;

				if (doneId) {
					await jqlRepo.codeReviewTicket(ticketId, doneId);
					return {success: true};
				}
				return {success: false, error: 'Done status not found'};
			} catch (error) {
				const errorMessage =
					error instanceof Error ? error.message : 'Unknown error';
				console.error('Failed to done ticket:', error);
				return {success: false, error: errorMessage};
			}
		},
		[],
	);

	const handleCodeReviewTicket = useCallback(
		async (
			ticket: TableDataInterface,
			pull: Pull,
		): Promise<TicketOperationResult> => {
			try {
				const statuses = await jqlRepo.getTransitionByTicketId(ticket.key);
				const codeReviewId = statuses.transitions.find(transition =>
					STATUS_PATTERNS.REVIEW.test(transition.name),
				)?.id;

				if (STATUS_PATTERNS.REVIEW.test(ticket.status)) {
					const doneId = statuses.transitions.find(transition =>
						STATUS_PATTERNS.DONE.test(transition.name),
					)?.id;

					if (doneId && pull.merged_at && ticket.storyPoint) {
						return await handleDoneTicket(ticket.key);
					}
					return {success: true};
				}

				if (codeReviewId) {
					await jqlRepo.codeReviewTicket(ticket.key, codeReviewId);
					if (pull.merged_at && ticket.storyPoint) {
						return await handleDoneTicket(ticket.key);
					}
					return {success: true};
				}
				return {success: false, error: 'Code review status not found'};
			} catch (error) {
				const errorMessage =
					error instanceof Error ? error.message : 'Unknown error';
				console.error('Failed to review ticket:', error);
				return {success: false, error: errorMessage};
			}
		},
		[handleDoneTicket],
	);

	const handleHoldTicket = useCallback(
		async (
			ticket: TableDataInterface,
		): Promise<TicketOperationResult> => {
			try {
				const statuses = await jqlRepo.getTransitionByTicketId(ticket.key);
				const onHoldId = statuses.transitions.find(transition =>
					STATUS_PATTERNS.HOLD.test(transition.name),
				)?.id;

				if (onHoldId && STATUS_PATTERNS.PROGRESS.test(ticket.status)) {
					await jqlRepo.holdTicket(ticket.key, onHoldId);
					return {success: true};
				}

				if (STATUS_PATTERNS.REVIEW) {
					// handleDoneTicket(ticket.key)
				}

				return {
					success: false,
					error: 'Hold status not available or ticket not in progress',
				};
			} catch (error) {
				const errorMessage =
					error instanceof Error ? error.message : 'Unknown error';
				console.error('Failed to hold ticket:', error);
				return {success: false, error: errorMessage};
			}
		},
		[],
	);

	const handleCodeReviewFromHold = useCallback(
		async (
			ticket: TableDataInterface,
			pull: Pull,
		): Promise<TicketOperationResult> => {
			try {
				let statuses = await jqlRepo.getTransitionByTicketId(ticket.key);
				const inProgressId = statuses.transitions.find(transition =>
					STATUS_PATTERNS.PROGRESS.test(transition.name),
				)?.id;

				if (inProgressId) {
					await jqlRepo.codeReviewTicket(ticket.key, inProgressId);

					statuses = await jqlRepo.getTransitionByTicketId(ticket.key);
					const codeReviewId = statuses.transitions.find(transition =>
						STATUS_PATTERNS.REVIEW.test(transition.name),
					)?.id;

					if (codeReviewId) {
						await jqlRepo.codeReviewTicket(ticket.key, codeReviewId);
						if (pull.merged_at && ticket.storyPoint) {
							return await handleDoneTicket(ticket.key);
						}
						return {success: true};
					}
					return {success: true};
				}
				return {success: false, error: 'In Progress status not found'};
			} catch (error) {
				const errorMessage =
					error instanceof Error ? error.message : 'Unknown error';
				console.error('Failed to review ticket from hold:', error);
				return {success: false, error: errorMessage};
			}
		},
		[handleDoneTicket],
	);

	return {
		handleDoneTicket,
		handleCodeReviewTicket,
		handleHoldTicket,
		handleCodeReviewFromHold,
	};
};
