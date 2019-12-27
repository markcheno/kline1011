import Manager from '../manage/manager';
import calcMAIndicator from '../manage/indicators';

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
    this.maxCountInArea = Math.ceil(width / columnWidth) + 1;
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
    this.updateRangeWidth(this.getAllData());
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
    const { decimalDigits } = Manager.instance.setting;
    const appendLength = data.length;
    this.data = data.concat(this.data);
    const MAArray = [5, 10, 20];
    const first = 0;
    const last = appendLength - 1 + Math.max(...MAArray);
    calcMAIndicator(this.data, {
      decimalDigits,
      range: [first, last],
      MAArray: [5, 10, 20],
    });
    // 更新range width
    this.updateRangeWidth(data.slice(first, last));
    this.updateCandleCurrentData(appendLength);
  }

  // 动态更新最后一个点的数据
  updateLastData(data) {
    const { chartType } = Manager.instance.setting;
    const { lastIndex } = this;
    let islocked = false;
    if (chartType === 'line') {
      // 校验时间, 判断是否需要补点
      const { time } = this.getDataByIndex(lastIndex);
      if (data.time - time <= 60000) {
        this.data[lastIndex].close = data.close;
        islocked = this.isCrossLinelocked();
      } else {
        const updateTime = data.time;
        islocked = this.isCrossLinelocked();
        this.lastIndex += 1;
        this.data[this.lastIndex] = {
          open: data.open,
          high: data.high,
          low: data.low,
          close: data.close,
          time: moment(moment(updateTime).format('YYYY-MM-DD HH:mm')).valueOf(),
        };
      }
      Manager.instance.redrawMain();
      if (islocked) {
        const width = Manager.instance.canvas.mainCanvas.width - this.rangeWidth;
        this.crossCursorSelectAt.x = width;
        Manager.instance.redrawOver();
      }
    }
  }

  isInitShowCross() {
    const { chartType } = Manager.instance.setting;
    if (chartType === 'line') {
      const width = Manager.instance.canvas.mainCanvas.width - this.rangeWidth;
      this.crossCursorSelectAt.x = width;
      Manager.instance.redrawOver();
    }
  }

  // 校验十字线是否被固定
  isCrossLinelocked() {
    const { chartType } = Manager.instance.setting;
    if (chartType === 'candle') return false;
    if (this.crossCursorSelectAt.index === this.lastIndex) return true;
    return false;
  }

  // 区别处理蜡烛图和分时数据
  dataFilterHandle(chartType, data) {
    const { decimalDigits } = Manager.instance.setting;
    if (chartType === 'candle') {
      this.data = data;
      calcMAIndicator(this.data, {
        decimalDigits,
        range: [0, data.length - 1],
        MAArray: [5, 10, 20],
      });
    } else if (chartType === 'line') {
      let line = [];
      const lineTimeArray = [];
      let maxIndex = 0;
      data.forEach((element, index) => {
        // 如果不足, 空补全
        const { start, end } = element;
        let { quotes } = element;
        const number = (end - start) / 60000;
        maxIndex += quotes.length;
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
      this.lastIndex = maxIndex - 1;
      this.data = line;
    }
  }

  // 初始化当前蜡烛视图数据
  initCandleCurrentData() {
    this.lastIndex = this.data.length - 1;
    // 初始化时, 右侧间隔预留了一点距离
    this.firstIndex = this.lastIndex - this.maxCountInArea + 3;
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
    // lastIndex 在初始化时单独被设置了
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

  // 更新range的最大宽度
  updateRangeWidth(data) {
    const manager = Manager.instance;
    const context = manager.canvas.mainContext;
    const Font = manager.theme.Default;
    context.font = Font;
    const { layout } = manager;
    layout.getLayouts().forEach(item => {
      if (item.range) {
        const result = item.getRangeData().calcMaxAndMinByIndicator(data);
        const rangeWidth = Math.max(
          context.measureText(result.min).width,
          context.measureText(result.max).width,
        );
        this.updateMaxRangeWidth(rangeWidth + 30);
      }
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
      area.updateMoveStartPlace({ x: area.mouseDownPlace.x + x });
      this.candleLeftOffest = maxOffest;
      this.savedCandleLeftOffest = this.candleLeftOffest;
      this.firstIndex -= 1;
    }
    this.validateLastIndex();
  }

  // 视图往左移动 first++ last--
  chartToLeftMove(x, area, maxOffest) {
    if (this.candleLeftOffest <= maxOffest) {
      area.updateMoveStartPlace({ x: area.mouseDownPlace.x + x });
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
    this.crossCursorSelectAt = { ...place, index: -1 };
  }
}
