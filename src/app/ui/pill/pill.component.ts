import { Component, Input } from '@angular/core';

/**
 * Generic reusable pill component.
 * Can be used for status indicators, labels, or any small badge-like UI element.
 */
@Component({
  selector: 'app-pill',
  standalone: true,
  templateUrl: './pill.component.html',
  styleUrls: ['./pill.component.scss']
})
export class PillComponent {
  @Input({ required: true }) text!: string;
  @Input() textColor = 'var(--primary)';
  @Input() bgColor = 'var(--primary-bg)';
  @Input() borderColor = 'transparent';
}
