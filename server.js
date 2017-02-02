/**
 * Created by satyasumansaridae on 2/2/17.
 */
var restify = require('restify');
var builder = require('botbuilder');
var admin = require("firebase-admin");

//=========================================================
// Bot Setup
//=========================================================

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});


// Create chat bot
var connector = new builder.ChatConnector({
    appId: "1dd05224-d740-4b09-88ee-407088fb99af",
    appPassword: "pbxzzeM06j1Q9bXsLwHKycC"
});

admin.initializeApp({
    credential: admin.credential.cert("probot-d140b-firebase-adminsdk-97nyw-00a41cb203.json"),
    databaseURL: "https://probot-d140b.firebaseio.com"
});


var bot = new builder.UniversalBot(connector);
server.post('/api/messages', connector.listen());

var MobilityData = ["I have no problems in walking about", "I have some problems in walking about", "I am confined to Bed"];
var SelfCareData = ["I have no problems with self care", "I have some problems washing or dressing myself", "I am unable to wash or dress myself"];

bot.on('contactRelationUpdate', function (message) {
    if (message.action === 'add') {
        var name = message.user ? message.user.name : null;

        admin.database().ref('/users'+message.user.name).set(message.address);

        var reply = new builder.Message()
            .address(message.address)
            .text("Hello %s... Thanks for adding me. Say 'hello' to see some great demos. %s", name || 'there');
        bot.send(reply);
    } else {
        // delete their data
    }
});

bot.dialog('/', [
    function (session) {
        builder.Prompts.choice(session, "In terms of your health, how would you best describe the state of your mobility today?", MobilityData);
    },
    function (session) {
        session.send("ok");
        session.beginDialog('/selfcare');
    }
]);

bot.dialog('/selfcare', [
    function (session) {
        builder.Prompts.choice(session, "How do you feel about self-care?", SelfCareData);
    },
    function (session, results) {
        console.log(results.response);
        session.send("ok");
    }
]);

server.get(/\/assets\/?.*/, restify.serveStatic({
    directory: __dirname
}));

server.get(/\/?.*/, restify.serveStatic({
    directory: __dirname,
    default: '/index.html'
}));

server.get('/', restify.serveStatic({
    directory: __dirname,
    default: '/index.html'
}));
