/**
 * Earn-With-Us Engine — pure visibility predicate (doctrine Engine 6).
 *
 * Every buyer page quietly carries "the other side of this" at the END of
 * the page: an honest invitation into the provider/seller/teacher role,
 * with a REAL server-computed proof number. Never shown to a user already
 * enrolled in that role — an invitation you've accepted is noise.
 */

export function shouldShowInvite(role: string, enrolledRoles: string[]): boolean {
  if (!role) return false;
  return !enrolledRoles.includes(role);
}
