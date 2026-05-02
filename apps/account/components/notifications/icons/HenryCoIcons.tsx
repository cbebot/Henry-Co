/**
 * Customer-side icon entry point. The icon implementations now live in
 * @henryco/notifications-ui so apps/account and the staff workspace
 * apps (PR-β) render the same bespoke HenryCo glyphs without duplicate
 * SVG paths.
 */

export {
  ArchiveIcon,
  DeleteForeverIcon,
  DeleteIcon,
  EmptyStateGlyph,
  HenryCoBell,
  MarkReadIcon,
  RestoreIcon,
  SeverityInfoIcon,
  SeveritySecurityIcon,
  SeveritySuccessIcon,
  SeverityUrgentIcon,
  SeverityWarningIcon,
} from "@henryco/notifications-ui/icons";
