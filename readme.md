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

  cli.on("message", (data)=> {

    console.log(data); // you can get messages from the browser

  });
  
  cli.ping(); // send ping message
  cli.on("close", ()=> {

    console.log("a client closed");

  });
  cli.on("error", (err)=> {

    console.log(err.message);

  });

});

```

See [ws.js](ws.js)
