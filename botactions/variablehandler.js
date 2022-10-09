
const { dbinfo } = require('../config.json')

module.exports ={
	getvariable: function(client, key, callback){
		const mysql = require('mysql')
		const database = mysql.createConnection(dbinfo)
		var tmp

		//client.channels.cache.get(client.chanBotLog).send('Retrieving ' + key)
		database.connect(
			function(err){
				if (err){
					return console.error('Database error: ', err.message)
				}
				console.log('Connected to the MySQL Server: Retrieving variable ' + key)
			}
		)

		database.beginTransaction(function(err) {
			if (err) { console.log (err) }	

			try {
				var querystring = "SELECT Value from PFC_VARIABLES WHERE varKey = '" + key + "'"
				database.query(querystring, function (err, result, fields) {
					if (err) { console.log(err) }
					if (result && result.length != 0){
						return callback(JSON.parse(result[0].Value.toString()))
					} else {
						return callback(undefined)
					}
				})

			} catch (error){
				console.log(error.stack)
			}
		})
    },

	setvariable: function(client, key, value){
		const mysql = require('mysql')
		const database = mysql.createConnection(dbinfo)

		//client.channels.cache.get(client.chanBotLog).send('Saving ' + key)
		database.connect(
			function(err){
				if (err){
					return console.error('Database error: ', err.message)
				}
				console.log('Connected to the MySQL Server: Updating variable ' + key)
			}
		)

		database.beginTransaction(function(err) {
			if (err) { console.log (err) }	

			try {
				var querystring = "UPDATE PFC_VARIABLES SET Value = '" + JSON.stringify(value) + "' WHERE varKey = '" + key + "'"
				database.query(querystring, function (err, result, fields) {
					if (err) { console.log(err) }
					if (result['affectedRows'] == 0){
						try{
							var querystring = "INSERT INTO PFC_VARIABLES (varKey, value) VALUES ( '"+ key + "', '" + JSON.stringify(value) + "')"
							database.query(querystring, function (err, result, fields) {
								if (err) { console.log(err) }
								console.log(result)
								//console.log(key + ' inserted with the value of ' + value)
							})
						} catch (error){
							console.log(error.stack)
						}
					}
					//console.log(key + ' updated with the value of ' + value)
				})

			} catch (error){

				console.log(error.stack)

			}
		})
		database.commit();
    }
}
