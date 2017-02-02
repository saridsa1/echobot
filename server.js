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

//=========================================================
// Bots Dialogs
//=========================================================
/**
 *
 */
var salesData = {
    "west": {
        units: 200,
        total: "$6,000"
    },
    "central": {
        units: 100,
        total: "$3,000"
    },
    "east": {
        units: 300,
        total: "$9,000"
    }
};

bot.dialog('/', [
    function (session) {
        builder.Prompts.choice(session, "Which region would you like sales for?", salesData);
    },
    function (session, results) {
        if (results.response) {
            var region = salesData[results.response.entity];
            session.send("We sold %(units)d units for a total of %(total)s.", region);
        } else {
            session.send("ok");
        }
    }
]);
server.get('/', restify.serveStatic({
    directory: __dirname,
    default: '/index.html'
}));