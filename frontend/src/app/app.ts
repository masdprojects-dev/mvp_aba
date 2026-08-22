import { Component } from '@angular/core';

import { Kanban } from './features/kanban/kanban';

@Component({
  selector: 'app-root',
  imports: [Kanban],
  template: '<app-kanban />',
})
export class App {}