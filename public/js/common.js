function toPercent(input) {
  return (Math.floor(input * 10000) / 100) + '%'
}

function daysAgo(days) {
  return new Date(new Date() - 1000 * 60 * 60 * 24 * days)
}
