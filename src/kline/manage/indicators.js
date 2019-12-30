// 指标相关

// 计算 MA 指标
function calcMAIndicator(option) {
  const { allData, appendLength, decimalDigits, MAArray } = option;
  const MASize = MAArray.map(item => item.replace('MA', ''));
  const start = 0;
  let end = allData.length - 1;
  if (appendLength) {
    end = appendLength - 1 + Math.max(...MASize);
  }
  const total = {};
  MAArray.forEach(item => {
    total[item] = 0;
  });
  const calc = (item, index, element) => {
    const size = Number(item.replace('MA', ''));
    total[item] += element.close;
    const startMA = allData[index - size];
    if (startMA) {
      total[item] -= startMA.close;
      element[item] = (total[item] / size).toFixed(decimalDigits);
    } else {
      element[item] = (total[item] / (index + 1)).toFixed(decimalDigits);
    }
  };
  for (let i = start; i <= end; i++) {
    Object.keys(total).forEach(item => {
      calc(item, i, allData[i]);
    });
  }
}

// 计算对应的指标 option: 需要计算指标的区间内数据 , chartIndicator, decimalDigits
function calcIndicator(option) {
  const { allData, appendLength, setting } = option;
  const { decimalDigits } = setting;
  const indicatorObj = {};
  // 指标重新计算时, 需重新计算的allData的最大last的下标
  let needReloadLastIndex = -1;
  setting.getChart().forEach(item => {
    Object.assign(indicatorObj, item.chartIndicator);
  });
  Object.keys(indicatorObj).forEach(item => {
    let maxReloadIndex = -1;
    switch (item) {
      case 'MA':
        maxReloadIndex = calcMAIndicator({
          allData,
          appendLength,
          MAArray: indicatorObj.MA,
          decimalDigits,
        });
        break;
      default:
        break;
    }
    needReloadLastIndex = Math.max(needReloadLastIndex, maxReloadIndex);
  });
  return needReloadLastIndex;
}

export default calcIndicator;
