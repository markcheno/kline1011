import MainLayout from '../layout/layout';
import Setting from '../setting/setting';
// 保存kline的实例
export default class Manager {
  static instance

  constructor() {
    this.canvas = {};
    this.layout = {};
    this.setting = new Setting();
    this.option = {};
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

  // 注册鼠标事件
  registerMouseEvent() {
    // 获取当前鼠标所在位置
    const getMouesePlace = e => {
      const rect = e.target.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      return { x, y };
    };
    $(this.canvas.overlayCanvas).bind('contextmenu', e => {
      // 注册鼠标右键事件
      e.cancelBubble = true;
      e.returnValue = false;
      e.preventDefault();
      e.stopPropagation();
      return false;
    }).mousedown(e => {
      // 注册左键按下事件
      if (e.which !== 1) return;
      const place = getMouesePlace(e);
      console.log(place);
    }).mousemove(e => {
      // 注册鼠标移动事件
      const place = getMouesePlace(e);
      console.log(place);
    }).mouseleave(e => {
      // 注册鼠标离开区域事件
      const place = getMouesePlace(e);
      console.log(place);
    }).mouseup(e => {
      // 注册鼠标左键抬起事件
      if (e.which !== 1) return;
      const place = getMouesePlace(e);
      console.log(place);
    });
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
}
