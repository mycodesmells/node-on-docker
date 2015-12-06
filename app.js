var http = require('http');

var server = http.createServer(function(req, res){
    res.end("This app is using node version: " + process.version);
});

server.listen(3000);
