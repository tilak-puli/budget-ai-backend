function getNowInIndiaTimezone() {
  return new Date(new Date().toLocaleString('en', { timeZone: 'Asia/Kolkata' }));
}
exports.getNowInIndiaTimezone = getNowInIndiaTimezone;
