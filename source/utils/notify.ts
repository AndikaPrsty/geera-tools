import {NotifySend} from 'node-notifier';
import os from 'os';
import {exec} from 'child_process';

const notifier = new NotifySend();

export const notify = (
	title = '',
	message = '',
	urgency: '' | 'warning' | 'critical' | undefined = undefined,
) => {
	if (os.platform() === 'android') {
		exec(
			`termux-notification --title "${title}" --content "${message}" --sound`,
		);
		exec('termux-vibrate -d 3000');
	} else {
		notifier.notify({
			title,
			message,
			urgency,
		});
	}
};
