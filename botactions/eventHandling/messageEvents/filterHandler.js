//botactions/eventHandling/messageEvents/filterHandler.js
const filter = require('../../messages.json');
const performAction = require('./actionPerformer');

module.exports = async function handleFiltering(message, client) {
    const content = message.content;
    const lowerCaseContent = content.toLowerCase();
    const personalTriggers = [];
    const regularTriggers = [];
    let allowMessage = true;

    for (const phrase in filter.words) {
        if (filter.words[phrase].action === "personal") {
            personalTriggers.push(phrase);
        } else {
            regularTriggers.push(phrase);
        }
    }

    for (const phrase of personalTriggers) {
        if (lowerCaseContent.includes(phrase)) {
            console.log('Checking personal trigger for "' + phrase + '"');
            if (performAction(message, client, filter.words[phrase])) return;
        }
    }

    for (const phrase of regularTriggers) {
        if (lowerCaseContent.includes(phrase)) {
            console.log('Checking regular trigger for "' + phrase + '"');
            if (performAction(message, client, filter.words[phrase])) return;
        }
    }

    for (const regex in filter.regex) {
        const regexObj = new RegExp(regex, "i");
        if (regexObj.test(content) && allowMessage) {
            console.log('Matched regex: ' + regex);
            if (performAction(message, client, filter.regex[regex])) return;
        }
    }
};