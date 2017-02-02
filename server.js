/**
 * Created by satyasumansaridae on 2/2/17.
 */
var restify = require('restify');
var builder = require('botbuilder');

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
var bot = new builder.UniversalBot(connector);
server.post('/api/messages', connector.listen());

var MobilityData = ["I have no problems in walking about", "I have some problems in walking about", "I am confined to Bed"];
var SelfCareData = ["I have no problems with self care", "I have some problems washing or dressing myself", "I am unable to wash or dress myself"];


bot.dialog('/', [
    function (session) {
        builder.Prompts.choice(session, "In terms of your health, how would you best describe the state of your mobility today?", MobilityData);
    },
    function (session, results) {
        console.log(results.response);
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

server.get('/', restify.serveStatic({
    directory: __dirname,
    default: '/index.html'
}));