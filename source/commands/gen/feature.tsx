import React, { useEffect } from 'react';
import {Text} from 'ink';
import zod from 'zod';
import path from 'node:path';
import {makeDirectory} from "make-dir";
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { Listr } from 'listr2';
import replaceString from 'replace-string';

const projectDirectoryPath = process.cwd();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const templatePath = path.resolve(__dirname, "../../../source/templates");
const fromPath = (file: string) => path.join(path.resolve(__dirname, templatePath), file);
const toPath = (rootPath: string, file: any) => path.join(rootPath, file);

const copyWithTemplate = async (from = "" , to: any, name = "") => {
	const dirname = path.dirname(to);
	await makeDirectory(dirname);

	const source = await fs.readFile(from, 'utf8');
	let generatedSource = source;

	if (name) {
		generatedSource = replaceString(source, "%feature%", name);
	}

	await fs.writeFile(to, generatedSource);
};

export const options = zod.object({
	feature: zod.string().describe('feature')
});

type Props = {
	options: zod.infer<typeof options>;
};

export default function Feature({options}: Props) {
	const tasks = new Listr([
		{
			title: `Generating ${options.feature}Endpoint.ts`,
			async task() {
				const endpointPath = path.resolve(projectDirectoryPath, "src/app/infrastructures/endpoints")
				await copyWithTemplate(
					fromPath("Endpoint.ts.tpl"),
					toPath(endpointPath, `${options.feature}Endpoint.ts`),
					options.feature
				)
			}
		},
		{
			title: `Generating ${options.feature}ApiRepository.ts`,
			async task() {
				const apiRepositoryPath = path.resolve(projectDirectoryPath, "src/app/infrastructures/repositories/api")
				await copyWithTemplate(
					fromPath("ApiRepository.ts.tpl"),
					toPath(apiRepositoryPath, options.feature + 'ApiRepository.ts'),
					options.feature
				)
			}
		},
		{
			title: `Generating ${options.feature}RepositoryInterface.ts`,
			async task() {
				const repositoryInterface = path.resolve(projectDirectoryPath, "src/data/persistences/repositories/contracts")
				await copyWithTemplate(
					fromPath("RepositoryInterface.ts.tpl"),
					toPath(repositoryInterface, options.feature + 'RepositoryInterface.ts'),
					options.feature
				)
			}
		},
		{
			title: `Generating ${options.feature}Presenter.ts`,
			async task() {
				const presenterPath = path.resolve(projectDirectoryPath, "src/app/ui/presenters")
				await copyWithTemplate(
					fromPath("Presenter.ts.tpl"),
					toPath(presenterPath, options.feature + 'Presenter.ts'),
					options.feature
				)
			}
		},
		{
			title: `Generating ${options.feature}Mapper.ts`,
			async task() {
				const presenterPath = path.resolve(projectDirectoryPath, "src/data/persistences/mappers")
				await copyWithTemplate(
					fromPath("Mapper.ts.tpl"),
					toPath(presenterPath, options.feature + 'Mapper.ts'),
					options.feature
				)
			}
		},
		{
			title: `Generating ${options.feature}Component.ts`,
			async task() {
				const dIPath = path.resolve(projectDirectoryPath, "src/app/infrastructures/dependencies/modules")
				await copyWithTemplate(
					fromPath("DI.ts.tpl"),
					toPath(dIPath, options.feature + 'Component.ts'),
					options.feature
				)
			}
		},
	])

	useEffect(() => {
		tasks.run();
	}, [])

	return <Text></Text>
}
