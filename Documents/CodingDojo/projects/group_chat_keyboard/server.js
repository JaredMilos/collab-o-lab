const express = require('express');
const app = express();

var path = require("path");
app.use(express.static(__dirname + "/static"));

const server = app.listen(1337);
console.log("Listening on port 1337")
const io = require('socket.io')(server);

var bodyParser  = require('body-parser');

var session = require('express-session')
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true }
  }));

var user_array = [];
var chat_log = "";
var connected_user_count = 0;

function findObjectByAttribute (items, attribute, value) {
    for (var i = 0; i < items.length; i++) {
      if (items[i][attribute] === value) {
        return items[i].user_name;
      }
    }
    return null;
};

app.set('views', path.join(__dirname, './views'));
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', function(req, res) {
    sid = req.sessionID;
    res.render("index");
   })

io.on('connection', function (socket) {
    connected_user_count += 1;
    console.log("Current users:", connected_user_count);
    socket.emit('greeting', { msg: "Yo, we're connected. -Server" }); 

    socket.on('new_screen', function() {
        socket.emit('new_screen', chat_log)
    })

    socket.on('new_user', function(name) {
        new_user = {user_name: name, user_id: sid};
        console.log(name, "has entered the ring!");
        user_array.push(new_user);
        socket.emit('render_users', sid);
    });

    socket.on('new_message', function(data) {
        var current_user = findObjectByAttribute(user_array, 'user_id', data.id);
        var output_data = {message_sender: current_user, message: data.msg, id: data.id}
        server_log = '<b class="blue_text">'+current_user+':</b> '+data.msg+'<br><br>'
        chat_log = chat_log+server_log; 
        io.emit('render_chat', output_data);
    });

    socket.on('note_play', function(data) {
        io.emit('note_play', data);
    })

    socket.on('note_off', function(data) {
        io.emit('note_off', data);
    })

    socket.on('thank_you', function() {
    });

    socket.on('disconnect',function(){
        connected_user_count -= 1;
        console.log("Current users:", connected_user_count);
        if (connected_user_count < 1) {
            chat_log = '';
            console.log("Server log flushed");
        }
    });
});