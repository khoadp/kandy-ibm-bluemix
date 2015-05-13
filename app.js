var Kandy = require('kandy');

// This application uses express as it's web server
// for more info, see: http://expressjs.com
var express = require('express');

// create a new express server
var app = express();

// serve the files out of ./public as our main files
app.use(express.static(__dirname + '/public'));

var cfenv = require('cfenv');

// get the app environment from Cloud Foundry
var appEnv = cfenv.getAppEnv();

// start server on the specified port and binding host
app.listen(appEnv.port, appEnv.bind, function () {
    // print a message when the server starts listening
    console.log("server starting on " + appEnv.url);
});

app.get('/getUserAccessToken', function (request, response) {
    var apiKey = request.query.apiKey;
    var userId = request.query.userId;
    var password = request.query.password;

    if (typeof apiKey == "undefined" || apiKey == ''
        || typeof userId == "undefined" || userId == ''
        || typeof password == "undefined" || password == '') {
        response.send('{"message":"API Key, User Id and Password are required"}');
        return;
    }

    var kandy = new Kandy(apiKey);

    kandy.getUserAccessToken(userId, password, function (data, res) {
        var dataJson = JSON.parse(data);
        response.send(dataJson);
    });
});

app.get('/getDomainAccessToken', function (request, response) {
    var apiKey = request.query.apiKey;
    var domainApiSecret = request.query.domainApiSecret;

    if (typeof apiKey == "undefined" || apiKey == ''
        || typeof domainApiSecret == "undefined" || domainApiSecret == '') {
        response.send('{"message":"API Key, Domain Api Secret are required"}');
        return;
    }

    var kandy = new Kandy(apiKey, domainApiSecret);

    kandy.getDomainAccessToken(function (data, res) {
        var dataJson = JSON.parse(data);
        response.send(dataJson);
    });
});

app.get('/getListUsers', function (request, response) {
    var domainAccessToken = request.query.domainAccessToken;

    if (typeof domainAccessToken == "undefined" || domainAccessToken == '') {
        response.send('{"message":"Domain Access Token is required"}');
        return;
    }

    var kandy = new Kandy();

    kandy.getListUsers(domainAccessToken, function (data, res) {
        var dataJson = JSON.parse(data);
        response.send(dataJson);
    });
});

app.get('/sms', function (request, response) {
    var userAccessToken = request.query.userAccessToken;
    var from = request.query.from;
    var to = request.query.to;
    var text = request.query.text;

    if (typeof userAccessToken == "undefined" || userAccessToken == ''
        || typeof to == "undefined" || to == ''
        || typeof text == "undefined" || text == '') {
        response.send('{"message":"User Access Token, To and Text are required"}');
        return;
    }

    var kandy = new Kandy();

    kandy.sendSms(userAccessToken, from, to, text, function (data, res) {
        var dataJson = JSON.parse(data);
        if (dataJson.message == "success") {
            console.log("Sent to " + to + ": " + text);
        }
        response.send(dataJson);
    });

});

app.get('/message', function (request, response) {
    var userAccessToken = request.query.userAccessToken;
    var to = request.query.to;
    var text = request.query.text;

    if (typeof userAccessToken == "undefined" || userAccessToken == ''
        || typeof text == "undefined" || text == '') {
        response.send('{"message":"User Access Token, To and Text are required"}');
        return;
    }

    var kandy = new Kandy();

    kandy.sendIm(userAccessToken, to, text, function (data, res) {
        var dataJson = JSON.parse(data);
        if (dataJson.message == "success") {
            console.log("Sent to " + to + ": " + text);
        }
        response.send(dataJson);
    });

});

app.get('/addressbooks', function (request, response) {
    var userAccessToken = request.query.userAccessToken;

    if (typeof userAccessToken == "undefined" || userAccessToken == '') {
        response.send('{"message":"User Access Token is required"}');
        return;
    }

    var kandy = new Kandy();

    kandy.getAddressbook(userAccessToken, function (data, res) {
        var dataJson = JSON.parse(data);
        if (dataJson.message == "success") {
            console.log("got addressbook");
        }
        response.send(dataJson);
    });

});

app.get('/getMessages', function (request, response) {
    var userAccessToken = request.query.userAccessToken;

    if (typeof userAccessToken == "undefined" || userAccessToken == '') {
        response.send('{"message":"User Access Token is required"}');
        return;
    }

    var kandy = new Kandy();

    kandy.getIm(userAccessToken, true, function (data, res) {
        var dataJson = JSON.parse(data);
        if (dataJson.message == "success") {
        }
        response.send(dataJson);
    });

});