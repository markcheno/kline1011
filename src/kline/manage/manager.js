import MainLayout from '../layout/layout';
import Setting from '../setting/setting';
import Theme from '../setting/themes';
import DataSource from '../data/dataSource';
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
    Manager.instance = this;
  }

  setOption(option) {
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
  }


  redraw(x) {
    this.layout.drawChartLayout();
    const { layouts } = this.layout;
    layouts.forEach(item => {
      item.drawChartLayout(x);
    });
  }

  // 开始绘制
  startDraw() {
    this.requestData();
  }

  // 请求数据
  requestData() {
    const { datafeed } = this.getOption();
    datafeed.getBars(this.onHistoryCallback);
  }

  // 请求历史数据处理
  onHistoryCallback(data) {
    const that = Manager.instance;
    const { dataSource } = that;
    dataSource.updateData(data);
    that.initLayout();
    that.redraw();
  }

  onMouseDown(place) {
    this.layout.onMouseDown(place);
    this.movePoints = [].concat(JSON.parse(JSON.stringify(this.candlestickMovePoint)));
  }

  onMouseMove(place, leftMouseDownStatus) {
    // eslint-disable-next-line no-unused-expressions
    this.layout && this.layout.onMouseMove(place, leftMouseDownStatus);
  }

  onMouseUp() {
  }

  updateCandlestickMovePoint(points) {
    this.candlestickMovePoint = points;
  }
}
