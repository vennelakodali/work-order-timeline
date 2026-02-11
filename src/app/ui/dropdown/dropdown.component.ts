import { Component, Input, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Reusable dropdown component.
 * Uses content projection with [trigger] and [panel] slots.
 * Manages open/close state and click-outside-to-close behavior.
 */
@Component({
  selector: 'app-dropdown',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dropdown-container">
      <div class="dropdown-trigger" (click)="toggle($event)">
        <ng-content select="[trigger]"></ng-content>
      </div>
      <div
        class="dropdown-panel"
        *ngIf="isOpen"
        [class]="panelClass"
        [class.align-right]="align === 'right'"
      >
        <ng-content select="[panel]"></ng-content>
      </div>
    </div>
  `,
  styleUrls: ['./dropdown.component.scss']
})
export class DropdownComponent {
  @Input() panelClass = '';
  @Input() align: 'left' | 'right' = 'left';

  isOpen = false;

  constructor(private elRef: ElementRef) {}

  toggle(event: MouseEvent): void {
    event.stopPropagation();
    this.isOpen = !this.isOpen;
  }

  close(): void {
    this.isOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.isOpen && !this.elRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
    }
  }
}
