/**
 * Get the sheet name for event registrations
 * @param eventId The ID of the event
 * @returns The sheet name for event registrations
 */
export function getEventRegistrationsSheet(eventId: string): string {
  return `Event_${eventId}_Registrations`;
} 