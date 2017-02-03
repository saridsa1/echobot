/**
 * Created by satyasumansaridae on 2/2/17.
 */
var restify = require('restify');
var builder = require('botbuilder');
var admin = require('firebase-admin');
var moment = require('moment');
var scheduler = require('node-schedule');

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

        if(name) {
            console.log("Processing for name ", name);

            admin.database().ref('/root/users').orderByChild('name').equalTo(name).once('value', function(snapshot) {
                console.log("Look up successful ", JSON.stringify(snapshot.val()));

                var keys = Object.keys(snapshot.val());
                var systemUserId = keys[0];

                var userObj = snapshot.val()[systemUserId];

                var surveyScheduledDateTime = userObj["scheduledDate"];

                var message1 = new builder.Message()
                    .address(message.address)
                    .text("Hello %s... I am Bumble bee an automated survey bot. I see you have been registered to %s", name || 'there', userObj["trailName"]);
                bot.send(message1);

                admin.database().ref('/root/users/'+systemUserId).update({"channelAddress" : message.address}, function(){
                    console.log("Update successful");
                    var message2 = new builder.Message()
                        .address(message.address)
                        .text("Your next survey is on %s", moment(surveyScheduledDateTime).format("dddd, MMMM Do YYYY, h:mm:ss a"));
                    bot.send(message2);

                    scheduleSurvey(userObj);
                });
            }, function (errorObject) {
                console.error(JSON.stringify(errorObject));
                var reply = new builder.Message()
                    .address(message.address)
                    .text("Hello %s... I am Bumble bee an automated survey bot. I see you haven't been registered to survey yet!!", name || 'there');
                bot.send(reply);
            });
        }

    } else {
        // delete their data
    }
});

function scheduleSurvey(userObject){

    var formattedDate = new Date(moment().add(2, 'm'));

    console.log("SCHEDULING THE SURVEY FOR ", moment(formattedDate).format('YYYY-MM-DD HH:mm:ss'));
    scheduler.scheduleJob(formattedDate, function(){
        console.log("Starting the survey now ", JSON.stringify(userObject));

        bot.beginDialog(userObject.channelAddress, '/start', { msgId: userObject.trailName, params: userObject });

        bot.dialog('/start', [
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
    });
}

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
