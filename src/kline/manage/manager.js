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
    const requestCount = this.dataSource.maxCountInLayout * 2;
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
    const { firstDataRequest } = option;
    const that = Manager.instance;
    const { dataSource } = that;
    // 首次加载与loadmore加载分开处理
    firstDataRequest ? dataSource.initData(data) : dataSource.updateData(data);
    firstDataRequest && that.initLayout();
    that.redrawMain();
    that.requestOption.requestPending = false;
  }

  // 校验数据当前请求状态 return 再次请求 无需请求 请求完成(已经加载完所有数据)
  checkDataRequestStatus() {
    const { dataSource } = this;
    const { firstIndex, candleLeftOffest } = dataSource;
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
    console.log('onLeave');
    Control.clearOverView();
  }

  onMouseUp() {
    this.checkDataRequestStatus();
    console.log('onMouseUp');
  }
}
