const express=require('express');
const ejs=require('ejs');
const expressLayout=require('express-ejs-layouts');
const path=require('path');
const mongoose=require('mongoose');
const bodyParser=require("body-parser");
const dotenv = require('dotenv');
const session =require('express-session');
const flash= require('express-flash');
const MongoDbStore=require('connect-mongo');
const passport = require('passport');
const Emitter = require('events');

dotenv.config();
const app=express();

app.use(bodyParser.urlencoded({extended:true}));

const DATABASE_URL=process.env.DATABASE_URL;
const CONFIG={
    usenewUrlParser:true,
    useUnifiedTopology:true,
    // useCreateIndex: true,
    // useFindAndModify:true
}
mongoose.connect(DATABASE_URL,CONFIG);
const connection=mongoose.connection;
connection.once('open',()=>{
    console.log("Database connected...");
}).on('err',() =>{
    console.log('Connection failed...')
});

// //Assests
// app.use(express.static('public'));

// app.use(express.urlencoded({extended:false}));

// app.use(express.json());

//session store
// let mongoStore= new MongoDbStore({
//     mongooseConnection: connection,
//     collection:'sessions'
// })

// event emitter
const eventEmitter= new Emitter()
app.set('eventEmitter', eventEmitter)
//session config
app.use(session({
    secret: process.env.COOKIE_SECRET,
    resave: false,
    store: MongoDbStore.create({
        mongoUrl: DATABASE_URL
    }),
    saveUninitialized: false, 
    cookie: {maxAge: 1000*60*60*24} //24hr
}))

//passport config
const passportInit = require('./app/config/passport');
const { Socket } = require('dgram');
passportInit(passport);
app.use(passport.initialize());
app.use(passport.session());

app.use(flash())

//Assests
app.use(express.static('public'));

app.use(express.urlencoded({extended:false}));

app.use(express.json());

//global middleware
app.use((req,res,next)=>{
    res.locals.session= req.session;
    res.locals.user= req.user;
    next();
})


//set template engine
app.use(expressLayout);
app.set('views',path.join(__dirname,'/resources/views'));
app.set('view engine','ejs');

require('./routes/web')(app);
app.use((req,res)=>{
    res.status(404).render('errors/404')
})

const PORT=process.env.PORT || 3000
const server=app.listen(PORT,()=>{
    console.log(`Server on port ${PORT}...`);
})

// Socket

const io = require('socket.io')(server)
io.on('connection', (socket)=>{
    // join
    // console.log(socket.id)
    socket.on('join', (roomName)=>{
        console.log(roomName)  //join method of event, emitted by client
        socket.join(roomName)   //join method of socket
    })
})

eventEmitter.on('orderUpdated',(data)=>{
    io.to(`order_${data.id}`).emit('orderUpdated',data)
})

eventEmitter.on('orderPlaced',(data)=>{
    io.to('adminRoom').emit('orderPlaced',data)
})
