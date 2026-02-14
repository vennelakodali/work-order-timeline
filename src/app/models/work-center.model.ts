/**
 * Work Center Document - represents production lines, machines, or work areas
 * where work orders are scheduled.
 */
export type WorkCenterDocument = {
  docId: string;
  docType: 'workCenter';
  data: {
    name: string;
  };
}
