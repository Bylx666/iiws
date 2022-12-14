# Ws
`const { func1, func2 } = require('iiws')`

Get tools with WebSocket

获取Websocket的工具

## Usages 用法
`iiws` does not include server features, but only provides essential tools to help with your native server.

`iiws`不包含服务器功能，只提供构建原生服务器用的基础工具

For example

```js

const http = require("http"); // Class for server 服务器类
const { createFrame } = require("./wstool"); // get funcs needed 调用需要的函数

// create a server and get `test` while `GET`ting
// 创建服务器并在get时返回`test`
var server = http.createServer((req, res)=> {

  res.writeHead(200, {
    "Access-Control-Allow-Origin": "*"
  });
  res.end("test");

});

// select a port
// 选择监听端口
server.listen(500);

// create websocket server
// 创建websocket服务
server.on("upgrade", (req, soc)=> {

  // constant content, of the header of the ws server
  // 固定写法，返回websocket的响应头
  var h = [
    "HTTP/1.1 101 Switching Protocols",
    "Upgrade: websocket",
    "Connection: Upgrade",
    "Access-Control-Allow-Origin: *",
    "Sec-WebSocket-Accept: "+require("crypto").createHash("sha1").update(req.headers['sec-websocket-key']+"258EAFA5-E914-47DA-95CA-C5AB0DC85B11").digest("base64")
  ];
  soc.write(h.join("\n")+"\n\n");

  // sent "sisi" to client by 2s
  // 在2秒后向客户端发送"嘻嘻"
  setTimeout(()=> {
    soc.write(createFrame("嘻嘻"));
  }, 2000);

});
```

See [ws.js](ws.js)
