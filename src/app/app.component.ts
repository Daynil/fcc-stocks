import { Component } from '@angular/core';
import { HTTP_PROVIDERS } from '@angular/http';

import { AttributionComponent } from './shared/attribution.component';
import { StockGraphComponent } from './stock-graph/stock-graph.component';
import { StockService } from './shared/stock.service';

@Component({
  moduleId: module.id,
  selector: 'my-app',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.css'],
  directives: [AttributionComponent, StockGraphComponent],
  providers: [HTTP_PROVIDERS, StockService]
})
export class AppComponent {
  
  constructor() { 
  }

}