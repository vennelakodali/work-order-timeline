/**
 * Work Center Document - represents production lines, machines, or work areas
 * where work orders are scheduled.
 */
export interface WorkCenterDocument {
  docId: string;
  docType: 'workCenter';
  data: {
    name: string;
  };
}
