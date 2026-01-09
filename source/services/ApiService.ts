import axios, {AxiosInstance} from 'axios';

const client = axios.create({
	baseURL: process.env['JIRA_API_URL'],
	auth: {
		username: process.env['JIRA_USERNAME'] || '',
		password: process.env['JIRA_API_TOKEN'] || '',
	},
});

export default class ApiService {
	client: AxiosInstance;

	constructor() {
		this.client = client;
	}
}
