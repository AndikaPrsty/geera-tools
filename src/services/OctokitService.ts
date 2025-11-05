import { Octokit } from "@octokit/core"

Octokit

export class OctokitService {
  client: Octokit;

  constructor() {
    this.client = new Octokit({auth: process.env.GITHUB_TOKEN})
  }
}

