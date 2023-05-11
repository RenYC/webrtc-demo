const redis = require('redis');

// connect 连接到端口 6379 上的本地主机
const redisClient = redis.createClient({
  host: '127.0.0.1',
  port: 6379,
});

redisClient.on('connect', () => {
  console.log('redis 链接成功');
})

redisClient.on('error', (err) => {
  console.log('Redis Client Error', err)
})

redisClient.on('reconnecting', (stats) => {
  console.log('redis重连', stats);
});



// 存储和检索简单字符串
// textString()

async function textString() {

  await redisClient.set('name', 'redis');
  const name = await redisClient.get('name');
  console.log('name', name);

  await redisClient.hSet('user-session:123',
    'surname', 'Smith'
  )

  let userSession = await redisClient.hGetAll('user-session:123');
  console.log(JSON.stringify(userSession, null, 2));
}

// 存储和检索地图
