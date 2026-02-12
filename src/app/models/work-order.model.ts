/**
 * Work Order Status types
 */
export type WorkOrderStatus = 'open' | 'in-progress' | 'complete' | 'blocked';

/**
 * Work Order Document - represents a scheduled work order on a work center.
 */
export interface WorkOrderDocument {
  docId: string;
  docType: 'workOrder';
  data: {
    name: string;
    workCenterId: string;           // References WorkCenterDocument.docId
    status: WorkOrderStatus;
    startDate: string;              // ISO format (e.g., "2025-01-15")
    endDate: string;                // ISO format
  };
}

/**
 * Zoom/timescale levels for the timeline view
 */
export type TimescaleLevel = typeof TimescaleLevels[keyof typeof TimescaleLevels];

export const TimescaleLevels = {
  'hour': 'Hour',
  'day': 'Day',
  'week': 'Week',
  'month': 'Month'  
};

/**
 * Panel mode for the slide-out create/edit panel
 */
export type PanelMode = 'create' | 'edit';

/**
 * Status display configuration - maps status to label and color tokens
 */
export interface StatusConfig {
  value: WorkOrderStatus;
  label: string;
  textColor: string;
  bgColor: string;
  borderColor: string;
}