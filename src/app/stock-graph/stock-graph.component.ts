import { AfterViewInit, Component, ElementRef,
         OnInit, ViewChild } from '@angular/core';

import { StockService } from '../shared/stock.service';

@Component({
  moduleId: module.id,
  selector: 'stock-graph',
  templateUrl: 'stock-graph.component.html',
  styleUrls: ['stock-graph.component.css']
})
export class StockGraphComponent implements AfterViewInit, OnInit {

  @ViewChild('graph') graph: ElementRef;

  constructor(private stockService: StockService) { }

  ngOnInit() { }

  ngAfterViewInit() {
    this.stockService.createGraph(this.graph.nativeElement);
  }

}