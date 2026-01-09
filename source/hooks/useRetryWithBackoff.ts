import {useCallback, useRef} from 'react';
import {TASK_CONSTANTS} from '../constants/task.js';

export interface RetryConfig {
	maxAttempts?: number;
	baseDelay?: number;
	maxDelay?: number;
}

export const useRetryWithBackoff = () => {
	const retryCountRef = useRef(0);
	const currentTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	const executeWithRetry = useCallback(
		async <T>(
			operation: () => Promise<T>,
			config: RetryConfig = {},
		): Promise<T> => {
			const {
				maxAttempts = TASK_CONSTANTS.MAX_RETRY_ATTEMPTS,
				baseDelay = TASK_CONSTANTS.RETRY_INTERVAL_MS,
				maxDelay = 60000, // 1 minute max
			} = config;

			const attempt = async (attemptNumber: number): Promise<T> => {
				try {
					const result = await operation();
					retryCountRef.current = 0; // Reset on success
					return result;
				} catch (error) {
					if (attemptNumber >= maxAttempts) {
						throw error;
					}

					// Exponential backoff with jitter
					const delay = Math.min(
						baseDelay * Math.pow(2, attemptNumber - 1) + Math.random() * 1000,
						maxDelay,
					);

					return new Promise((resolve, reject) => {
						currentTimeoutRef.current = setTimeout(async () => {
							try {
								const result = await attempt(attemptNumber + 1);
								resolve(result);
							} catch (retryError) {
								reject(retryError);
							}
						}, delay);
					});
				}
			};

			retryCountRef.current++;
			return attempt(1);
		},
		[],
	);

	const cancelRetry = useCallback(() => {
		if (currentTimeoutRef.current) {
			clearTimeout(currentTimeoutRef.current);
			currentTimeoutRef.current = null;
		}
		retryCountRef.current = 0;
	}, []);

	return {
		executeWithRetry,
		cancelRetry,
		retryCount: retryCountRef.current,
	};
};
