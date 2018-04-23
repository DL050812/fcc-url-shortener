
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
  
  if(!isUrl(longUrl)){
     res.json({ "error" : "Wrong url format, make sure you have a valid protocol and real site."});
  } else {
     collection.insertOne(myobj, function(err, result) {
		      if (err) throw err;
          var fullUrl = `${req.protocol}://${req.get('host')}/${shortUrl}`;
          // eg: { "original_url":"http://foo.com:80", "short_url":"https://fcc-url-shortener-microservice1/8170" } 
		      res.json({ "original_url": longUrl, "short_url": fullUrl } );
		}) 
  }
})

// eg: https://fcc-url-shortener-microservice1.glitch.me/8170
app.get('/:shortUrl(\\d{1,4})', function (req, res) {
  
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
  

// Short URL will simply be up to a 4 digit number e.g.: 8170
function getShortUrl() {
    return (Math.floor(Math.random() * (10000 - 1) ) + 1).toString();
}
  
function isUrl(str)
{
    var regexp =  /^(?:(?:https?|http):\/\/)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/\S*)?$/;       
    if (regexp.test(str)) 
          return true;
    return false;
}


// Respond not found to all the wrong routes
app.use(function(req, res){
  res.status(404);
  res.type('txt').send('Not found');
});


app.listen(process.env.PORT, function () {
  console.log('Node.js listening ...');
});
