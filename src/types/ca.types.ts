import { t } from "elysia";
import { TimelineEntry } from "./case.types";
import { LEGAL_SERVICES_CONST } from "./ca/applications.types";

const APPLICATION_STATUS_CONST = ["completed", "in_progress", "require_action", "pending"] as const;
type ApplicationStatusType = (typeof APPLICATION_STATUS_CONST)[number];

// Define the TimelineSchema for applications
const ApplicationTimelineSchema = t.Object({
  id: t.Number(),
  title: t.String(),
  description: t.Optional(t.String()),
  completedAt: t.Optional(t.Date()),
});

// Schema for creating a new application
const CreateApplicationSchema = t.Object({
  title: t.String(),
  description: t.Optional(t.String()),
  category: t.Enum(Object.fromEntries(LEGAL_SERVICES_CONST.map(x => [x, x]))),
  status: t.Optional(t.Enum(Object.fromEntries(APPLICATION_STATUS_CONST.map(x => [x, x])))),
  open_date: t.Date(),
  handled_by: t.Number(),
  ca_name: t.String(),
  consumer_id: t.Optional(t.Number()),
  consumer_name: t.String(),
  consumer_phone: t.Number(),
  consumer_age: t.Optional(t.Number()),
  consumer_address: t.Optional(t.String()),
  consumer_documents: t.Optional(t.Array(t.String())),
  timeline: t.Optional(t.Array(ApplicationTimelineSchema)),
});

// Schema for updating an existing application
const UpdateApplicationSchema = t.Object({
  id: t.String(),
  title: t.Optional(t.String()),
  description: t.Optional(t.String()),
  category: t.Optional(t.Enum(Object.fromEntries(LEGAL_SERVICES_CONST.map(x => [x, x])))),
  status: t.Optional(t.Enum(Object.fromEntries(APPLICATION_STATUS_CONST.map(x => [x, x])))),
  open_date: t.Optional(t.Date()),
  handled_by: t.Optional(t.Number()),
  ca_name: t.Optional(t.String()),
  consumer_id: t.Optional(t.Number()),
  consumer_name: t.Optional(t.String()),
  consumer_phone: t.Optional(t.Number()),
  consumer_age: t.Optional(t.Number()),
  consumer_address: t.Optional(t.String()),
  consumer_documents: t.Optional(t.Array(t.String())),
  timeline: t.Optional(t.Array(ApplicationTimelineSchema)),
});

// Schema for application data returned from API
const ApplicationSchema = t.Object({
  id: t.String(),
  title: t.String(),
  description: t.Optional(t.String()),
  category: t.Enum(Object.fromEntries(LEGAL_SERVICES_CONST.map(x => [x, x]))),
  status: t.Enum(Object.fromEntries(APPLICATION_STATUS_CONST.map(x => [x, x]))),
  open_date: t.Date(),
  handled_by: t.Number(),
  ca_name: t.String(),
  consumer_id: t.Number(),
  consumer_name: t.String(),
  consumer_phone: t.Number(),
  consumer_age: t.Optional(t.Number()),
  consumer_address: t.Optional(t.String()),
  consumer_documents: t.Optional(t.Array(t.String())),
  timeline: t.Optional(t.Array(ApplicationTimelineSchema)),
  updated_at: t.Optional(t.Date()),
});

export { 
  APPLICATION_STATUS_CONST, 
  ApplicationStatusType, 
  CreateApplicationSchema, 
  UpdateApplicationSchema, 
  ApplicationSchema,
  ApplicationTimelineSchema 
};
