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
    this.timeline.updateTimeline(this);
    new Plotters.TimelinePlotter().draw(this);
  }

  initLayout() {
    this.updateTimelineArea(new TimelineArea('timelineArea'));
  }

  updateLayout(place) {
    this.layout(place);
    const { left, right, top, bottom } = place;
    this.timelineArea.layout({ left, right: right - this.rangeWidth, top, bottom });
  }

  updateTimelineArea(area) {
    this.timelineArea = area;
  }
}

class ChartLayout extends Area {
  constructor(option) {
    super(option.name);
    this.chartArea = {};
    this.rangeArea = {};
    this.chartPlotters = option.chartPlotters;
    this.range = new Range({
      name: `${option.name}Range`,
      boundaryGap: option.boundaryGap,
      indicator: option.indicator,
    });
    this.initLayout();
  }

  drawChartLayout() {
    // 更新chart的range
    this.range.updateRange(this);
    new Plotters.BackgroundGridPlotter().draw(this);
    // 绘制range
    new Plotters.RangePlotter().draw(this);
    // 绘制主视图
    new Plotters[this.chartPlotters]().draw(this);
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
    this.chartArea.layout({ left, right: right - this.rangeWidth, top, bottom });
    this.rangeArea.layout({ left: right - this.rangeWidth, right, top, bottom });
  }

  // 设置chartArea
  updateChartArea(area) {
    this.chartArea = area;
  }

  // 设置rangeArea
  updateRangeArea(area) {
    this.rangeArea = area;
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
    // 时间线
    this.addLayout(new TimelineLayout('timelineLayout'));
    this.addLayout(new ChartLayout({
      chartPlotters: 'VolumePlotter',
      name: 'volumeChartLayout',
      boundaryGap: ['10%', '0%'],
      indicator: {
        min: 0,
        max: 'volume',
      },
    }));
    // 主视图
    this.addLayout(new ChartLayout({
      chartPlotters: 'CandlestickPlotter',
      name: 'mainChartLayout',
      boundaryGap: ['10%', '10%'],
      indicator: {
        min: 'low',
        max: 'high',
      },
    }));
  }

  drawChartLayout() {
    new Plotters.BackgroundPlotter().draw(this);
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
    manager.dataSource.updateMaxCountInArea(right - left);
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
}
