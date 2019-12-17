import MainLayout from '../layout/layout';
import Setting from '../setting/setting';
import Theme from '../setting/themes';
import DataSource from '../data/dataSource';
import Control from './control';
// 保存kline的实例
export default class Manager {
  static instance

  constructor() {
    this.canvas = {};
    this.layout = {};
    this.setting = new Setting();
    this.option = {};
    this.dataSource = new DataSource();
    this.theme = new Theme();
    this.candlestickMovePoint = {};
    this.movePoints = [];
    this.requestPending = false;
    Manager.instance = this;
  }

  setOption(option) {
    this.option = option;
  }

  getOption() {
    this.setting.init({
      symbol: this.option.symbol,
      period: this.option.period,
    });
    return this.option;
  }

  // 绑定canvas
  bindCanvas() {
    const mainCanvas = document.querySelector('#chart_mainCanvas');
    const overlayCanvas = document.querySelector('#chart_overlayCanvas');
    const mainContext = mainCanvas.getContext('2d');
    const overlayContext = overlayCanvas.getContext('2d');
    this.canvas.mainCanvas = mainCanvas;
    this.canvas.overlayCanvas = overlayCanvas;
    this.canvas.mainContext = mainContext;
    this.canvas.overlayContext = overlayContext;
  }

  // 初始化布局
  initLayout() {
    this.layout = new MainLayout('mainLayout');
    this.layoutResize();
  }

  // 调整各个layout, area的大小 与 位置
  layoutResize() {
    const left = 0;
    const right = this.canvas.mainCanvas.width;
    const top = 0;
    const bottom = this.canvas.mainCanvas.height;
    this.layout.updateLayout({ left, right, top, bottom });
  }

  // 跳转大小
  onSize(w, h) {
    const width = w || window.innerWidth;
    const height = h || window.innerHeight;
    const { element } = this.getOption();
    const container = $(element);
    container.css({
      width: `${width}px`,
      height: `${height}px`,
    });
    this.canvas.mainCanvas.width = width;
    this.canvas.mainCanvas.height = height;
    this.canvas.overlayCanvas.width = width;
    this.canvas.overlayCanvas.height = height;
    this.dataSource.updateMaxCountInLayout();
  }


  // 重绘主视图
  redrawMain(x = 0) {
    this.layout.drawMainLayout();
    const { layouts } = this.layout;
    for (let i = layouts.length - 1; i >= 0; i--) {
      layouts[i].drawChartLayout(x);
    }
  }

  // 重绘over视图
  redrawOver() {
    this.layout.drawOverLayout();
  }

  // 开始绘制
  startDraw() {
    this.requestData();
  }

  switchSymbol(symbol) {
    this.setting.setSymbol(symbol);
    this.requestData();
  }

  switchPeriod(period) {
    this.setting.setPeriod(period);
    this.requestData();
  }

  // 请求数据
  requestData() {
    const { setting } = this;
    this.getBars({
      firstDataRequest: true,
      startTime: new Date().getTime(),
      symbol: setting.getSymbol(),
      period: setting.getPeriod(),
      chartType: setting.chartType,
    });
  }

  // 请求数据
  getBars(requestParam) {
    if (this.requestPending) return;
    this.requestPending = true;
    const { datafeed } = this.getOption();
    // 计算当前蜡烛图最大可显示的数量
    const requestCount = this.dataSource.maxCountInLayout * 3;
    const { firstDataRequest, startTime, symbol, period, chartType } = requestParam;
    datafeed.getBars(chartType, symbol, period, startTime, requestCount, this.onHistoryCallback, firstDataRequest);
  }

  // 请求历史数据处理
  onHistoryCallback(data, option = {
    firstDataRequest: false,
  }) {
    const that = Manager.instance;
    const { dataSource } = that;
    dataSource.updateData(data);
    that.initLayout();
    that.redrawMain();
    that.requestPending = false;
    option.firstDataRequest || Control.leftMousePut();
  }

  onMouseDown(place) {
    this.layout.onMouseDown(place);
    // this.movePoints = [].concat(JSON.parse(JSON.stringify(this.candlestickMovePoint)));
  }

  onMouseMove(place, leftMouseDownStatus) {
    // eslint-disable-next-line no-unused-expressions
    this.layout && this.layout.onMouseMove(place, leftMouseDownStatus);
  }

  onMouseUp() {
  }

  onMouseLeave(e) {
    this.layout.onMouseLeave(e);
  }

  // updateCandlestickMovePoint(points) {
  //   this.candlestickMovePoint = points;
  // }
}
