import { AfterViewInit, Component, ElementRef,
         HostListener, OnInit, ViewChild } from '@angular/core';

import { StockService } from '../shared/stock.service';

@Component({
  moduleId: module.id,
  selector: 'stock-graph',
  templateUrl: 'stock-graph.component.html',
  styleUrls: ['stock-graph.component.css']
})
export class StockGraphComponent implements AfterViewInit, OnInit {

  @ViewChild('graph') graph: ElementRef;
  @ViewChild('verticalline') verticalLine: ElementRef;

  constructor(private stockService: StockService) { }

  ngOnInit() { }

  ngAfterViewInit() {
    this.stockService.createGraph(this.graph.nativeElement, this.verticalLine.nativeElement);
    this.stockService.getExistingStocks();
  }

  @HostListener('mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    this.stockService.updateMouseX(event.clientX);
  }

}