function formatVolume(volume) {
  if (volume.split('.')[0].length >= 4 && volume.split('.')[0].length < 9) return `${(volume / 10000).toFixed(2)}万`;
  if (volume.split('.')[0].length >= 9 && volume.split('.')[0].length < 13) return `${(volume / 100000000).toFixed(2)}亿`;
  if (volume.split('.')[0].length >= 13) return `${(volume / 1000000000000).toFixed(2)}兆`;
  return volume;
}

function formatDate(time) {
  return time;
}

function getPixelRatio(context) {
  const backingStore = context.backingStorePixelRatio
        || context.webkitBackingStorePixelRatio
        || context.mozBackingStorePixelRatio
        || context.msBackingStorePixelRatio
        || context.oBackingStorePixelRatio
        || context.backingStorePixelRatio || 1;
  return (window.devicePixelRatio || 1) / backingStore;
}

export { formatVolume, formatDate, getPixelRatio };
