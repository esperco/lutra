var http = require('http');
var ecstatic = require('ecstatic');
 
http.createServer(
  ecstatic({ root: __dirname + '/pub',
             contentType: 'text/html' })
).listen(5000);
 
console.log('Listening on :5000');