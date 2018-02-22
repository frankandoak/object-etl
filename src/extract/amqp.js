const amqplib = require('amqplib')
const assert = require('assert')
const {Readable} = require('../streamable')
const log = require('debug')('object-etl.extract.amqp')

module.exports = class Amqp extends Readable {
  constructor (queue, limit) {
    super()
    const host = process.env.AMQP_SERVER
    assert(host, 'Please define AMQP_SERVER')

    this.queue = queue
    this.channel = amqplib.connect(host).then((conn) => conn.createChannel())
    this.channel.then(amqp => {
      amqp.assertQueue(this.queue)
      amqp.prefetch(1)
    })
    this.consumerTag = null
    this.limit = limit
    this.stopping = false
  }

  read () {
    this.channel
      .then(async amqp => {
        let worker = async (msg) => {
          log('get')
          if (this.limit !== undefined && this.limit-- <= 0) {
            log('reach limit, stopping consumer')
            await this.stop()
            log('consumer out')
            return
          }
          let {content} = msg
          let decodedContent = content.toString()
          log(decodedContent)
          try {
            await this.push(decodedContent)
            log('ack')
            await amqp.ack(msg)
          } catch (e) {
            log('reject', e)
            await amqp.reject(msg)
          }
        }
        let response = await amqp.consume(this.queue, worker, {})
        this.consumerTag = response.consumerTag
        log('consumer listening on', this.queue, this.consumerTag)
      })
  }

  async stop () {
    if (!this.stopping) {
      this.stopping = true
      return this.channel
        .then(async amqp => {
          await amqp.cancel(this.consumerTag)
        })
    } else {
      return Promise.resolve()
    }
  }
}
