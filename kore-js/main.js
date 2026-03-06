if (process.env.NODE_ENV === 'development' || process.env.KORJS_ENV === 'dev') {
  module.exports = require('./dist/korjs.dev.js');
} else {
  module.exports = require('./dist/korjs.js');
}