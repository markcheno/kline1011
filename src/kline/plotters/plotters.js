import Manager from '../manage/manager';

// 记录的绘制坐标点
let pointsPlaces = {
  x: [],
  y: [],
};

export class Plotter {
  constructor(name) {
    this.name = name;
    this.manager = Manager.instance;
    this.chartType = Manager.instance.setting.chartType;
    this.mainContext = this.manager.canvas.mainContext;
    this.overlayContext = this.manager.canvas.overlayContext;
  }

  drawLine(context, place) {
    const { from, to } = place;
    context.beginPath();
    context.moveTo(from.x, from.y);
    context.lineTo(to.x, to.y);
    context.stroke();
  }

  drawLines(context, places) {
    context.beginPath();
    places.forEach(item => {
      const { from, to } = item;
      context.moveTo(from.x, from.y);
      context.lineTo(to.x, to.y);
    });
    context.stroke();
  }

  drawReact(context, place) {
    const { x, y, width, height } = place;
    context.fillRect(x, y, width, height);
  }

  drawReacts(context, places) {
    places.forEach(item => {
      const { x, y, width, height } = item;
      context.fillRect(x, y, width, height);
    });
  }

  // 绘制最大最小
  drawMaxMin(option) {
    const { mainContext, maxMin, PositiveColor, NegativeColor, Font } = option;
    const maxX = maxMin.max.x;
    const maxY = maxMin.max.y;
    const minX = maxMin.min.x;
    const minY = maxMin.min.y;
    mainContext.font = Font;
    const textMaxWidth = mainContext.measureText(maxMin.max.value).width + 20;
    const textMinWidth = mainContext.measureText(maxMin.min.value).width + 20;
    mainContext.strokeStyle = PositiveColor;
    mainContext.lineWidth = 2;
    this.drawLine(mainContext, {
      from: { x: maxX, y: maxY },
      to: { x: maxX, y: maxY - 20 },
    });
    this.drawLine(mainContext, {
      from: { x: maxX, y: maxY - 20 },
      to: { x: maxX + 40, y: maxY - 20 },
    });
    mainContext.fillStyle = PositiveColor;
    this.drawReact(mainContext, { x: maxX + 40, y: maxY - 30, width: textMaxWidth, height: 20 });
    mainContext.strokeStyle = NegativeColor;
    this.drawLine(mainContext, {
      from: { x: minX, y: minY },
      to: { x: minX, y: minY + 20 },
    });
    this.drawLine(mainContext, {
      from: { x: minX, y: minY + 20 },
      to: { x: minX + 40, y: minY + 20 },
    });
    mainContext.fillStyle = NegativeColor;
    this.drawReact(mainContext, { x: minX + 40, y: minY + 10, width: textMinWidth, height: 20 });
    mainContext.fillStyle = '#ffffff';
    mainContext.fillText(maxMin.max.value, maxX + 65, maxY - 18);
    mainContext.fillText(maxMin.min.value, minX + 65, minY + 22);
  }
}

// 橡皮擦画笔
export class ClearPlotter extends Plotter {
  constructor(type) {
    super('ClearPlotter');
    this.context = type === 'main' ? this.mainContext : this.overlayContext;
  }

  draw(layout) {
    this.context.clearRect(layout.getLeft(), layout.getTop(), layout.getWidth(), layout.getHeight());
  }
}

// 主视图背景
export class BackgroundPlotter extends Plotter {
  constructor(name) {
    super(name);
    const { theme } = this.manager;
    this.color = theme.Color.Background;
  }

  draw(layout) {
    const context = this.mainContext;
    context.fillStyle = this.color;
    context.fillRect(layout.getLeft(), layout.getTop(), layout.getWidth(), layout.getHeight());
  }
}

// chart视图背景网格
export class BackgroundGridPlotter extends Plotter {
  constructor(name) {
    super(name);
    const { theme } = this.manager;
    this.BackgroundGridColor = theme.Color.BackgroundGridColor;
  }

  // 绘制 不同chartArea的range横线
  draw(layout) {
    const area = layout.chartArea;
    const context = this.mainContext;
    const { left, right } = area.getPlace();
    const gradations = layout.range.getGradations();
    const grids = gradations.map(item => ({
      from: {
        x: left + 0.5,
        y: item.y,
      },
      to: {
        x: right + 0.5,
        y: item.y,
      },
    }));
    context.strokeStyle = this.BackgroundGridColor;
    this.drawLines(context, grids);
  }
}

export class LineChartPlotter extends Plotter {
  constructor(name) {
    super(name);
    const { theme } = this.manager;
    this.fillColor = theme.Line.fillColor;
    this.strokeColor = theme.Line.strokeColor;
    this.strokeLineWidth = theme.Line.strokeLineWidth;
    this.NegativeColor = theme.Color.Negative;
    this.PositiveColor = theme.Color.Positive;
    this.Font = theme.Font.Default;
    this.maxMin = {
      min: { x: -1, y: Number.MIN_SAFE_INTEGER, value: 0 },
      max: { x: -1, y: Number.MAX_SAFE_INTEGER, value: 0 },
    };
  }

  drawFillLines(context, places, bottom) {
    context.beginPath();
    context.moveTo(0, bottom);
    places.forEach(item => {
      const { x, y } = item;
      context.lineTo(x, y);
    });
    context.lineTo(places[places.length - 1].x, bottom);
    context.fillStyle = this.fillColor;
    context.fill();
  }

  drawLineStorkeLines(context, places) {
    context.beginPath();
    places.forEach(item => {
      const { x, y } = item;
      context.lineTo(x, y);
    });
    context.strokeStyle = this.strokeColor;
    context.lineWidth = this.strokeLineWidth;
    context.stroke();
  }

  draw(layout) {
    const { range, chartArea } = layout;
    const { dataSource } = this.manager;
    const context = this.mainContext;
    const data = dataSource.getCurrentData();
    const width = chartArea.getWidth();
    const bottom = chartArea.getBottom();
    const size = data.length;
    const interval = width / size;
    const places = [];
    const { maxMin } = this;
    pointsPlaces = { x: [], y: [] };
    for (let i = 0; i < size; i++) {
      if (data[i]) {
        const { close } = data[i];
        const x = i * interval;
        const y = range.toY(close);
        pointsPlaces.x.push(x);
        pointsPlaces.y.push(y);
        places.push({
          x,
          y,
        });
        // 分时图最大最小值
        if (y < maxMin.max.y) {
          maxMin.max = {
            x,
            y,
            value: close,
          };
        }
        if (y > maxMin.min.y) {
          maxMin.min = {
            x,
            y,
            value: close,
          };
        }
      }
    }
    this.drawLineStorkeLines(context, places);
    this.drawFillLines(context, places, bottom);
    this.drawMaxMin({
      mainContext: context,
      maxMin: this.maxMin,
      PositiveColor: this.PositiveColor,
      NegativeColor: this.NegativeColor,
      Font: this.Font,
    });
  }
}

export class LineChartInfoPlotter extends Plotter {
  constructor(name) {
    super(name);
    const { theme } = this.manager;
    this.GridColor = theme.Color.Grid;
    this.Font = theme.Font.Default;
  }

  draw(layout, index) {
    const { chartArea } = layout;
    const { dataSource } = this.manager;
    const context = this.overlayContext;
    const currentData = dataSource.getCurrentData();
    const { left, top } = chartArea.getPlace();
    const data = currentData[index];
    context.font = this.Font;
    context.fillStyle = this.GridColor;
    const y = top + 15;
    let x = left;
    const textArray = [`开盘价: ${data.open}`, `最低价: ${data.low}`, `最高价: ${data.high}`, `收盘价: ${data.close}`];
    textArray.forEach(item => {
      context.fillText(item, x, y);
      x += context.measureText(item).width + 10;
    });
  }
}

export class CandlestickPlotter extends Plotter {
  constructor(name) {
    super(name);
    this.areaRight = 0;
    const { theme } = this.manager;
    this.NegativeColor = theme.Color.Negative;
    this.PositiveColor = theme.Color.Positive;
    this.GridColor = theme.Color.Grid;
    this.Font = theme.Font.Default;
    this.maxMin = {
      min: { x: -1, y: Number.MIN_SAFE_INTEGER, value: 0 },
      max: { x: -1, y: Number.MAX_SAFE_INTEGER, value: 0 },
    };
  }

  toMaxX(x) {
    if (x > this.areaRight) return this.areaRight;
    return x;
  }

  toReactWidth(x, width) {
    if (x + width > this.areaRight) return this.areaRight - x;
    return width;
  }

  // 计算蜡烛图顺滑移动的距离点
  // updateCandlestickMovePoint(points) {
  //   this.manager.updateCandlestickMovePoint(points);
  // }

  draw(layout) {
    const { range, chartArea } = layout;
    const { dataSource } = this.manager;
    const context = this.mainContext;
    const currentData = dataSource.getCurrentData();
    const { candleLeftOffest } = dataSource;
    const columnWidth = dataSource.getColumnWidth();
    const itemCenterOffset = dataSource.getColumnCenter();
    const { maxMin } = this;
    this.areaRight = chartArea.getRight();
    let columnLeft = candleLeftOffest;
    // 从前往后绘制
    const fillPosLines = [];
    const fillPosRects = [];
    const fillNegRects = [];
    const fillNegLines = [];
    pointsPlaces = { x: [], y: [] };
    for (let i = 0; i < currentData.length; i++) {
      const data = currentData[i];
      const { open, close, high, low } = data;
      const highPlace = range.toY(high);
      const lowPlace = range.toY(low);
      const closePlace = range.toY(close);
      const openPlace = range.toY(open);
      const leftX = this.toMaxX(columnLeft);
      const leftLineX = this.toMaxX(columnLeft + itemCenterOffset);
      pointsPlaces.x.push(leftLineX);
      const rectWidth = this.toReactWidth(leftX, 2 * itemCenterOffset);
      const lineRectWidth = this.toReactWidth(leftLineX, 1);
      // 蜡烛图最大最小值
      if (highPlace < maxMin.max.y) {
        maxMin.max = {
          x: leftLineX,
          y: highPlace,
          value: data.high,
        };
      }
      if (lowPlace > maxMin.min.y) {
        maxMin.min = {
          x: leftLineX,
          y: lowPlace,
          value: data.low,
        };
      }
      // 涨
      if (close >= open) {
        fillPosRects.push({ x: leftX, y: closePlace, width: rectWidth, height: Math.max(openPlace - closePlace, 1) });
        fillPosLines.push({ x: leftLineX, y: highPlace, width: lineRectWidth, height: closePlace - highPlace });
        fillPosLines.push({ x: leftLineX, y: openPlace, width: lineRectWidth, height: lowPlace - openPlace });
      } else if (close < open) {
        fillNegRects.push({ x: leftX, y: openPlace, width: rectWidth, height: Math.max(closePlace - openPlace, 1) });
        fillNegLines.push({ x: leftLineX, y: highPlace, width: lineRectWidth, height: openPlace - highPlace });
        fillNegLines.push({ x: leftLineX, y: closePlace, width: lineRectWidth, height: lowPlace - closePlace });
      }
      columnLeft += columnWidth;
    }
    // this.updateCandlestickMovePoint(candlestickMovePoint);
    if (fillPosLines.length > 0) {
      context.fillStyle = this.PositiveColor;
      this.drawReacts(context, fillPosLines);
    }
    if (fillPosRects.length > 0) {
      context.fillStyle = this.PositiveColor;
      this.drawReacts(context, fillPosRects);
    }
    if (fillNegLines.length > 0) {
      context.fillStyle = this.NegativeColor;
      this.drawReacts(context, fillNegLines);
    }
    if (fillNegRects.length > 0) {
      context.fillStyle = this.NegativeColor;
      this.drawReacts(context, fillNegRects);
    }
    this.drawMaxMin({
      mainContext: context,
      maxMin: this.maxMin,
      PositiveColor: this.PositiveColor,
      NegativeColor: this.NegativeColor,
      Font: this.Font,
    });
  }
}

export class CandlestickInfoPlotter extends Plotter {
  constructor(name) {
    super(name);
    const { theme } = this.manager;
    this.GridColor = theme.Color.Grid;
    this.Font = theme.Font.Default;
  }

  draw(layout, index) {
    const { chartArea } = layout;
    const { dataSource } = this.manager;
    const context = this.overlayContext;
    const currentData = dataSource.getCurrentData();
    const { left, top } = chartArea.getPlace();
    const data = currentData[index];
    context.font = this.Font;
    context.fillStyle = this.GridColor;
    const y = top + 15;
    let x = left;
    const textArray = [`开盘价: ${data.open}`, `最低价: ${data.low}`, `最高价: ${data.high}`, `收盘价: ${data.close}`];
    textArray.forEach(item => {
      context.fillText(item, x, y);
      x += context.measureText(item).width + 10;
    });
  }
}

export class TimelinePlotter extends Plotter {
  constructor(name) {
    super(name);
    const { theme } = this.manager;
    this.GridColor = theme.Color.Grid;
    this.BackgroundGridColor = theme.Color.BackgroundGridColor;
    this.Font = theme.Font.Default;
    this.middle = 0;
  }

  // 绘制timeline的竖线
  drawVertical(verticalX) {
    const { layout, setting } = this.manager;
    const { timelineAreaHeight } = setting;
    const context = this.mainContext;
    const { top, bottom } = layout.getPlace();
    context.strokeStyle = this.BackgroundGridColor;
    verticalX.forEach(item => {
      this.drawLine(context, {
        from: { x: item, y: top },
        to: { x: item, y: bottom - timelineAreaHeight },
      });
    });
  }

  // 蜡烛图
  drawCandleTime(context, timeArray) {
    const { dataSource } = this.manager;
    const { firstIndex } = dataSource;
    const { candleLeftOffest } = dataSource;
    const columnWidth = dataSource.getColumnWidth();
    const itemCenterOffset = dataSource.getColumnCenter();
    context.textAlign = 'center';
    const verticalX = [];
    timeArray.forEach(item => {
      const x = candleLeftOffest + columnWidth * (item.index - firstIndex) + itemCenterOffset;
      verticalX.push(x);
      context.fillText(item.value, x, this.middle);
    });
    this.drawVertical(verticalX);
  }

  // 分时图
  drawLineTime(context, timeArray, width) {
    const { dataSource } = this.manager;
    const size = dataSource.getCurrentData().length;
    const interval = width / size;
    const verticalX = [];
    timeArray.forEach((item, index) => {
      if (index === 0) {
        context.textAlign = 'left';
      } else if (index === timeArray.length - 1) {
        context.textAlign = 'right';
      } else {
        context.textAlign = 'center';
      }
      const x = interval * item.index;
      verticalX.push(x);
      context.fillText(item.value, x, this.middle);
    });
    this.drawVertical(verticalX);
  }

  draw(layout) {
    const area = layout.timelineArea;
    const { timeArray } = layout.timeline.getData();
    const context = this.mainContext;
    let { left, right, top, bottom } = area.getPlace();
    this.middle = (top + bottom) / 2 + 0.5;
    left += 0.5;
    right += 0.5;
    top += 0.5;
    bottom += 0.5;
    context.font = this.Font;
    context.strokeStyle = this.GridColor;
    context.lineWidth = 1;
    context.fillStyle = this.GridColor;
    // 背景上的横轴
    // const layoutGrid = [];
    if (this.chartType === 'candle') {
      this.drawCandleTime(context, timeArray);
    } else if (this.chartType === 'line') {
      this.drawLineTime(context, timeArray, right - left);
    }
    context.strokeStyle = this.GridColor;
    this.drawLine(context, {
      from: { x: left, y: top },
      to: { x: right, y: top },
    });
  }
}

export class TimelineInfoPlotter extends Plotter {
  constructor(name) {
    super(name);
    const { theme } = this.manager;
    this.GridColor = theme.Color.Grid;
    this.Font = theme.Font.Default;
  }

  draw(layout, index) {
    const { timelineArea } = layout;
    const { dataSource } = this.manager;
    const context = this.overlayContext;
    const currentData = dataSource.getCurrentData();
    const { top } = timelineArea.getPlace();
    const data = currentData[index];
    if (!data) return;
    const formatStr = this.chartType === 'candle' ? 'YYYY-MM-DD' : 'HH:mm';
    // eslint-disable-next-line no-undef
    const time = moment(data.time).format(formatStr);
    const x = pointsPlaces.x[index];
    const leftX = x - context.measureText(time).width / 2;
    context.font = this.Font;
    context.fillStyle = this.GridColor;
    this.drawReact(context, {
      x: leftX - 10,
      y: top,
      width: context.measureText(time).width + 20,
      height: 20,
    });
    context.fillStyle = '#ffffff';
    context.fillText(time, leftX, top + 15);
  }
}

export class RangePlotter extends Plotter {
  constructor(name) {
    super(name);
    const { theme } = this.manager;
    this.GridColor = theme.Color.Grid;
    this.Font = theme.Font.Default;
  }

  draw(layout) {
    const area = layout.rangeArea;
    const context = this.mainContext;
    const gradations = layout.range.getGradations();
    let { left, right, top, bottom } = area.getPlace();
    const center = area.getCenter() + 0.5;
    left += 0.5;
    right += 0.5;
    top += 0.5;
    bottom += 0.5;
    context.font = this.Font;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.strokeStyle = this.GridColor;
    context.lineWidth = 1;
    this.drawLine(context, {
      from: { x: left, y: top },
      to: { x: left, y: bottom },
    });
    this.drawLine(context, {
      from: { x: left, y: bottom },
      to: { x: right, y: bottom },
    });
    gradations.forEach(item => {
      context.strokeStyle = this.GridColor;
      this.drawLine(context, {
        from: { x: left, y: item.y },
        to: { x: left + 6, y: item.y },
      });
      this.drawLine(context, {
        from: { x: right - 6, y: item.y },
        to: { x: right, y: item.y },
      });
      context.fillStyle = this.GridColor;
      context.fillText(item.text, center, item.y);
    });
  }
}

export class RangeInfoPlotter extends Plotter {
  constructor(name) {
    super(name);
    const { theme } = this.manager;
    this.GridColor = theme.Color.Grid;
    this.Font = theme.Font.Default;
  }

  draw(layout, y) {
    const area = layout.rangeArea;
    const context = this.overlayContext;
    const value = parseInt(layout.range.toValue(y), 10);
    const { left } = area.getPlace();
    const width = area.getWidth();
    const textWidth = context.measureText(value).width;
    context.font = this.Font;
    context.fillStyle = this.GridColor;
    this.drawReact(context, {
      x: left,
      y: y - 10,
      width,
      height: 20,
    });
    context.fillStyle = '#ffffff';
    context.fillText(value, left + (width - textWidth) / 2, y + 4);
  }
}

export class VolumePlotter extends Plotter {
  constructor(name) {
    super(name);
    const { theme } = this.manager;
    this.paddingBottom = 3;
    this.areaRight = 0;
    this.NegativeColor = theme.Color.Negative;
    this.PositiveColor = theme.Color.Positive;
    this.GridColor = theme.Color.Grid;
  }

  toMaxX(x) {
    if (x > this.areaRight) return this.areaRight;
    return x;
  }

  toReactWidth(x, width) {
    if (x + width > this.areaRight) return this.areaRight - x;
    return width;
  }

  draw(layout) {
    const { range, chartArea } = layout;
    const { dataSource, setting } = this.manager;
    const context = this.mainContext;
    const currentData = dataSource.getCurrentData();
    const { candleLeftOffest } = dataSource;
    const { left, right, top } = chartArea.getPlace();
    let columnWidth = 0;
    let itemCenterOffset = 0;
    let columnLeft;
    if (setting.chartType === 'candle') {
      columnWidth = dataSource.getColumnWidth();
      itemCenterOffset = dataSource.getColumnCenter();
      columnLeft = candleLeftOffest;
    } else if (setting.chartType === 'line') {
      const size = currentData.length;
      columnWidth = (right - left) / size;
      itemCenterOffset = columnWidth / 2;
      columnLeft = 0;
    }
    this.areaRight = right;
    // 从前往后绘制
    const fillPosRects = [];
    const fillNegRects = [];
    for (let i = 0; i < currentData.length; i++) {
      const data = currentData[i];
      if (!data) continue;
      const { volume, close, open } = data;
      const volumePlace = range.toY(volume);
      const lowPlace = range.toY(0);
      const leftX = this.toMaxX(columnLeft);
      const rectWidth = this.toReactWidth(leftX, 2 * itemCenterOffset);
      // 涨
      if (close >= open) {
        fillPosRects.push({ x: leftX, y: volumePlace - this.paddingBottom, width: rectWidth, height: lowPlace - volumePlace });
      } else if (close < open) {
        fillNegRects.push({ x: leftX, y: volumePlace - this.paddingBottom, width: rectWidth, height: lowPlace - volumePlace });
      }
      columnLeft += columnWidth;
    }
    if (fillPosRects.length > 0) {
      context.fillStyle = this.PositiveColor;
      this.drawReacts(context, fillPosRects);
    }
    if (fillNegRects.length > 0) {
      context.fillStyle = this.NegativeColor;
      this.drawReacts(context, fillNegRects);
    }
    context.strokeStyle = this.GridColor;
    // 绘制分割线
    this.drawLine(context, {
      from: { x: left + 0.5, y: top + 0.5 },
      to: { x: right + 0.5, y: top + 0.5 },
    });
  }
}

export class VolumeInfoPlotter extends Plotter {
  constructor(name) {
    super(name);
    const { theme } = this.manager;
    this.GridColor = theme.Color.Grid;
    this.Font = theme.Font.Default;
  }

  draw(layout, index) {
    const { chartArea } = layout;
    const { dataSource } = this.manager;
    const context = this.overlayContext;
    const currentData = dataSource.getCurrentData();
    const { left, top } = chartArea.getPlace();
    const data = currentData[index];
    context.font = this.Font;
    context.fillStyle = this.GridColor;
    context.fillText(`成交量: ${data.volume}`, left, top + 15);
  }
}

// 绘制over视图
export class SelectionPlotter extends Plotter {
  constructor(name) {
    super(name);
    const { theme } = this.manager;
    this.lineColor = theme.Color.Grid;
    this.timelineAreaHeight = this.manager.setting.timelineAreaHeight;
  }

  // 二分搜索插入
  searchInsert(target) {
    const nums = pointsPlaces.x;
    let left = 0;
    let right = nums.length - 1;
    while (left <= right) {
      // eslint-disable-next-line no-bitwise
      const mid = (left + right) >>> 1;
      const midItem = nums[mid];
      if (midItem === target) {
        return {
          index: mid,
          value: midItem,
        };
      } if (target > midItem) {
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }
    if (left > nums.length - 1) left = nums.length - 1;
    if (nums[left] - target > target - nums[left - 1]) {
      return {
        index: left - 1,
        value: nums[left - 1],
      };
    }
    return {
      index: left,
      value: nums[left],
    };
  }

  getCrossLineY(y, index) {
    const { chartType } = this.manager.setting;
    if (chartType === 'line') {
      return pointsPlaces.y[index];
    }
    return y;
  }

  draw(layout) {
    const context = this.overlayContext;
    const { crossCursorSelectAt } = this.manager.dataSource;
    context.strokeStyle = this.lineColor;
    // 取最近的图点
    const xInfo = this.searchInsert(crossCursorSelectAt.x);
    const x = xInfo.value;
    const y = this.getCrossLineY(crossCursorSelectAt.y + 0.5, xInfo.index);
    context.setLineDash([5, 5]);
    this.drawLine(context, {
      from: { x, y: 0 },
      to: { x, y: layout.getBottom() - this.timelineAreaHeight },
    });
    this.drawLine(context, {
      from: { x: 0, y },
      to: { x: layout.getRight(), y },
    });
    context.setLineDash([]);
    return {
      index: xInfo.index,
      y,
    };
  }
}
