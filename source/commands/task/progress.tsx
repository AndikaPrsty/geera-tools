import React from 'react';
import {option} from 'pastel';
import {useEffect} from 'react';
import zod from 'zod';
import Table from '../../components/table.js';
import {Box, Text} from 'ink';
import {useTaskFetching} from '../../hooks/useTaskFetching.js';

export const options = zod.object({
	watch: zod
		.boolean()
		.default(false)
		.describe(
			option({
				description: 'interval refetching',
				defaultValueDescription: 'false',
			}),
		),
	interval: zod
		.number()
		.default(60)
		.describe(
			option({
				description: 'interval in second (s)',
				defaultValueDescription: '60',
			}),
		),
});

type Props = {
	options: zod.infer<typeof options>;
};

export default function Progress({options}: Props) {
	const {state, startFetching, cleanupTimers} = useTaskFetching({
		watch: options.watch,
		interval: options.interval,
	});

	useEffect(() => {
		startFetching();

		// Cleanup on unmount
		return () => {
			cleanupTimers();
		};
	}, [startFetching, cleanupTimers]);

	if (state.loading && !state.tableData.length) {
		return <Text>loading...</Text>;
	}

	if (!state.tableData.length) {
		return (
			<Box flexDirection="column">
				{options.watch ? <Text>refetching in {state.timer}</Text> : null}
				<Text>no data found...</Text>
			</Box>
		);
	}

	return (
		<Box flexDirection="column">
			{state.loading ? <Text>loading...</Text> : options.watch ? <Text>refetching in {state.timer}</Text> : null}
			<Table data={state.tableData} />
		</Box>
	);
}
