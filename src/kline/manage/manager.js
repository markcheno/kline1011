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
    this.requestOption = {
      // 请求pending状态
      requestPending: false,
      // 数据是否已经加载完毕
      noData: false,
    };
    Manager.instance = this;
  }

  setOption(option) {
    this.setting.init({
      symbol: option.symbol,
      period: option.period,
      decimalDigits: option.decimalDigits,
    });
    this.option = option;
  }

  getOption() {
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

  // 初始化副图指标
  initIndicatorChart() {
    const layoutIndicator = this.getOption().layoutIndicator || [];
    const symbol = this.setting.getSymbol().id;
    const isShowVolume = symbol === 6;
    layoutIndicator.forEach(element => {
      this.setting.addChart(element);
    });
    // chartType === 'candle' && this.setting.addChart('MACD');
    // chartType === 'candle' && this.setting.addChart('VR');
    // chartType === 'candle' && this.setting.addChart('WR');
    // chartType === 'candle' && this.setting.addChart('RSI');
    // chartType === 'candle' && this.setting.addChart('KDJ');
    // chartType === 'candle' && this.setting.addChart('CCI');
    // chartType === 'candle' && this.setting.addChart('BIAS');
    if (isShowVolume) {
      this.setting.addChart('Volume');
    }
  }

  // 初始化主图指标
  initMainIndicator() {
    const mainIndicator = this.getOption().mainIndicator || [];
    mainIndicator.forEach(element => {
      this.setting.addMainChartIndicator(element);
    });
  }

  // 添加主图指标
  addMainIndicator(indicator) {
    const chartType = this.setting.getChartType();
    if (chartType === 'line') return;
    this.setting.addMainChartIndicator(indicator);
    this.dataSource.calcMainIndicator(indicator);
    this.redrawMain();
  }

  // 移除对应主图指标
  removeMainIndicator(indicator) {
    const chartType = this.setting.getChartType();
    if (chartType === 'line') return;
    this.setting.removeMainChartIndicator(indicator);
    this.redrawMain();
  }

  // 移除所有的主图指标
  removeAllMainIndicator() {
    const chartType = this.setting.getChartType();
    if (chartType === 'line') return;
    this.setting.removeAllMainIndicator();
    this.redrawMain();
  }

  // 初始化布局
  initLayout() {
    // 初始化副图指标
    this.initIndicatorChart();
    this.initMainIndicator();
    this.layout = new MainLayout('mainLayout');
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
    const devicePixelRatio = 1;
    const width = w || window.innerWidth;
    const height = h || window.innerHeight;
    const { element } = this.getOption();
    const container = $(element);
    container.css({
      width: `${width}px`,
      height: `${height}px`,
    });
    this.canvas.mainCanvas.width = width * devicePixelRatio;
    this.canvas.mainCanvas.height = height * devicePixelRatio;
    this.canvas.overlayCanvas.width = width * devicePixelRatio;
    this.canvas.overlayCanvas.height = height * devicePixelRatio;
    this.dataSource.updateMaxCountInLayout();
  }


  // 重绘主视图
  redrawMain() {
    this.layout.drawMainLayout();
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

  switchLine() {
    this.setting.setChartType('line');
    this.requestData();
  }

  switchCandle() {
    this.setting.setChartType('candle');
    this.requestData();
  }

  // 首次请求数据
  requestData() {
    this.getBars({
      startTime: new Date().getTime(),
      firstDataRequest: true,
    });
  }

  // load more 数据
  loadMoreData() {
    const { dataSource } = this;
    const { firstIndex } = dataSource;
    const firstData = dataSource.getDataByIndex(firstIndex);
    this.getBars({
      startTime: firstData.time,
      firstDataRequest: false,
    });
  }

  // 请求数据
  getBars(requestParam) {
    const { requestPending } = this.requestOption;
    if (requestPending) return;
    this.requestOption.requestPending = true;
    const { datafeed } = this.getOption();
    const { setting } = this;
    // 计算当前蜡烛图最大可显示的数量
    const requestCount = 199;
    const { startTime, firstDataRequest } = requestParam;
    datafeed.getBars({
      chartType: setting.chartType,
      symbol: setting.getSymbol(),
      period: setting.getPeriod(),
      startTime,
      requestCount,
      firstDataRequest,
      onHistoryCallback: this.onHistoryCallback,
    });
  }

  // 请求历史数据处理
  onHistoryCallback(data, option) {
    const { firstDataRequest, noData } = option;
    const that = Manager.instance;
    const { dataSource } = that;
    that.requestOption.noData = noData;
    // 首次加载与loadmore加载分开处理
    if (firstDataRequest) {
      that.initLayout();
      dataSource.initData(data);
      that.layoutResize();
      that.redrawMain();
      // 分时图初始化需显示十字线
      dataSource.isInitShowCross();
    } else {
      dataSource.updateData(data);
      that.layoutResize();
      that.redrawMain();
    }
    that.requestOption.requestPending = false;
  }

  // 更新最后一个点的数据
  updateLastData(data) {
    this.dataSource.updateLastData(data);
  }

  // 校验数据当前请求状态 再次请求 无需请求 请求完成(已经加载完所有数据)
  checkDataRequestStatus() {
    const { dataSource, setting } = this;
    if (setting.chartType === 'line') return;
    const { firstIndex, candleLeftOffest } = dataSource;
    if (this.requestOption.noData) return;
    if (firstIndex <= 0 && candleLeftOffest >= 0) {
      this.loadMoreData();
    }
  }

  onMouseDown(place) {
    this.layout.onMouseDown(place);
  }

  onMouseMove(place, leftMouseDownStatus) {
    this.layout && this.layout.onMouseMove(place, leftMouseDownStatus);
  }

  onMouseLeave() {
    this.checkDataRequestStatus();
    Control.clearOverView();
  }

  onMouseUp() {
    this.checkDataRequestStatus();
  }
}
