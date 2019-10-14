import { Area, ChartArea, RangeArea } from './area';
import Manager from '../manage/manager';

class Layout extends Area {
  constructor(name) {
    super(name);
    this.type = 'layout';
  }
}

// 横线 行布局
class LandscapeLayout extends Layout {
  constructor(name) {
    super(name);
    this.chartArea = null;
    this.rangeArea = null;
  }

  // 初始化
  initLayout() {
    const { name } = this;
    this.setChartArea(new ChartArea(`${name}Area`));
    if (name !== 'timeLine') {
      this.setRangeArea(new RangeArea(`${name}Range`));
    }
  }

  // 根据area的变化调整layout布局
  updateLayout(place) {
    const { left, right, top, bottom } = place;
    this.layout(place);
    if (this.rangeArea) {
      const rangeWidth = 100;
      this.chartArea.layout({ left, right: right - rangeWidth, top, bottom });
      this.rangeArea.layout({ left: right - rangeWidth, right, top, bottom });
    } else {
      this.chartArea.layout(place);
    }
  }

  // 设置chartArea
  setChartArea(area) {
    this.chartArea = area;
  }

  // 设置rangeArea
  setRangeArea(area) {
    this.rangeArea = area;
  }
}

// 整体布局
export default class MainLayout extends Layout {
  constructor(name) {
    super(name);
    this.landscapeLayout = [];
    this.initLayout();
  }

  // 初始化布局
  initLayout() {
    // 时间线
    const timeLineLandscapeLayout = new LandscapeLayout('timeLine');
    timeLineLandscapeLayout.initLayout();
    this.addLayout(timeLineLandscapeLayout);
    // 主视图
    const mainLandscapeLayout = new LandscapeLayout('main');
    mainLandscapeLayout.initLayout();
    this.addLayout(mainLandscapeLayout);
  }

  // 添加layout
  addLayout(layout) {
    this.landscapeLayout.push(layout);
  }

  // 调整layout布局
  updateLayout(place) {
    const { left, right, top, bottom } = place;
    this.layout(place);
    const { timeLineAreaHeight } = Manager.instance.setting;
    let toTalheight = bottom - top;
    let height = 0;
    this.landscapeLayout.forEach((item, index) => {
      if (index === 0) {
        height = timeLineAreaHeight;
      } else if (index === this.landscapeLayout.length - 1) {
        height = toTalheight;
      } else {
        height = (bottom - top) / 5;
      }
      toTalheight -= height;
      item.updateLayout({ left, right, top: toTalheight, bottom });
    });
  }
}
