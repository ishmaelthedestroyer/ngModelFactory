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
  ],

  users = [
    {
      _id: 1,
      name: 'User One'
    },
    {
      _id: 2,
      name: 'User Two'
    },
    {
      _id: 3,
      name: 'User Three'
    },
    {
      _id: 4,
      name: 'User Four'
    },
    {
      _id: 5,
      name: 'User Five'
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

app.get('/users', function(req, res) {
  res.status(200).json(users);
});

app.get('/models/:id', function(req, res) {
  for (var i = 0, len = models.length; i < len; i++) {
    if (models[i]._id.toString() === req.params.id.toString()) {
      return res.status(200).json(models[i]);
    }
  }

  return res.status(404).end();
});

app.get('/users/:id', function(req, res) {
  for (var i = 0, len = users.length; i < len; i++) {
    if (users[i]._id.toString() === req.params.id.toString()) {
      return res.status(200).json(users[i]);
    }
  }

  return res.status(404).end();
});

app.put('/models/:id', function(req, res) {
  for (var i = 0, len = models.length; i < len; i++) {
    if (models[i]._id.toString() === req.params.id.toString()) {
      for (var key in req.body) {
        models[i][key] = req.body[key];
      }

      return res.status(200).json(models[i]);
    }
  }

  return res.status(404).end();
});

app.put('/users/:id', function(req, res) {
  for (var i = 0, len = users.length; i < len; i++) {
    if (users[i]._id.toString() === req.params.id.toString()) {
      for (var key in req.body) {
        users[i][key] = req.body[key];
      }

      return res.status(200).json(users[i]);
    }
  }

  return res.status(404).end();
});

app.delete('/models/:id', function(req, res) {
  for (var i = 0, len = models.length; i < len; i++) {
    if (models[i]._id.toString() === req.params.id.toString()) {
      models.splice(i, 1);
      return res.status(204).end();
    }
  }

  return res.status(404).end();
});

app.delete('/users/:id', function(req, res) {
  for (var i = 0, len = users.length; i < len; i++) {
    if (users[i]._id.toString() === req.params.id.toString()) {
      users.splice(i, 1);
      return res.status(204).end();
    }
  }

  return res.status(404).end();
});

app.listen(port);
console.log('Server listening on port ' + port + '.');