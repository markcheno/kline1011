<template>
  <div id="app">
    <button @click="changeSymbol({id: 6, name: '白银T+D'})">白银T+D</button>
    <button @click="changeSymbol({id: 12, name: '现货黄金'})">现货黄金</button>
    <button
      v-for="(item, index) in timer"
      :key="index"
      @click="changePeriod(item.type)"
    >{{item.text}}</button>
    <button @click="changeLine">切换分时图</button>
    <button @click="changeCandle">切换蜡烛图</button>
    <div>
      <button
        v-for="(item, index) in mainIndicatorList"
        :class="{ isActive: item.isAdd }"
        :key="index"
        @click="addRemoveMainIndicator(item)"
      >{{item.text}}</button>
    </div>
    <div>
      <button>成交量指标</button>
      <button>MACD指标</button>
      <button>WR指标</button>
      <button>VR指标</button>
      <button>CCI指标</button>
      <button>BIAS指标</button>
      <button>KDJ指标</button>
      <button>RSI指标</button>
    </div>
    <div id="kline_container"></div>
  </div>
</template>

<script>

import io from 'socket.io-client';
import Kline from './kline/entry';

class Datafeed {
  getBars(params) {
    const { chartType,
      symbol,
      period,
      startTime,
      requestCount,
      onHistoryCallback,
      firstDataRequest } = params;
    let url = '';
    if (chartType === 'candle') {
      url = `https://official.gkoudai.com/officialNetworkApi/CandleStickV2?qid=${symbol.id}&type=${period}&ts=${startTime}&count=${requestCount}`;
    } else if (chartType === 'line') {
      url = `https://official.gkoudai.com/officialNetworkApi/TimeChartV4?qid=${symbol.id}&type=1`;
    }
    $.ajax({
      type: 'GET',
      url,
      dataType: 'json',
      timeout: 30000,
      success(res) {
        if (chartType === 'candle') {
          const candle = res.data.candle.map(item => ({
            open: Number(item.o),
            high: Number(item.h),
            low: Number(item.l),
            close: Number(item.c),
            time: item.ts,
            volume: Number(item.v),
            // eslint-disable-next-line no-undef
            day: moment(item.ts).format('YYYY-MM-DD'),
          }));
          onHistoryCallback(candle, {
            firstDataRequest,
            noData: !candle.length,
          });
        } else if (chartType === 'line') {
          const line = res.data.data[0].region;
          line.forEach(element => {
            element.quotes = element.quotes.map(item => ({
              open: Number(item.o),
              high: Number(item.h),
              low: Number(item.l),
              close: Number(item.c),
              time: Number(item.t),
              volume: Number(item.v),
            }));
          });
          onHistoryCallback(line, {
            firstDataRequest,
          });
        }
      },
    });
  }
}

export default {
  name: 'app',
  data() {
    return {
      timer: [
        { text: '日K', type: 6 },
        { text: '周K', type: 7 },
        { text: '月K', type: 8 },
        { text: '1分', type: 1 },
        { text: '5分', type: 2 },
        { text: '15分', type: 3 },
        { text: '30分', type: 4 },
        { text: '1时', type: 5 },
        { text: '4时', type: 9 },
      ],
      mainIndicatorList: [{
        text: 'MA指标',
        name: 'MA',
        isAdd: true,
      }, {
        text: 'BOLL指标',
        name: 'BOLL',
        isAdd: false,
      }, {
        text: 'ENV指标',
        name: 'ENV',
        isAdd: false,
      }, {
        text: 'CG指标',
        name: 'CG',
        isAdd: false,
      }, {
        text: 'SAR指标',
        name: 'SAR',
        isAdd: false,
      }],
      kline: '',
    };
  },
  mounted() {
    // const socket = this.initPriceSocket();
    this.kline = new Kline({
      element: '#kline_container',
      width: 1200,
      height: 650,
      datafeed: new Datafeed(),
      mainIndicator: ['MA'],
      layoutIndicator: ['CCI', 'MACD'],
      symbol: {
        id: 12,
        name: '现货黄金',
      },
      period: 6,
      decimalDigits: 2,
    });
    // this.socketHandle(socket);
  },
  methods: {
    addMainIndicator(indicator) {
      this.kline.addMainIndicator(indicator);
    },
    removeMainIndicator(indicator) {
      this.kline.removeMainIndicator(indicator);
    },
    addRemoveMainIndicator(item) {
      const { name, isAdd } = item;
      item.isAdd = !item.isAdd;
      isAdd ? this.removeMainIndicator(name) : this.addMainIndicator(name);
    },
    changeSymbol(symbol) {
      this.kline.switchSymbol(symbol);
    },
    changePeriod(period) {
      this.kline.switchPeriod(period);
    },
    changeLine() {
      this.kline.switchLine();
    },
    changeCandle() {
      this.kline.switchCandle();
    },
    socketHandle(socket) {
      socket.emit('subscribeDelete', { token: socket.id, qid: ['all'] });
      socket.emit('subscribeRegister', {
        qid: [12],
        token: socket.id,
      });
    },
    connectSocket(socket) {
      socket.id
        ? this.socketHandle(socket)
        : socket.on('connectResponse', () => {
          this.socketHandle(socket);
        });
    },
    initPriceSocket() {
      const socket = io('https://wssof.gkoudai.com');
      socket.on('connectResponse', () => {
        socket.removeListener('subscribeResponse');
        socket.removeEventListener('subscribeResponse');
        let lastPrice = 0;
        socket.on('subscribeResponse', (data) => {
          const socketData = JSON.parse(data).quote;
          if (lastPrice !== socketData.nowPrice) {
            this.kline.updateLastData({
              open: Number(socketData.open),
              high: Number(socketData.top),
              low: Number(socketData.low),
              close: Number(socketData.nowPrice),
              time: Number(socketData.updatetime),
            });
            lastPrice = socketData.nowPrice;
          }
        });
      });
      return socket;
    },
  },
};
</script>

<style>
#app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}

#kline_container {
  margin: auto;
}

button.isActive {
  background: red;
  color: #ffffff;
}
</style>
