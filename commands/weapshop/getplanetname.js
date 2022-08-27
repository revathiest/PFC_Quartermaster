module.exports ={
	getplanetname: function(planetTag){
		
		switch(planetTag){
			case 'Stanton1':
				return 'Hurston'
			case 'Stanton2':
				return 'Crusader'
			case 'Stanton3':
				return 'ArcCorp'
			case 'Stanton4':
				return 'MicroTech'
			case 'GrimHex':
				return 'Grim Hex'
			default:
				return planetTag
		}
	}
}