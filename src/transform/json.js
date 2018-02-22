const {Transform} = require('../streamable')

module.exports = class Json extends Transform {
  async _transform (data) {
    await this.push(JSON.parse(data))
  }
}
