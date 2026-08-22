import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Lead } from '../models/lead.model';

@Injectable({
  providedIn: 'root',
})
export class LeadsMock {
  private readonly http = inject(HttpClient);

  getLeads(): Observable<Lead[]> {
    return this.http.get<Lead[]>('/mocks/leads.json');
  }
}