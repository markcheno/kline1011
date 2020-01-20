import { layoutIndicator, mainIndicator } from '../manage/indicators';

export default class Setting {
  constructor() {
    // 品种基础属性
    this.symbol = {
      id: null,
      name: '',
      decimalDigits: 0,
    };
    this.period = null;
    // 是否支持暂时成交量视图, 取决于指标配置与传入的数据是否支持
    this.isSupportVolume = false;
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

  // 不支持成交量展示
  disabledSupportVolume() {
    this.isSupportVolume = false;
  }

  // 支持成交量展示
  enabledSupportVolume() {
    this.isSupportVolume = true;
  }

  // 获取成交量是否支持展示状态
  getSupportVolumeStatus() {
    return this.isSupportVolume;
  }

  // 添加视图
  addChart(key) {
    const chartType = this.getChartType();
    const isSupportVolume = this.getSupportVolumeStatus();
    // 分时图只支持成交量视图
    if (chartType === 'line' && key !== 'Volume') return;
    // 判断当前数据是否支持展示成交量视图
    if (!isSupportVolume && key === 'Volume') return;
    const chart = chartType === 'candle' ? this.candlechart : this.lineChart;
    // 去重
    let isRepeat = false;
    const indicator = layoutIndicator[key];
    chart.forEach(element => {
      if (element.name === indicator.name) isRepeat = true;
    });
    isRepeat || chart.unshift(indicator);
  }

  // 移除视图
  removeChart(key) {
    const chartType = this.getChartType();
    const chart = chartType === 'candle' ? this.candlechart : this.lineChart;
    const indicator = layoutIndicator[key];
    const indicatorIndex = chart.findIndex((item => item.name === indicator.name));
    indicatorIndex === -1 || chart.splice(indicatorIndex, 1);
  }

  // 移除所有的副图指标
  removeAllChart() {
    if (this.getChartType === 'line') return;
    // 目前只支持蜡烛图上移除指标
    const chart = this.candlechart.find(element => element.name === 'mainChartLayout');
    this.candlechart = [];
    this.candlechart.push(chart);
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

  // 初始化设置
  init(option) {
    const { symbol, period } = option;
    this.setPeriod(period);
    this.setSymbol(symbol);
  }

  // 设置品种相关设置
  setSymbol(symbol) {
    this.symbol = symbol || {
      id: null,
      name: '',
      decimalDigits: 0,
    };
  }

  setPeriod(period) {
    this.period = period;
  }

  getChartType() {
    return this.chartType;
  }

  setChartType(type) {
    this.chartType = type;
  }

  getSymbolId() {
    return this.symbol.id;
  }

  getSymbolName() {
    return this.symbol.name;
  }

  getSymbolDecimalDigits() {
    return this.symbol.decimalDigits || 0;
  }

  getPeriod() {
    return this.period;
  }
}
