const glob = require('glob')
const fs = require('fs')
const {Readable} = require('../streamable')
const log = require('debug')('object-etl.extract.file')
const async = require('async')

module.exports = class File extends Readable {
  constructor (path) {
    super()
    this.paths = glob.sync(path)
  }

  read () {
    async.doWhilst(async () => {
      let path = this.paths.pop()
      if (!path) { return false }
      log('read', path)
      let value = await this.push(fs.readFileSync(path, 'utf8'))
      return value
    }, a => !!a, (err, res) => { if (err) { throw err } })
  }
}
