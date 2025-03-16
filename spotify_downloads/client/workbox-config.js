module.exports = {
  globDirectory: "build/",
  globPatterns: ["**/*.{html,js,css,png,jpg,svg,mp3,wav}"],
  swDest: "build/serviceWorker.js",
  clientsClaim: true,
  skipWaiting: true
}; 