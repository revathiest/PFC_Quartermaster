module.exports ={
	getshopinfo: function(interaction, dealers, version){
				
		var args = interaction.options._hoistedOptions[0]
		const { Client, Intents, EmbedBuilder } = require('discord.js')
		const { getshipmanuf } = require ('./getshipmanuf.js')
		var shops = dealers.ShopLayoutNodes.ShopLayoutNode
		var shiplist = []
		
		if(!interaction.deferred){
			interaction.deferReply({ephemeral: true})
		}
		
		// No arguments were provided
		if (args == undefined || args == null || args == ''){

			//var shops = dealers.ShopLayoutNodes.ShopLayoutNode
			const responseEmbed = new EmbedBuilder()
				.setColor('#0099ff')
				.setTitle('Ship Shops - ' + version)
				.setAuthor({name: 'Pyro Freelancer Corps', iconURL: 'https://i.imgur.com/5sZV5QN.png', url: 'https://robertsspaceindustries.com/orgs/PFCS'})
				.setThumbnail('https://i.imgur.com/RdZBmhk.png')
				.setTimestamp()
				.setFooter({text:'Official PFC Communication', iconURL:'https://i.imgur.com/5sZV5QN.png'})
			
			shops.forEach( shop => {
				const tmpshop = shop.Name.split('_')
				if (responseEmbed.data.description == undefined || responseEmbed.data.description == null ){
					responseEmbed.setDescription( '**' + tmpshop[0] + '** located in ' + tmpshop[1])
				} else {
					responseEmbed.setDescription(responseEmbed.data.description + '\n**' + tmpshop[0] + '** located in ' + tmpshop[1])
				}
			})
			interaction.user.send({ embeds: [responseEmbed] })
			interaction.editReply({content: 'Check your DMs', ephemeral: true})
			return
		}
		
		shops.forEach( shop => {
			const tmpshop = shop.Name.split('_')
			if (args.value.toLowerCase() == tmpshop[0].toLowerCase()){
				const inventory = shop.ShopInventoryNodes.ShopInventoryNode
				
				const responseEmbed = new EmbedBuilder()
				.setColor('#0099ff')
				.setTitle(tmpshop[0] + ' - ' + tmpshop[1] + ' - ' + version)
				.setAuthor({name: 'Pyro Freelancer Corps', iconURL: 'https://i.imgur.com/5sZV5QN.png', url: 'https://robertsspaceindustries.com/orgs/PFCS'})
				.setThumbnail('https://i.imgur.com/RdZBmhk.png')
				.setTimestamp()
				.setFooter({text:'Official PFC Communication', iconURL:'https://i.imgur.com/5sZV5QN.png'})
			
				inventory.forEach( ship => {
					
					const tmp = ship.Name.split('_')
					const manufacturer = tmp.shift()
					if (tmp[tmp.length-1] == 'UPDATE') {
						tmp[tmp.length-1] = ''
					}
					const shipName = tmp.join(' ')
					const prices = dealers.Prices
					var cont = true
					prices.forEach( price =>  { 
						if (cont == false){
							return
						}
						if (price.Node.ID == ship.InventoryID){
							cont = false
						const shopPrice = price.Node.BasePrice.toLocaleString( undefined, {minimumFractionDigits: 0} )
							tmplist = [manufacturer, shipName, shopPrice]
							shiplist.push(tmplist)
						}
					})
				})
				shiplist.sort()
				
				var manufList = ''
				var manufTag = ''
				
				for (let i = 0; i < shiplist.length; i++) {
					if (manufTag !== shiplist[i][0]){
							manufTag = shiplist[i][0]
							manufList = shiplist[i][1] + ' - ' + shiplist[i][2] + 'aUEC\n'
					} else {
						manufList = manufList + shiplist[i][1] + ' - ' + shiplist[i][2] + 'aUEC\n'
					}
					if (shiplist[i+1] == undefined || shiplist[i+1][0] !== manufTag) {
						
						const manufName = getshipmanuf(manufTag)
						
						responseEmbed.addFields({name:'**' + manufName + '** (' + manufTag + ')', value:manufList})
					}
				}
				
				//console.log(shiplist)
				interaction.user.send({ embeds: [responseEmbed] })
			interaction.editReply({content: 'Check your DMs', ephemeral: true})

				//Here is where we'll get the list of shops
				//And after we've sent the embed... we'll return
				return
			}
		})
		
		
		
		
		
		
		
	}
}