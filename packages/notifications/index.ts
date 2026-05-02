// Customer audience
export { publishNotification } from "./publish";

export {
  DIVISIONS,
  SEVERITIES,
  type Division,
  type Severity,
  type PublishInput,
  type PublishResult,
  type PublishOk,
  type PublishErr,
  type PublishErrorCode,
} from "./types";

export {
  EVENT_TYPES,
  getEventTypeSpec,
  applyDeepLinkTemplate,
  type EventTypeId,
  type EventTypeSpec,
} from "./event-types";

// Staff (operator) audience — V2-NOT-02-A
export { publishStaffNotification } from "./staff-publish";

export {
  type StaffPublishInput,
  type StaffPublishResult,
  type StaffPublishOk,
  type StaffPublishErr,
  type StaffPublishErrorCode,
  type StaffRecipient,
} from "./staff-types";

export {
  STAFF_EVENT_TYPES,
  getStaffEventTypeSpec,
  type StaffEventTypeId,
  type StaffEventTypeSpec,
} from "./staff-event-types";
