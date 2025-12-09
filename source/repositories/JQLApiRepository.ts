import { Issues } from "../contracts/Issues.js";
import { Transitions } from "../contracts/Transition.js";
import ApiService from "../services/ApiService.js";

export default class JQLApiRepository {
  service: ApiService

  constructor() {
    this.service = new ApiService();
  }

  async assignedBugs() {
    const resp = await this.service.client.get("/search/jql", {
      params: {
        fields: "assignee,customfield_10024,statusCategory,summary,status,changelog,issuetype",
        expand: "changelog",
        jql: `assignee in(64103adf7222b08f3e705ecf) and issuetype = Bug and created <= now() ORDER BY created DESC`,
      }
    })

    return resp.data as Issues
  }

  async assignedTasks() {
    const resp = await this.service.client.get("/search/jql", {
      params: {
        fields: "assignee,customfield_10024,statusCategory,summary,status,changelog,issuetype",
        expand: "changelog",
        maxResults: 10,
        jql: `assignee in(64103adf7222b08f3e705ecf) and issuetype in("Sub-task Engineer") ORDER BY cf[10195] DESC, status DESC`,
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

  async getBugs(issues = "") {
    const resp = await this.service.client.get("/search/jql", {
      params: {
        fields: "assignee,customfield_10024,statusCategory,summary,status,changelog,issuetype",
        expand: "changelog",
        maxResults: 5000,
        jql: `Key in(${issues})`
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
}

