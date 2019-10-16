import Manager from '../manage/manager';

export class Plotter {
  constructor(name) {
    this.name = name;
    this.manager = Manager.instance;
    this.mainContext = this.manager.canvas.mainContext;
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
      item.moveTo(from.x, from.y);
      item.lineTo(to.x, to.y);
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

export class CandlestickPlotter extends Plotter {
  constructor(name) {
    super(name);
    const { theme } = this.manager;
    this.NegativeColor = theme.Color.Negative;
    this.PositiveColor = theme.Color.Positive;
  }

  // 值换算坐标
  toY(value) {
    return this.top + Math.floor((this.maxValue - value) * this.ratio);
  }

  draw(layout) {
    const { range, chartArea } = layout;
    const { dataSource } = this.manager;
    const context = this.mainContext;
    const currentData = dataSource.getCurrentData();
    const columnWidth = dataSource.getColumnWidth();
    const itemCenterOffset = dataSource.getColumnCenter();
    let columnRight = chartArea.getRight() - columnWidth;
    // 从后往前绘制
    const fillPosLines = [];
    const fillPosRects = [];
    const fillNegRects = [];
    const fillNegLines = [];
    for (let i = currentData.length - 1; i >= 0; i--) {
      const data = currentData[i];
      const { open, close } = data;
      const highPlace = range.toY(data.high);
      const lowPlace = range.toY(data.low);
      const closePlace = range.toY(data.close);
      const openPlace = range.toY(data.open);
      // 涨
      if (close >= open) {
        fillPosRects.push({ x: columnRight, y: closePlace, width: 2 * itemCenterOffset, height: Math.max(openPlace - closePlace, 1) });
        fillPosLines.push({ x: columnRight + itemCenterOffset, y: highPlace, width: 1, height: closePlace - highPlace });
        fillPosLines.push({ x: columnRight + itemCenterOffset, y: openPlace, width: 1, height: lowPlace - openPlace });
      } else if (close < open) {
        fillNegRects.push({ x: columnRight, y: openPlace, width: 2 * itemCenterOffset, height: Math.max(closePlace - openPlace, 1) });
        fillNegLines.push({ x: columnRight + itemCenterOffset, y: highPlace, width: 1, height: openPlace - highPlace });
        fillNegLines.push({ x: columnRight + itemCenterOffset, y: closePlace, width: 1, height: lowPlace - closePlace });
      }
      columnRight -= columnWidth;
    }
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
    context.textBaseline = 'middle';
    context.fillStyle = this.GridColor;
    this.drawLine(context, {
      from: { x: left, y: top },
      to: { x: right, y: top },
    });
    context.fillText(data.minDate, left, middle);
    context.fillText(data.maxDate, right, middle);
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
    context.fillStyle = this.GridColor;
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
      this.drawLine(context, {
        from: { x: left, y: item.y },
        to: { x: left + 6, y: item.y },
      });
      this.drawLine(context, {
        from: { x: right - 6, y: item.y },
        to: { x: right, y: item.y },
      });
      context.fillText(item.text, center, item.y);
    });
  }
}
