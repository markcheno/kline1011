<template>
  <div id="app">
    <button @click="changeSymbol({id: 6, name: '白银T+D'})">白银T+D</button>
    <button @click="changeSymbol({id: 12, name: '现货黄金'})">现货黄金</button>
    <button
      v-for="(item, index) in timer"
      :key="index"
      @click="changePeriod(item.type)"
    >{{item.text}}</button>
    <button>切换分时图</button>
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
        { text: '日K', resolution: 'D', type: 6, mode: 2, timer: 86400000 },
        { text: '周K', resolution: 'W', type: 7, mode: 2, timer: 604800000 },
        { text: '月K', resolution: '1M', type: 8, mode: 2, timer: 2592000000 },
        { text: '1分', resolution: '1', type: 1, mode: 2, timer: 60000 },
        { text: '5分', resolution: '5', type: 2, mode: 2, timer: 300000 },
        { text: '15分', resolution: '15', type: 3, mode: 2, timer: 900000 },
        { text: '30分', resolution: '30', type: 4, mode: 2, timer: 1800000 },
        { text: '1时', resolution: '60', type: 5, mode: 2, timer: 3600000 },
        { text: '4时', resolution: '240', type: 9, mode: 2, timer: 14400000 },
      ],
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
      symbol: {
        id: 12,
        name: '现货黄金',
      },
      period: 6,
      decimalDigits: 0,
    });
    // this.socketHandle(socket);
  },
  methods: {
    changeSymbol(symbol) {
      this.kline.switchSymbol(symbol);
    },
    changePeriod(period) {
      this.kline.switchPeriod(period);
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
</style>
