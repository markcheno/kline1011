import Manager from '../manage/manager';
import Control from '../manage/control';

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
  }

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

  updateData(data) {
    // const isuUpdate = this.data.length;
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


  getDataByIndex(index) {
    return this.data[index];
  }

  // 初始化当前蜡烛视图数据
  initCandleCurrentData() {
    this.lastIndex = this.data.length - 1;
    this.firstIndex = this.lastIndex - this.maxCountInArea + 1;
    this.currentData = this.data.slice(this.firstIndex, this.lastIndex + 1);
  }

  // 初始化当前分时视图数据
  initLineData() {
    this.lastIndex = this.data.length - 1;
    this.firstIndex = 0;
    this.currentData = this.getAllData();
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
    if (rangeWidth > this.rangeWidth) { this.rangeWidth = rangeWidth; }
  }


  calcMaxAndMinByIndicator(data, indicator, boundaryGap) {
    let min = Array.prototype.toString.call(indicator.min) === '[object String]' ? Number.MAX_SAFE_INTEGER : indicator.min;
    let max = Array.prototype.toString.call(indicator.max) === '[object String]' ? Number.MIN_SAFE_INTEGER : indicator.max;
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
      const rangeWidth = Math.max(context.measureText(result.min).width, context.measureText(result.max).width);
      this.updateMaxRangeWidth(rangeWidth + 25);
    });
  }

  // 视图往右移动 first-- last++
  chartToRightMove() {

  }

  // 视图往左移动 first++ last--
  chartToLeftMove() {

  }

  move(x, direction, area) {
    // 右移大于0, 左移小于0
    this.candleLeftOffest = this.savedCandleLeftOffest + x;
    console.table({ candleLeftOffest: this.candleLeftOffest });
    const maxOffest = 0 - this.getColumnWidth();
    if (direction === 'right') {
      if (this.candleLeftOffest >= 0) {
        area.updateMoveStartPlace({ x: area.oldPlace.x + x });
        this.candleLeftOffest = maxOffest;
        this.savedCandleLeftOffest = this.candleLeftOffest;
        this.firstIndex -= 1;
        this.lastIndex = this.validateLastIndex();
      }
    } else if (direction === 'left') {
      if (this.candleLeftOffest <= maxOffest) {
        area.updateMoveStartPlace({ x: area.oldPlace.x + x });
        this.candleLeftOffest = 0;
        this.savedCandleLeftOffest = this.candleLeftOffest;
        this.firstIndex += 1;
        this.lastIndex = this.validateLastIndex();
      }
    }
    this.currentData = this.data.slice(this.firstIndex, this.lastIndex + 1);
  }

  validateLastIndex() {
    const maxIndex = this.getAllData().length - 1;
    const index = this.firstIndex + this.maxCountInArea - 1;
    return Math.min(maxIndex, index);
  }

  startMove() {
    this.savedCandleLeftOffest = this.candleLeftOffest;
  }

  // 放大缩小
  scaleView(s) {
    const candleStickModeItemLength = DataSource.candleStick.itemWidth.length;
    this.scale += s;
    if (this.scale < 0) {
      this.scale = 0;
    } else if (this.scale >= candleStickModeItemLength) {
      this.scale = candleStickModeItemLength - 1;
    }
    this.updateMaxCountInArea();
    this.lastIndex = this.validateLastIndex();
    this.currentData = this.data.slice(this.firstIndex, this.lastIndex + 1);
  }

  // 更新十字线选中数据
  updateCrossCursorSelectAt(place) {
    this.crossCursorSelectAt = { ...place };
  }
}
