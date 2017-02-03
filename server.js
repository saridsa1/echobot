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

                var message1 = new builder.Message()
                    .address(message.address)
                    .text("Hello %s... I am Bumble bee an automated questionnaire bot. Please take a quick questionnaire for %s", name || 'there', userObj["trailName"]);
                bot.send(message1);

                admin.database().ref('/root/users/'+systemUserId).update({"channelAddress" : message.address}, function(){
                    console.log("Update successful");
                    var message2 = new builder.Message()
                        .address(message.address)
                        .text("Your next survey is on %s", moment().add(2, 'm').format("dddd, MMMM Do YYYY, h:mm:ss a"));
                    bot.send(message2);

                    var message3 = new builder.Message()
                        .address(message.address)
                        .text('The answers provided by you will only be used for trail purpose, and transmitted over a secure line');

                    bot.send(message3);

                    scheduleSurvey(userObj, message.address, systemUserId);
                });
            }, function (errorObject) {
                console.error(JSON.stringify(errorObject));
                var message1 = new builder.Message()
                    .address(message.address)
                    .text("Hello %s... I am Bumble bee an automated questionnaire bot. I see you haven't been questionnaire to survey yet!!", name || 'there');

                bot.send(message1);

            });
        }

    } else {
        // delete their data
    }
});

function scheduleSurvey(userObject, channelAddress, systemUserId){

    var formattedDate = new Date(moment().add(1, 'm'));

    console.log("SCHEDULING THE SURVEY FOR ", moment(formattedDate).format('YYYY-MM-DD HH:mm:ss'));
    scheduler.scheduleJob(formattedDate, function(){
        console.log("Starting the survey now ", JSON.stringify(userObject));

        bot.beginDialog(channelAddress, '/start', { msgId: userObject.trailName, params: userObject, index : 0, form: {} });

        admin.database().ref('/root/clinicalTrailInfo/'+userObject.trailID).once('value').then(function(snapshot) {
            var keys = Object.keys(snapshot.val());
            var clinicalTrailId = keys[0];

            var clinicalTrailQuestionnare = snapshot.val()[clinicalTrailId];

            //console.log(snapshot.val());

            //var questions = clinicalTrailQuestionnare["Questions"];
            var standardResponses = ["Great!!", "Okay", "Don't worry you will get better soon"];

            bot.dialog('/start', [
                function (session, args) {
                    // Save previous state (create on first call)
                    session.dialogData.index = args ? args.index : 0;
                    session.dialogData.form = args ? args.form : {};
                    // Prompt user for next field
                    builder.Prompts.choice(session, clinicalTrailQuestionnare[session.dialogData.index].QuestionText, clinicalTrailQuestionnare[session.dialogData.index].Answers);
                },
                function (session, results) {
                    // Save users reply
                    var field = clinicalTrailQuestionnare[session.dialogData.index++].field;
                    session.dialogData.form[field] = results.response;

                    // Check for end of form
                    if (session.dialogData.index >= clinicalTrailQuestionnare.length) {
                        // Return completed form
                        console.log(session.dialogData.form);

                        admin.database().ref('/root/users/'+systemUserId).update({"QuestionnaireResult" : session.dialogData.form}, function(){
                            session.send("Thank you for your time ! We are done with questionnaire ");
                            session.endDialogWithResult({ response: session.dialogData.form });
                        })
                    } else {
                        // Next field
                        session.send(standardResponses[results.response.index]);
                        session.replaceDialog('/start', session.dialogData);

                    }
                }
            ]);
        });
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
