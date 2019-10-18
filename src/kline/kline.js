import Manager from './manage/manager';
import MainTpl from './view/mainTpl';
import './style/main.scss';

export default class Kline {
  constructor(option) {
    this.element = '#kline_container';
    this.width = 1200;
    this.height = 650;
    this.datafeed = {};
    Object.assign(this, option);
    this.init();
    return this;
  }

  // 初始化
  init() {
    const manager = new Manager();
    this.initTemplate();
    manager.setOption(this);
    manager.bindCanvas();
    manager.onSize(this.width, this.height);
    manager.registerMouseEvent();
    manager.initLayout();
    manager.startDraw();
  }

  // 初始化模板
  initTemplate() {
    const mainView = $.parseHTML(MainTpl);
    $(this.element).html(mainView);
  }
}
