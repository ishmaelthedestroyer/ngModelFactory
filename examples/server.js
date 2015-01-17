var

  express = require('express'),

  bodyParser = require('body-parser'),

  app = express(),

  port = process.env.PORT || process.argv[2] || (port = 3000),

  models = [
    {
      _id: 1,
      name: 'Item One'
    },
    {
      _id: 2,
      name: 'Item Two'
    },
    {
      _id: 3,
      name: 'Item Three'
    }
  ];

app.use(express.static(__dirname + '/../', {
  // maxAge: 2592000000 // 30 day cache
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

app.get('/models', function(req, res) {
  res.status(200).json(models);
});

app.listen(port);
console.log('Server listening on port ' + port + '.');