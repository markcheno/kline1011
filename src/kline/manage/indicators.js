// 指标相关
// 计算 MA 指标
function calcMAIndicator(data, option) {
  const { decimalDigits, MAArray, range } = option;
  const [start, end] = range;
  const total = {};
  MAArray.forEach(item => {
    total[`MA${item}`] = 0;
  });
  const calc = (item, index, element) => {
    const size = Number(item.replace('MA', ''));
    total[item] += element.close;
    const startMA = data[index - size];
    if (startMA) {
      total[item] -= startMA.close;
      element[item] = (total[item] / size).toFixed(decimalDigits);
    } else {
      element[item] = (total[item] / (index + 1)).toFixed(decimalDigits);
    }
  };
  for (let i = start; i <= end; i++) {
    Object.keys(total).forEach(item => {
      calc(item, i, data[i]);
    });
  }
}

export default calcMAIndicator;
