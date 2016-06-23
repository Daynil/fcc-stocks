import { EventEmitter, Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import "rxjs/add/operator/toPromise";
import * as d3 from "d3";
import * as _ from "lodash";

import { parseJson, handleError } from '../shared/http-helpers';
import { DataPoint, Stock } from './stock.model';
import { RandomColorGen } from './color-gen.util';
import { SocketService } from './socket.service';


@Injectable()
export class StockService {

  stockList: Stock[] = [];
  stockAdded: EventEmitter<Stock> = new EventEmitter<Stock>();

  w = 1100;
  h = 350;
  paddingX = 40;
  paddingY = 5;
  rawGraph: HTMLDivElement;
  chartRef: d3.Selection<any>;
  xScale: d3.time.Scale<number, number>;
  yScale: d3.scale.Linear<number, number>;  
  xAxis: d3.svg.Axis;
  yAxis: d3.svg.Axis;
  lineFunc: d3.svg.Line<DataPoint>;
  axisTimeFormat: d3.time.Format;
  displayTimeFormat: d3.time.Format = d3.time.format('%B %d, %Y');
  selectedDate: string = 'Selected Date';

  lineRef: HTMLDivElement;
  leftBase = 317;
  relativeX = 0;
  mouseX = 0;
  colorGen: RandomColorGen;

  constructor(private http: Http, private socketService: SocketService) {
    // How do we dependency inject a utility with configurable paramater?
    this.colorGen = new RandomColorGen(12);
    
    // Listen for stocks added/removed by other clients and sync
    this.socketService.pushStock.subscribe( (outsiderStock) => {
      // Dates are sent over the wire stringified, reformat for compatability
      outsiderStock.data = outsiderStock.data.map(dataPt => {
        dataPt.date = this.formatDate(dataPt.date);
        return dataPt;
      });
      this.addStocktoChart(outsiderStock);
    });
    
    this.socketService.removeStock.subscribe( (outsideRemovedStock) => {
      // Dates are sent over the wire stringified, reformat for compatability
      outsideRemovedStock.data = outsideRemovedStock.data.map(dataPt => {
        dataPt.date = this.formatDate(dataPt.date);
        return dataPt;
      });
      this.removeStock(outsideRemovedStock, false);
    });
    
  }

  updateMouseX(mouseX: number) {
    this.mouseX = mouseX;
    this.relativeX = mouseX - this.rawGraph.offsetLeft - 32;
    if (this.relativeX < 0 + this.paddingX || this.relativeX > this.w) this.lineRef.style.display = 'none';
    else this.showLine();
  }

  createGraph(graph: HTMLDivElement, line: HTMLDivElement) {
    this.rawGraph = graph;
    this.chartRef = d3.select(graph)
                      .append('svg')
                      .attr('width', this.w + 'px')
                      .attr('height', this.h + 'px');

    this.lineRef = line;
    this.lineRef.style.display = 'none';
    
    this.axisTimeFormat = d3.time.format("%b '%y");

    this.xScale = d3.time.scale();
    this.yScale = d3.scale.linear();
    this.xAxis = d3.svg.axis().orient('bottom');
    this.yAxis = d3.svg.axis().orient('left');

    // Draw axis first
    this.chartRef.append('g')
                  .attr('transform', `translate(0, ${this.h - this.paddingX})`)
                  .attr('class', 'x axis');
    this.chartRef.append('g')
                  .attr('transform', `translate(${this.paddingX}, 0)`)
                  .attr('class', 'y axis');

    this.lineFunc = d3.svg.line<DataPoint>()
                          .x((d, i) => this.xScale(d.date))
                          .y(d => this.yScale(d.price));
  }

  addStocktoChart(stockInfo: Stock) {
    // Reject duplicates
    let duplicateStock = _.find(this.stockList, d => d.symbol === stockInfo.symbol);
    if (typeof duplicateStock !== 'undefined') return;

    this.stockList.push(stockInfo);

    this.updateScales();

    // Apply list of stocks as new data
    let lines = this.chartRef.selectAll('.line')
                              .data(this.stockList.map(stockCol => stockCol.data));

    // Transition existing lines
    lines.transition().duration(500)
          .attr('d', this.lineFunc);

    // Add non-existing lines
    lines.enter()
          .append('svg:path')
          .attr('class', (d, i) => 'line ' + this.stockList[i].symbol)
          .attr('d', this.lineFunc)
          .attr('fill', 'none')
          .attr('stroke', (d, i) => this.stockList[i].color)
          .attr('stroke-width', 1.5);
    lines.exit();
  }

  removeStock(stock: Stock, selfInitiated: boolean) {
    if (selfInitiated) this.socketService.emitRemovedStock(stock);
    _.remove(this.stockList, d => d.symbol === stock.symbol);
    this.updateScales();

    // Remove stock line
    d3.select(`.${stock.symbol}`).remove();

    // Apply list of stocks as new data
    let lines = this.chartRef.selectAll('.line')
                              .data(this.stockList.map(stockCol => stockCol.data));

    // Transition existing lines
    lines.transition().duration(500)
          .attr('d', this.lineFunc);
  }

  updateScales() {
    // Find appropriate scale based on min and max values in stock collection
    let minDate = d3.max(this.stockList, d => {
      return d3.min( d.data, d2 => {
        return d2.date.getTime();
      })
    } );
    let maxDate = d3.max(this.stockList, d => Date.parse(d.newestDate));

    let minPrice = 999999;
    let maxPrice = 0;
    this.stockList.forEach(stockCol => {
      let stockMinPrice = d3.min(stockCol.data, d => d.price);
      let stockMaxPrice = d3.max(stockCol.data, d => d.price);
      if (stockMinPrice < minPrice) minPrice = stockMinPrice;
      if (stockMaxPrice > maxPrice) maxPrice = stockMaxPrice; 
    });

    this.xScale.domain([minDate, maxDate]).range([this.paddingX, this.w]);
    this.yScale.domain([minPrice, maxPrice]).range([this.h - this.paddingX, this.paddingX]);

    // Update x-axis labels
    this.xAxis.scale(this.xScale).tickFormat(this.axisTimeFormat);
    this.yAxis.scale(this.yScale).ticks(6);

    this.chartRef.selectAll('g.x.axis').transition().duration(500).call(this.xAxis);
    this.chartRef.selectAll('g.y.axis').transition().duration(500).call(this.yAxis);
    this.chartRef.selectAll('.axis line, .axis path')
                  .attr('stroke', 'aliceblue')
                  .attr('shape-rendering', 'crispEdges')
                  .attr('fill', 'none')
                  .attr('color', 'aliceblue')
                  .attr('stroke-width', 1);

    this.chartRef.selectAll('.axis text')
                  .attr('font-size', '12px')
                  .attr('fill', 'aliceblue')
                  .attr('shape-rendering', 'crispEdges');
  }

  showLine() {
    this.lineRef.style.display = '';
    this.lineRef.style.left = this.mouseX + 'px';
    let xDate = this.xScale.invert(this.relativeX);
    let strippedXDate = this.formatDate(xDate.toDateString());
    this.stockList.forEach(stock => {
      let selectedPrice = _.find( stock.data, d => d.date.getTime() == strippedXDate.getTime() );
      if (typeof selectedPrice != 'undefined') {
        this.selectedDate = this.displayTimeFormat(selectedPrice.date);
        stock.priceSelected = selectedPrice.price;
      }
    });
  }

  getExistingStocks() {
    return this.http
                .get('/api/getexistingstocks')
                .toPromise()
                .then(parseJson)
                .then((res: Array<any>) => {
                  let formattedStockList = res.map(unformedStock => {
                    return this.formatDbResponse(unformedStock);
                  });
                  return formattedStockList;
                })
                .then((existingStocks: Stock[]) => {
                  existingStocks.forEach(stock => {
                    this.addStocktoChart(stock);
                  });
                })
                .catch(handleError)                
  }

  getStockData(stockSymbol: string) {
    return this.http
                .get(`/api/getstockdata/${stockSymbol}`)
                .toPromise()
                .then(parseJson)
                .then(this.formatQuandlResponse.bind(this))
                .then( (res: Stock) => {
                  this.stockAdded.emit(res);
                  this.socketService.emitStock(res);
                  return res;
                })
                .then(stockInfo => this.addStocktoChart(stockInfo))
                .catch(handleError);
  }

  private formatQuandlResponse(dataset): Stock {
    let data = dataset.dataset;
    let formattedData: Stock = <Stock>{};
    formattedData.symbol = data.dataset_code;
    let nameEnd = data.name.indexOf('(') - 1;
    formattedData.name = data.name.slice(0, nameEnd);
    formattedData.newestDate = data.newest_available_date;
    formattedData.oldestDate = data.oldest_available_date;
    formattedData.data = [];
    data.data.forEach(dayData => {
      let strippedDate = this.formatDate(dayData[0])
      let formattedDayData = {
        date: strippedDate,
        price: dayData[1]
      };
      formattedData.data.push(formattedDayData);
    });
    formattedData.color = this.colorGen.randomColor();
    return formattedData;
  }

  private formatDbResponse(stock): Stock {
    let formattedStock: Stock = stock;
    formattedStock.data = stock.data.map(dataPt => {
      dataPt.date = this.formatDate(dataPt.date);
      return dataPt;
    });
    return formattedStock;
  }

  private formatDate(stringyDate: string): Date {
    let numberDate = new Date(stringyDate);
    return new Date(numberDate.getUTCFullYear(), numberDate.getUTCMonth(), numberDate.getUTCDate());
  }

}