import { t } from "elysia";
import { PRACTICE_AREAS_CONST, PracticeAreasType } from "./user.types";


const STATUS_CONST = ["pending", "active", "closed", "opened", "completed"] as const;
type StatusType = (typeof STATUS_CONST)[number];

const PRIRORITY_CONST = ["low", "medium", "important", "urgent", "emergency"] as const;
type PriorityType = (typeof PRIRORITY_CONST)[number];

type TimelineEntry = {
  id: number;
  title: string;
  description?: string;
  completedAt?: Date;
};

const CaseSchema = t.Object({
  id: t.Optional(t.String()),
  title: t.Optional(t.String()),
  description: t.Optional(t.String()),
  type: t.Optional(t.Enum(Object.fromEntries(PRACTICE_AREAS_CONST.map(area => [area, area])))),
  assigned_to: t.Optional(t.String()),
  status: t.Optional(t.Enum(Object.fromEntries(STATUS_CONST.map(x => [x, x])))),
  priority: t.Optional(t.Enum(Object.fromEntries(PRIRORITY_CONST.map(x => [x, x])))),
  open_date: t.Optional(t.String({ format: "date" })),
  consumer_id: t.Optional(t.Number()),
  consumer_name: t.Optional(t.String()),
  consumer_phone: t.Optional(t.Number()),
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

export { TimelineEntry, CaseSchema, STATUS_CONST, StatusType, PRIRORITY_CONST, PriorityType };
