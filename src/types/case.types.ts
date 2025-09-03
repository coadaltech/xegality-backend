import { t } from "elysia";
import { PRACTICE_AREAS_CONST, PracticeAreasType } from "./user.types";


const STATUS_CONST = ["pending", "active", "closed", "opened"] as const;
type StatusType = (typeof STATUS_CONST)[number];

const PRIRORITY_CONST = ["low", "normal", "important", "urgent", "emergency"] as const;
type PriorityType = (typeof PRIRORITY_CONST)[number];

type TimelineEntry = {
  id: number;
  title: string;
  description?: string;
  completedAt?: Date;
};

type PostCaseType = {
  title: string,
  description: string,
  type: PracticeAreasType,
  assigned_to: string,
  status?: StatusType,
  priority?: PriorityType,
  open_date: Date,
  consumer_id?: number,
  consumer_name: string,
  consumer_phone: number,
  consumer_age: number,
  consumer_address: string,
  consumer_documents?: string[],
  timeline?: TimelineEntry[],
}

const PostCaseSchema = t.Object({
  title: t.String(),
  description: t.String(),
  type: t.Enum(Object.fromEntries(PRACTICE_AREAS_CONST.map(area => [area, area]))),
  assigned_to: t.String(),
  status: t.Optional(t.Enum(Object.fromEntries(STATUS_CONST.map(x => [x, x])))),
  priority: t.Optional(t.Enum(Object.fromEntries(PRIRORITY_CONST.map(x => [x, x])))),
  open_date: t.Date(),
  consumer_id: t.Optional(t.Number()),
  consumer_name: t.String(),
  consumer_phone: t.Number(),
  consumer_age: t.Number(),
  consumer_address: t.String(),
  consumer_documents: t.Optional(t.Array(t.String())),
  timeline: t.Optional(t.Array(t.Object({
    id: t.Number(),
    title: t.String(),
    description: t.Optional(t.String()),
    completedAt: t.Optional(t.Date()),
  }))),
});

export { TimelineEntry, PostCaseType, PostCaseSchema, STATUS_CONST, StatusType, PRIRORITY_CONST, PriorityType };
