import { NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';

/** Convert ISO date string "YYYY-MM-DD" to NgbDateStruct */
export function isoToNgbDate(iso: string): NgbDateStruct {
  const parts = iso.split('-');
  return {
    year: parseInt(parts[0], 10),
    month: parseInt(parts[1], 10),
    day: parseInt(parts[2], 10)
  };
}

/** Convert NgbDateStruct back to ISO string "YYYY-MM-DD" */
export function ngbDateToIso(d: NgbDateStruct): string {
  const month = String(d.month).padStart(2, '0');
  const day = String(d.day).padStart(2, '0');
  return `${d.year}-${month}-${day}`;
}

/** Convert NgbDateStruct to a native Date for comparison */
export function ngbDateToDate(d: NgbDateStruct): Date {
  return new Date(d.year, d.month - 1, d.day);
}

/** Format NgbDateStruct for display as "MM.DD.YYYY" */
export function formatNgbDate(d: NgbDateStruct | null): string {
  if (!d) return '';
  const month = String(d.month).padStart(2, '0');
  const day = String(d.day).padStart(2, '0');
  return `${month}.${day}.${d.year}`;
}
