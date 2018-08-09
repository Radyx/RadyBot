// Library
const Discord = require('discord.js');
const client = new Discord.Client();
const CryptoJS = require("crypto-js");

// Default Variables
var awaiting_channel = "471830779354284033";
var password_channel = "471740361950232627";
var password = process.env.PASSWORD;

var queue_await_member = [];

// Settings
var verified_role;
var awaiting_role;
var my_guild_id = process.env.GUILD_ID;
var my_guild;

client.prefix = "rady";
client.color = [0, 174, 219];

var has_been_verified = [];
// Encrypt Function
function EncryptMD5(str){
    return CryptoJS.MD5(str).toString();
}

// Bot Functions
function verify_member(mb){
    try{
        mb.addRole(verified_role);
    }catch(ex){
        console.log(ex);
    }
}

function make_member_await(mb){
    try{
        mb.addRole(awaiting_role);
    }catch(ex){
        console.log(ex);
    }
}

function remove_awaiting_role(mb){
    try{
        mb.removeRole(awaiting_role);
    }catch(ex){
        console.log(ex);
    }
}

function queue_pop(){
    var new_queue = [];
    for (var i = 1; i < queue_await_member.length; i++){
        new_queue.push(queue_await_member[i]);
    }
    queue_await_member = new_queue;
}
function queue_front(){
    return queue_await_member[0];
}
function queue_is_empty(){
    return (queue_await_member.length === 0);
}
function find_member_by_name(user_name){
    var to_return;
    my_guild.members.forEach(function (memb) {
        if (memb.user.username.toLowerCase().startsWith(user_name)){
            to_return = memb.user;
        }
        if (memb.nickname != undefined){
            if (memb.nickname.toLowerCase().startsWith(user_name)){
                to_return = memb.user;
            }
        }
    });
    return to_return;
}
function await_new_mb(){
    if (!queue_is_empty()){
        var current_member = queue_front();
        queue_pop();
        var member = my_guild.members.get(current_member);
        make_member_await(member);
        setTimeout(function(){
            try{
                if (has_been_verified.indexOf(current_member) === -1){
                    member.kick();
                    has_been_verified.splice(queue_await_member.indexOf(member.user.id), 1);
                    await_new_mb();
                }
            }catch(ex){
                console.log(ex);
            }
        }, 30000);
    }else{
        if (my_guild != null){
            my_guild.members.forEach(function (memb) {
                if (memb.roles.size === 1){
                    queue_await_member.push(memb.user.id);
                }
            }); 
        }
        setTimeout(function(){
            await_new_mb();
        }, 1000);
    }
}
// Bot Events
client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    my_guild = client.guilds.find("id", "471736146473517057");
    verified_role = my_guild.roles.find("name", "Verified");
    awaiting_role = my_guild.roles.find("name", "Waiting");
    await_new_mb();
});

client.on('message', message => {
    // Ignore messages that aren't from the server

    if (message.channel.type !== "text") return;

    if (message.author.bot === true) return;

    if (message.guild.id != my_guild_id) return;

    if (message.channel.id === password_channel){

        has_been_verified.push(message.author.id);

        if (EncryptMD5(message.content) === password){

            // Password is OK
            verify_member(message.member);
            remove_awaiting_role(message.member);
            await_new_mb();

        }else{

            // Wrong Password
            try{
                message.member.kick("Wrong Password!");
                await_new_mb();
            }catch(ex){
                console.log(ex);
            }
        }
        try{
            message.delete();
        }catch(ex){
            console.log(ex);
        }
    }
    // Ignore if it doesn't start with bot prefix
    if (!message.content.startsWith(client.prefix)) return;
    var msg = message.content.split(/\s+/g);
    if (msg.length > 1){
        cmd = msg[1].toLowerCase();
    }
    // Run commands
    if (cmd === "avatar"){
        var correct_user = message.author;
        var member = message.mentions.members.first();
        if (member){
            correct_user = member.user;
        }else if (msg.length === 2){
            correct_user = message.author;
        }else{
            var this_username = message.content.substring((client.prefix + " avatar ").length, message.content.length).toLowerCase();
            correct_user = find_member_by_name(this_username);
        }
        if (correct_user){
            const embed = new Discord.RichEmbed()
                .setTitle("Download Image!")
                .setDescription(correct_user.tag)
                .setURL(correct_user.avatarURL)
                .setColor(client.color)
                .setImage(correct_user.avatarURL);
            message.channel.send({embed});
        }
    }
  }
});

client.on("guildMemberAdd" ,(member) => {
    queue_await_member.push(member.user.id);
});

client.login(process.env.BOT_TOKEN);
