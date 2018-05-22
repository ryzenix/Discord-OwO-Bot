const requireDir = require('require-dir');
const dir = requireDir('./command',{recurse:true});

const CommandInterface = require('./commandinterface');

const sender = require('../util/sender.js');

const mysql = require('../util/mysql.js');
const con = mysql.con;
const global = require('../util/global.js');

const macro = require('../util/macro.js');
const ban = require('../util/ban.js');


const prefix = 'owo';

//Commands (including alias)
var commands = {};
//Change alias to main command name
var aliasToCommand = {};
//Only main command names
var mcommands = {};
//Admin commands
var adminCommands = {};

class Command {

	//Grabs all commands in ./command/
	constructor(Client){
		this.client = Client;
		global.client(Client);
		sender.client(Client);
		global.con(con);
		macro.con(con);
		for(var key in dir){
			if(dir[key] instanceof CommandInterface)
				addCommand(dir[key]);
			else
				for(var key2 in dir[key])
					if(dir[key][key2] instanceof CommandInterface)
						addCommand(dir[key][key2]);
		}
		macro.commands(mcommands);
	}

	execute(msg){
		//Gets command arguments
		var args;
		if(msg.content.toLowerCase().indexOf(prefix) === 0)
			args = msg.content.slice(prefix.length).trim().split(/ +/g);
		else{
			if(msg.content.toLowerCase().includes('owo')||msg.content.toLowerCase().includes('uwu')){
				param.command = "points";
				param.args = [];
				executeCommand(param);
			}
			return;
		}

		//Get command name
		var command = args.shift().toLowerCase();

		//Init params to pass into command
		var param = initParam(msg,command,args);

		//Execute the command
		if(commands[command]){
			executeCommand(param);
		}else{
			param.command = "points";
			param.args = [];
			executeCommand(param);
		}
	}

	executeAdmin(msg){
		var args;
		if(msg.content.toLowerCase().indexOf(prefix) === 0)
			args = msg.content.slice(prefix.length).trim().split(/ +/g);
		else return;
		var command = args.shift().toLowerCase();
		
		var param = initParam(msg,command,args);

		if(msg.channel.type==="dm"){
			if(adminCommands[command]&&adminCommands[command].dm)
				adminCommands[command].execute(param);
		}else{
			if(adminCommands[command]&&!adminCommands[command].dm)
				adminCommands[command].execute(param);
			else
				this.execute(msg);
		}
	}

}

function addCommand(command){
	var alias = command.alias;
	var name = alias[0];
	if(command.admin){
		for(var i=0;i<alias.length;i++){
			adminCommands[alias[i]] = command;
		}
		return;
	}
	if(alias){
		for(var i=0;i<alias.length;i++){
			commands[alias[i]] = command;
			if(command.distinctAlias){
				aliasToCommand[alias[i]] = alias[i];
				mcommands[alias[i]] = {cd:command.cooldown,ban:12,half:command.half,six:command.six};
			}else
				aliasToCommand[alias[i]] = name;
		}
	}
	if(!command.distinctAlias)
		mcommands[name] = {cd:command.cooldown,ban:12,half:command.half,six:command.six};
}

function executeCommand(param){
	var command = param.command;
	var msg = param.msg;
	var name = aliasToCommand[command];
	ban.check(con,msg,name,function(){
		macro.check(msg,aliasToCommand[command],async function(){
			await commands[command].execute(param);
			//log here
			console.log(aliasToCommand[param.command]);
			//user requests help of a command
			//if(param.help)
		});
	},false);
}

function initParam(msg,command,args){
	var param = {
		"msg":msg,
		"args":args,
		"command":command,
		"client":this.client,
		"mysql":mysql,
		"con":con,
		"send":sender.send(msg),
		"global":global,
		"aliasToCommand":aliasToCommand,
		"commands":commands,
		"mcommands":mcommands
	};
	return param;
}
module.exports = Command;
