/**
 * Create a text Frame for ws
 * 创建websocket文本帧
 * @param {String} m content of frame 文本帧内容
 * @returns {Buffer} binary frame buffer 二进制帧
 */
function createFrame(m) {
  
  var l = Buffer.byteLength(m);

  var b = null;
  if(l>65535) {

    b = Buffer.alloc(10+l);
    b[0] = 129;
    b[1] = 127;
    b.writeUInt32BE(l ,6);
    b.write(m, 10);

  }else if(l>125) {

    b = Buffer.alloc(4+l);
    b[0] = 129;
    b[1] = 126;
    b.writeUInt16BE(l, 2);
    b.write(m, 10);

  }else {

    b = Buffer.alloc(2+l);
    b[0] = 129;
    b.writeUInt8(l, 1);
    b.write(m, 10);

  }

  return b;

}


module.exports = { createFrame };
