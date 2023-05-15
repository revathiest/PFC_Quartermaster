const filter = require('./messages.json')


module.exports ={
	process_messages: function(message, allowmessage){

        const words = message.content.split(' ');

        for(var i in words){
            var tmp = words[i].toLowerCase();
            if (filter[tmp] && allowmessage) {
                message.channel.send(filter[tmp]);
                return false;
            } else if(message.author.bot == false) {
                return true;
            } else {
                return false;
            }
        }
    },
    test_message: function(string){
        //This isnt being used.
    },
}