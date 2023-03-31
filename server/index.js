const express = require('express');
const http = require('http');
const cors = require("cors");
const {Server} = require('socket.io');

const Game = require('./components/game')
const Player = require('./components/player')

const app = express();
app.use(cors);

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
    }
});

io.on("connection", (socket) => {
    console.log(`User Connected: ${socket.id}`);
    console.log(io.engine.clientsCount)
  
    socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.id}`);
        console.log(io.engine.clientsCount)
    });

    socket.on("session_id", (data) => {
        console.log(" belongs to " +data)
    });


    socket.on("join_room", async (data, callback) => {
        await joinGame(data, socket) 
        callback()
    });

    socket.on("start_game", (data) => {
        startGame(data, socket) 
    });

    socket.on("create_game", (data) => {
        
        createGame(data);
    });


});

function createGame(data){
    let newGame = new Game();


    newGame.createGame(data);

    newGame.saveGame();
}

async function startGame(data, socket){

    let newGame = new Game()
    await newGame.fetchGame(data.gameId)
 
    let playerObejctArray = await newGame.startGame();

    for(let i = 0; i < playerObejctArray.length; i++){
        const player = playerObejctArray[i]
      
        io.to(player.socketId).emit("error_popup", {
            playerCards : player.cards, 
            playerPoints : 20,
            trumpCard: "H_A"
        })
    }


    newGame.updateGame();
}

async function joinGame(data, socket){
    let newGame = new Game();

    try{
        await newGame.fetchGame(data.gameId);
    }catch(e){
        socket.emit("error_popup", "WRONG CODE ERORR!!!");
        return;
    }

    if(!newGame.maxPlayersReached()){
        await newGame.joinGame(data, socket.id);

    }else{
        let newPlayer = new Player(data.sessionId, data.gameId, socket.id);

        newPlayer.playerId = await newPlayer.doesPlayerExist(); 

        if(newPlayer.playerId){
            newPlayer.updatePlayer(); 
        }else{
            socket.emit("error_popup", "GAME FULL ERROR");
            return;  
        } 
    }

    socket.join(data.gameId);
}



/* async function test(){
    
    let newGame = new Game();


    await newGame.fetchGame("2PGU04");



    let playerObejctArray = await newGame.startGame();
    console.log("Test")

    for(let i = 0; i < playerObejctArray.length; i++){
        const player = playerObejctArray[i]
        console.log(player.socketId, player.cards)
        io.on("connection", (socket) => {
            socket.to(player.socketId).emit("error_popup", JSON.stringify(player.cards))
        });
    }

    newGame.updateGame();

}

test() */

server.listen(8800, () =>{
    console.log("SERVER IS RUNNING...")
})