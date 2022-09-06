const { SlashCommandBuilder } = require('@discordjs/builders')
const { dbinfo, botPermsReq } = require('./../config.json')
const Builder = new SlashCommandBuilder()

Builder.type = 1
Builder.default_member_permissions = botPermsReq
Builder.setName('dataupdate')
Builder.setDescription('*ADMIN COMMAND* Update info from game data')

module.exports ={
	data: Builder,

	async execute(interaction, client){
		
		var shops = null
		
		// Database Definitions
		const mysql = require('mysql')
		const database = mysql.createConnection(dbinfo)
		
		//initiate the database connection
		database.connect(
			function(err){
				if (err){
					return console.error('Database error: ', err.message)
				}
				console.log('Connected to the MySQL Server')
			}
		)
		

		database.beginTransaction(function(err){
			console.log("Clearing all game data tables")
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
		})





		//Bring in everything we want from the shop files.  These are category_id 6
		database.beginTransaction(function(err) {
			console.log("Getting shop information from game data files")
			if (err) { console.log (err) }	
			try{
				var querystring = "SELECT name FROM gamedata WHERE category_id = 6 AND version = (SELECT MAX(version) FROM gamedata)"
				database.query(querystring, function (err, result, fields) {
					if (err) { console.log(err) }
					shops = result
					shops.forEach(shop => {
						querystring = "SELECT data FROM gamedata WHERE category_id = 6 AND name = '" + shop.name + "' AND version = (SELECT MAX(version) FROM gamedata)"
						database.query(querystring, function (err, result, fields) {
							if (err) { console.log(err) }						
							
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
			console.log("Getting weapon data from game data files")
			if (err) { console.log (err) }	
			try{
				var querystring = "SELECT name FROM gamedata WHERE category_id = 2 AND version = (SELECT MAX(version) FROM gamedata)"
				database.query(querystring, function (err, result, fields) {
					if (err) { console.log(err) }
					weaps = result

					weaps.forEach(weap => {
						querystring = "SELECT data FROM gamedata WHERE category_id = 2 AND name = '" + weap.name + "' AND version = (SELECT MAX(version) FROM gamedata)"
						database.query(querystring, function (err, result, fields) {
							if (err) { console.log(err) }
							
							const weapdata = JSON.parse(result[0].data.toString())
							var Manufacturer
							const keylist = weapdata.Components.SAttachableComponentParams.AttachDef
							
							Object.keys(keylist).forEach(key => {
								if (key.startsWith("SCItemManufacturer")) {
									Manufacturer = keylist[key].Localization.Name
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
							
							console.log("Saving inventory item")
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
			console.log("Getting weapon magazine data from game data files")
			if (err) { console.log (err) }	
			try{
				var querystring = "SELECT name FROM gamedata WHERE category_id = 3 AND version = (SELECT MAX(version) FROM gamedata)"
				database.query(querystring, function (err, result, fields) {
					if (err) { console.log(err) }
					mags = result
					

					mags.forEach(mag => {
						querystring = "SELECT data FROM gamedata WHERE category_id = 3 AND name = '" + mag.name + "' AND version = (SELECT MAX(version) FROM gamedata)"
						database.query(querystring, function (err, result, fields) {
							if (err) { console.log(err) }
							
							const magdata = JSON.parse(result[0].data.toString())
							var Manufacturer
							const keylist = magdata.Components.SAttachableComponentParams.AttachDef
							
							Object.keys(keylist).forEach(key => {
								if (key.startsWith("SCItemManufacturer")) {
									Manufacturer = keylist[key].Localization.Name
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
							
							console.log("Saving inventory item")
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
			console.log("Getting comoddity data from game data files")
			if (err) { console.log (err) }	
			try{
				var querystring = "SELECT name FROM gamedata WHERE category_id = 4 AND version = (SELECT MAX(version) FROM gamedata)"
				database.query(querystring, function (err, result, fields) {
					if (err) { console.log(err) }
					commodities = result
					

					commodities.forEach(commodity => {
						querystring = "SELECT data FROM gamedata WHERE category_id = 4 AND name = '" + commodity.name + "' AND version = (SELECT MAX(version) FROM gamedata)"
						database.query(querystring, function (err, result, fields) {
							if (err) { console.log(err) }
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
							
							console.log("Saving comoddity information")
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
			console.log("Getting manufacturer data from game data files")
			if (err) { console.log (err) }	
			try{
				var querystring = "SELECT name FROM gamedata WHERE category_id = 7 AND version = (SELECT MAX(version) FROM gamedata)"
				database.query(querystring, function (err, result, fields) {
					if (err) { console.log(err) }
					manufacturers = result
					

					manufacturers.forEach(manufacturer => {
						querystring = "SELECT data FROM gamedata WHERE category_id = 7 AND name = '" + manufacturer.name + "' AND version = (SELECT MAX(version) FROM gamedata)"
						database.query(querystring, function (err, result, fields) {
							if (err) { console.log(err) }
							const manufdata = JSON.parse(result[0].data.toString())
			
							var Name = 'Unknown'
							var Description = 'Unknown'
							var ID = manufdata.__ref
							if (manufdata.Localization){
								Name = manufdata.Localization.Name
								Description = manufdata.Localization.Description
							}
							var Code = manufdata.Code
							
							if (Code == ""){ return }
							 
							const regex = /'/gi
							
							Name = Name.replace(regex, "''")
							Description = Description.replace(regex, "''")
							
							console.log("Saving manufacturer informaton for " + Name)
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
			console.log("Getting ship data from game data files")
			if (err) { console.log (err) }	
			try{
				var querystring = "SELECT name FROM gamedata WHERE category_id = 1 AND version = (SELECT MAX(version) FROM gamedata)"
				database.query(querystring, function (err, result, fields) {
					if (err) { console.log(err) }
					ships = result
					

					ships.forEach(ship => {
						querystring = "SELECT data FROM gamedata WHERE category_id = 1 AND name = '" + ship.name + "' AND version = (SELECT MAX(version) FROM gamedata)"
						database.query(querystring, function (err, result, fields) {
							if (err) { console.log(err + " for " + ship.displayname) }
							var shipdata
							try{
							var tmp = result[0].data.toString()
							var tmp2 = tmp.replace(/\.\./g, '0.')
							var shipdatastring = tmp2.replace(/:\./g, ':')
							shipdata = JSON.parse(shipdatastring)
							} catch (error){
								console.log(result[0].data.toString())
								console.log(error.stack)
							}
							const name = shipdata.name
							const displayname = shipdata.displayname
							const size = shipdata.size
							const mass = (shipdata.Parts.Part.mass != undefined ? shipdata.Parts.Part.mass : 0)
							var damagemax = 0
							
							if(Array.isArray(shipdata.Parts.Part)){ return }
							
							const part = shipdata.Parts.Part
							
							
							
							damagemax = updateparts(database, part, displayname, damagemax)
							
							console.log("Saving ship information for " + displayname)
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
	
	console.log("Updating ship parts information for " + name)
	var KEEP = true
	
	//console.log(damagemax)
	
	if (part.damageMax != undefined) {
		console.log(damagemax + " + " + part.damageMax)
		damagemax = damagemax + part.damageMax
		//console.log("Max damage updated (" + damagemax + ")")
	}	
	if (part.damagemax != undefined) {
		damagemax = damagemax + part.damagemax
		//console.log("Max damage updated (" + damagemax + ")")
	}
	
	if (Array.isArray(part)){
		for (let i = 0; i < part.length; i++){
			updateparts(database, part[i], name, damagemax)
		}
	}
		
	if (part.ItemPort != undefined){
		
		if(part.ItemPort.flags != undefined){
			
			var splitflags = part.ItemPort.flags.split(" ")

			for (let i = 0; i < splitflags.length; i++){
				 if (splitflags[i] == "uneditable") {
					KEEP = false
				} 
			}

			if (part.Parts != undefined){
				updateparts(database, part.Parts.Part, name, damagemax)
			} 
			
		} else {
			if (part.Parts != undefined){
				updateparts(database, part.Parts.Part, name, damagemax)
			}
			KEEP = false
		}
	} else {
		KEEP = false
	}
	
	if (part.Parts != undefined){
		updateparts(database, part.Parts.Part, name, damagemax)
	}

	if(KEEP){
		//Here's where we'll put the part data in.
		
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
			console.log("Saving itemport information for " + _shipname)
			var querystring = "INSERT INTO ITEMPORTS (ShipName, PortName, PortType, PortSubtype, MaxSize, MinSize) VALUES ('" +
			_shipname + "', '" +
			_portname + "', '" +
			_porttype + "', '" +
			_portsubtype + "', " +
			_maxsize + ", " +
			_minsize + ")"
			database.query(querystring)
			database.commit()
		})

	}
	return damagemax
}

function updateshop(database, shopnode, shoptype){

	console.log("Updating shop information")
	
	if (Array.isArray(shopnode)){
		for (let i = 0; i < shopnode.length; i++){
			updateshop(database, shopnode[i], shoptype)
		}
	}
	
	if (shopnode.ShopInventoryNodes != undefined && shopnode.ShopInventoryNodes != null){
		const invnode = shopnode.ShopInventoryNodes.ShopInventoryNode
		updateinv(database, invnode, shopnode.ID)
		
		database.beginTransaction(function(err) {
			console.log('Saving shop information for ' + shopnode.Name)
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
		updateshop(database, nextnode, shoptype)
		return
	}
	
}

function updateinv(database, invnode, shopid){

	console.log("Updating shop inventories")
	
	for (let i = 0; i < invnode.length; i++){
		
		database.beginTransaction(function(err) {
			console.log('Saving shop inventory information')
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
	console.log("Updating price information")
	for (let i = 0; i < prices.length; i++){
		
		database.beginTransaction(function(err) {
			var querystring = "UPDATE SHOPINV SET Price = '" + prices[i].Node.BasePrice + "' WHERE InvID = '" + prices[i].Node.ID + "'"
			database.query(querystring)
			database.commit()
		})
	}
}