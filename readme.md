# iiws

A Websocket Server frame for node that is cleaner, easier, more essential and better for learning.

## Get started

```js
const http = require("http");
const WSS = require('iiws');

const httpServer = http.createServer();
httpServer.listen(500);

const ws = new WSS(httpServer);
ws.on("connect", (cli)=> {

  console.log("a client connected")
  ws.broadcast("Hello! every client!"); // broadcast to all online client
  cli.send("Welcome, a user"); // just send message to one user
  cli.ping(); // send ping message
  console.log(ws.clients); // [cli1, cli2, cli3...] get all online clients array

  cli.on("message", (data)=> {

    console.log(data); // you can get messages from the browser

  });

  cli.on("close", ()=> {

    console.log("a client closed");

  });

  cli.on("error", (err)=> {

    console.log(err.message);

  });

});

```

## Websocket basic rules

### Handshakes

<pre>
HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Accept: require("crypto").createHash("sha1").update(req.headers['sec-websocket-key']+"258EAFA5-E914-47DA-95CA-C5AB0DC85B11").digest("base64")
</pre>

### Frame format

<pre>
 0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
+-+-+-+-+-------+-+-------------+-------------------------------+
|F|R|R|R| opcode|M| Payload len |    Extended payload length    |
|I|S|S|S|  (4)  |A|     (7)     |             (16/64)           |
|N|V|V|V|       |S|             |   (if payload len==126/127)   |
| |1|2|3|       |K|             |                               |
+-+-+-+-+-------+-+-------------+ - - - - - - - - - - - - - - - +
|     Extended payload length continued, if payload len == 127  |
+ - - - - - - - - - - - - - - - +-------------------------------+
|                               |Masking-key, if MASK set to 1  |
+-------------------------------+-------------------------------+
| Masking-key (continued)       |          Payload Data         |
+-------------------------------- - - - - - - - - - - - - - - - +
:                     Payload Data continued ...                :
+ - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - +
|                     Payload Data continued ...                |
+---------------------------------------------------------------+
</pre>

### opcode

|opcode|conception               |
|:---- | :----                   |
|0x0   |means a fragment         |
|0x1   |means a TEXT frame       |
|0x2   |a BINARY frame           |
|0x3->7|reserved code            |
|0x8   |means disconnecting      |
|0x9   |means a `ping` operation |
|0xA   |means a `pong` operation |
|0xB->F|reserved code            |

## How to build a websocket server with native nodejs

There is detailed explaination, it's friendly to learn the theory of WebSocket.

See [ws.js](ws.js)
