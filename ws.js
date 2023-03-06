
/**
 * Create a text Frame for ws
 * @param { String|Buffer } content content of frame
 * @param { Object } options options
 * @param { Number } options.opcode
 * @param { Boolean } options.fin whether as a fragment
 * @returns { Buffer } frame buffer
 * |opcode|conception               |
 * |:---- | :----                   |
 * |0x0   |means a fragment         |
 * |0x1   |means a TEXT frame       |
 * |0x2   |a BINARY frame           |
 * |0x3->7|reserved code            |
 * |0x8   |means disconnecting      |
 * |0x9   |means a `ping` operation |
 * |0xA   |means a `pong` operation |
 * |0xB->F|reserved code            |
 */
function createFrame(content, options) {
  
  var len = Buffer.byteLength(content);

  var buf = null;
  if(len>65535) {

    buf = Buffer.alloc(10+len);
    buf[1] = 127;
    buf.writeUInt32BE(len ,6);
    buf.write(content, 10);

  }else if(len>125) {

    buf = Buffer.alloc(4+len);
    buf[1] = 126;
    buf.writeUInt16BE(len, 2);
    buf.write(content, 4);

  }else {

    buf = Buffer.alloc(2+len);
    buf[1] = len;
    buf.write(content, 2);

  }

  if(options) {

    const opcode = options.opcode;
    if(opcode&&opcode<15&&opcode>=0) buf[0] = 128|opcode;

  }

  else buf[0] = 129;

  return buf;

}

/**
 * Parse meta of a frame from client
 * @param {Buffer} source client buffer Source
 */
function parseFrameMeta(source) {

  var src = Buffer.from(source);

  var len7 = src[1] & 127; // 127 = 01111111
  var len = 0;
  var lenMeta = 0;
  var masked = src[1] >= 128; // 128 = 10000000
  if(len7===127) {

    len = src.readUInt32BE(6);
    lenMeta = 10;

  }else if(len7===126) {

    len = src.readUInt16BE(2);
    lenMeta = 4;

  }else {

    len = len7;
    lenMeta = 2;

  }

  return {
    fin: src[0] >= 128,
    opcode: src[0] & 15,
    mask: masked,
    maskKey: masked?src.subarray(lenMeta, lenMeta + (masked?4:0)):null,
    len7: len7,
    len: len,
    lenMeta: lenMeta+(masked?4:0)
  };

}

/**
 * ws inverse mask
 * @param {String} data 源数据
 * @param {Buffer|Array} key 4位数掩码键
 * @returns {String}
 */
function imask(data, key) {

  if(!key) return data;

  var d = Buffer.from(data);
  for(let i = 0; i < d.length; ++i) d[i] = d[i] ^ key[i % 4];
  return d;

}

/**
 * @constructor
 */
function Event() {

  var listeners = {};
  this.on = (event, callback)=> {

    if(listeners[event]) listeners[event].push(callback);
    else listeners[event] = [callback];

  };
  this.off = (event, callback)=> {

    var e = listeners[event];
    var i = e.indexOf(callback);
    if(e&&i!==-1) e.splice(i, 1);

  };
  this.emit = (event, param)=> {

    if(listeners[event]) listeners[event].forEach((callback)=> callback(param));

  };

}

/**
 * Create a WebSocket Server
 * @constructor
 * @param { Server } server server from http(s).createServer()
 */
function WSS(server) {

  Event.call(this);

  var clients = [];

  this.server = server;
  this.clients = clients;

  this.broadcast = (data)=> {

    clients.forEach((v)=> {v.send(data)});
    
  };

  server.on("upgrade", (req, socket)=> {

    socket.write([
      "HTTP/1.1 101 Switching Protocols",
      "Upgrade: websocket",
      "Connection: Upgrade",
      "Access-Control-Allow-Origin: *",
      "Sec-WebSocket-Accept: "+require("crypto").createHash("sha1").update(req.headers['sec-websocket-key']+"258EAFA5-E914-47DA-95CA-C5AB0DC85B11").digest("base64")
    ].join("\n")+"\n\n");
    
    var cli = {
      send(data, options) {

        socket.write(createFrame(data, options));

      },
      ping() {

        socket.write(createFrame("", {opcode: 9}));

      },
      pong() {

        socket.write(createFrame("", {opcode: 10}));

      },
      close() {

        var cliI = clients.indexOf(cli);
        if(cliI!==-1) clients.splice(clients.indexOf(cli), 1);
        socket.write(createFrame("", {opcode: 8}));
        cli.emit("close");
        socket.destroy();

      },
      socket: socket
    };
    Event.call(cli);
    this.emit("connect", cli);
    clients.push(cli);
    
    var buf = Buffer.allocUnsafe(0);
    var messageData = Buffer.allocUnsafe(0);
    var dataList = [];
    var frameEnd = true;
    function nextFrame() {

      frameEnd = false;
      var m = parseFrameMeta(buf);
      dataList.push({l: m.lenMeta, f: ()=> {
        
        dataList.push({l: m.len, f: (d)=> {

          messageData = Buffer.concat([ messageData, imask(d, m.maskKey) ]);
          frameEnd = true;
          if(m.fin) {
            
            if(m.opcode===8) return cli.close();
            if(m.opcode===9) return cli.pong();
            cli.emit("message", messageData);
            messageData = Buffer.allocUnsafe(0);

          }

        }});

      }});

    }
    socket.on("data", (c)=> {

      buf = Buffer.concat([buf, c]);
      if(frameEnd) nextFrame();
      while(dataList[0]&&buf.byteLength >= dataList[0].l) {
        
        const l = dataList[0].l;
        dataList[0].f(buf.subarray(0, l));
        buf = buf.subarray(l);
        dataList.splice(0, 1);

      }

    });

    socket.on("end", ()=> {

      cli.close();

    });

    socket.on("error", (err)=> {

      cli.emit("error", err);
      cli.close();

    });

  });

}

module.exports = WSS;
