import { t } from "elysia";
import { TimelineEntry } from "./case.types";

const APPLICATION_STATUS_CONST = ["completed", "in_progress", "require_action", "pending"] as const;
type ApplicationStatusType = (typeof APPLICATION_STATUS_CONST)[number];

type ApplicationType = {
  title: string,
  description?: string,
  category: string,
  status?: ApplicationStatusType,
  open_date: Date,
  handled_by: number,
  consumer_id?: number,
  consumer_name: string,
  consumer_phone: number,
  consumer_age?: number,
  consumer_address?: string,
  consumer_documents?: string[],
  timeline?: TimelineEntry[],
}

const ApplicationSchema = t.Object({
  title: t.String(),
  description: t.Optional(t.String()),
  category: t.String(),
  status: t.Optional(t.Enum(Object.fromEntries(APPLICATION_STATUS_CONST.map(x => [x, x])))),
  open_date: t.Date(),
  handled_by: t.Number(),
  consumer_id: t.Optional(t.Number()),
  consumer_name: t.String(),
  consumer_phone: t.Number(),
  consumer_age: t.Optional(t.Number()),
  consumer_address: t.Optional(t.String()),
  consumer_documents: t.Optional(t.Array(t.String())),
  timeline: t.Optional(t.Array(t.Object({
    id: t.Number(),
    title: t.String(),
    description: t.Optional(t.String()),
    completedAt: t.Optional(t.Date()),
  }))),
});


export { APPLICATION_STATUS_CONST, ApplicationStatusType, ApplicationType, ApplicationSchema };
