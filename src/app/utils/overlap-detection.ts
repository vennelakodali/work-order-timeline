import { WorkOrderDocument } from '../models/work-order.model';

/**
 * Check if a proposed date range overlaps with any order in the list.
 * Two ranges [s1, e1] and [s2, e2] overlap if s1 < e2 AND s2 < e1.
 *
 * @param existingOrders - Orders on the same work center to check against
 * @param startDate - ISO date string for the proposed start
 * @param endDate - ISO date string for the proposed end
 * @param excludeOrderId - Optional order ID to exclude (for edit mode)
 * @returns Error message string if overlap detected, null otherwise
 */
export function checkOverlap(
  existingOrders: WorkOrderDocument[],
  startDate: string,
  endDate: string,
  excludeOrderId?: string
): string | null {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();

  const ordersToCheck = excludeOrderId
    ? existingOrders.filter(wo => wo.docId !== excludeOrderId)
    : existingOrders;

  for (const order of ordersToCheck) {
    const orderStart = new Date(order.data.startDate).getTime();
    const orderEnd = new Date(order.data.endDate).getTime();

    if (start < orderEnd && orderStart < end) {
      return `Overlap detected with "${order.data.name}" (${order.data.startDate} to ${order.data.endDate}). Please adjust the dates.`;
    }
  }

  return null;
}
