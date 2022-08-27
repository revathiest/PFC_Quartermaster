module.exports ={
	getshopinfo: function(interaction, dealers, version){
				
		var args = interaction.options._hoistedOptions[0]
		const { Client, Intents, MessageEmbed } = require('discord.js')
		const { getplanetname } = require ('./getplanetname.js')
		var shops = dealers.ShopLayoutNodes.ShopLayoutNode
		var shoploclist = []
		
		const responseEmbed = new MessageEmbed()
		.setColor('#0099ff')
		.setAuthor('Pyro Freelancer Corps', 'https://i.imgur.com/5sZV5QN.png', 'https://robertsspaceindustries.com/orgs/PFCS')
		.setThumbnail('https://i.imgur.com/RdZBmhk.png')
		.setTimestamp()
		.setFooter('Official PFC Communication', 'https://i.imgur.com/5sZV5QN.pngg')
		
		// No arguments were provided
		if (args == undefined || args == null || args == ''){

			//var shops = dealers.ShopLayoutNodes.ShopLayoutNode
			responseEmbed.setTitle('Weapon Shops - ' + version)
			
			shops.forEach( shop => {
				const tmpshop = shop.Name.split('_')
				if (responseEmbed.description == undefined || responseEmbed.description == null ){
					responseEmbed.setDescription( '**' + tmpshop[0] + '**')
				} else {
					responseEmbed.setDescription(responseEmbed.description + '\n**' + tmpshop[0] + '**')
				}
			})
			interaction.user.send({ embeds: [responseEmbed] })
			interaction.reply({content: 'Check your DMs', ephemeral: true})
			return
		}
		

		shops.forEach( shop => {
			var tmpshop = shop.Name.split('_')
			if (args.value.toLowerCase() == tmpshop[0].toLowerCase()){
				
				var shoplist = shop.ShopLayoutNodes.ShopLayoutNode
				if (shoplist[0] != undefined){
					responseEmbed.setTitle(tmpshop[0] + ' - ' + version)
					var shopnode = 0
					while (shoplist[shopnode] != undefined){
						console.log(shoplist[shopnode].Name)
						shopnode++
					}
				} else {
					var shopinfo = shoplist.Name.split('_')
					responseEmbed.setTitle(shopinfo[0] + ' - ' + shopinfo[1] + ' - ' + version)
					const shopinv = shoplist.ShopInventoryNodes.ShopInventoryNode
					shopinv.forEach( item => {
						//Here we need to provide the categories
					})
					
					console.log(shoplist.Name)
				}



				

			
				//console.log(shiplist)
				interaction.user.send({ embeds: [responseEmbed] })
				interaction.reply({content: 'Check your DMs', ephemeral: true})

				//Here is where we'll get the list of shops
				//And after we've sent the embed... we'll return
				return
			}
		})
		
		
		
		
		
		
		
	}
}