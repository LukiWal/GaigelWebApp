const db = require('../mySqlConnection');

class Player{
    constructor(sessionId, gameId, socketId){
        this.playerId = null
        this.sessionId = sessionId
        this.gameId = gameId
        this.socketId = socketId
        this.points = null
        this.cards = null
        this.trick = false
        this.meldedCards = []
    }

    removeCard(card){
        const index = this.cards.indexOf(card);
        if (index > -1) { // only splice array when item is found
            this.cards.splice(index, 1);
        } else{
            return false;
        }
    }

    addCard(newCard){
        this.cards = this.cards.concat(newCard);
    }

    playerMeldCard(card, trump){
        const [card1Color, card1Value] = card.split(":").pop().split('_');

        const [trumpColor, trumpValue] = trump.split(":").pop().split('_');

        this.cards.forEach(cardPlayerDeck => {
                const [card2Color, card2Value] = cardPlayerDeck.split(":").pop().split('_');
                if(card1Color == card2Color && !this.meldedCards.includes(card) && !this.meldedCards.includes(cardPlayerDeck)){
                    if(card1Value == "O" && card2Value == "K" || card2Value == "O" && card1Value == "K"){
                        this.meldedCards.push(cardPlayerDeck, card);
                        if(trumpColor == card1Color){
                            this.points += 40;
                            return 40;
                        } else{
                            this.points += 20;
                            return 20;
                        }
                    }
                }
            }
        )

        return false;
        
    }

    doesPlayerHaveCard(card){
        return this.cards.includes(card);
    }

    async doesPlayerExist(){
        const sql = "SELECT playerId FROM players WHERE sessionId='" +this.sessionId +"' AND gameId='" +this.gameId +"';"
       
        try{
            const id = await db.promise(sql);
       
            return id[0].playerId;
        }catch(e){
            return false;
        }
    }

    async fetchPlayerById(playerId){
        
        const sql = "SELECT * FROM `players` WHERE `playerId`='" +playerId +"'"
     
        let data = await db.promise(sql);

        
        this.playerId = data[0].playerId;
        this.sessionId = data[0].sessionId
        this.gameId = data[0].gameId
        this.socketId = data[0].socketId
        this.points = data[0].points
        this.cards = JSON.parse(data[0].cards)
        this.trick = data[0].trick
        this.meldedCards = JSON.parse(data[0].meldedCards)
        if(this.playerId != null){
            return("done");
        } else{
            throw Error('Nope. Try again.'); 
        }
        
    }

    async savePlayerAndGetId(){
        const sql = "INSERT INTO players (`sessionId`,`gameId`,`socketId`) VALUES (?);"
        
        const values = [
            this.sessionId,
            this.gameId,
            this.socketId
        ]

        const result = await db.promiseInsert(sql, values);
        return result.insertId;
    }

    async updatePlayer(){
        const sql = "UPDATE players SET ? WHERE playerId = ?"
        let values = {
            sessionId : this.sessionId,
            gameId : this.gameId,
            socketId: this.socketId,
            trick: this.trick
        }

        if(this.cards){
            values.cards = JSON.stringify(this.cards) 
        }

        if(this.meldedCards){
            values.meldedCards = JSON.stringify(this.meldedCards) 
        }

        if(this.points){
            values.points = this.points
        }
           
        await db.promiseUpdate(sql, [values, this.playerId]);
    }
}

module.exports = Player