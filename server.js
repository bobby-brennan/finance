var EXPRESS = require('express');
var APP = EXPRESS();

APP.set('views', __dirname + '/views')
APP.set('view engine', 'ejs');

APP.get('/', function(req, res) {
  res.render('chart');
});

APP.get('/res/*', function(req, res) {
  res.sendFile(__dirname + req.url);
});

APP.listen(3060);
