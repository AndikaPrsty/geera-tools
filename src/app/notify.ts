import { NotifySend } from "node-notifier";
import os from "os";
import { exec } from "child_process";


const notifier = new NotifySend();

export const notify = (title = "", message = "", urgency: "" | "warning" | "critical" = undefined) => {
  if (os.platform() === "android") {
    exec(`termux-notification --title "${title}" --content "${message}" --sound`)
  } else {
    notifier.notify({
      title,
      message,
      urgency
    })
  }
}

