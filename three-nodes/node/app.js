var express = require('express');
var app = express();
var MongoClient = require('mongodb').MongoClient;

var url = 'mongodb://mongodb:27017/nba';
MongoClient.connect(url, function(err, db) {

    app.use('/node', function(req, res) {
        res.end("This app is using node version: " + process.version);
    });

    app.use('/mongo', function(req, res) {
        var adminDb = db.admin();
        adminDb.serverStatus(function(err, info) {
            if(err) {
                res.error(500);
            }

            res.status(200).end('This app is connected with MongoDB version ' + info.version)
        });
    });

    app.use('/data', function(req, res) {
        db.collection('players').find({}).toArray(function(err, players) {
            if(err) {
                res.error(500);
            }

            res.status(200).json(players);
        })
    });


});

app.listen(3000);
