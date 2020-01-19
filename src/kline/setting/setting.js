import { layoutIndicator, mainIndicator } from '../manage/indicators';

export default class Setting {
  constructor() {
    this.symbol = null;
    this.period = null;
    // 保留小数点
    this.decimalDigits = 2;
    this.chartPadding = {
      left: 0,
      right: 0,
    };
    this.timelineAreaHeight = 30;
    // candle 蜡烛图 line 分时图
    this.chartType = 'line';
    this.candlechart = [{
      name: 'mainChartLayout',
      chartPlotters: 'CandlestickPlotter',
      boundaryGap: ['20%', '20%'],
      chartIndicator: {},
      chartConfig: {
        sign: 'Candle',
      },
    }];
    this.lineChart = [{
      name: 'lineChartLayout',
      chartPlotters: 'LineChartPlotter',
      boundaryGap: ['20%', '50%'],
      chartConfig: {
        sign: 'Line',
      },
    }];
  }

  // 添加视图
  addChart(key) {
    const chartType = this.getChartType();
    if (chartType === 'line' && key !== 'Volume') return;
    const chart = chartType === 'candle' ? this.candlechart : this.lineChart;
    // 去重
    let isRepeat = false;
    const indicator = layoutIndicator[key];
    chart.forEach(element => {
      if (element.name === indicator.name) isRepeat = true;
    });
    isRepeat || chart.unshift(indicator);
  }

  // 添加主视图上的指标
  addMainChartIndicator(key) {
    // 目前只支持蜡烛图上添加指标
    if (this.getChartType === 'line') return;
    const chart = this.candlechart.find(element => element.name === 'mainChartLayout');
    const { chartIndicator } = chart;
    const indicator = mainIndicator[key];
    if (!indicator) return;
    chartIndicator[key] = indicator;
  }

  // 移除主视图上的指标
  removeMainChartIndicator(key) {
    if (this.getChartType === 'line') return;
    // 目前只支持蜡烛图上移除指标
    const chart = this.candlechart.find(element => element.name === 'mainChartLayout');
    const { chartIndicator } = chart;
    delete chartIndicator[key];
  }

  // 移除主视图上的所有指标
  removeAllMainIndicator() {
    if (this.getChartType === 'line') return;
    // 目前只支持蜡烛图上移除指标
    const chart = this.candlechart.find(element => element.name === 'mainChartLayout');
    chart.chartIndicator = {};
  }

  getChart() {
    return this.chartType === 'candle' ? this.candlechart : this.lineChart;
  }

  init(option) {
    const { symbol, period, decimalDigits } = option;
    this.setPeriod(period);
    this.setSymbol(symbol);
    this.setDecimalDigits(decimalDigits);
  }

  setSymbol(symbol) {
    this.symbol = symbol;
  }

  setPeriod(period) {
    this.period = period;
  }

  setDecimalDigits(decimalDigits) {
    this.decimalDigits = decimalDigits;
  }

  getChartType() {
    return this.chartType;
  }

  setChartType(type) {
    this.chartType = type;
  }

  getSymbol() {
    return this.symbol;
  }

  getPeriod() {
    return this.period;
  }
}
