var Express = require('express');
var App = Express();

App.set('views', __dirname + '/views')
App.set('view engine', 'ejs');

App.get('/', function(req, res) {
  res.render('chart');
});

App.get('/options', function(req, res) {
  res.render('options');
});

App.use('/', Express.static(__dirname + '/res'));

App.listen(3060);
