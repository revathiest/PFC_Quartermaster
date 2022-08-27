module.exports ={
	getshipmanuf: function(manufTag){
		
		switch(manufTag){
			case 'AEGS':
				return 'Aegis Dynamics'
			case 'ANVL':
				return 'Anvil Aerospace'
			case 'ARGO':
				return 'ARGO Astronautics'
			case 'BANU':
				return 'Banu'
			case 'CNOU':
				return 'Consolidated Outland'
			case 'CRUS':
				return 'Crusader Industries'
			case 'DRAK':
				return 'Drake Interplanetary'
			case 'ESPR':
				return 'Esperia'
			case 'GRIN':
				return 'Greycat Industrial'
			case 'KRIG':
				return 'Kruger Intergalactic'
			case 'MISC':
				return 'Musashi Industrial & Starflight Concern'
			case 'ORIG':
				return 'Origin Jumpworks'
			case 'RSI':
				return 'Roberts Space Industries'
			case 'TMBL':
				return 'Tumbril'
			default:
				return 'Manufacturer not found'
		}
	}
}