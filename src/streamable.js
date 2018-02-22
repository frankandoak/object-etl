// This lib is heavily inspired on nodes's stream, however it serves a different purpose
// It manipulates objects and pipe promises inside
const async = require('async')
const AsyncFunction = (async () => {}).constructor

class Readable {
  constructor () {
    this.writable = null
    this.pending = false
  }
  pipe (writable) {
    this.writable = writable
    return writable
  }
  async push (data) {
    if (!this.writable) { throw new Error('Please pipe a writable before reading') }
    if (this.pending) { throw new Error('Push pending, wait for push to resolve before pushing again') }

    try {
      this.pending = true
      await this.writable.write(data)
    } finally {
      this.pending = false
    }
  }
}

// very happy with this one
// Writable.write returns an async that resolves when writing is succesful
// Writable pipes the write operations in a buffer :)
// call Writable({write: async}) or implement the _wrote
class Writable {
  constructor (opts) {
    if (opts && opts.write) {
      this._write = opts.write
    }
    if (this._write instanceof AsyncFunction !== true) {
      throw new Error('_write should be an AsyncFunction')
    }
    // Writable deals with back pressure by creating a processing queue
    this._queue = async.queue(async (data) => {
      await this._write(data)
    }, 1)
  }
  // async
  write (data) {
    return new Promise((resolve, reject) => {
      this._queue.push(data, err => {
        err ? reject(err) : resolve()
      })
    })
  }
}

class Transform extends Writable {
  constructor (opts) {
    super({}) // do not set _write
    if (opts && opts.transform) {
      this._transform = opts.transform
    }
    if (this._transform instanceof AsyncFunction !== true) {
      throw new Error('_transform should be an AsyncFunction')
    }
    this.writable = null
    this.pending = false
  }
  pipe (writable) {
    this.writable = writable
    return writable
  }
  async _write (data) {
    await this._transform(data)
  }
  async push (data) {
    if (!this.writable) { throw new Error('Please pipe a writable before reading') }
    if (this.pending) { throw new Error('Push pending, wait for push to resolve before pushing again') }

    try {
      this.pending = true
      await this.writable.write(data)
    } finally {
      this.pending = false
    }
  }
}

module.exports = {Readable, Writable, Transform}
