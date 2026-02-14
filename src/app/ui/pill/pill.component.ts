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
  @Input({ required: true }) public text!: string;
  @Input() public textColor = 'var(--primary)';
  @Input() public bgColor = 'var(--primary-bg)';
  @Input() public borderColor = 'transparent';
}
