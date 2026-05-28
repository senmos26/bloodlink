import { appointmentTools } from "./appointmentTools";
import { profileTools } from "./profileTools";
import { centerTools } from "./centerTools";
import { notificationTools } from "./notificationTools";

export const sangbotTools = {
  ...appointmentTools,
  ...profileTools,
  ...centerTools,
  ...notificationTools,
} as const;
