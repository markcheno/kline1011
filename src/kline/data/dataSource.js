import Manager from '../manage/manager';

export default class DataSource {
  // 更新数据策略
  static updateMode = {
    DoNothing: 0,
    Refresh: 1,
    Update: 2,
    Append: 3,
  };

  static candleStick = {
    itemWidth: [1, 3, 3, 5, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29],
    spaceWidth: [1, 1, 2, 2, 3, 3, 3, 3, 3, 3, 5, 5, 5, 5, 7, 7, 7],
  };

  constructor() {
    // 原数据
    this.data = [];
    // 当前时间段数据
    this.currentData = [];
    // 保留小数点
    this.decimalDigits = 0;
    // range 宽度
    this.rangeWidth = 0;
    this.firstIndex = -1;
    this.lastIndex = -1;
    this.scale = 10;
    this.maxCountInArea = -1;
    this.maxCountInLayout = -1;
    // 记录蜡烛图最左侧被遮盖的距离
    this.candleLeftOffest = 0;
    this.savedCandleLeftOffest = 0;
    this.crossCursorSelectAt = {
      x: 0,
      y: 0,
      index: -1,
    };
    this.lineTimeArray = [];
  }

  getColumnWidth() {
    const candleStickMode = DataSource.candleStick;
    return candleStickMode.itemWidth[this.scale] + candleStickMode.spaceWidth[this.scale];
  }

  getColumnCenter() {
    const candleStickMode = DataSource.candleStick;
    return candleStickMode.itemWidth[this.scale] / 2;
  }

  getSpaceWidth() {
    const candleStickMode = DataSource.candleStick;
    return candleStickMode.spaceWidth[this.scale];
  }

  // 计算最大蜡烛图个数
  updateMaxCountInArea() {
    const width = Manager.instance.canvas.mainCanvas.width - this.rangeWidth;
    const columnWidth = this.getColumnWidth();
    this.maxCountInArea = Math.ceil(width / columnWidth);
  }

  // 计算整个图表中最大蜡烛图个数
  updateMaxCountInLayout() {
    const { width } = Manager.instance.canvas.mainCanvas;
    const columnWidth = this.getColumnWidth();
    this.maxCountInLayout = Math.ceil(width / columnWidth);
  }

  // 初始加载数据
  initData(data) {
    const { chartType } = Manager.instance.setting;
    this.dataFilterHandle(chartType, data);
    // 更新range width
    this.updateRangeWidth();
    if (chartType === 'candle') {
      this.updateMaxCountInArea();
      // 更新区间内的时间
      this.initCandleCurrentData();
    } else if (chartType === 'line') {
      this.initLineData();
    }
  }

  // loadmore更新数据
  updateData(data) {
    const appendLength = data.length;
    this.data = data.concat(this.data);
    // 更新range width
    this.updateRangeWidth();
    this.updateCandleCurrentData(appendLength);
  }

  // 区别处理蜡烛图和分时数据
  dataFilterHandle(chartType, data) {
    if (chartType === 'candle') {
      this.data = data;
    } else if (chartType === 'line') {
      let line = [];
      const lineTimeArray = [];
      data.forEach((element, index) => {
        // 如果不足, 空补全
        const { start, end } = element;
        let { quotes } = element;
        const number = (end - start) / 60000;
        if (quotes.length < number) {
          quotes = quotes.concat(new Array(number - quotes.length));
        }
        lineTimeArray.push({
          index: line.length === 0 ? 0 : line.length - 1,
          /* global moment */
          value: moment(start).format('HH:mm'),
        });
        line = line.concat(quotes);
        if (index === data.length - 1) {
          lineTimeArray.push({
            index: line.length - 1,
            value: moment(end).format('HH:mm'),
          });
        }
      });
      this.lineTimeArray = lineTimeArray;
      // Manager.instance.timel
      this.data = line;
    }
  }

  // 初始化当前蜡烛视图数据
  initCandleCurrentData() {
    this.lastIndex = this.data.length - 1;
    this.firstIndex = this.lastIndex - this.maxCountInArea + 1;
    this.currentData = this.data.slice(this.firstIndex, this.lastIndex + 1);
  }

  // 更新当前蜡烛视图数据
  updateCandleCurrentData(appendLength) {
    this.lastIndex += appendLength;
    this.firstIndex = this.lastIndex - this.maxCountInArea + 1;
    // 重新计算偏移量
    this.candleLeftOffest = this.candleLeftOffest % this.getColumnWidth();
    this.currentData = this.data.slice(this.firstIndex, this.lastIndex + 1);
  }

  // 初始化当前分时视图数据
  initLineData() {
    this.lastIndex = this.data.length - 1;
    this.firstIndex = 0;
    this.currentData = this.getAllData();
  }

  getDataByIndex(index) {
    return this.data[index];
  }

  // 获取当前视图数据
  getCurrentData() {
    return this.currentData;
  }

  // 获取所有的数据
  getAllData() {
    return this.data;
  }

  // 获取所有数据中的最大值, 最小值
  updateMaxRangeWidth(rangeWidth) {
    if (rangeWidth > this.rangeWidth) {
      this.rangeWidth = rangeWidth;
    }
  }

  calcMaxAndMinByIndicator(data, indicator, boundaryGap) {
    let min = Array.prototype.toString.call(indicator.min) === '[object String]'
      ? Number.MAX_SAFE_INTEGER
      : indicator.min;
    let max = Array.prototype.toString.call(indicator.max) === '[object String]'
      ? Number.MIN_SAFE_INTEGER
      : indicator.max;
    data.forEach(item => {
      if (min > item[indicator.min]) min = item[indicator.min];
      if (max < item[indicator.max]) max = item[indicator.max];
    });
    const top = boundaryGap[0].split('%')[0] / 100;
    const bottom = boundaryGap[1].split('%')[0] / 100;
    const reduce = max - min;
    return {
      min: min - reduce * bottom,
      max: max + reduce * top,
    };
  }

  // 更新range的最大宽度
  updateRangeWidth() {
    const manager = Manager.instance;
    const data = this.getAllData();
    const context = manager.canvas.mainContext;
    const chart = manager.setting.getChart();
    chart.forEach(item => {
      const result = this.calcMaxAndMinByIndicator(data, item.indicator, item.boundaryGap);
      const rangeWidth = Math.max(
        context.measureText(result.min).width,
        context.measureText(result.max).width,
      );
      this.updateMaxRangeWidth(rangeWidth + 25);
    });
  }

  // 移动
  move(x, direction, area) {
    // 右移大于0, 左移小于0
    if (this.limitLeftAndRight(x, direction)) return;
    this.candleLeftOffest = this.savedCandleLeftOffest + x;
    const maxOffest = 0 - this.getColumnWidth();
    if (direction === 'right') {
      this.chartToRightMove(x, area, maxOffest);
    } else if (direction === 'left') {
      this.chartToLeftMove(x, area, maxOffest);
    }
    this.currentData = this.data.slice(this.firstIndex, this.lastIndex + 1);
  }

  // 最左最右边界 return true 表示已到达边界
  limitLeftAndRight(x, direction) {
    if (direction === 'left') {
      // 最右边界
      const max = this.getAllData().length - 1;
      const lastIndexLimit = max - Math.round(this.maxCountInArea / 2);
      if (this.firstIndex >= lastIndexLimit) return true;
    }
    if (direction === 'right') {
      // 最左边界
      if (this.firstIndex <= 0) {
        const maxLeftOffset = (Manager.instance.canvas.mainCanvas.width - this.rangeWidth) / 2;
        this.candleLeftOffest = Math.min(this.savedCandleLeftOffest + x, maxLeftOffset);
        this.validateLastIndex();
        this.currentData = this.data.slice(this.firstIndex, this.lastIndex + 1);
        return true;
      }
    }
    return false;
  }

  // 视图往右移动 first-- last++
  chartToRightMove(x, area, maxOffest) {
    if (this.candleLeftOffest >= 0) {
      area.updateMoveStartPlace({ x: area.oldPlace.x + x });
      this.candleLeftOffest = maxOffest;
      this.savedCandleLeftOffest = this.candleLeftOffest;
      this.firstIndex -= 1;
    }
    this.validateLastIndex();
  }

  // 视图往左移动 first++ last--
  chartToLeftMove(x, area, maxOffest) {
    if (this.candleLeftOffest <= maxOffest) {
      area.updateMoveStartPlace({ x: area.oldPlace.x + x });
      this.candleLeftOffest = 0;
      this.savedCandleLeftOffest = this.candleLeftOffest;
      this.firstIndex += 1;
    }
    this.validateLastIndex();
  }

  validateLastIndex() {
    const { candleLeftOffest } = this;
    let index = 0;
    if (candleLeftOffest > 0) {
      const width = Manager.instance.canvas.mainCanvas.width - this.rangeWidth - candleLeftOffest;
      const columnWidth = this.getColumnWidth();
      index = this.firstIndex + Math.ceil(width / columnWidth) - 1;
    } else {
      index = this.firstIndex + this.maxCountInArea - 1;
    }
    const maxIndex = this.getAllData().length - 1;
    this.lastIndex = Math.min(maxIndex, index);
  }

  startMove() {
    this.savedCandleLeftOffest = this.candleLeftOffest;
  }

  // 放大缩小
  scaleView(s) {
    console.log(this.crossCursorSelectAt.index);
    const maxScale = DataSource.candleStick.itemWidth.length - 1;
    this.scale += s;
    if (this.scale < 0) {
      this.scale = 0;
    } else if (this.scale > maxScale) {
      this.scale = maxScale;
    }
    const oldMaxCountInArea = this.maxCountInArea;
    // 重新设置区间内最大个数
    this.updateMaxCountInLayout();
    this.updateMaxCountInArea();
    // 重新设置缩放后的firstIndex
    this.resetScaleIndex(oldMaxCountInArea);
    this.currentData = this.data.slice(this.firstIndex, this.lastIndex + 1);
  }

  resetScaleIndex(oldMaxCountInArea) {
    const { firstIndex, crossCursorSelectAt, maxCountInArea } = this;
    const selectedIndex = crossCursorSelectAt.index;
    const reduce = maxCountInArea - oldMaxCountInArea;
    const radio = selectedIndex / oldMaxCountInArea;
    this.firstIndex = Math.max(0, firstIndex - Math.round(reduce * radio));
    this.validateLastIndex();
  }

  // 更新十字线选中数据
  updateCrossCursorSelectAt(place) {
    this.crossCursorSelectAt = { ...place };
  }
}
