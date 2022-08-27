const { SlashCommandBuilder } = require('@discordjs/builders')

module.exports ={
	data: new SlashCommandBuilder()
		.setName('dataupdate')
		.setDescription('*ADMIN COMMAND* Update info from game data'),

	role: '849044491343757343', //Server Admin Only

	async execute(interaction, client){
		//const { getshopinfo } = require ('./weapshop/getshopinfo.js')
		
		var shops = null
		
		// Database Definitions
		const mysql = require('mysql')
		const database = mysql.createConnection({
			host: 'na05-sql.pebblehost.com',
			user: 'customer_230193_pfc',
			password: 'oZmTmYJ4l5!si1gbCNs@',
			database: 'customer_230193_pfc',
		})
		
		//initiate the database connection
		database.connect(
			function(err){
				if (err){
					return console.error('Database error: ', err.message)
				}
				console.log('Connected to the MySQL Server')
			}
		)
		
		//Bring in everything we want from the shop files.  These are category_id 6
		database.beginTransaction(function(err) {
			if (err) { console.log (err) }	
			try{
				var querystring = "SELECT name FROM gamedata WHERE category_id = 6 AND version = (SELECT MAX(version) FROM gamedata)"
				database.query(querystring, function (err, result, fields) {
					if (err) { console.log(err) }
					shops = result
					//console.log('Shop List Retrieved')
					
					querystring = "DELETE FROM SHOPS;"
					database.query(querystring)
					querystring = "DELETE FROM SHOPINV;"
					database.query(querystring)
					querystring = "DELETE FROM INVITEMS;"
					database.query(querystring)
					querystring = "DELETE FROM COMMODITIES;"
					database.query(querystring)
					querystring = "DELETE FROM MANUFACTURERS;"
					database.query(querystring)
					querystring = "DELETE FROM SHIPS;"
					database.query(querystring)
					querystring = "DELETE FROM ITEMPORTS;"
					database.query(querystring)
					
					database.commit()

					shops.forEach(shop => {
						querystring = "SELECT data FROM gamedata WHERE category_id = 6 AND name = '" + shop.name + "' AND version = (SELECT MAX(version) FROM gamedata)"
						database.query(querystring, function (err, result, fields) {
							if (err) { console.log(err) }
							//console.log('Shop data retrieved for ' + shop.name)							
							
							const shopdata = JSON.parse(result[0].data.toString())
							updateshop(database, shopdata, shop.name) //For some reason, We're not getting the Weapons Shop info into the database
							if (shopdata.Prices != undefined) {
								updateprices(database, shopdata.Prices)
							}
						})
					})
					database.commit()
				})
			} catch (error) {
				console.log(error)
			}
		})
		
		
		//Bring in everything we want from the weapon files.  These are category_id 2
		database.beginTransaction(function(err) {
			if (err) { console.log (err) }	
			try{
				var querystring = "SELECT name FROM gamedata WHERE category_id = 2 AND version = (SELECT MAX(version) FROM gamedata)"
				database.query(querystring, function (err, result, fields) {
					if (err) { console.log(err) }
					weaps = result
					//console.log('Weapon List Retrieved')

					weaps.forEach(weap => {
						querystring = "SELECT data FROM gamedata WHERE category_id = 2 AND name = '" + weap.name + "' AND version = (SELECT MAX(version) FROM gamedata)"
						database.query(querystring, function (err, result, fields) {
							if (err) { console.log(err) }
							//console.log('Weapon data retrieved for ' + weap.name)	
							
							const weapdata = JSON.parse(result[0].data.toString())
							var Manufacturer
							const keylist = weapdata.Components.SAttachableComponentParams.AttachDef
							
							Object.keys(keylist).forEach(key => {
								if (key.startsWith("SCItemManufacturer")) {
									Manufacturer = keylist[key].Localization.Name
									//console.log(Manufacturer.Localization.Name)
									//console.log(Manufacturer)
								}	
							})
							
							var Description = weapdata.Components.SAttachableComponentParams.AttachDef.Localization.Description
							var splitDesc = Description.split("\n");
							Description = (splitDesc[splitDesc.length - 1])
							var Name = weapdata.Components.SAttachableComponentParams.AttachDef.Localization.Name
							var ShortName = weapdata.Components.SAttachableComponentParams.AttachDef.Localization.ShortName
							
							const regex = /'/gi
							
							Description = Description.replace(regex, "")
							Name = Name.replace(regex, "")
							ShortName = ShortName.replace(regex, "")
							
							const ID = weapdata.__ref
							const ManufID = weapdata.Components.SAttachableComponentParams.AttachDef.Manufacturer
							const Mass = weapdata.Components.SEntityPhysicsControllerParams.PhysType.SEntityRigidPhysicsControllerParams.Mass
							const Type = weapdata.Components.SAttachableComponentParams.AttachDef.Type
							const SubType = weapdata.Components.SAttachableComponentParams.AttachDef.SubType
							const Size = weapdata.Components.SAttachableComponentParams.AttachDef.Size
							const Grade = weapdata.Components.SAttachableComponentParams.AttachDef.Grade
							
							querystring = "INSERT INTO INVITEMS (ID, ManufID, Name, ShortName, Description, Manufacturer, Mass, Type, SubType, Size, Grade) VALUES ('" + 
							ID + "', '" +
							ManufID + "', '" +
							Name + "', '" +
							ShortName + "', '" +
							Description + "', '" +
							Manufacturer + "', " +
							Mass + ", '" +
							Type + "', '" +
							SubType + "', " +
							Size + ", " +
							Grade + ")"
							database.query(querystring)
							database.commit()
						})
					})
					database.commit()
				})
			} catch (error) {
				console.log(error)
			}
		})
		
		//Bring in everything we want from the weapon magazine files.  These are category_id 3
		database.beginTransaction(function(err) {
			if (err) { console.log (err) }	
			try{
				var querystring = "SELECT name FROM gamedata WHERE category_id = 3 AND version = (SELECT MAX(version) FROM gamedata)"
				database.query(querystring, function (err, result, fields) {
					if (err) { console.log(err) }
					mags = result
					//console.log('Weapon Magazine List Retrieved')
					

					mags.forEach(mag => {
						querystring = "SELECT data FROM gamedata WHERE category_id = 3 AND name = '" + mag.name + "' AND version = (SELECT MAX(version) FROM gamedata)"
						database.query(querystring, function (err, result, fields) {
							if (err) { console.log(err) }
							//console.log('Magazine data retrieved for ' + mag.name)	
							
							const magdata = JSON.parse(result[0].data.toString())
							var Manufacturer
							const keylist = magdata.Components.SAttachableComponentParams.AttachDef
							
							Object.keys(keylist).forEach(key => {
								if (key.startsWith("SCItemManufacturer")) {
									Manufacturer = keylist[key].Localization.Name
									//console.log(Manufacturer.Localization.Name)
									//console.log(Manufacturer)
								}	
							})
							
							var Description = magdata.Components.SAttachableComponentParams.AttachDef.Localization.Description
							var splitDesc = Description.split("\n");
							Description = (splitDesc[splitDesc.length - 1])
							var Name = magdata.Components.SAttachableComponentParams.AttachDef.Localization.Name
							var ShortName = magdata.Components.SAttachableComponentParams.AttachDef.Localization.ShortName
							
							const regex = /'/gi
							
							Description = Description.replace(regex, "''")
							Name = Name.replace(regex, "''")
							ShortName = ShortName.replace(regex, "''")
							
							const ID = magdata.__ref
							const ManufID = magdata.Components.SAttachableComponentParams.AttachDef.Manufacturer
							const Mass = magdata.Components.SEntityPhysicsControllerParams.PhysType.SEntityRigidPhysicsControllerParams.Mass
							const Type = magdata.Components.SAttachableComponentParams.AttachDef.Type
							const SubType = magdata.Components.SAttachableComponentParams.AttachDef.SubType
							const Size = magdata.Components.SAttachableComponentParams.AttachDef.Size
							const Grade = magdata.Components.SAttachableComponentParams.AttachDef.Grade
							
							querystring = "INSERT INTO INVITEMS (ID, ManufID, Name, ShortName, Description, Manufacturer, Mass, Type, SubType, Size, Grade) VALUES ('" + 
							ID + "', '" +
							ManufID + "', '" +
							Name + "', '" +
							ShortName + "', '" +
							Description + "', '" +
							Manufacturer + "', " +
							Mass + ", '" +
							Type + "', '" +
							SubType + "', " +
							Size + ", " +
							Grade + ")"
							database.query(querystring)
							database.commit()
						})
					})
					database.commit()
				})
			} catch (error) {
				console.log(error)
			}
		})
		
		//Bring in everything we want from the Commodity files.  These are category_id 4
		database.beginTransaction(function(err) {
			if (err) { console.log (err) }	
			try{
				var querystring = "SELECT name FROM gamedata WHERE category_id = 4 AND version = (SELECT MAX(version) FROM gamedata)"
				database.query(querystring, function (err, result, fields) {
					if (err) { console.log(err) }
					commodities = result
					//console.log('Commodity List Retrieved')
					

					commodities.forEach(commodity => {
						querystring = "SELECT data FROM gamedata WHERE category_id = 4 AND name = '" + commodity.name + "' AND version = (SELECT MAX(version) FROM gamedata)"
						database.query(querystring, function (err, result, fields) {
							if (err) { console.log(err) }
							//console.log('Commodity data retrieved for ' + commodity.name)	
							const commdata = JSON.parse(result[0].data.toString())
							
							var ID = commdata.__ref
							var Name = commdata.Components.CommodityComponentParams.name
							var Price = null
							var Type
							var TypeID
							var SubType
							var SubTypeID
							var Volatility
							var DecayRate
							
							if (commdata.RetailProducts != undefined){
								Price = commdata.RetailProducts.Node.BasePrice
							}
							
							const keylist = commdata.Components.CommodityComponentParams
							
							Object.keys(keylist).forEach( key => {
							if (key.startsWith("CommodityType")) {
									Type = keylist[key].name
									TypeID = keylist[key].__ref
								}
							if (key.startsWith("CommoditySubtype")) {
									SubType = keylist[key].name
									SubTypeID = keylist[key].__ref
									Volatility = keylist[key].volatility
									DecayRate = keylist[key].HealthDecayOverTime
								}	
							})
							
							const regex = /'/gi
							
							Name = Name.replace(regex, "''")
							if (SubType != undefined){
								SubType = SubType.replace(regex, "''")						
							}
							
							querystring = "INSERT INTO COMMODITIES (ID, Name, Type, SubType, Price, TypeID, SubTypeID, Volatility, DecayRate) VALUES ('" + 
							ID + "', '" +
							Name + "', '" +
							Type + "', '" +
							SubType + "', " +
							Price + ", '" +
							TypeID + "', '" +
							SubTypeID + "', '" +
							Volatility + "', '" +
							DecayRate + "')"
							database.query(querystring)
							database.commit()
						})
					})
					database.commit()
				})
			} catch (error) {
				console.log(error)
			}
		})
		
		//Bring in everything we want from the Manufacturer files.  These are category_id 7
		database.beginTransaction(function(err) {
			if (err) { console.log (err) }	
			try{
				var querystring = "SELECT name FROM gamedata WHERE category_id = 7 AND version = (SELECT MAX(version) FROM gamedata)"
				database.query(querystring, function (err, result, fields) {
					if (err) { console.log(err) }
					manufacturers = result
					//console.log('Manufacturer List Retrieved')
					

					manufacturers.forEach(manufacturer => {
						querystring = "SELECT data FROM gamedata WHERE category_id = 7 AND name = '" + manufacturer.name + "' AND version = (SELECT MAX(version) FROM gamedata)"
						database.query(querystring, function (err, result, fields) {
							if (err) { console.log(err) }
							//console.log('Manufacturer data retrieved for ' + manufacturer.name)	
							const manufdata = JSON.parse(result[0].data.toString())
			
							var ID = manufdata.__ref
							var Name = manufdata.Localization.Name
							var Description = manufdata.Localization.Description
							var Code = manufdata.Code
							
							if (Code == ""){ return }
							 
							const regex = /'/gi
							
							Name = Name.replace(regex, "''")
							Description = Description.replace(regex, "''")
							
							querystring = "INSERT INTO MANUFACTURERS (ID, Name, Description, Code) VALUES ('" + 
							ID + "', '" +
							Name + "', '" +
							Description + "', '" +
							Code + "')"
							database.query(querystring)
							database.commit()
						})
					})
					database.commit()
				})
			} catch (error) {
				console.log(error)
			}
		})
		
		//Bring in everything we want from the Ship files.  These are category_id 1
		database.beginTransaction(function(err) {
			if (err) { console.log (err) }	
			try{
				var querystring = "SELECT name FROM gamedata WHERE category_id = 1 AND version = (SELECT MAX(version) FROM gamedata)"
				database.query(querystring, function (err, result, fields) {
					if (err) { console.log(err) }
					ships = result
					//console.log('Ship List Retrieved')
					

					ships.forEach(ship => {
						querystring = "SELECT data FROM gamedata WHERE category_id = 1 AND name = '" + ship.name + "' AND version = (SELECT MAX(version) FROM gamedata)"
						database.query(querystring, function (err, result, fields) {
							if (err) { console.log(err + " for " + ship.displayname) }
							//console.log('Ship data retrieved for ' + ship.name)	
							const shipdata = JSON.parse(result[0].data.toString())
							const name = shipdata.name
							const displayname = shipdata.displayname
							const size = shipdata.size
							const mass = (shipdata.Parts.Part.mass != undefined ? shipdata.Parts.Part.mass : 0)
							var damagemax = 0
							
							if(Array.isArray(shipdata.Parts.Part)){ return }
							
							const part = shipdata.Parts.Part
							
							
							
							damagemax = updateparts(database, part, displayname, damagemax)
							
							querystring = "INSERT INTO SHIPS (Name, Size, Mass, DisplayName) VALUES ('" + 
							name + "', " +
							size + ", " +
							mass + ", '" +
							displayname + "')"

							console.log(querystring)
							database.query(querystring)
							database.commit()

						})
					})
					database.commit()
				})
			} catch (error) {
				console.log(error)
			}
		})
		
		database
			.on('error', (error) => {
				console.log('Database Error: ' + error)
			})
			.on('connect', () => {
				console.log('Database Connected. ')
			})
			.on('end', (error) => {
				console.log('Database Disconnected: ' + error)
			})
			.on('drain', () => {
				console.log('Database Drained. ')
			})
			.on('endqueue', (sequence) => {
				console.log('Database Enqueued: ' + sequence)
			})
		
	}
}
		
function updateparts(database, part, name, damagemax){

	var KEEP = true
	
	console.log(damagemax)
	
	if (part.damageMax != undefined) {
		console.log(damagemax + " + " + part.damageMax)
		damagemax = damagemax + part.damageMax
		console.log("Max damage updated (" + damagemax + ")")
	}	
	if (part.damagemax != undefined) {
		damagemax = damagemax + part.damagemax
		console.log("Max damage updated (" + damagemax + ")")
	}
	
	if (Array.isArray(part)){
		//console.log("Array of parts found")
		for (let i = 0; i < part.length; i++){
			//console.log(part[i].name + " - part found. (2)")
			updateparts(database, part[i], name, damagemax)
		}
	}
		
	if (part.ItemPort != undefined){
		
		if(part.ItemPort.flags != undefined){
			
			//console.log("Flags found")
			
			var splitflags = part.ItemPort.flags.split(" ")

			for (let i = 0; i < splitflags.length; i++){
				 if (splitflags[i] == "uneditable") {
					//console.log("Uneditable part")
					KEEP = false
				} 
			}

			if (part.Parts != undefined){
				//console.log("Found more parts")
				updateparts(database, part.Parts.Part, name, damagemax)
			} 
			
		} else {
			//console.log("No flags for part - " + part.name)
			if (part.Parts != undefined){
				updateparts(database, part.Parts.Part, name, damagemax)
			}
			KEEP = false
		}
	} else {
		KEEP = false
	}
	
	if (part.Parts != undefined){
		//console.log("Found more parts")
		updateparts(database, part.Parts.Part, name, damagemax)
	}

	if(KEEP){
		//Here's where we'll put the part data in.
		//console.log(part.name + " - part found (1).")
		
		var _shipname = name
		var _portname = ''
		var _porttype = ''
		var _portsubtype = ''
		var _maxsize = 0
		var _minsize = 0
		
		_portname = (part.name != undefined ? part.name : '')
		if (part.ItemPort.Types != undefined) {
			_porttype = (part.ItemPort.Types.Type.type != undefined ? part.ItemPort.Types.Type.type : '')
			_portsubtype = (part.ItemPort.Types.Type.subtypes != undefined ? part.ItemPort.Types.Type.subtypes : '')
		}
		_maxsize = (part.ItemPort.maxsize != undefined ? part.ItemPort.maxsize : 0)
		_minsize = (part.ItemPort.minsize != undefined ? part.ItemPort.minsize : 0)

		database.beginTransaction(function(err) {
			var querystring = "INSERT INTO ITEMPORTS (ShipName, PortName, PortType, PortSubtype, MaxSize, MinSize) VALUES ('" +
			_shipname + "', '" +
			_portname + "', '" +
			_porttype + "', '" +
			_portsubtype + "', " +
			_maxsize + ", " +
			_minsize + ")"
			//console.log(querystring)
			database.query(querystring)
			database.commit()
		})

	}
	return damagemax
}

function updateshop(database, shopnode, shoptype){
	
	if (Array.isArray(shopnode)){
		//console.log("Array of nodes found")
		for (let i = 0; i < shopnode.length; i++){
			//console.log(shopnode[i].Name + " - shop found.")
			updateshop(database, shopnode[i], shoptype)
		}
	}
	
	//console.log(shopnode.Name + " - current node.")
	
	if (shopnode.ShopInventoryNodes != undefined && shopnode.ShopInventoryNodes != null){
		const invnode = shopnode.ShopInventoryNodes.ShopInventoryNode
		//console.log(shopnode.Name + " - inventory found.")
		updateinv(database, invnode, shopnode.ID)
		
		database.beginTransaction(function(err) {
			var querystring = "INSERT INTO SHOPS (ID, Name, ShopType, AcceptStolen) VALUES ('" +
			shopnode.ID + "', '" +
			shopnode.Name + "', '" +
			shoptype + "', " +
			shopnode.AcceptsStolenGoods + ")"
			database.query(querystring)
			database.commit()
		})
		return
	}
	
	if (shopnode.ShopLayoutNodes != undefined && shopnode.ShopLayoutNodes != null){
		const nextnode = shopnode.ShopLayoutNodes.ShopLayoutNode
		//console.log(shopnode.Name + " - layout found.")
		updateshop(database, nextnode, shoptype)
		return
	}
	
}

function updateinv(database, invnode, shopid){
	
	for (let i = 0; i < invnode.length; i++){
		
		database.beginTransaction(function(err) {
			var querystring = "INSERT INTO SHOPINV (ShopID, InvID, invName, TransType) VALUES ('" +
			shopid + "', '" +
			invnode[i].InventoryID + "', '" +
			invnode[i].Name + "', '" +
			invnode[i].TransactionType + "')"
			database.query(querystring)
			database.commit()
		})
	}
}

function updateprices (database, prices){	
	for (let i = 0; i < prices.length; i++){
		
		database.beginTransaction(function(err) {
			var querystring = "UPDATE SHOPINV SET Price = '" + prices[i].Node.BasePrice + "' WHERE InvID = '" + prices[i].Node.ID + "'"
			database.query(querystring)
			database.commit()
		})
	}
}