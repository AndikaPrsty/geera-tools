import React from 'react';
import {option} from 'pastel';
import {useEffect, useState} from 'react';
import zod from 'zod';
import JQLApiRepository from '../../repositories/JQLApiRepository.js';
import Table from '../../components/table.js';
import moment from 'moment';
import {Box, Text} from 'ink';

const JQLRepo = new JQLApiRepository();

interface TableDataInterface {
	key: string;
	summary: string;
	assignee: string;
	storyPoint: string;
}

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

export default function Tasks({options}: Props) {
	const [loading, setLoading] = useState(false);
	const [tableData, setTableData] = useState<any[]>([]);
	const [timer, setTimer] = useState('');

	const fetchAssignedTask = async () => {
		try {
			setLoading(true);
			const resp = await JQLRepo.assignedTasks();

			const data = resp.issues.map(issue => {
				return {
					key: issue.key,
					summary: issue.fields.summary,
					assignee: issue.fields.assignee.displayName,
					storyPoint: issue.fields.customfield_10024?.toString() || '-',
				} as TableDataInterface;
			});

			setTableData(data);
			if (!options.watch) return;

			const fa = moment(new Date().getTime() + options.interval * 1000);

			const intervalId = setInterval(() => {
				const endTime = moment(fa);
				const now = moment();
				const diff = endTime.diff(now);
				setTimer(moment(diff).format('mm:ss'));
			}, 100);

			setTimeout(() => {
				clearInterval(intervalId);
				fetchAssignedTask();
			}, options.interval * 1000);
		} catch (error) {
			console.log(error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchAssignedTask();
	}, []);

	if (loading) {
		return <Text>loading...</Text>;
	}

	return (
		<Box flexDirection="column">
			{options.watch ? <Text>refecthing in {timer}</Text> : null}
			<Table data={tableData} />
		</Box>
	);
}
