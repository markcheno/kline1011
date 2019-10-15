<template>
  <div id="app">
    <div id="kline_container"></div>
  </div>
</template>

<script>

import Kline from './kline/entry';

class Datafeed {
  getBars(onHistoryCallback) {
    $.ajax({
      type: 'GET',
      url: 'http://192.168.1.62:8080/officialNetworkApi/CandleStickV2?qid=6&type=6',
      dataType: 'json',
      timeout: 30000,
      success(res) {
        const candle = res.data.candle.map(item => ({
          open: Number(item.o),
          high: Number(item.h),
          low: Number(item.l),
          close: Number(item.c),
          time: item.ts,
          volume: Number(item.v),
        }));
        onHistoryCallback(candle);
      },
    });
  }
}

export default {
  name: 'app',
  mounted() {
    const kline = new Kline({
      element: '#kline_container',
      width: 1200,
      height: 650,
      datafeed: new Datafeed(),
    });
    console.log(kline);
  },
  methods: {
  },
};
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
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
