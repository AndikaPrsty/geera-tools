import {Pull} from '../contracts/Pull.js';
import {OctokitService} from '../services/OctokitService.js';

export default class OctoApiRepository {
	octo: OctokitService;

	constructor() {
		this.octo = new OctokitService();
	}

	async getPullRequests() {
		const resp = await this.octo.client.request(
			'GET /repos/{owner}/{repo}/pulls?page=1&per_page=400&direction=desc&state=all',
			{
				owner: 'Lionparcel',
				repo: 'medusa',
			},
		);

		return resp.data as Pull[];
	}
}
