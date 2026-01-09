import React, {useEffect} from 'react';
import {Text} from 'ink';
import zod from 'zod';
import path from 'node:path';
import {makeDirectory} from 'make-dir';
import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';

const projectDirectoryPath = process.cwd();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const templatePath = '../templates';
const fromPath = (file: string) =>
	path.join(path.resolve(__dirname, templatePath), file);
const toPath = (rootPath: string, file: any) => path.join(rootPath, file);

const copyWithTemplate = async (from = '', to: any) => {
	const dirname = path.dirname(to);
	await makeDirectory(dirname);

	const source = await fs.readFile(from, 'utf8');
	let generatedSource = source;

	await fs.writeFile(to, generatedSource);
};

export const options = zod.object({
	name: zod.string().default('Stranger').describe('Name'),
});

type Props = {
	options: zod.infer<typeof options>;
};

export default function Index({options}: Props) {
	useEffect(() => {
		console.log(options.name);
		console.log(projectDirectoryPath);
		copyWithTemplate(
			fromPath('Endpoint.ts'),
			toPath(projectDirectoryPath, 'Endpoint.ts'),
		);
	}, []);

	return <Text>hello</Text>;
}
