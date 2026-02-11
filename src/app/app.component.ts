import { Component } from '@angular/core';
import { TimelineComponent } from './components/timeline/timeline.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [TimelineComponent],
  template: `
    <div class="app-container">
      <header class="app-header">
        <span class="logo">NAOLOGIC</span>
      </header>
      <app-timeline />
    </div>
  `,
  styles: [`
    .app-container {
      display: flex;
      flex-direction: column;
      height: 100vh;
      background: var(--bg-white);
      padding: 20px 24px;
      overflow: hidden;
    }
    .app-header {
      flex-shrink: 0;
      margin-bottom: 6px;
    }
    .logo {
      font-family: var(--font-family);
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 2px;
      color: var(--primary);
      text-transform: uppercase;
    }
  `]
})
export class AppComponent {}
