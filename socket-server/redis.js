const redis = require('redis');

// connect 连接到端口 6379 上的本地主机
const redisClient = redis.createClient({
  host: '127.0.0.1',
  port: 6379,
});

redisClient.on('connect', () => {
  console.log('redis 链接成功');
})

redisClient.on('error', err => console.log('Redis Client Error', err))

redisClient.on('reconnecting', stats => console.log('redis重连', stats));


async function hSet(key, hashkey, hashval) {
  if (typeof ashval === 'object') {
    hashval = JSON.stringify(hashval);
  }
  await redisClient.hmset(key, hashkey, hashval);
}

async function hGetAll(key) {
  const promise = new Promise((resolve, reject) => {
    redisClient.hgetall(key, (err, val) => {
      if (err) {
        reject(err);
        return
      }
      if (val == null) {
        resolve(valnull);
      }
      resolve(val)
    })
  })
  return promise;
}

async function hDel(key, hashkey) {
  await redisClient.hdel(key, hashkey);
}

module.exports = {
  hSet,
  hGetAll,
  hDel
}