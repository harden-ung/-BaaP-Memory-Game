'use strict';
//IIFE so that one cannot access variables from Chrome Inspect
(()=>{
    // declair constants 
    const CONST = {
        BOARD_SIZE: 16,
        CARDS_PER_ROW: 4,
        CARD_INVISIBLE: "oi-aperture",
        GAME_STATE: {
            NO_TURNED_CARD: 0,
            ONE_TURNED_CARD: 1,
            GAME_OVER: 3
        },
        CARD_STATE: {
            IN_GAME: 0,
            OPENED: 1
        },
        TURN_INVISIBLE_DELAY: 150
    }
    //class MemoryCard to create card objects
    class MemoryCard {
        constructor(id, gameController) {
            this.id = id;
            this.element = document.getElementById("card-" + id);
            this.span = this.element.getElementsByTagName("span")[0];
            this.gameController = gameController;
            this.iconClass = "";
            this.state = CONST.CARD_STATE.IN_GAME;
            //one trick offent used in React to help bind this to object of class MemoryCard instead of this to event object
            this.onClickhandler = this.onClickhandler.bind(this);
        }
        onClickhandler(e) {
            if (this.gameController.state === CONST.GAME_STATE.TWO_TURNED_CARDS) return;
            if (this.state === CONST.CARD_STATE.IN_GAME) {
                this.gameController.turnCard(this.id);
            }
        }
        turnVisible() {
            this.span.classList.remove(CONST.CARD_INVISIBLE,"text-danger");
            this.span.classList.add(this.iconClass,"text-primary");
            this.element.classList.add("animated", "flipInX");
            this.state = CONST.CARD_STATE.OPENED;
        }
        turnInvisible() {
            this.element.classList.remove("flipInX");
            this.element.classList.add("flipOutX");
            this.promise = new Promise((resolve, reject) => {
                this.element.addEventListener("animationend", () => {
                    this.span.classList.remove(this.iconClass);
                    this.element.classList.remove("animated", "flipOutX")
                    this.span.classList.add(CONST.CARD_INVISIBLE,"text-danger");
                    resolve();
                }, { once: true });
            });
            this.state = CONST.CARD_STATE.IN_GAME;
        }
        getIcon() {
            return this.iconClass;
        }
        setIcon(x) {
            this.iconClass = ICONNAMES[x];
        }
    }
    class MemoryGame {
        constructor(size, cardsPerRow) {
            this.nbrOfCards = size;
            this.cardsPerRow = cardsPerRow;
            this.cards = [];
            this.firstCard = undefined;
            this.secondCard = undefined;
            this.state = CONST.GAME_STATE.NO_TURNED_CARD;
            this.moveCount = 0;
            this.secondPlay = -1;
            this.foundPairs = 0;
            this.playTimeInterval;
        }
        inittialize() {
            this.addDefaultHighScore();
            this.createDivs();
            this.setEventListeners();
            this.setIconClassToCards();
        }
        addDefaultHighScore(){
            //add 3 default highscore
            if(localStorage.getItem("highscore") === null){     
                localStorage.setItem("highscore", JSON.stringify([{ turn: this.nbrOfCards / 2 + 5, time: 20 }, { turn: this.nbrOfCards / 2 + 10, time: 36 }, { turn: this.nbrOfCards / 2 + 13, time: 30 }]));
            }
        }
        gameEnd(){
            clearInterval(this.playTimeInterval);      
            document.getElementById("yourScore").innerText = `You finish the game with ${this.moveCount} moves in ${this.toMinuteAndSecond(this.secondPlay)}.`;
            this.setHighscore();
            this.getHighScore();
            this.showModal();
        }
        setHighscore(){
            //assign temporary score object
            let tempScoreObject = { turn: this.moveCount, time: this.secondPlay };
            //assign savedScoreArray
            let savedScoreArray = JSON.parse(localStorage.getItem("highscore"));
            savedScoreArray.push(tempScoreObject);
            //set highscore
            //sort array by turn and time
            let newHighscoreArray = savedScoreArray.sort((arr, cur) => {
                //loop through arr and curent value, swap if arr turn < cur turn
                if (arr.turn < cur.turn) return -1;
                if (arr.turn > cur.turn) return 1;
                // if arr.turn === cur.turn, swap if arr.time < cur.time
                if (arr.time < cur.time) return -1;
                if (arr.time > cur.time) return 1;
            }).slice(0, 3);
            localStorage.setItem("highscore", JSON.stringify(newHighscoreArray));
        }
        getHighScore(){
            //show 3 highscores         
            document.getElementById("highScore1").innerHTML = `#1 ${JSON.parse(localStorage.getItem("highscore"))[0].turn} moves ${this.toMinuteAndSecond(JSON.parse(localStorage.getItem("highscore"))[0].time)}`;
            document.getElementById("highScore2").innerHTML = `#2 ${JSON.parse(localStorage.getItem("highscore"))[1].turn} moves ${this.toMinuteAndSecond(JSON.parse(localStorage.getItem("highscore"))[1].time)}`;
            document.getElementById("highScore3").innerHTML = `#3 ${JSON.parse(localStorage.getItem("highscore"))[2].turn} moves ${this.toMinuteAndSecond(JSON.parse(localStorage.getItem("highscore"))[2].time)}`;
        }
        showModal(){
            //display modal
            let modalElement = document.getElementById("highScoreModal");
            modalElement.style.display = "block";
            //add listener for buttons
            let closeBtn = document.getElementById("closeModal");
            let replayBtn = document.getElementById("replay");
            closeBtn.addEventListener("click", () => {
                modalElement.style.display = "none";
            })
            replayBtn.addEventListener("click", () => {
                modalElement.style.display = "none";
                location.reload();
            })
        }
        toMinuteAndSecond(second){
            let minute = Math.floor(second / 60);
            second -= minute*60;
            if (minute === 0){
                return `${second}s`;
            } else return `${minute}'${second}s`

        }
        setPlayTime(){
            if(this.state === CONST.GAME_STATE.GAME_OVER) return;
            //use arrowFunction here so that this here is MemoryGame object. Otherwise, it will be HTML document.getElementById object
            this.playTimeInterval = setInterval(() => {         
                this.secondPlay++;  
                document.getElementById("play-time").innerText = `Playtime: ${this.toMinuteAndSecond(this.secondPlay)}`;               
            }, 1000);
        }
        setIconClassToCards() {
            let x, y;
            for (let i = 0; i < this.nbrOfCards / 2; i++) {
                x = Math.floor(Math.random() * this.nbrOfCards);
                y = Math.floor(Math.random() * this.nbrOfCards);

                //set icon immediately after find next uninitialized icon class index otherwise there will be bugs that one element may not have iconClass
                x = this.getNextUninitializedIconClassIndex(x);
                this.cards[x].setIcon(i);
                y = this.getNextUninitializedIconClassIndex(y);  
                this.cards[y].setIcon(i);
            }
        }
        getNextUninitializedIconClassIndex(x) {
            for (let i = 0; i < this.nbrOfCards; i++) {
                let n = (x + i) % this.nbrOfCards;
                if (this.cards[n].getIcon() === "")
                    return n;
            }
            throw ("Error");//should not reach
        }
        setEventListeners() {
            for (let i = 0; i < this.nbrOfCards; i++) {
                this.cards[i] = new MemoryCard(i, this);
                //this.cards refer to array cards in MemoryGame
                this.cards[i].element.addEventListener("click", this.cards[i].onClickhandler);
            }
        }
        createRow(id) {
            let divRow = document.createElement("div");
            divRow.id = "row-" + id;
            divRow.classList.add("row");
            return divRow;
        }
        createCard(id) {
            let divCard = document.createElement("div");
            divCard.id = "card-" + id;
            divCard.classList.add("col-sm" , "card");
            return divCard;
        }
        createCardBody() {
            let divCardBody = document.createElement("div");
            divCardBody.classList.add("card-body");
            return divCardBody;
        }
        createIcon(id) {
            let iconSpan = document.createElement("span");
            iconSpan.id = "span-" + id;
            iconSpan.classList.add("oi", "text-danger");
            iconSpan.classList.add(CONST.CARD_INVISIBLE);
            return iconSpan;
        }
        createDivs() {
            let i, j;
            let cardId = 0;
            let rowElement, cardElement, cardBodyElement, iconElement;
            for (i = 0; i < this.nbrOfCards / this.cardsPerRow; i++) {
                rowElement = this.createRow(i);
                for (j = 0; j < this.cardsPerRow; j++) {
                    cardId = j + i * this.cardsPerRow;
                    cardElement = this.createCard(cardId);
                    cardBodyElement = this.createCardBody();
                    iconElement = this.createIcon(cardId);
                    cardBodyElement.appendChild(iconElement);
                    cardElement.appendChild(cardBodyElement);
                    rowElement.appendChild(cardElement);
                }
                document.getElementById("game-content").appendChild(rowElement);
            }
        }
        turnCard(id) {
            if (this.secondPlay === -1){
                this.secondPlay = 0;
                this.setPlayTime();
            }
            switch (this.state) {
                case CONST.GAME_STATE.NO_TURNED_CARD:
                    this.firstCard = this.cards[id];
                    this.firstCard.turnVisible();
                    this.state = CONST.GAME_STATE.ONE_TURNED_CARD;
                    break;
                case CONST.GAME_STATE.ONE_TURNED_CARD:
                    if (this.id === this.firstCard.id) break;
                    this.secondCard = this.cards[id];
                    this.secondCard.turnVisible();

                    this.state = CONST.GAME_STATE.TWO_TURNED_CARDS;
                    //move counter by +1
                    document.getElementById("turn-count").innerText = `Turns: ${++this.moveCount}`;

                    //if cards does not match
                    if (this.firstCard.getIcon() !== this.secondCard.getIcon()) {
                        setTimeout(() => {
                            this.firstCard.turnInvisible();
                            this.secondCard.turnInvisible();
                            Promise.all([this.firstCard.promise, this.secondCard.promise]).then(() => {
                                this.state = CONST.GAME_STATE.NO_TURNED_CARD;
                                this.firstCard.promise = new Promise(() => 0);
                                this.secondCard.promise = new Promise(() => 0);
                            })
                        }, CONST.TURN_INVISIBLE_DELAY);
                    } else { //cards match
                        this.firstCard.element.classList.add("card-done");
                        this.secondCard.element.classList.add("card-done");
                        this.firstCard.element.removeEventListener("click", this.firstCard.onClickhandler);
                        this.secondCard.element.removeEventListener("click", this.secondCard.onClickhandler);
                        this.foundPairs +=1;
                        //update progress bar
                        document.getElementById("progress-bar").style.width = (this.foundPairs * 100 /(this.nbrOfCards/2) + "%");
                        if (this.foundPairs === this.nbrOfCards/2){
                            this.state = CONST.GAME_STATE.GAME_OVER;
                            this.gameEnd();
                        }
                        else {
                            this.state = CONST.GAME_STATE.NO_TURNED_CARD;
                        }
                    }
                    break;
                default:
                    break;
            }
        }
    }
    let memoryGame = new MemoryGame(CONST.BOARD_SIZE, CONST.CARDS_PER_ROW);
    memoryGame.inittialize();
})()
