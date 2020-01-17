/* eslint-disable semi */
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

  // 绘制不连续的线
  drawLines(context, places) {
    context.beginPath();
    places.forEach(item => {
      const { from, to } = item;
      context.moveTo(from.x, from.y);
      context.lineTo(to.x, to.y);
    });
    context.stroke();
  }

  // 绘制连续的线
  drawSerialLines(context, places) {
    context.beginPath();
    places.forEach((item, index) => {
      const { x, y } = item;
      if (index === 0) {
        context.moveTo(x, y);
      } else {
        context.lineTo(x, y);
      }
    });
    context.stroke();
  }

  drawArrow(ctx, fromX, fromY, toX, toY, theta, headlen, width, color) {
    const angle = (Math.atan2(fromY - toY, fromX - toX) * 180) / Math.PI;
    const angle1 = ((angle + theta) * Math.PI) / 180;
    const angle2 = ((angle - theta) * Math.PI) / 180;
    const topX = headlen * Math.cos(angle1);
    const topY = headlen * Math.sin(angle1);
    const botX = headlen * Math.cos(angle2);
    const botY = headlen * Math.sin(angle2);
    ctx.beginPath();
    let arrowX = fromX - topX;
    let arrowY = fromY - topY;
    ctx.moveTo(arrowX, arrowY);
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    arrowX = toX + topX;
    arrowY = toY + topY;
    ctx.moveTo(arrowX, arrowY);
    ctx.lineTo(toX, toY);
    arrowX = toX + botX;
    arrowY = toY + botY;
    ctx.lineTo(arrowX, arrowY);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
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
    const maxDirction = maxMin.max.direction;
    const minX = maxMin.min.x;
    const minY = maxMin.min.y;
    const minDirction = maxMin.min.direction;
    mainContext.font = Font;
    const textMaxWidth = mainContext.measureText(maxMin.max.value).width + 20;
    const textMinWidth = mainContext.measureText(maxMin.min.value).width + 20;
    mainContext.strokeStyle = PositiveColor;
    mainContext.lineWidth = 2;
    // 矩形初始点
    const rectMaxLeft = maxDirction === 'left' ? maxX + 40 : maxX - textMaxWidth - 40;
    const rectMinLeft = minDirction === 'left' ? minX + 40 : minX - textMinWidth - 40;
    this.drawLine(mainContext, {
      from: { x: maxX, y: maxY },
      to: { x: maxX, y: maxY - 20 },
    });
    this.drawLine(mainContext, {
      from: { x: maxX, y: maxY - 20 },
      to: { x: rectMaxLeft, y: maxY - 20 },
    });
    mainContext.fillStyle = PositiveColor;
    this.drawReact(mainContext, { x: rectMaxLeft, y: maxY - 30, width: textMaxWidth, height: 20 });
    mainContext.strokeStyle = NegativeColor;
    this.drawLine(mainContext, {
      from: { x: minX, y: minY },
      to: { x: minX, y: minY + 20 },
    });
    this.drawLine(mainContext, {
      from: { x: minX, y: minY + 20 },
      to: { x: rectMinLeft, y: minY + 20 },
    });
    mainContext.fillStyle = NegativeColor;
    this.drawReact(mainContext, { x: rectMinLeft, y: minY + 10, width: textMinWidth, height: 20 });
    mainContext.fillStyle = '#ffffff';
    mainContext.textAlign = 'left';
    mainContext.fillText(maxMin.max.value, rectMaxLeft + 10, maxY - 18);
    mainContext.fillText(maxMin.min.value, rectMinLeft + 10, minY + 22);
  }
}

// 橡皮擦画笔
export class ClearPlotter extends Plotter {
  constructor(type) {
    super('ClearPlotter');
    this.context = type === 'main' ? this.mainContext : this.overlayContext;
  }

  draw(layout) {
    const { left, top, right, bottom } = layout.getPlace();
    this.context.clearRect(left, top, right - left, bottom - top);
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
    const { left, top, right, bottom } = layout.getPlace();
    context.fillRect(left, top, right - left, bottom - top);
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
    const area = layout.getChartArea();
    const rangeData = layout.getRangeData();
    const context = this.mainContext;
    const { left, right } = area.getPlace();
    const gradations = rangeData.getGradations();
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

// 分时图
export class LineChartPlotter extends Plotter {
  constructor(name) {
    super(name);
    const { theme } = this.manager;
    this.fillColor = theme.Line.fillColor;
    this.strokeColor = theme.Line.strokeColor;
    this.strokeLineWidth = theme.Line.strokeLineWidth;
    this.averageLineColor = theme.Line.averageLineColor;
    this.averageLineWidth = theme.Line.averageLineWidth;
    this.NegativeColor = theme.Color.Negative;
    this.PositiveColor = theme.Color.Positive;
    this.Font = theme.Font.Default;
    this.maxMin = {
      min: { x: -1, y: Number.MIN_SAFE_INTEGER, value: 0 },
      max: { x: -1, y: Number.MAX_SAFE_INTEGER, value: 0 },
    };
  }

  // 绘制区域
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

  // 绘制折线
  drawLineStorkeLines(context, places, option) {
    const { color, lineWidth } = option;
    context.beginPath();
    places.forEach(item => {
      const { x, y } = item;
      context.lineTo(x, y);
    });
    context.strokeStyle = color;
    context.lineWidth = lineWidth;
    context.stroke();
  }

  // 绘制动态点
  showLinePoint(place) {
    const point = $('#chart_canvasGroup .line-point');
    point.show();
    const { x, y } = place;
    point.css('left', `${x - 20}px`);
    point.css('top', `${y - 20}px`);
  }

  // 绘制分时图均价 todo 成交量单独处理
  drawAverageLine(rangeData, interval) {
    const { dataSource } = this.manager;
    const context = this.mainContext;
    const data = dataSource.getCurrentData();
    const places = [];
    for (let i = 0; i < data.length; i++) {
      if (data[i]) {
        const x = i * interval;
        const y = rangeData.toY(data[i].average);
        places.push({
          x,
          y,
        });
      }
    }
    this.drawLineStorkeLines(context, places, {
      color: this.averageLineColor,
      lineWidth: this.averageLineWidth,
    });
  }

  draw(layout) {
    const chartArea = layout.getChartArea();
    const rangeData = layout.getRangeData();
    const { dataSource } = this.manager;
    const { right, left, bottom } = chartArea;
    const context = this.mainContext;
    const data = dataSource.getCurrentData();
    const width = right - left;
    const size = data.length;
    const interval = width / size;
    const places = [];
    const { maxMin } = this;
    pointsPlaces = { x: [], y: [] };
    for (let i = 0; i < size; i++) {
      if (data[i]) {
        const { close } = data[i];
        const x = i * interval;
        const y = rangeData.toY(close);
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
            direction: x > ((right - left) / 2 + left) ? 'right' : 'left',
          };
        }
        if (y > maxMin.min.y) {
          maxMin.min = {
            x,
            y,
            value: close,
            direction: x > ((right - left) / 2 + left) ? 'right' : 'left',
          };
        }
      }
    }
    this.drawLineStorkeLines(context, places, {
      color: this.strokeColor,
      lineWidth: this.strokeLineWidth,
    });
    this.drawFillLines(context, places, bottom);
    this.showLinePoint(places[places.length - 1]);
    this.drawAverageLine(rangeData, interval);
    this.drawMaxMin({
      mainContext: context,
      maxMin: this.maxMin,
      PositiveColor: this.PositiveColor,
      NegativeColor: this.NegativeColor,
      Font: this.Font,
    });
  }
}

// chart 视图指标
export class ChartIndicatorPlotter extends Plotter {
  constructor(name) {
    super(name);
    this.rangeData = {};
    this.theme = this.manager.theme;
    const { dataSource } = this.manager;
    this.currentData = dataSource.getCurrentData();
    this.candleLeftOffest = dataSource.getCandleLeftOffest();
    this.columnWidth = dataSource.getColumnWidth();
    this.itemCenterOffset = dataSource.getColumnCenter();
  }

  // MA
  drawMA(MAIndicator, type) {
    const { currentData, itemCenterOffset, columnWidth, rangeData, theme } = this;
    const MAObj = {};
    const { MALineColor } = theme.Line.MA;
    MAIndicator.data.forEach(item => {
      MAObj[item] = [];
    });
    let start = this.candleLeftOffest + itemCenterOffset;
    for (let i = 0; i < currentData.length; i++) {
      const data = currentData[i];
      Object.keys(MAObj).forEach(item => {
        const MAdata = data[type][item];
        MAObj[item].push({
          x: start,
          y: rangeData.toY(MAdata),
        });
      });
      start += columnWidth;
    }
    // 绘制MA
    const context = this.mainContext;
    Object.values(MAObj).forEach((item, index) => {
      context.strokeStyle = MALineColor[index]
      this.drawSerialLines(context, item);
    });
  }

  // BOLL
  drawBOLL(type) {
    const { currentData, itemCenterOffset, columnWidth, rangeData, theme } = this;
    const context = this.mainContext;
    const BOLLColor = theme.Line.BOLL;
    const BOLLPlaces = {
      MID: [],
      UP: [],
      LOW: [],
    };
    let start = this.candleLeftOffest + itemCenterOffset;
    for (let i = 0; i < currentData.length; i++) {
      const data = currentData[i];
      ['MID', 'UP', 'LOW'].forEach(item => {
        BOLLPlaces[item].push({
          x: start,
          y: rangeData.toY(data[type][item]),
        });
      });
      start += columnWidth;
    }
    context.lineWidth = BOLLColor.lineWidth;
    Object.keys(BOLLPlaces).forEach(item => {
      context.strokeStyle = BOLLColor[item];
      this.drawSerialLines(context, BOLLPlaces[item]);
    });
  }

  // 绘制 ENV
  drawENV(type) {
    const { currentData, itemCenterOffset, columnWidth, rangeData, theme } = this;
    const context = this.mainContext;
    const ENVColor = theme.Line.ENV;
    const ENVPlaces = {
      EnvUp: [],
      EnvLow: [],
    };
    let start = this.candleLeftOffest + itemCenterOffset;
    for (let i = 0; i < currentData.length; i++) {
      const data = currentData[i];
      ['EnvUp', 'EnvLow'].forEach(item => {
        ENVPlaces[item].push({
          x: start,
          y: rangeData.toY(data[type][item]),
        });
      });
      start += columnWidth;
    }
    context.lineWidth = ENVColor.lineWidth;
    Object.keys(ENVPlaces).forEach(item => {
      context.strokeStyle = ENVColor[item];
      this.drawSerialLines(context, ENVPlaces[item]);
    });
  }

  // 绘制CG指标
  drawCG(type) {
    const { currentData, itemCenterOffset, columnWidth, rangeData, theme } = this;
    const context = this.mainContext;
    const CGColor = theme.Line.CG;
    // 绘制圆弧
    const drawArc = (arcX, y, isFill) => {
      // 长度
      const width = 30;
      // 半径
      const arcR = 10;
      const x = arcX - width / 2;
      context.beginPath();
      context.moveTo(x, y - arcR);
      context.quadraticCurveTo(x - arcR, y, x, y + arcR);
      context.lineTo(x + width, y + arcR);
      context.quadraticCurveTo(x + width + arcR, y, x + width, y - arcR);
      context.lineTo(x, y - arcR);
      isFill ? context.fill() : context.stroke();
    };
    let start = this.candleLeftOffest + itemCenterOffset;
    // CG指标线
    const CGLinePlaces = [];
    // 主趋势线
    const CGTrendPlaces = [];
    // 看多看空
    const buySellPlaces = { CGBuy: [], CGSell: [] };
    for (let i = 0; i < currentData.length; i++) {
      const data = currentData[i];
      // CG指标线
      CGLinePlaces.push({
        x: start,
        y: rangeData.toY(data[type].MA55),
      });
      // 主趋势线
      const preData = currentData[i - 1];
      const lastTrendColor = preData && preData[type].CGtrendColor;
      const nowTrendColor = data[type].CGtrendColor;
      const trendCGobj = {
        x: start,
        y: rangeData.toY(data[type].EMAEMAclose1010),
        color: data[type].CGtrendColor,
      };
      // 根据不同颜色保存不同的主趋势线
      if (nowTrendColor !== lastTrendColor) {
        CGTrendPlaces.push([]);
        const preTrendPlaces = CGTrendPlaces[CGTrendPlaces.length - 2];
        preTrendPlaces && preTrendPlaces.push(trendCGobj);
      }
      const nowTrendPlaces = CGTrendPlaces[CGTrendPlaces.length - 1];
      nowTrendPlaces.push(trendCGobj);
      // 看多看空
      const { CGBuySell } = data[type];
      if (CGBuySell) {
        buySellPlaces[CGBuySell].push({
          x: start,
          y: rangeData.toY(CGBuySell === 'CGSell' ? data.high : data.low),
        });
      }
      start += columnWidth;
    }
    context.lineWidth = CGColor.lineWidth;
    context.strokeStyle = CGColor.CGLine;
    this.drawSerialLines(context, CGLinePlaces);
    CGTrendPlaces.forEach(item => {
      const trendItemColor = item[0].color;
      context.strokeStyle = CGColor[trendItemColor];
      this.drawSerialLines(context, item);
    });
    // 绘制看多看空
    context.font = CGColor.BuySellFont;
    context.textAlign = 'center';
    Object.keys(buySellPlaces).forEach(item => {
      const buySellValues = buySellPlaces[item];
      const text = item === 'CGSell' ? '看空' : '看多';
      const textColor = item === 'CGSell' ? CGColor.CGTrendNegative : CGColor.CGTrendPositive;
      const fillColor = item === 'CGSell' ? CGColor.BuySellFillNegative : CGColor.BuySellFillPositive;
      context.strokeStyle = textColor;
      buySellValues.forEach(buySellItem => {
        const textY = item === 'CGSell' ? buySellItem.y - 40 : buySellItem.y + 40;
        context.lineWidth = 0.5;
        context.fillStyle = fillColor;
        drawArc(buySellItem.x, textY, true);
        drawArc(buySellItem.x, textY, false);
        context.fillStyle = textColor;
        context.fillText(text, buySellItem.x, textY);
        const arrowPlace = {};
        if (item === 'CGSell') {
          arrowPlace.from = { x: buySellItem.x, y: buySellItem.y - 20 };
          arrowPlace.to = { x: buySellItem.x, y: buySellItem.y - 10 };
        } else {
          arrowPlace.from = { x: buySellItem.x, y: buySellItem.y + 20 };
          arrowPlace.to = { x: buySellItem.x, y: buySellItem.y + 10 };
        }
        this.drawArrow(
          context,
          arrowPlace.from.x,
          arrowPlace.from.y,
          arrowPlace.to.x,
          arrowPlace.to.y,
          30,
          5,
          2,
          textColor,
        );
      });
    });
  }

  // 绘制SAR指标
  drawSAR(type) {
    const { currentData, itemCenterOffset, columnWidth, rangeData, theme } = this;
    const context = this.mainContext;
    const SARTheme = theme.Line.SAR;
    const SARUpPlaces = [];
    const SARDownPlaces = [];
    let start = this.candleLeftOffest + itemCenterOffset;
    for (let i = 0; i < currentData.length; i++) {
      const data = currentData[i];
      const { SAR, SAROption } = data[type];
      if (!SAR) continue;
      if (SAROption.up) SARUpPlaces.push({ x: start, y: rangeData.toY(SAR) })
      else SARDownPlaces.push({ x: start, y: rangeData.toY(SAR) });
      start += columnWidth;
    }
    const r = columnWidth / 4;
    // 绘制圆形
    context.beginPath();
    context.strokeStyle = SARTheme.upColor;
    SARUpPlaces.forEach(item => {
      context.moveTo(item.x + r, item.y);
      context.arc(item.x, item.y, r, 0, 2 * Math.PI)
    })
    context.stroke()
    context.beginPath();
    context.strokeStyle = SARTheme.downColor;
    SARDownPlaces.forEach(item => {
      context.moveTo(item.x + r, item.y);
      context.arc(item.x, item.y, r, 0, 2 * Math.PI)
    })
    context.stroke()
  }

  draw(layout) {
    this.rangeData = layout.getRangeData();
    const chartIndicator = layout.getChartIndicator();
    if (!chartIndicator) return;
    Object.keys(chartIndicator).forEach(item => {
      switch (item) {
        case 'MA':
          this.drawMA(chartIndicator[item], layout.chartConfig.sign);
          break;
        case 'BOLL':
          this.drawBOLL(layout.chartConfig.sign);
          break;
        case 'ENV':
          this.drawENV(layout.chartConfig.sign);
          break;
        case 'CG':
          this.drawCG(layout.chartConfig.sign);
          break;
        case 'SAR':
          this.drawSAR(layout.chartConfig.sign);
          break;
        default:
          break;
      }
    });
  }
}

// 主视图上显示的信息 (蜡烛图/分时图) 高开低收/均线
export class MainInfoPlotter extends Plotter {
  constructor(name) {
    super(name);
    const { theme } = this.manager;
    this.Font = theme.Font.Default;
    this.NegativeColor = theme.Color.Negative;
    this.PositiveColor = theme.Color.Positive;
    this.FontColor = theme.Color.Normal;
    this.AverageLineColor = theme.Line.averageLineColor;
  }

  // param: open/close/hign/low
  getCandleFontColor(type, data, preData) {
    // 开盘价
    const { open } = data;
    const nowValue = data[type];
    const preValue = preData ? preData[type] : open;
    if (type === 'time') return this.FontColor;
    if (nowValue === preValue) return this.FontColor;
    return nowValue > preValue ? this.PositiveColor : this.NegativeColor;
  }

  getLineFontColor(close, open) {
    if (close === open) return this.FontColor;
    if (close > open) return this.PositiveColor;
    return this.NegativeColor;
  }

  draw(layout, index) {
    // 判断当前视图中是否有蜡烛图, 分时图
    const MainLayout = layout
      .getLayouts()
      .find(
        item => item.chartConfig
          && (item.chartConfig.sign === 'Candle' || item.chartConfig.sign === 'Line'),
      );
    if (!MainLayout) return;
    const context = this.overlayContext;
    const { dataSource } = this.manager;
    const { maxCountInArea } = dataSource;
    const currentData = dataSource.getCurrentData();
    const chartConfig = MainLayout.getChartConfig();
    const chartSign = chartConfig.sign;
    const data = currentData[index];
    const preData = currentData[index - 1];
    const { left, right, top } = MainLayout.getPlace();
    const direction = index < maxCountInArea / 2 ? 'right' : 'left';
    context.font = this.Font;
    if (chartSign === 'Candle') {
      // 绘制蜡烛图的高开低收
      const textArray = [
        {
          label: '时间',
          // eslint-disable-next-line no-undef
          value: moment(data.time).format('YYYY-MM-DD'),
          color: this.getCandleFontColor('time', data, preData),
        },
        {
          label: '开盘价',
          value: data.open,
          color: this.getCandleFontColor('open', data, preData),
        },
        {
          label: '最低价',
          value: data.low,
          color: this.getCandleFontColor('low', data, preData),
        },
        {
          label: '最高价',
          value: data.high,
          color: this.getCandleFontColor('high', data, preData),
        },
        {
          label: '收盘价',
          value: data.close,
          color: this.getCandleFontColor('close', data, preData),
        },
      ];
      const widthArray = textArray.map(
        item => context.measureText(`${item.label}${item.value}`).width,
      );
      const rectWidth = Math.max(...widthArray) + 50;
      const distance = ((right - left) / 2 - rectWidth) / 4;
      const x = direction === 'left' ? left + distance : right - distance - 2 * rectWidth;
      context.fillStyle = 'rgba(247,247,247, .93)';
      this.drawReact(context, {
        x,
        y: top + 20,
        width: rectWidth,
        height: textArray.length * 20 + 30,
      });
      let textY = top + 50;
      textArray.forEach(item => {
        const { label, value } = item;
        context.fillStyle = this.FontColor;
        context.textAlign = 'left';
        context.fillText(label, x + 10, textY);
        context.fillStyle = item.color;
        context.textAlign = 'right';
        context.fillText(value, x + rectWidth - 10, textY);
        textY += 20;
      });
    } else if (chartSign === 'Line') {
      // 绘制分时的均线, 当前价, 时间
      const lineTextInfoArray = [
        {
          label: '时间:',
          // eslint-disable-next-line no-undef
          value: moment(data.time).format('HH:mm'),
          color: this.FontColor,
        },
        {
          label: '均价:',
          value: data.average,
          color: this.AverageLineColor,
        },
        {
          label: '数值:',
          value: data.close,
          color: this.getLineFontColor(data.close, data.open),
        },
      ];
      let lineInfoX = left + 10;
      const lineInfoY = 20;
      const labelBetween = 20;
      const valueBetween = 5;
      lineTextInfoArray.forEach(item => {
        context.textAlign = 'left';
        context.fillStyle = this.FontColor;
        context.fillText(item.label, lineInfoX, lineInfoY);
        lineInfoX += context.measureText(item.label).width + valueBetween;
        context.fillStyle = item.color;
        context.fillText(item.value, lineInfoX, lineInfoY);
        lineInfoX += context.measureText(item.value).width + labelBetween;
      });
    }
  }
}

// chart 视图 上显示的信息
export class ChartInfoPlotters extends Plotter {
  constructor(name) {
    super(name);
    const { theme } = this.manager;
    this.theme = theme;
    this.decimalDigits = this.manager.setting.decimalDigits;
  }

  // 成交量 信息
  drawVolumeInfo(data, startPlace) {
    const formatVolume = volume => {
      if (volume.split('.')[0].length >= 4 && volume.split('.')[0].length < 9) return `${(volume / 10000).toFixed(2)}万`;
      if (volume.split('.')[0].length >= 9 && volume.split('.')[0].length < 13) return `${(volume / 100000000).toFixed(2)}亿`;
      if (volume.split('.')[0].length >= 13) return `${(volume / 1000000000000).toFixed(2)}兆`;
      return volume;
    };
    const context = this.overlayContext;
    const { volume } = data;
    const volumeColor = this.theme.Line.Volume;
    const text = `成交量: ${formatVolume(volume.toString())}手`;
    const { startX, textY } = startPlace
    let textX = startX;
    context.fillStyle = volumeColor.infoColor;
    context.font = volumeColor.infoFont;
    context.textAlign = 'left';
    context.fillText(text, textX, textY);
    textX += context.measureText(text).width + 10;
  }

  // MACD 信息
  drawMACDInfo(chartConfig, data, startPlace) {
    const context = this.overlayContext;
    const { MACD, DIF, DEA } = data;
    const { short, long, middle } = chartConfig.data;
    const label = `MACD(${short}, ${long}, ${middle})`
    const MACDtext = `MACD:${Number(MACD).toFixed(2)}`;
    const DIFtext = `DIF:${Number(DIF).toFixed(2)}`;
    const DEAtext = `DEA:${Number(DEA).toFixed(2)}`;
    const { startX, textY } = startPlace
    const MACDTheme = this.theme.Line.MACD;
    // 副视图中绘制MACD信息
    let textX = startX;
    context.font = MACDTheme.infoFont;
    context.fillStyle = MACDTheme.infoColor;
    context.textAlign = 'left';
    context.fillText(label, textX, textY);
    textX += context.measureText(label).width + 10;
    context.fillStyle = MACDTheme.MACDInfo;
    context.fillText(MACDtext, textX, textY);
    textX += context.measureText(MACDtext).width + 10;
    context.fillStyle = MACDTheme.DIF;
    context.fillText(DIFtext, textX, textY);
    textX += context.measureText(DIFtext).width + 10;
    context.fillStyle = MACDTheme.DEA;
    context.fillText(DEAtext, textX, textY);
    textX += context.measureText(DEAtext).width + 10;
    startPlace.startX = textX;
  }

  // VR 信息
  drawVRInfo(chartConfig, data, startPlace) {
    const context = this.overlayContext;
    const VRTheme = this.theme.Line.VR;
    const VRValues = ['VR'].map(item => ({
      value: `${item}:${data[item]}`,
      color: VRTheme.VRColor,
    }));
    VRValues.unshift({ value: `VR(${chartConfig.N})`, color: VRTheme.infoColor });
    const { startX, textY } = startPlace
    let textX = startX;
    context.font = VRTheme.infoFont;
    context.textAlign = 'left';
    VRValues.forEach(item => {
      context.fillStyle = item.color;
      context.fillText(item.value, textX, textY);
      textX += context.measureText(item.value).width + 10;
    });
    startPlace.startX = textX;
  }

  // WR 信息
  drawWRInfo(chartConfig, data, startPlace) {
    const context = this.overlayContext;
    const WRTheme = this.theme.Line.WR;
    const WRValues = ['WR'].map(item => ({
      value: `${item}:${data[item]}`,
      color: WRTheme.WRColor,
    }));
    WRValues.unshift({ value: `WR(${chartConfig.N})`, color: WRTheme.infoColor });
    const { startX, textY } = startPlace
    let textX = startX;
    context.font = WRTheme.infoFont;
    context.textAlign = 'left';
    WRValues.forEach(item => {
      context.fillStyle = item.color;
      context.fillText(item.value, textX, textY);
      textX += context.measureText(item.value).width + 10;
    });
    startPlace.startX = textX;
  }

  // RSI 信息
  drawRSIInfo(chartConfig, data, startPlace) {
    const context = this.overlayContext;
    const RSITheme = this.theme.Line.RSI;
    const RSIValues = ['RSI1', 'RSI2'].map(item => ({
      value: `${item}:${data[item]}`,
      color: RSITheme[item],
    }));
    RSIValues.unshift({ value: `RSI(${chartConfig.N1}, ${chartConfig.N2})`, color: RSITheme.infoColor });
    const { startX, textY } = startPlace
    let textX = startX;
    context.font = RSITheme.infoFont;
    context.textAlign = 'left';
    RSIValues.forEach(item => {
      context.fillStyle = item.color;
      context.fillText(item.value, textX, textY);
      textX += context.measureText(item.value).width + 10;
    });
    startPlace.startX = textX;
  }

  // CCI 信息
  drawCCIInfo(chartConfig, data, startPlace) {
    const context = this.overlayContext;
    const CCITheme = this.theme.Line.CCI;
    const CCIValues = ['CCI'].map(item => ({
      value: `${item}:${data[item]}`,
      color: CCITheme.CCI,
    }));
    CCIValues.unshift({ value: `CCI(${chartConfig.N})`, color: CCITheme.infoColor });
    const { startX, textY } = startPlace
    let textX = startX;
    context.font = CCITheme.infoFont;
    context.textAlign = 'left';
    CCIValues.forEach(item => {
      context.fillStyle = item.color;
      context.fillText(item.value, textX, textY);
      textX += context.measureText(item.value).width + 10;
    });
    startPlace.startX = textX;
  }

  // KDJ 信息
  drawKDJInfo(chartConfig, data, startPlace) {
    const context = this.overlayContext;
    const KDJTheme = this.theme.Line.KDJ;
    const KDJValues = ['K', 'D', 'J'].map(item => ({
      value: `${item}:${data[item]}`,
      color: KDJTheme[item],
    }));
    KDJValues.unshift({ value: `KDJ(${chartConfig.N}, ${chartConfig.m1}, ${chartConfig.m2})`, color: KDJTheme.infoColor });
    const { startX, textY } = startPlace
    let textX = startX;
    context.font = KDJTheme.infoFont;
    context.textAlign = 'left';
    KDJValues.forEach(item => {
      context.fillStyle = item.color;
      context.fillText(item.value, textX, textY);
      textX += context.measureText(item.value).width + 10;
    });
    startPlace.startX = textX;
  }

  // BIAS 信息
  drawBIASInfo(chartConfig, data, startPlace) {
    const context = this.overlayContext;
    const BIASTheme = this.theme.Line.BIAS;
    const KDJValues = ['BIAS1', 'BIAS2', 'BIAS3'].map(item => ({
      originValue: data[item],
      value: `${item}:${data[item]}`,
      color: BIASTheme[item],
    }));
    KDJValues.unshift({ value: `BIAS(${chartConfig.N1}, ${chartConfig.N2}, ${chartConfig.N3})`, color: BIASTheme.infoColor });
    const { startX, textY } = startPlace
    let textX = startX;
    context.font = BIASTheme.infoFont;
    context.textAlign = 'left';
    KDJValues.forEach(item => {
      context.fillStyle = item.color;
      if (item.originValue !== null) {
        context.fillText(item.value, textX, textY);
        textX += context.measureText(item.value).width + 10;
      }
    });
    startPlace.startX = textX;
  }

  // MA 信息
  drawMAInfo(MAData, data, startPlace) {
    const context = this.overlayContext;
    const MAArray = MAData.data;
    const MATheme = this.theme.Line.MA;
    const MAValue = MAArray.map((item, index) => ({
      color: MATheme.MALineColor[index], value: `${item}: ${data[item]}`,
    }))
    const { startX, textY } = startPlace
    const label = 'MA';
    let textX = startX;
    context.font = MATheme.infoFont;
    context.fillStyle = MATheme.infoColor;
    context.textAlign = 'left';
    context.fillText(label, textX, textY);
    textX += context.measureText(label).width + 10;
    MAValue.forEach(item => {
      context.fillStyle = item.color;
      context.fillText(item.value, textX, textY);
      textX += context.measureText(item.value).width + 10;
    })
    startPlace.startX = textX;
  }

  // BOLL 信息
  drawBOLLInfo(BOLLData, data, startPlace) {
    const context = this.overlayContext;
    const BOLLTheme = this.theme.Line.BOLL;
    const BOLLValues = ['UP', 'MID', 'LOW'].map(item => ({
      value: `${item}:${data[item]}`,
      color: BOLLTheme[item],
    }));
    BOLLValues.unshift({ value: `BOLL(${BOLLData.N})`, color: BOLLTheme.infoColor });
    const { startX, textY } = startPlace
    let textX = startX;
    context.font = BOLLTheme.infoFont;
    context.textAlign = 'left';
    BOLLValues.forEach(item => {
      context.fillStyle = item.color;
      context.fillText(item.value, textX, textY);
      textX += context.measureText(item.value).width + 10;
    });
    startPlace.startX = textX;
  }

  // ENV 信息
  drawENVInfo(ENVData, data, startPlace) {
    const context = this.overlayContext;
    const ENVTheme = this.theme.Line.ENV;
    const { N, n2 } = ENVData;
    const ENVValues = ['EnvUp', 'EnvLow'].map(item => ({
      value: `${item}:${data[item]}`,
      color: ENVTheme[item],
    }))
    ENVValues.unshift({ value: `ENV(${N}, ${n2})`, color: ENVTheme.infoColor });
    const { startX, textY } = startPlace
    let textX = startX;
    context.font = ENVTheme.infoFont;
    context.textAlign = 'left';
    ENVValues.forEach(item => {
      context.fillStyle = item.color;
      context.fillText(item.value, textX, textY);
      textX += context.measureText(item.value).width + 10;
    });
    startPlace.startX = textX;
  }

  // CG 指标信息
  drawCGInfo(data, startPlace) {
    const context = this.overlayContext;
    const CGTheme = this.theme.Line.CG;
    const CGValues = [{
      value: `CG指标:${data.MA55}`,
      color: CGTheme.CGLine,
    }, {
      value: `主趋势线:${Number(data.EMAEMAclose1010).toFixed(this.decimalDigits)}`,
      color: CGTheme[data.CGtrendColor],
    }];
    const { startX, textY } = startPlace
    let textX = startX;
    context.font = CGTheme.infoFont;
    context.textAlign = 'left';
    CGValues.forEach(item => {
      context.fillStyle = item.color;
      context.fillText(item.value, textX, textY);
      textX += context.measureText(item.value).width + 10;
    });
    startPlace.startX = textX;
  }

  // SAR 指标信息
  drawSARInfo(SARData, data, startPlace) {
    const context = this.overlayContext;
    const SARTheme = this.theme.Line.SAR;
    const { N, STEP, MVALUE } = SARData;
    const { SAR, SAROption } = data;
    const SARValues = [{
      value: `SAR(${N},${STEP},${MVALUE})`,
      color: SARTheme.infoColor,
    }, {
      value: `SAR:${SAR}`,
      color: SAROption.up ? SARTheme.upColor : SARTheme.downColor,
    }];
    const { startX, textY } = startPlace
    let textX = startX;
    context.font = SARTheme.infoFont;
    context.textAlign = 'left';
    SARValues.forEach(item => {
      context.fillStyle = item.color;
      context.fillText(item.value, textX, textY);
      textX += context.measureText(item.value).width + 10;
    });
    startPlace.startX = textX;
  }

  draw(layout, index) {
    const { dataSource } = this.manager;
    this.chartArea = layout.getChartArea();
    // const context = this.overlayContext;
    const currentData = dataSource.getCurrentData();
    const { left, top } = this.chartArea.getPlace();
    const chartConfig = layout.getChartConfig();
    const chartSign = chartConfig.sign;
    const data = currentData[index];
    // chart信息
    const startPlace = {
      startX: left + 5,
      textY: top + 15,
    }
    switch (chartSign) {
      case 'Volume':
        this.drawVolumeInfo(data, startPlace);
        break;
      case 'MACD':
        this.drawMACDInfo(chartConfig, data, startPlace);
        break;
      case 'VR':
        this.drawVRInfo(chartConfig, data, startPlace);
        break;
      case 'WR':
        this.drawWRInfo(chartConfig, data, startPlace);
        break;
      case 'RSI':
        this.drawRSIInfo(chartConfig, data, startPlace);
        break;
      case 'KDJ':
        this.drawKDJInfo(chartConfig, data, startPlace);
        break;
      case 'CCI':
        this.drawCCIInfo(chartConfig, data, startPlace);
        break;
      case 'BIAS':
        this.drawBIASInfo(chartConfig, data, startPlace);
        break;
      default:
        break;
    }
    // chart 上的指标信息
    const chartIndicator = layout.getChartIndicator();
    chartIndicator && Object.keys(chartIndicator).forEach(indicatorItem => {
      switch (indicatorItem) {
        case 'MA':
          this.drawMAInfo(chartIndicator.MA, data[chartSign], startPlace);
          break;
        case 'BOLL':
          this.drawBOLLInfo(chartIndicator.BOLL, data[chartSign], startPlace);
          break;
        case 'ENV':
          this.drawENVInfo(chartIndicator.ENV, data[chartSign], startPlace);
          break;
        case 'CG':
          this.drawCGInfo(data[chartSign], startPlace);
          break;
        case 'SAR':
          this.drawSARInfo(chartIndicator.SAR, data[chartSign], startPlace);
          break;
        default:
          break;
      }
    });
  }
}

// 蜡烛图
export class CandlestickPlotter extends Plotter {
  constructor(name) {
    super(name);
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

  hideLinePoint() {
    const point = $('#chart_canvasGroup .line-point');
    point.hide();
  }

  draw(layout) {
    const rangeData = layout.getRangeData();
    const { right, left } = layout.getPlace();
    const { dataSource } = this.manager;
    const context = this.mainContext;
    const currentData = dataSource.getCurrentData();
    const candleLeftOffest = dataSource.getCandleLeftOffest();
    const columnWidth = dataSource.getColumnWidth();
    const itemCenterOffset = dataSource.getColumnCenter();
    const { maxMin } = this;
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
      const highPlace = rangeData.toY(high);
      const lowPlace = rangeData.toY(low);
      const closePlace = rangeData.toY(close);
      const openPlace = rangeData.toY(open);
      const leftX = columnLeft;
      const leftLineX = columnLeft + itemCenterOffset;
      pointsPlaces.x.push(leftLineX);
      const rectWidth = 2 * itemCenterOffset;
      const lineRectWidth = 1;
      // 蜡烛图最大最小值
      if (highPlace < maxMin.max.y) {
        maxMin.max = {
          direction: leftLineX > ((right - left) / 2 + left) ? 'right' : 'left',
          x: leftLineX,
          y: highPlace,
          value: data.high,
        };
      }
      if (lowPlace > maxMin.min.y) {
        maxMin.min = {
          direction: leftLineX > ((right - left) / 2 + left) ? 'right' : 'left',
          x: leftLineX,
          y: lowPlace,
          value: data.low,
        };
      }
      // 涨
      if (close >= open) {
        fillPosRects.push({
          x: leftX,
          y: closePlace,
          width: rectWidth,
          height: Math.max(openPlace - closePlace, 1),
        });
        fillPosLines.push({
          x: leftLineX,
          y: highPlace,
          width: lineRectWidth,
          height: closePlace - highPlace,
        });
        fillPosLines.push({
          x: leftLineX,
          y: openPlace,
          width: lineRectWidth,
          height: lowPlace - openPlace,
        });
      } else if (close < open) {
        fillNegRects.push({
          x: leftX,
          y: openPlace,
          width: rectWidth,
          height: Math.max(closePlace - openPlace, 1),
        });
        fillNegLines.push({
          x: leftLineX,
          y: highPlace,
          width: lineRectWidth,
          height: openPlace - highPlace,
        });
        fillNegLines.push({
          x: leftLineX,
          y: closePlace,
          width: lineRectWidth,
          height: lowPlace - closePlace,
        });
      }
      columnLeft += columnWidth;
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
    this.hideLinePoint();
    this.drawMaxMin({
      mainContext: context,
      maxMin: this.maxMin,
      PositiveColor: this.PositiveColor,
      NegativeColor: this.NegativeColor,
      Font: this.Font,
    });
  }
}

// 时间轴
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
    context.textAlign = 'left';
    context.fillText(time, leftX, top + 15);
  }
}

// range轴
export class RangePlotter extends Plotter {
  constructor(name) {
    super(name);
    const { theme } = this.manager;
    this.GridColor = theme.Color.Grid;
    this.Font = theme.Font.Default;
    this.Background = theme.Color.Background;
  }

  // 清除越界的图案
  clearRangeArea(area) {
    const { left, right, top, bottom } = area.getPlace();
    this.mainContext.clearRect(left, top, right - left, bottom - top);
    this.mainContext.fillStyle = this.Background;
    this.mainContext.fillRect(left, top, right - left, bottom - top);
  }

  draw(layout) {
    const rangeArea = layout.getRangeArea();
    const rangeData = layout.getRangeData();
    const context = this.mainContext;
    const gradations = rangeData.getGradations();
    let { left, right, top, bottom } = rangeArea.getPlace();
    this.clearRangeArea(rangeArea);
    const center = rangeArea.getCenter() + 0.5;
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

  draw(layout, option) {
    const { index, y } = option;
    const { decimalDigits, chartType } = this.manager.setting;
    const rangeArea = layout.getRangeArea();
    const rangeData = layout.getRangeData();
    const context = this.overlayContext;
    let value;
    if (chartType === 'candle') {
      value = rangeData.toValue(y).toFixed(decimalDigits);
    } else if (chartType === 'line') {
      const data = this.manager.dataSource.getCurrentData();
      value = data[index].close;
    }
    const { left, right } = rangeArea.getPlace();
    const width = right - left;
    const textWidth = context.measureText(value).width;
    context.font = this.Font;
    context.fillStyle = this.GridColor;
    context.textAlign = 'left';
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
    this.NegativeColor = theme.Color.Negative;
    this.PositiveColor = theme.Color.Positive;
    this.GridColor = theme.Color.Grid;
  }

  draw(layout) {
    const chartArea = layout.getChartArea();
    const rangeData = layout.getRangeData();
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
    // 从前往后绘制
    const fillPosRects = [];
    const fillNegRects = [];
    for (let i = 0; i < currentData.length; i++) {
      const data = currentData[i];
      if (!data) continue;
      const { volume, close, open } = data;
      const volumePlace = rangeData.toY(volume);
      const lowPlace = rangeData.toY(0);
      const leftX = columnLeft;
      const rectWidth = 2 * itemCenterOffset;
      // 涨
      if (close >= open) {
        fillPosRects.push({
          x: leftX,
          y: volumePlace - this.paddingBottom,
          width: rectWidth,
          height: lowPlace - volumePlace,
        });
      } else if (close < open) {
        fillNegRects.push({
          x: leftX,
          y: volumePlace - this.paddingBottom,
          width: rectWidth,
          height: lowPlace - volumePlace,
        });
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
      }
      if (target > midItem) {
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
    const { right, bottom } = layout.getPlace();
    context.setLineDash([5, 5]);
    this.drawLine(context, {
      from: { x, y: 0 },
      to: { x, y: bottom - this.timelineAreaHeight },
    });
    this.drawLine(context, {
      from: { x: 0, y },
      to: { x: right, y },
    });
    context.setLineDash([]);
    crossCursorSelectAt.index = xInfo.index;
    return {
      index: xInfo.index,
      y,
    };
  }
}

// 绘制MACD
export class MACDPlotter extends Plotter {
  constructor(name) {
    super(name);
    const { theme } = this.manager;
    this.GridColor = theme.Color.Grid;
    this.MACDtheme = theme.Line.MACD;
  }

  draw(layout) {
    const chartArea = layout.getChartArea();
    const rangeData = layout.getRangeData();
    const { dataSource } = this.manager;
    const { left, right, top } = chartArea.getPlace();
    const context = this.mainContext;
    const currentData = dataSource.getCurrentData();
    const columnWidth = dataSource.getColumnWidth();
    const candleLeftOffest = dataSource.getCandleLeftOffest();
    const itemCenterOffset = dataSource.getColumnCenter();
    let start = candleLeftOffest + itemCenterOffset;
    const DIFarray = [];
    const DEAarray = [];
    const MACDpositiveArray = [];
    const MACDnegativeArray = [];
    // 绘制分割线
    context.strokeStyle = this.GridColor;
    this.drawLine(context, {
      from: { x: left + 0.5, y: top + 0.5 },
      to: { x: right + 0.5, y: top + 0.5 },
    });
    for (let i = 0; i < currentData.length; i++) {
      const data = currentData[i];
      const { DIF, DEA, MACD } = data;
      const DIFplace = rangeData.toY(DIF);
      const DEAplace = rangeData.toY(DEA);
      const MACDplace = rangeData.toY(MACD);
      const MACDZeroPlace = rangeData.toY(0);
      DIFarray.push({
        x: start,
        y: DIFplace,
      });
      DEAarray.push({
        x: start,
        y: DEAplace,
      });
      const MACDPlaceObj = {
        from: { x: start, y: MACDZeroPlace },
        to: { x: start, y: MACDplace },
      };
      MACD > 0 ? MACDpositiveArray.push(MACDPlaceObj) : MACDnegativeArray.push(MACDPlaceObj);
      start += columnWidth;
    }
    context.lineWidth = this.MACDtheme.lineWidth;
    context.strokeStyle = this.MACDtheme.MACDpositive;
    this.drawLines(context, MACDpositiveArray);
    context.strokeStyle = this.MACDtheme.MACDnegative;
    this.drawLines(context, MACDnegativeArray);
    context.strokeStyle = this.MACDtheme.DIF;
    this.drawSerialLines(context, DIFarray);
    context.strokeStyle = this.MACDtheme.DEA;
    this.drawSerialLines(context, DEAarray);
  }
}

// 绘制VR
export class VRPlotter extends Plotter {
  constructor(name) {
    super(name);
    const { theme } = this.manager;
    this.GridColor = theme.Color.Grid;
    this.VRtheme = theme.Line.VR;
  }

  draw(layout) {
    const chartArea = layout.getChartArea();
    const rangeData = layout.getRangeData();
    const { dataSource } = this.manager;
    const { left, right, top } = chartArea.getPlace();
    const context = this.mainContext;
    const currentData = dataSource.getCurrentData();
    const columnWidth = dataSource.getColumnWidth();
    const candleLeftOffest = dataSource.getCandleLeftOffest();
    const itemCenterOffset = dataSource.getColumnCenter();
    let start = candleLeftOffest + itemCenterOffset;
    const VRPlace = [];
    // 绘制分割线
    context.strokeStyle = this.GridColor;
    this.drawLine(context, {
      from: { x: left + 0.5, y: top + 0.5 },
      to: { x: right + 0.5, y: top + 0.5 },
    });
    for (let i = 0; i < currentData.length; i++) {
      const data = currentData[i];
      const { VR } = data;
      const VRplace = rangeData.toY(VR);
      VRPlace.push({
        x: start,
        y: VRplace,
      });
      start += columnWidth;
    }
    context.lineWidth = this.VRtheme.lineWidth;
    context.strokeStyle = this.VRtheme.VRColor;
    this.drawSerialLines(context, VRPlace);
  }
}

// 绘制WR
export class WRPlotter extends Plotter {
  constructor(name) {
    super(name);
    const { theme } = this.manager;
    this.GridColor = theme.Color.Grid;
    this.WRtheme = theme.Line.WR;
  }

  draw(layout) {
    const chartArea = layout.getChartArea();
    const rangeData = layout.getRangeData();
    const { dataSource } = this.manager;
    const { left, right, top } = chartArea.getPlace();
    const context = this.mainContext;
    const currentData = dataSource.getCurrentData();
    const columnWidth = dataSource.getColumnWidth();
    const candleLeftOffest = dataSource.getCandleLeftOffest();
    const itemCenterOffset = dataSource.getColumnCenter();
    let start = candleLeftOffest + itemCenterOffset;
    const WRPlace = [];
    // 绘制分割线
    context.strokeStyle = this.GridColor;
    this.drawLine(context, {
      from: { x: left + 0.5, y: top + 0.5 },
      to: { x: right + 0.5, y: top + 0.5 },
    });
    for (let i = 0; i < currentData.length; i++) {
      const data = currentData[i];
      const { WR } = data;
      const WRplace = rangeData.toY(WR);
      WRPlace.push({
        x: start,
        y: WRplace,
      });
      start += columnWidth;
    }
    context.lineWidth = this.WRtheme.lineWidth;
    context.strokeStyle = this.WRtheme.WRColor;
    this.drawSerialLines(context, WRPlace);
  }
}

// 绘制RSI
export class RSIPlotter extends Plotter {
  constructor(name) {
    super(name);
    const { theme } = this.manager;
    this.GridColor = theme.Color.Grid;
    this.RSITheme = theme.Line.RSI;
  }

  draw(layout) {
    const chartArea = layout.getChartArea();
    const rangeData = layout.getRangeData();
    const { dataSource } = this.manager;
    const { left, right, top } = chartArea.getPlace();
    const context = this.mainContext;
    const currentData = dataSource.getCurrentData();
    const columnWidth = dataSource.getColumnWidth();
    const candleLeftOffest = dataSource.getCandleLeftOffest();
    const itemCenterOffset = dataSource.getColumnCenter();
    let start = candleLeftOffest + itemCenterOffset;
    const RSI1Place = [];
    const RSI2Place = [];
    // 绘制分割线
    context.strokeStyle = this.GridColor;
    this.drawLine(context, {
      from: { x: left + 0.5, y: top + 0.5 },
      to: { x: right + 0.5, y: top + 0.5 },
    });
    for (let i = 0; i < currentData.length; i++) {
      const data = currentData[i];
      const { RSI1, RSI2 } = data;
      RSI1Place.push({
        x: start,
        y: rangeData.toY(RSI1),
      });
      RSI2Place.push({
        x: start,
        y: rangeData.toY(RSI2),
      });
      start += columnWidth;
    }
    context.lineWidth = this.RSITheme.lineWidth;
    context.strokeStyle = this.RSITheme.RSI1;
    this.drawSerialLines(context, RSI1Place);
    context.strokeStyle = this.RSITheme.RSI2;
    this.drawSerialLines(context, RSI2Place);
  }
}

// 绘制KDJ
export class KDJPlotter extends Plotter {
  constructor(name) {
    super(name);
    const { theme } = this.manager;
    this.GridColor = theme.Color.Grid;
    this.KDJTheme = theme.Line.KDJ;
  }

  draw(layout) {
    const chartArea = layout.getChartArea();
    const rangeData = layout.getRangeData();
    const { dataSource } = this.manager;
    const { left, right, top } = chartArea.getPlace();
    const context = this.mainContext;
    const currentData = dataSource.getCurrentData();
    const columnWidth = dataSource.getColumnWidth();
    const candleLeftOffest = dataSource.getCandleLeftOffest();
    const itemCenterOffset = dataSource.getColumnCenter();
    let start = candleLeftOffest + itemCenterOffset;
    const KPlace = [];
    const DPlace = [];
    const JPLace = [];
    // 绘制分割线
    context.strokeStyle = this.GridColor;
    this.drawLine(context, {
      from: { x: left + 0.5, y: top + 0.5 },
      to: { x: right + 0.5, y: top + 0.5 },
    });
    for (let i = 0; i < currentData.length; i++) {
      const data = currentData[i];
      const { K, D, J } = data;
      KPlace.push({
        x: start,
        y: rangeData.toY(K),
      });
      DPlace.push({
        x: start,
        y: rangeData.toY(D),
      });
      JPLace.push({
        x: start,
        y: rangeData.toY(J),
      });
      start += columnWidth;
    }
    context.lineWidth = this.KDJTheme.lineWidth;
    context.strokeStyle = this.KDJTheme.K;
    this.drawSerialLines(context, KPlace);
    context.strokeStyle = this.KDJTheme.D;
    this.drawSerialLines(context, DPlace);
    context.strokeStyle = this.KDJTheme.J;
    this.drawSerialLines(context, JPLace);
  }
}

// 绘制CCI
export class CCIPlotter extends Plotter {
  constructor(name) {
    super(name);
    const { theme } = this.manager;
    this.GridColor = theme.Color.Grid;
    this.CCITheme = theme.Line.CCI;
  }

  draw(layout) {
    const chartArea = layout.getChartArea();
    const rangeData = layout.getRangeData();
    const { dataSource } = this.manager;
    const { left, right, top } = chartArea.getPlace();
    const context = this.mainContext;
    const currentData = dataSource.getCurrentData();
    const columnWidth = dataSource.getColumnWidth();
    const candleLeftOffest = dataSource.getCandleLeftOffest();
    const itemCenterOffset = dataSource.getColumnCenter();
    let start = candleLeftOffest + itemCenterOffset;
    const CCIPlace = [];
    // 绘制分割线
    context.strokeStyle = this.GridColor;
    this.drawLine(context, {
      from: { x: left + 0.5, y: top + 0.5 },
      to: { x: right + 0.5, y: top + 0.5 },
    });
    for (let i = 0; i < currentData.length; i++) {
      const data = currentData[i];
      const { CCI } = data;
      CCIPlace.push({
        x: start,
        y: rangeData.toY(CCI),
      });
      start += columnWidth;
    }
    context.lineWidth = this.CCITheme.lineWidth;
    context.strokeStyle = this.CCITheme.CCI;
    this.drawSerialLines(context, CCIPlace);
  }
}

// 绘制BIAS
export class BIASPlotter extends Plotter {
  constructor(name) {
    super(name);
    const { theme } = this.manager;
    this.GridColor = theme.Color.Grid;
    this.BIASTheme = theme.Line.BIAS;
  }

  draw(layout) {
    const chartArea = layout.getChartArea();
    const rangeData = layout.getRangeData();
    const { dataSource } = this.manager;
    const { left, right, top } = chartArea.getPlace();
    const context = this.mainContext;
    const currentData = dataSource.getCurrentData();
    const columnWidth = dataSource.getColumnWidth();
    const candleLeftOffest = dataSource.getCandleLeftOffest();
    const itemCenterOffset = dataSource.getColumnCenter();
    let start = candleLeftOffest + itemCenterOffset;
    const BIAS1Place = [];
    const BIAS2Place = [];
    const BIAS3Place = [];
    // 绘制分割线
    context.strokeStyle = this.GridColor;
    this.drawLine(context, {
      from: { x: left + 0.5, y: top + 0.5 },
      to: { x: right + 0.5, y: top + 0.5 },
    });
    for (let i = 0; i < currentData.length; i++) {
      const data = currentData[i];
      const { BIAS1, BIAS2, BIAS3 } = data;
      BIAS1 && BIAS1Place.push({
        x: start,
        y: rangeData.toY(BIAS1),
      });
      BIAS2 && BIAS2Place.push({
        x: start,
        y: rangeData.toY(BIAS2),
      });
      BIAS3 && BIAS3Place.push({
        x: start,
        y: rangeData.toY(BIAS3),
      });
      start += columnWidth;
    }
    context.lineWidth = this.BIASTheme.lineWidth;
    context.strokeStyle = this.BIASTheme.BIAS1;
    this.drawSerialLines(context, BIAS1Place);
    context.strokeStyle = this.BIASTheme.BIAS2;
    this.drawSerialLines(context, BIAS2Place);
    context.strokeStyle = this.BIASTheme.BIAS3;
    this.drawSerialLines(context, BIAS3Place);
  }
}
