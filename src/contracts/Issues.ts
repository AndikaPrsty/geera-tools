export interface Issues {
  issues: Issue[]
  nextPageToken: string
  isLast: boolean
}


export interface Issue {
  expand: string
  id: string
  self: string
  key: string
  changelog: Changelog
  fields: Fields
}

export interface Issuetype {
  self: string
  id: string
  description: string
  iconUrl: string
  name: string
  subtask: boolean
  avatarId: number
  hierarchyLevel: number
}

export interface Changelog {
  startAt: number
  maxResults: number
  total: number
  histories: History[]
}

export interface History {
  id: string
  author: Author
  created: string
  items: Item[]
}

export interface Author {
  self: string
  accountId: string
  emailAddress?: string
  avatarUrls: AvatarUrls
  displayName: string
  active: boolean
  timeZone: string
  accountType: string
}

export interface AvatarUrls {
  "48x48": string
  "24x24": string
  "16x16": string
  "32x32": string
}

export interface Item {
  field: string
  fieldtype: string
  fieldId?: string
  from?: string
  fromString?: string
  to?: string
  toString: string
  tmpFromAccountId: any
  tmpToAccountId?: string
}

export interface Fields {
  summary: string
  assignee: Assignee
  statusCategory: StatusCategory
  customfield_10024: number
  status: Status
  issuetype: Issuetype
}

export interface Assignee {
  self: string
  accountId: string
  emailAddress: string
  avatarUrls: AvatarUrls2
  displayName: string
  active: boolean
  timeZone: string
  accountType: string
}

export interface AvatarUrls2 {
  "48x48": string
  "24x24": string
  "16x16": string
  "32x32": string
}

export interface StatusCategory {
  self: string
  id: number
  key: string
  colorName: string
  name: string
}

export interface Status {
  self: string
  description: string
  iconUrl: string
  name: string
  id: string
  statusCategory: StatusCategory2
}

export interface StatusCategory2 {
  self: string
  id: number
  key: string
  colorName: string
  name: string
}
