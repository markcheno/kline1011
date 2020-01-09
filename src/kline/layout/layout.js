import { Area, ChartArea, RangeArea, TimelineArea } from './area';
import Timeline from '../range/timeline';
import Range from '../range/range';
import Manager from '../manage/manager';
import * as Plotters from '../plotters/plotters';

class Layout extends Area {
  constructor(name) {
    super(name);
    delete this.mouseDownPlace;
  }
}

class TimelineLayout extends Layout {
  constructor(name) {
    super(name);
    this.timelineArea = new TimelineArea('timelineArea');
    this.timeline = new Timeline('timeline');
  }

  drawChartLayout() {
    this.timeline.updateTimeline();
    new Plotters.TimelinePlotter().draw(this);
  }

  drawChartLayoutOverInfo(selectedInfo) {
    new Plotters.TimelineInfoPlotter().draw(this, selectedInfo.index);
  }

  updateLayout(place) {
    this.layout(place);
    const { left, right, top, bottom } = place;
    const { rangeWidth } = Manager.instance.dataSource;
    this.timelineArea.layout({ left, right: right - rangeWidth, top, bottom });
  }

  onMouseDown(place) {
    const { x, y } = place;
    if (this.timelineArea.contains(x, y)) this.timelineArea.onMouseDown(place);
  }

  onMouseMove(place, leftMouseDownStatus) {
    const { x, y } = place;
    if (this.timelineArea.contains(x, y)) this.timelineArea.onMouseMove(place, leftMouseDownStatus);
  }
}

class ChartLayout extends Layout {
  constructor(option) {
    super(option.name);
    this.chartConfig = option.chartConfig;
    this.chart = {
      area: new ChartArea(`${this.name}Area`),
      mainPlotter: option.chartPlotters,
      chartIndicator: option.chartIndicator,
    };
    this.range = {
      area: new RangeArea(`${this.name}Range`),
      data: new Range({
        name: `${option.name}Range`,
        boundaryGap: option.boundaryGap,
        chartConfig: option.chartConfig,
        chartIndicator: option.chartIndicator,
      }),
    };
  }

  drawChartLayout() {
    const { mainPlotter } = this.chart;
    // 更新chart的range
    this.getRangeData().updateRange(this);
    new Plotters.BackgroundGridPlotter().draw(this);
    // 绘制主视图
    new Plotters[mainPlotter]().draw(this);
    // 绘制主视图指标
    new Plotters.ChartIndicatorPlotter().draw(this);
    // 绘制range
    new Plotters.RangePlotter().draw(this);
  }

  drawChartLayoutOverInfo(selectedInfo) {
    new Plotters.ChartInfoPlotters().draw(this, selectedInfo.index);
    this.drawChartLayoutRangeInfo(selectedInfo);
  }

  drawChartLayoutRangeInfo(option) {
    const { top, bottom } = this.getRangeArea();
    if (option.y <= top || option.y >= bottom) return;
    new Plotters.RangeInfoPlotter().draw(this, option);
  }

  // 根据area的变化调整layout布局
  updateLayout(place) {
    this.layout(place);
    const chartArea = this.getChartArea();
    const rangeArea = this.getRangeArea();
    const { left, right, top, bottom } = place;
    const { rangeWidth } = Manager.instance.dataSource;
    chartArea.layout({ left, right: right - rangeWidth, top, bottom });
    rangeArea.layout({ left: right - rangeWidth, right, top, bottom });
  }

  onMouseDown(place) {
    const { x, y } = place;
    const chartArea = this.getChartArea();
    const rangeArea = this.getRangeArea();
    if (chartArea.contains(x, y)) chartArea.onMouseDown(place);
    if (rangeArea.contains(x, y)) rangeArea.onMouseDown(place);
  }

  onMouseMove(place, leftMouseDownStatus) {
    const { x, y } = place;
    const chartArea = this.getChartArea();
    const rangeArea = this.getRangeArea();
    if (chartArea.contains(x, y)) chartArea.onMouseMove(place, leftMouseDownStatus);
    if (rangeArea.contains(x, y)) rangeArea.onMouseMove(place, leftMouseDownStatus);
  }

  getChartArea() {
    return this.chart.area;
  }

  getChartConfig() {
    return this.chartConfig;
  }

  getChartIndicator() {
    return this.chart.chartIndicator;
  }

  getRangeArea() {
    return this.range.area;
  }

  getRangeData() {
    return this.range.data;
  }
}

// 整体布局
export default class MainLayout extends Layout {
  constructor(name) {
    super(name);
    this.layouts = [];
    this.initLayout();
  }

  getLayouts() {
    return this.layouts;
  }

  // 初始化布局
  initLayout() {
    const { setting } = Manager.instance;
    // 时间线
    this.addLayout(new TimelineLayout('timelineLayout'));
    setting.getChart().forEach(item => {
      this.addLayout(new ChartLayout(item));
    });
  }

  // 绘制主图
  drawMainLayout() {
    new Plotters.ClearPlotter('main').draw(this);
    new Plotters.BackgroundPlotter().draw(this);
    this.drawChartLayout();
  }

  drawChartLayout() {
    this.layouts.forEach(item => {
      item.drawChartLayout();
    });
  }

  // 请空over图
  clearOverLayout() {
    new Plotters.ClearPlotter('overlay').draw(this);
  }

  // 绘制over图
  drawOverLayout() {
    this.clearOverLayout();
    const selectedInfo = new Plotters.SelectionPlotter().draw(this);
    this.drawSelectionInfo(selectedInfo);
  }

  // 绘制over图上的info信息
  drawSelectionInfo(selectedInfo) {
    new Plotters.MainInfoPlotter().draw(this, selectedInfo.index);
    this.layouts.forEach(item => {
      item.drawChartLayoutOverInfo(selectedInfo);
    });
  }

  // 添加layout
  addLayout(layout) {
    this.layouts.push(layout);
  }

  // 调整layout布局
  updateLayout(place) {
    const manager = Manager.instance;
    this.layout(place);
    const { left, right, top, bottom } = place;
    const { timelineAreaHeight } = manager.setting;
    let nowBottom = bottom - top;
    let lastBottom = bottom;
    let height = 0;
    this.layouts.forEach((item, index) => {
      if (index === 0) {
        height = timelineAreaHeight;
      } else if (index === this.layouts.length - 1) {
        height = nowBottom;
      } else {
        height = (bottom - top) / 5;
      }
      nowBottom -= height;
      item.updateLayout({ left, right, top: nowBottom, bottom: lastBottom });
      lastBottom = nowBottom;
    });
  }

  onMouseDown(place) {
    const { x, y } = place;
    if (this.contains(x, y)) {
      this.layouts.forEach(item => {
        item.onMouseDown(place);
      });
    }
  }

  onMouseMove(place, leftMouseDownStatus) {
    const { x, y } = place;
    if (this.contains(x, y)) {
      this.layouts.forEach(item => {
        item.onMouseMove(place, leftMouseDownStatus);
      });
    }
  }
}
