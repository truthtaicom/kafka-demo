const { Kafka, logLevel } = require('kafkajs')
const { v4:  uuid } = require('uuid')
const fs = require('fs')
const { format } = require('date-fns')
const csv=require('csvtojson')

const kafka = new Kafka({
  clientId: 'my-app',
  logLevel: logLevel.DEBUG,
  brokers: ['kafka:9093'],
})


function reOrderObjectByKey({ ...unsorted_object }) {
  let keys = [], k, i, len, obj = {};

  for (k in unsorted_object) {
    if (unsorted_object.hasOwnProperty(k)) {
      keys.push(k);
    }
  }

  keys.sort();

  len = keys.length;

  for (i = 0; i < len; i++) {
    k = keys[i];
    obj[k] = unsorted_object[k]
  }
  
  return obj
}

const randomItemWithTime = async ([...items]) => {
  const randomNum = Math.floor(Math.random() * items.length)
  const item = items[randomNum];
  item.datetime = format(new Date(), 'dd-MM-yyyy HH:mm:ss')

  const resortedItem = reOrderObjectByKey(item)
  const message = Object.values(resortedItem).join("|")
  return message
}

const senMessageToKafka = (topic) => async (message) => {
  const producer = kafka.producer()
  await producer.connect()
  await producer.send({
    topic,
    messages: [{
      value: message
    }],
  })
}

const kafkaMarxGeo = async () => {
  const marxGeo = await csv().fromFile('./logs/marx-geo.csv')
  
  setInterval(async () => {
    const message = await randomItemWithTime(marxGeo)
    senMessageToKafka('kafka-marx-geo')(message)
  }, 1000)
}


const kafkaMobileEvent = async () => {
  const mobileEventLog = await csv().fromFile('./logs/mobile-event.csv')
  setInterval(async () => {
    const message = await randomItemWithTime(mobileEventLog)
    senMessageToKafka('kafka-mobile-event')(message)
  }, 1000)
}

const kafkaDemoTestConnect = async () => {
  const producer = kafka.producer()
  await producer.connect()
  await producer.send({
    topic: 'test-demo-001',
    messages: [
      { value: 'Hello test-demo-001!' },
    ],
  })
}

const run = async () => {
  await kafkaDemoTestConnect()
  kafkaMarxGeo()
  kafkaMobileEvent()

  // Consuming
  const consumer = kafka.consumer({ groupId: 'test-group' })

  await consumer.connect()
  await consumer.subscribe({ topic: 'kafka-marx-geo' })

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      console.log({
        value: message.value.toString(),
      })
    },
  })

}

run().catch(console.error)