import Manager from '../manage/manager';

// over视图所需的x轴坐标轴位置
let xPlaces = [];

export class Plotter {
  constructor(name) {
    this.name = name;
    this.manager = Manager.instance;
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

export class CandlestickPlotter extends Plotter {
  constructor(name) {
    super(name);
    this.areaRight = 0;
    const { theme } = this.manager;
    this.NegativeColor = theme.Color.Negative;
    this.PositiveColor = theme.Color.Positive;
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
    const { currentDataIndent } = dataSource;
    const columnWidth = dataSource.getColumnWidth();
    const itemCenterOffset = dataSource.getColumnCenter();
    this.areaRight = chartArea.getRight();
    // let columnRight = this.areaRight + moveX - 2 * itemCenterOffset;
    let columnLeft = currentDataIndent * columnWidth;
    // 从前往后绘制
    const fillPosLines = [];
    const fillPosRects = [];
    const fillNegRects = [];
    const fillNegLines = [];
    xPlaces = [];
    for (let i = 0; i < currentData.length; i++) {
      const data = currentData[i];
      const { open, close, high, low } = data;
      const highPlace = range.toY(high);
      const lowPlace = range.toY(low);
      const closePlace = range.toY(close);
      const openPlace = range.toY(open);
      const leftX = this.toMaxX(columnLeft);
      const leftLineX = this.toMaxX(columnLeft + itemCenterOffset);
      xPlaces.push(leftLineX);
      const rectWidth = this.toReactWidth(leftX, 2 * itemCenterOffset);
      const lineRectWidth = this.toReactWidth(leftLineX, 1);
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
      // if (i === currentData.length - 1) {
      //   // 计算最右蜡烛被遮盖的部分
      //   const overRightX = leftX + 2 * itemCenterOffset - this.areaRight;
      //   if (overRightX > 0) {
      //     candlestickMovePoint.push(Math.round(-overRightX));
      //     candlestickMovePoint.push(Math.round(columnWidth - overRightX + dataSource.getSpaceWidth()));
      //   }
      // } else if (i === 0) {
      //   const overLeftX = columnRight;
      //   if (overLeftX < 0) {
      //     candlestickMovePoint.push(Math.round(overLeftX));
      //     candlestickMovePoint.push(Math.round(columnWidth - Math.abs(overLeftX)));
      //   }
      // }
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
    this.Font = theme.Font.Default;
  }

  draw(layout) {
    const area = layout.timelineArea;
    const data = layout.timeline.getData();
    const context = this.mainContext;
    let { left, right, top, bottom } = area.getPlace();
    const middle = (top + bottom) / 2 + 0.5;
    left += 0.5;
    right += 0.5;
    top += 0.5;
    bottom += 0.5;
    context.font = this.Font;
    context.strokeStyle = this.GridColor;
    this.drawLine(context, {
      from: { x: left, y: top },
      to: { x: right, y: top },
    });
    context.fillStyle = this.GridColor;
    context.textAlign = 'left';
    context.fillText(data.minDate, left, middle);
    context.textAlign = 'right';
    context.fillText(data.maxDate, right, middle);
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
    // eslint-disable-next-line no-undef
    const time = moment(data.time).format('YYYY-MM-DD');
    const x = xPlaces[index];
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
    const textWidth = context.measureText(value).width;
    context.font = this.Font;
    context.fillStyle = this.GridColor;
    this.drawReact(context, {
      x: left,
      y: y - 10,
      width: textWidth + 40,
      height: 20,
    });
    context.fillStyle = '#ffffff';
    context.fillText(value, left + 20, y + 4);
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
    const { dataSource } = this.manager;
    const context = this.mainContext;
    const currentData = dataSource.getCurrentData();
    const { currentDataIndent } = dataSource;
    const { left, right, top } = chartArea.getPlace();
    const columnWidth = dataSource.getColumnWidth();
    const itemCenterOffset = dataSource.getColumnCenter();
    this.areaRight = right;
    // let columnRight = this.areaRight + moveX - 2 * itemCenterOffset;
    let columnLeft = currentDataIndent * columnWidth;
    // 从前往后绘制
    const fillPosRects = [];
    const fillNegRects = [];
    for (let i = 0; i < currentData.length; i++) {
      const data = currentData[i];
      const { volume, close, open } = data;
      const volumePlace = range.toY(volume);
      const lowPlace = range.toY(0);
      const leftX = this.toMaxX(columnLeft);
      const rectWidth = this.toReactWidth(leftX, 2 * itemCenterOffset);
      // 涨
      if (close >= open) {
        fillPosRects.push({ x: leftX, y: volumePlace, width: rectWidth, height: lowPlace - volumePlace - this.paddingBottom });
      } else if (close < open) {
        fillNegRects.push({ x: leftX, y: volumePlace, width: rectWidth, height: lowPlace - volumePlace - this.paddingBottom });
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
    const nums = xPlaces;
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

  draw(layout) {
    const context = this.overlayContext;
    const { crossCursorSelectAt } = this.manager.dataSource;
    context.strokeStyle = this.lineColor;
    // 取最近的蜡烛图点
    const xInfo = this.searchInsert(crossCursorSelectAt.x);
    const x = xInfo.value;
    const y = crossCursorSelectAt.y + 0.5;
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
    return xInfo.index;
  }
}
