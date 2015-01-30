var express = require('express');
var http = require('http');
var bodyParser = require('body-parser');
var superagent = require('superagent');
var Firebase = require('firebase');
var sha1 = require('sha1');

var firebaseRef = new Firebase('https://appdexcontest.firebaseio.com/keys');

PORT = Number(process.env.PORT || 8080);

app = express();
app.disable('x-powered-by');
app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));

app.get('/', function(req, res) {
  return res.sendFile('./public/index.html', {
    root: __dirname
  });
});

app.post('/compete', function(req, res) {
  var apiKey = req.body['api-key'];
  var email = req.body['email'];

  console.log(apiKey, apiKey.length);

  if (apiKey.length == 47) {
    superagent
      .get('https://api.newrelic.com/v2/applications.json')
      .set('X-API-Key', req.body['api-key'])
      .set('Accept', 'application/json')
      .end(function(result) {
        if (result.body && result.body.applications) {
          var applications = result.body.applications;
          var body = [];

          applications.apiKey = apiKey;
          applications.email = email;

          for(var x=0; x < applications.length; x++) {
            if (applications[x].application_summary) {
              body.push('<li><strong>' + applications[x].name + '</strong>: ' + applications[x].application_summary.apdex_score + '</li>');
            } else {
              body.push('<li><strong>' + applications[x].name + '</strong>: No Info</li>');
            }
          }

          body = '<ul>' + body.join('') + '</ul>';

          firebaseRef.child(sha1(apiKey)).set(result.body.applications, function () {
            res.send(body);
          })
        } else {
          res.send('Please provide a valid api key. Use your back button to try again.');
        }
      });
  } else {
    res.send('Please provide a valid api key. Use your back button to try again.');
  }
});

httpServer = http.createServer(app);

httpServer.listen(PORT, function() {
  return console.log('info', "Server running on " + PORT);
});
