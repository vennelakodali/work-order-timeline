import { WorkCenterDocument } from '../models/work-center.model';
import { WorkOrderDocument } from '../models/work-order.model';

/** Helper to create ISO date strings relative to a reference date */
function offsetDate(reference: Date, offsetDays: number): string {
  const date = new Date(reference);
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().split('T')[0];
}

/** Generate sample work centers and work orders relative to today */
export function createSampleData(): {
  centers: WorkCenterDocument[];
  orders: WorkOrderDocument[];
} {
  const today = new Date();
  const d = (offset: number) => offsetDate(today, offset);

  const centers: WorkCenterDocument[] = [
    { docId: 'wc-001', docType: 'workCenter', data: { name: 'Genesis Hardware' } },
    { docId: 'wc-002', docType: 'workCenter', data: { name: 'Rodrigues Electrics' } },
    { docId: 'wc-003', docType: 'workCenter', data: { name: 'Konsulting Inc' } },
    { docId: 'wc-004', docType: 'workCenter', data: { name: 'McMarrow Distribution' } },
    { docId: 'wc-005', docType: 'workCenter', data: { name: 'Spartan Manufacturing' } }
  ];

  const orders: WorkOrderDocument[] = [
    {
      docId: 'wo-001', docType: 'workOrder',
      data: { name: 'Centrix Ltd', workCenterId: 'wc-001', status: 'complete', startDate: d(-45), endDate: d(-15) }
    },
    {
      docId: 'wo-002', docType: 'workOrder',
      data: { name: 'Rodrigues Electrics', workCenterId: 'wc-002', status: 'in-progress', startDate: d(-20), endDate: d(25) }
    },
    {
      docId: 'wo-003', docType: 'workOrder',
      data: { name: 'Konsulting Inc', workCenterId: 'wc-003', status: 'in-progress', startDate: d(-10), endDate: d(20) }
    },
    {
      docId: 'wo-004', docType: 'workOrder',
      data: { name: 'Complex Systems', workCenterId: 'wc-003', status: 'in-progress', startDate: d(25), endDate: d(60) }
    },
    {
      docId: 'wo-005', docType: 'workOrder',
      data: { name: 'McMarrow Distribution', workCenterId: 'wc-004', status: 'blocked', startDate: d(-5), endDate: d(35) }
    },
    {
      docId: 'wo-006', docType: 'workOrder',
      data: { name: 'Apex Dynamics', workCenterId: 'wc-001', status: 'open', startDate: d(10), endDate: d(30) }
    },
    {
      docId: 'wo-007', docType: 'workOrder',
      data: { name: 'Titan Forge', workCenterId: 'wc-005', status: 'complete', startDate: d(-60), endDate: d(-35) }
    },
    {
      docId: 'wo-008', docType: 'workOrder',
      data: { name: 'Nova Assembly', workCenterId: 'wc-005', status: 'open', startDate: d(5), endDate: d(40) }
    },
    {
      docId: 'wo-009', docType: 'workOrder',
      data: { name: 'Summit Logistics', workCenterId: 'wc-004', status: 'open', startDate: d(40), endDate: d(55) }
    }
  ];

  return { centers, orders };
}
