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
var db_guild_id = "477696531420676096";
var my_guild;
var db_guild;
var user_info_id = "477697727220809738";
var user_info_channel;
var erased = 0;

client.prefix = "rady";
client.color = [0, 174, 219];

var has_been_verified = [];
// Encrypt Function
function EncryptMD5(str){
    return CryptoJS.MD5(str).toString();
}
// Functions
var download = function(uri, filename, callback){
    request.head(uri, function(err, res, body){
      request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
    });
  };

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
                    if (current_member.roles.has(awaiting_role)){
                        member.kick();
                    }
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
function find_role_by_name(role_name){
    var to_return;
    my_guild.roles.forEach(function(rl){
        if (rl.name.toLowerCase() === role_name.toLowerCase()){
            to_return = rl;
        }
    });
    return to_return;
}
function get_color_names(){
    try{
        var roles_list = my_guild.roles.sort((a, b) => (b.calculatedPosition - a.calculatedPosition)).map(r => r.name);
        var start_index = roles_list.indexOf("Color - Begin") + 1;
        var end_index = roles_list.indexOf("Color - End");
        var color_list = [];
        for(var i = start_index; i < end_index; i++){
            color_list.push(roles_list[i]);
        }
        color_list.sort((a, b) => a.localeCompare(b));
        return color_list;
    }catch(ex){

    }
}
function find_user_load_db(message, channel){
    var userid = message.author.id;
    try{
        channel.fetchMessages().then(messages => {
            var mm = messages.map(mm => mm.content);
            var desc = "none";
            for (var i = 0;i < mm.length; i++){
                if (mm[i].startsWith(userid)){
                    to_return = mm[i].substring(userid.length + 1, mm[i].length);
                    desc = to_return;
                }
            }
            const embed = new Discord.RichEmbed()
                .setTitle(`${message.author.username}'s profile`)
                .setColor(client.color)

                .setThumbnail(message.author.avatarURL)
                .addField("Description", desc);
            message.channel.send({embed});
        })
    }catch(ex){

    }
}
function find_user_change_db(message, channel, edited_message){
    var userid = message.author.id;
    try{
        channel.fetchMessages().then(messages => {
            var mm = messages.array();
            for (var i = 0;i < mm.length; i++){
                console.log(mm[i].content);
                if (mm[i].content.startsWith(userid)){
                    to_return = mm[i].content.substring(userid.length + 1, mm[i].content.length);
                    mm[i].delete();
                }
            }
            channel.send(userid + " " + edited_message);
        });
    }catch(ex){
        console.log(ex.toString());
    }
}
function user_condition(memb, username){
    if (memb.user.username.toLowerCase().startsWith(username)){
        return true;
    }
    if (memb.nickname != undefined){
        if (memb.nickname.toLowerCase().startsWith(username)){
            return true;
        }
    }
    return false;
}
// Bot Events
client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    my_guild = client.guilds.find("id", my_guild_id);
    db_guild = client.guilds.find("id", db_guild_id);
    verified_role = my_guild.roles.find("name", "Verified");
    awaiting_role = my_guild.roles.find("name", "Waiting");
    user_info_channel = db_guild.channels.get(user_info_id);
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
    if (!message.content.toLowerCase().startsWith(client.prefix)) return;
    var msg = message.content.split(/\s+/g);
    var args = [];
    var cmd;
    if (msg.length > 1){
        cmd = msg[1].toLowerCase();
    }
    if (msg.length > 2){
        args = msg.splice(2);
    }
    for(var i = 0; i < args.length; i++){
        args[i] = args[i].toLowerCase();
    }
    // Run commands
    if (cmd === "avatar"){
        var correct_user = message.author;
        var member;
        try{
            member = message.mentions.members.first();
        }catch(exx){
            
        }
        if (member != null){
            correct_user = member.user;
        }else if (args.length === 0){
            correct_user = message.author;
        }else{
            var this_username = message.content.substring((client.prefix + " avatar ").length, message.content.length).toLowerCase();
            var found_members = message.guild.members.filter(x => user_condition(x, this_username));
            if (found_members.array().length > 0){
                correct_user = found_members.array()[0].user;
            }
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
    if (cmd === "color"){
        if (args.length === 0){
            // Show color role list
            const embed = new Discord.RichEmbed()
                .setTitle("Choose your color")
                .setDescription(get_color_names().join(", "))
                .setColor(client.color)

                .addField("Usage", "Type in `Rady color <color>`");
            message.channel.send({embed});
        }else{
            var this_color = args.join(" ");
            var color_list = get_color_names();
            var color_list_lower = color_list;
            for(var i = 0; i < color_list.length; i++){
                color_list_lower[i] = color_list[i].toLowerCase();
            }
            if (color_list_lower.indexOf(this_color.toLowerCase()) !== -1){
                var color_role = find_role_by_name(this_color);
                for(var i = 0; i < color_list.length; i++){
                    var temp_color_role = find_role_by_name(color_list[i]);
                    try{
                        message.member.removeRole(temp_color_role);
                    }catch(exx){

                    }
                }
                message.member.addRole(color_role);
            }
        }
    }
    if (cmd === "setinfo"){
        var to_save = message.content.substring((client.prefix + " setinfo ").length, message.content.length);
        find_user_change_db(message, user_info_channel, to_save);
    }
    if (cmd === "profile"){
        find_user_load_db(message, user_info_channel)
    }
});

client.on("guildMemberAdd" ,(member) => {
    queue_await_member.push(member.user.id);
});

client.login(process.env.BOT_TOKEN);
