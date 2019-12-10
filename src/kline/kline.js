import Manager from './manage/manager';
import Control from './manage/control';
import MainTpl from './view/mainTpl';
import './style/main.scss';

export default class Kline {
  constructor(option) {
    this.manager = null;
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
    this.manager = manager;
    this.initTemplate();
    manager.setOption(this);
    manager.bindCanvas();
    manager.onSize(this.width, this.height);
    Control.registerMouseEvent();
    manager.startDraw();
  }

  // 初始化模板
  initTemplate() {
    const mainView = $.parseHTML(MainTpl);
    $(this.element).html(mainView);
  }

  switchSymbol(symbol) {
    this.manager.switchSymbol(symbol);
    console.log('symbol', symbol);
  }

  switchPeriod(period) {
    this.manager.switchPeriod(period);
    console.log('period', period);
  }
}
