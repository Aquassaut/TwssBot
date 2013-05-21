var twss = require('twss');
var irc = require('node-irc');
var fs = require('fs');
var channel = '#paume';
var on = true;
var lastMsg = '';

twss.threshold = 0.5;


/**
 *  Special object handling conditional logging 
 */
var bot = {
    'debug' : false,
    log : function (entry) {
        if (bot.debug) {
            console.log(entry);
        }
    }
};

/**
 *  Quit order behavior handling
 */
function quit(from) {
    bot.log('Ordre de déco reçu de ' + from);
    if (from === 'aquassaut' || from === 'anthony') {
        client.disconnect('Bien, maître');
    } else {
        client.say(channel, 'enkuler de rire');
    }
}

/**
 *  knowledge base updating. It feels pretty hacky,
 *  I don't really know how to clean it up
 */

function storeData(pos, msg) {
    //Prefix hack to keep it short.
    msg = (msg !== '' ? msg : lastMsg);
    msg = msg.replace(/"/g, '`');
    var prefix = (pos ? 'posi' : 'nega');
    var file = 'node_modules/twss/data/' + prefix + 'tive.js';
    var message = '\nexports.data.push("' + msg + '");';
    fs.appendFile(file, message, function (err) {
        if (err) { throw err; }
        bot.log(msg + ' ajouté à la liste ' + prefix + 'tive !');
    });
    twss.trainingData[prefix.slice(0, 3)].push(msg);
    client.say(channel, 'Addition validée : ' + msg);
    bot.log(prefix + ': ' + msg);
}

/**
 *  Mutes or unmutes the bot
 */

function setOn(bool) {
    on = bool;
    bot.log((on ? 'Actif' : 'inactif'));
}

/**
 *  Custom match ing rule, otherwise unrelated to the project
 */

function matchIUT (phrase) {
    var reg = /i\.?u\.?t\.?/i;
    return reg.test(phrase);
};

/**
 *  Finds out whether a sentence is TWSS worthy and prints a message to the channel
 *  if it is
 */

function process(msg) {
    var p = Math.round(100 * twss.prob(msg));
    var t = "THAT'S WHAT SHE SAID ! (c'est sur à " + p + "% !)";
    bot.log(msg + ' -> ' + p + '%');
    if (matchIUT(msg)) {
        client.say(channel, "C'EST NORMAAAAAL A L'IUTTTTTTT");
    } else if (twss.is(msg)) {
        client.say(channel, t);
    }
}

/**
 *  DANGEROUS, DEBUG COMMAND ONLY
 *  Evaluates user input and prints it to the channel
 */

function ev(cmd) {
    try {
        //The eval'd JS might be invalid
        var output = eval(cmd);
        client.say(channel, eval(cmd));
    } catch (e) {
        console.log(e);
        client.say(channel, 'Invalide : ' + cmd);
    }
}

/**
 *  Prints a help message giving a brief summary of the available commands
 */

function help() {
    var helpmsg =
        '!ouste : déconnecte le bot\n' +
        '!twss : ajoute la dernière phrase dans la liste des TWSS\n' +
        '!nwss : ajoute la dernière phrase dans la liste des Non-TWSS\n' +
        '!chut : désactive le bot\n' +
        '!parle : réactive le bot\n' +
        '!eval : évalue la commande suivante\n' +
        '!dbg : met le bot en debug-mode, permettant de logger toute son activité\n' +
        '!undbg : quitte le debug-mode\n' +
        '!help : affiche ce message d\'aide';
    client.say(channel, helpmsg);
    bot.log('message d\'aide envoyé');
}

/**
 *  Bot connection
 */

var client = new irc.Client('aruhier.fr', 'twssChezAqua', {
    port : 6667,
    autoConnect : true,
    autoRejoin : true,
    channels : [channel]
});

/**
 *  Error events handler
 */

client.addListener('error', function(message) {
    bot.log('error: ', message);
});

/**
 *  message event logic implementation. Uses a dispatch table for different commands
 *  and send the part of the message after the command for relevant functions
 */

client.addListener('message', function(from, to, message) {
    var dispatch = {
        '!ouste' : function() { quit(from); },
        '!twss' : function(msg) { storeData(true, msg); },
        '!nwss' : function(msg) { storeData(false, msg); },
        '!chut' : function() { setOn(false); },
        '!parle' : function() { setOn(true); },
        '!eval' : function() { ev(message.slice(6)); },
        '!dbg' : function() { bot.debug = true; },
        '!undbg' : function() { bot.debug = false; },
        '!help' : function() { help(); }
    };
    for(var elem in dispatch) {
        if (dispatch.hasOwnProperty(elem) && elem === message.slice(0, elem.length)) {
            //If the command is valid, validate it and send rest of message
            //starting from the first non whitespace character
                dispatch[elem](message.slice(elem.length + 1));
                lastMsg = message;
                return;
        }
    }
    if (on) {
        //if unmute
        process(message);
    }
    lastMsg = message;
});
