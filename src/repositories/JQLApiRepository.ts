import { Issues } from "../contracts/Issues.js";
import { Pull } from "../contracts/Pull.js";
import { Transitions } from "../contracts/Transition.js";
import ApiService from "../services/ApiService.js";
import { OctokitService } from "../services/OctokitService.js";

export default class JQLApiRepository {
  service: ApiService
  octo: OctokitService

  constructor() {
    this.service = new ApiService();
    this.octo = new OctokitService();
  }

  async assignedBugs(status: string) {
    const resp = await this.service.client.get("/search/jql", {
      params: {
        fields: "assignee,customfield_10024,statusCategory,summary,status,changelog,issuetype",
        expand: "changelog",
        jql: `assignee in(64103adf7222b08f3e705ecf) and created >= 2025-10-01 and created <= 2025-10-30 and type = Bug and status = '${status}'`,
      }
    })

    return resp.data as Issues
  }

  async assignedTasks(status: string) {
    const resp = await this.service.client.get("/search/jql", {
      params: {
        fields: "assignee,customfield_10024,statusCategory,summary,status,changelog,issuetype",
        expand: "changelog",
        jql: `assignee in(64103adf7222b08f3e705ecf) and created >= 2025-10-01 and created <= 2025-10-30 and status = '${status}'`,
      }
    })

    return resp.data as Issues
  }

  async onGoingTasks() {
    const resp = await this.service.client.get("/search/jql", {
      params: {
        fields: "assignee,customfield_10024,statusCategory,summary,status,changelog,issuetype",
        expand: "changelog",
        jql: `assignee in(64103adf7222b08f3e705ecf) and created >= 2025-10-01 and created <= 2025-12-30 and status in('In Progress')`,
      }
    })

    return resp.data as Issues
  }

  async getTransitionByTicketId(ticketId = ""): Promise<Transitions> {
    const resp = await this.service.client.get(
      `/issue/${ticketId}/transitions`
    )

    return resp.data as Transitions;
  }

  async holdTicket(ticketId = "", onHoldId = ""): Promise<Transitions> {
    const resp = await this.service.client.request({
      headers: {
        'Content-Type': 'application/json'
      },
      method: "POST",
      url: `/issue/${ticketId}/transitions`,
      data: JSON.stringify({
        transition: {
          id: onHoldId
        }
      })
    })

    return resp.data as Transitions;
  }

  async codeReviewTicket(ticketId = "", codeReviewId = ""): Promise<Transitions> {
    const resp = await this.service.client.request({
      headers: {
        'Content-Type': 'application/json'
      },
      method: "POST",
      url: `/issue/${ticketId}/transitions`,
      data: JSON.stringify({
        transition: {
          id: codeReviewId
        }
      })
    })

    return resp.data as Transitions;
  }

  async getOpenPullRequestByTicketId() {
    const resp = await this.octo.client.request("GET /repos/{owner}/{repo}/pulls?page=1&per_page=200", {
      owner: "Lionparcel",
      repo: "medusa"
    })

    return resp.data as Pull[];
  }

  async sendDiscordWebhook(payload: string) {
    await this.service.discordClient.request({
      headers: {
        'Content-Type': 'application/json'
      },
      method: "POST",
      url: process.env.DISCORD_CHANNEL_WEBHOOK,
      data: payload
    })

    return true;
  }
}

