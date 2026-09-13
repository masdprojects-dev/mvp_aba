import { Component } from '@angular/core';

import { Kanban } from './features/kanban/kanban';
import { Navbar } from './shared/components/navbar/navbar';

@Component({
  selector: 'app-root',
  imports: [
    Navbar,
    Kanban,
  ],
  template: `
    <app-navbar />
    <app-kanban />
  `,
})
export class App {}