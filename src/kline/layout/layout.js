import { Area, ChartArea, RangeArea, TimelineArea } from './area';
import Timeline from '../range/timeline';
import Range from '../range/range';
import Manager from '../manage/manager';
import * as Plotters from '../plotters/plotters';

class TimelineLayout extends Area {
  constructor(name) {
    super(name);
    this.timelineArea = {};
    this.timeline = new Timeline('timeline');
    this.initLayout();
  }

  drawChartLayout() {
    this.timeline.updateTimeline();
    new Plotters.TimelinePlotter().draw(this);
  }

  drawChartLayoutOverInfo(selectedInfo) {
    new Plotters.TimelineInfoPlotter().draw(this, selectedInfo.index);
  }

  initLayout() {
    this.updateTimelineArea(new TimelineArea('timelineArea'));
  }

  updateLayout(place) {
    this.layout(place);
    const { left, right, top, bottom } = place;
    const { rangeWidth } = Manager.instance.dataSource;
    this.timelineArea.layout({ left, right: right - rangeWidth, top, bottom });
  }

  updateTimelineArea(area) {
    this.timelineArea = area;
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

class ChartLayout extends Area {
  constructor(option) {
    super(option.name);
    this.chartArea = {};
    this.rangeArea = {};
    this.chartPlotters = option.chartPlotters;
    this.chartInfoPlotters = option.chartInfoPlotters;
    this.range = new Range({
      name: `${option.name}Range`,
      boundaryGap: option.boundaryGap,
      indicator: option.indicator,
    });
    this.initLayout();
  }

  drawChartLayout(moveX = 0) {
    // 更新chart的range
    this.range.updateRange(this);
    new Plotters.BackgroundGridPlotter().draw(this);
    // 绘制range
    new Plotters.RangePlotter().draw(this);
    // 绘制主视图
    new Plotters[this.chartPlotters]().draw(this, moveX);
  }

  drawChartLayoutOverInfo(selectedInfo) {
    new Plotters[this.chartInfoPlotters]().draw(this, selectedInfo.index);
    this.drawChartLayoutRangeInfo(selectedInfo.y);
  }

  drawChartLayoutRangeInfo(y) {
    const { top, bottom } = this.rangeArea;
    if (y <= top || y >= bottom) return;
    new Plotters.RangeInfoPlotter().draw(this, y);
  }

  // 初始化
  initLayout() {
    this.updateChartArea(new ChartArea(`${this.name}Area`));
    this.updateRangeArea(new RangeArea(`${this.name}Range`));
  }

  // 根据area的变化调整layout布局
  updateLayout(place) {
    this.layout(place);
    const { left, right, top, bottom } = place;
    const { rangeWidth } = Manager.instance.dataSource;
    this.chartArea.layout({ left, right: right - rangeWidth, top, bottom });
    this.rangeArea.layout({ left: right - rangeWidth, right, top, bottom });
  }

  // 设置chartArea
  updateChartArea(area) {
    this.chartArea = area;
  }

  // 设置rangeArea
  updateRangeArea(area) {
    this.rangeArea = area;
  }

  onMouseDown(place) {
    const { x, y } = place;
    if (this.chartArea.contains(x, y)) this.chartArea.onMouseDown(place);
    if (this.rangeArea.contains(x, y)) this.rangeArea.onMouseDown(place);
  }

  onMouseMove(place, leftMouseDownStatus) {
    const { x, y } = place;
    if (this.chartArea.contains(x, y)) this.chartArea.onMouseMove(place, leftMouseDownStatus);
    if (this.rangeArea.contains(x, y)) this.rangeArea.onMouseMove(place, leftMouseDownStatus);
  }
}

// 整体布局
export default class MainLayout extends Area {
  constructor(name) {
    super(name);
    this.layouts = [];
    this.initLayout();
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

  onMouseLeave(place) {
    this.layouts.forEach(item => {
      item.onMouseLeave(place);
    });
  }
}
