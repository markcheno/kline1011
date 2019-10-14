<template>
  <div id="app">
    <div id="kline_container"></div>
  </div>
</template>

<script>

import Kline from './kline/entry';

export default {
  name: 'app',
  mounted() {
    const kline = new Kline({
      element: '#kline_container',
      width: 1200,
      height: 650,
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
