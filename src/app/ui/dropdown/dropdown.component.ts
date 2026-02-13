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
  templateUrl: './dropdown.component.html',
  styleUrls: ['./dropdown.component.scss']
})
export class DropdownComponent {
  @Input() panelClass = '';
  @Input() align: 'left' | 'right' = 'left';
  @Input() autoCloseOthers = false;

  isOpen = false;
  private static currentOpenDropdown: DropdownComponent | null = null;

  constructor(private elRef: ElementRef) {}

  toggle(event: MouseEvent): void {
    event.stopPropagation();
    this.isOpen = !this.isOpen;
    if (this.autoCloseOthers && this.isOpen) {
      // Close any previously open dropdown
      if (DropdownComponent.currentOpenDropdown && DropdownComponent.currentOpenDropdown !== this) {
        DropdownComponent.currentOpenDropdown.close();
      }
      DropdownComponent.currentOpenDropdown = this;
    }
  }

  close(): void {
    if (this.isOpen) {
      this.isOpen = false;
      if (this.autoCloseOthers && DropdownComponent.currentOpenDropdown === this) {
        DropdownComponent.currentOpenDropdown = null;
      }
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.isOpen && !this.elRef.nativeElement.contains(event.target)) {
      this.close();
    }
  }
}
