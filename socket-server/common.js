/**
 * 统一返回参数
 */
function getMsg(type, msg, status = 200, data = null) {
  return {
    type,
    msg,
    status,
    data
  }
}

/**
 * 解析url参数
 * @param {string} url
 * @returns {object} queryName
 */
function getParams(url, queryName) {
  let query = decodeURI(url.split('?')[1]);
  let queryArr = query.split('&');
  for (let i = 0; i < queryArr.length; i++) {
    let item = queryArr[i].split('=');
    if (item[0] === queryName) {
      return item[1];
    }
  }
  return null;
}

module.exports = {
  getMsg,
  getParams
}