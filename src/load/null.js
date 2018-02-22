const {Writable} = require('../streamable')
const log = require('debug')('object-etl.load.null')

module.exports = class Null extends Writable {
  async _write (data) {
    log(JSON.stringify(data))
    // setTimeout(() => {
    //   log('clear', chunk)
    //   callback()
    // }, 1000)
  }
}
