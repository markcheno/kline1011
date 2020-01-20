function formatVolume(volume) {
  if (volume.split('.')[0].length >= 4 && volume.split('.')[0].length < 9) return `${(volume / 10000).toFixed(2)}万`;
  if (volume.split('.')[0].length >= 9 && volume.split('.')[0].length < 13) return `${(volume / 100000000).toFixed(2)}亿`;
  if (volume.split('.')[0].length >= 13) return `${(volume / 1000000000000).toFixed(2)}兆`;
  return volume;
}

function formatDate(time) {
  return time;
}

export { formatVolume, formatDate };
