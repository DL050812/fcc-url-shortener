
'use strict';

var fs = require('fs');
var express = require('express');
var app = express();


var mongodb = require('mongodb');
var collection;
// Standard URI format: mongodb://[dbuser:dbpassword@]host:port/dbname, details set in .env
var uri = 'mongodb://'+process.env.USER+':'+process.env.PASS+'@'+process.env.HOST+':'+process.env.DB_PORT+'/'+process.env.DB;

mongodb.MongoClient.connect(uri, function(err, db) {
  collection = db.collection("urls", function(err, res) {
    if (err) throw err;
  })
})

app.use('/', express.static(process.cwd() + '/views'));
app.use('/public', express.static(process.cwd() + '/public'));
  
// Eg:
// https://fcc-url-shortener-microservice1.glitch.me/new/https://www.google.com
// https://fcc-url-shortener-microservice1.glitch.me/new/http://foo.com:80
app.get('/new/:longUrl(*)', function (req, res, next) {
  var longUrl = req.params.longUrl;
  var shortUrl = getShortUrl();
  
  var myobj = { 'shortUrl': shortUrl,
	              'longUrl': longUrl };
  
  collection.insertOne(myobj, function(err, result) {
		    if (err) throw err;
        var fullUrl = `${req.protocol}://${req.get('host')}/${shortUrl}`;
        // eg: { "original_url":"http://foo.com:80", "short_url":"https://fcc-url-shortener-microservice1/8170" } 
		    res.json({ "original_url": longUrl, "short_url": fullUrl } );
		}) 
  
})

// eg: https://fcc-url-shortener-microservice1.glitch.me/8170
app.get('/:shortUrl(\\d{4})', function (req, res) {
  
  var shortUrl = req.params.shortUrl;  
  var query = { shortUrl: shortUrl};
  
  collection.findOne(query, function(err,document){
        if (document) {
            res.redirect(document.longUrl);
        } else {
            res.send(`Short url: ${shortUrl} not found`)
        };
	})
      
})
  

// Short URL will simply be a 4 digit number e.g.: 8170
function getShortUrl() {
    return (Math.floor(Math.random() * (10000 - 1) ) + 1).toString();
}
  
// Respond not found to all the wrong routes
app.use(function(req, res){
  res.status(404);
  res.type('txt').send('Not found');
});


app.listen(process.env.PORT, function () {
  console.log('Node.js listening ...');
});
