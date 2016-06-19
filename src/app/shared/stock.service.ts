import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import "rxjs/add/operator/toPromise";
import * as d3 from "d3";

import { parseJson, handleError } from '../shared/http-helpers';
import { DataPoint, Stock } from './stock.model';


@Injectable()
export class StockService {

  stockList: Stock[] = [];

  w = 1100;
  h = 350;
  paddingX = 35;
  paddingY = 5;
  chartRef: d3.Selection<any>;
  xScale: d3.time.Scale<number, number>;
  yScale: d3.scale.Linear<number, number>;  
  xAxis: d3.svg.Axis;
  yAxis: d3.svg.Axis;
  lineFunc: d3.svg.Line<DataPoint>;

  lineRef: HTMLDivElement;
  leftBase = 317;
  mouseX = 0;

  constructor(private http: Http) { }

  updateMouseX(xPos: number) {
 	  this.mouseX = xPos;
  }

  createGraph(graph: HTMLDivElement, line: HTMLDivElement) {
    this.chartRef = d3.select(graph)
                      .append('svg')
                      .attr('width', this.w + 'px')
                      .attr('height', this.h + 'px');

    this.lineRef = line;
    console.log(this.lineRef);

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
    this.stockList.push(stockInfo);

    // Find appropriate scale based on min and max values in stock collection
    let minDate = d3.min(this.stockList, d => Date.parse(d.oldestDate));
    let maxDate = d3.max(this.stockList, d => Date.parse(d.newestDate));

    let minPrice = 999999;
    let maxPrice = 0;
    this.stockList.forEach(stock => {
      let stockMinPrice = d3.min(stock.data, d => d.price);
      let stockMaxPrice = d3.max(stock.data, d => d.price);
      if (stockMinPrice < minPrice) minPrice = stockMinPrice;
      if (stockMaxPrice > maxPrice) maxPrice = stockMaxPrice; 
    });

    this.xScale.domain([minDate, maxDate]).range([this.paddingX, this.w]);
    this.yScale.domain([minPrice, maxPrice]).range([this.h - this.paddingX, this.paddingX]);

    // Update x-axis labels
    let timeFormat = d3.time.format("%b '%y");
    this.xAxis.scale(this.xScale).tickFormat(timeFormat);
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

    // Apply list of stocks as new data
    let lines = this.chartRef.selectAll('.line')
                              .data(this.stockList.map(stock => stock.data))
                              .attr('class', 'line');

    // Transition existing lines
    lines.transition().duration(500)
          .attr('d', this.lineFunc)
          .attr('fill', 'none')
          .attr('stroke', 'hsl(191, 100%, 50%)')
          .attr('stroke-width', 1.5);

    // Add non-existing lines
    lines.enter()
          .append('svg:path')
          .attr('class', 'line')
          .attr('d', this.lineFunc)
          .attr('fill', 'none')
          .attr('stroke', 'hsl(191, 100%, 50%)')
          .attr('stroke-width', 1.5);
    lines.exit();
  }

  showLine() {
    //this.lineRef.setAttribute('left', this.mouseX + 'px');
  }

  getStockData(stockSymbol: string) {
    return this.http
                .get(`/api/getstockdata/${stockSymbol}`)
                .toPromise()
                .then(parseJson)
                .then(this.formatResponse)
                .then(stockInfo => this.addStocktoChart(stockInfo))
                .catch(handleError);
  }

  private formatResponse(dataset) {
    let data = dataset.dataset;
    let formattedData: Stock = <Stock>{};
    formattedData.symbol = data.dataset_code;
    let nameEnd = data.name.indexOf('(') - 1;
    formattedData.name = data.name.slice(0, nameEnd);
    formattedData.newestDate = data.newest_available_date;
    formattedData.oldestDate = data.oldest_available_date;
    formattedData.data = [];
    data.data.forEach(dayData => {
      let numberDate = new Date(dayData[0]);
      let formattedDayData = {
        date: numberDate,
        price: dayData[1]
      };
      formattedData.data.push(formattedDayData);
    });
    return formattedData;
  }

}