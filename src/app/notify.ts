import { NotifySend } from "node-notifier";


const notifier = new NotifySend();

export const notify = (title = "", message = "", urgency: "" | "warning" | "critical" = undefined) => {
  notifier.notify({
    title,
    message,
    urgency
  })
}

