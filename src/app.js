// app.js
'use strict';
console.log("app starting...");
//IIFE so that one cannot access variables from Chrome Inspect
(()=>{
    //declair constants 
    const CONST = {
        BOARD_SIZE: 20,
        CARDS_PER_ROW: 4,
        CARD_INVISIBLE: "oi-aperture",
        GAME_STATE: {
            NO_TURNED_CARD: 0,
            ONE_TURNED_CARD: 1,
            TWO_TURNED_CARDS: 2,
            GAME_OVER: 3
        },
        CARD_STATE: {
            IN_GAME: 0,
            OPENED: 1
        },
        TURN_INVISIBLE_DELAY: 700
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
                //checking purposes if this work as intended
                // console.log(this);
                // console.log("card " + this.id + " clicked");
            }
        }
        turnVisible() {
            this.span.classList.remove(CONST.CARD_INVISIBLE);
            this.span.classList.add(this.iconClass);
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
                    this.span.classList.add(CONST.CARD_INVISIBLE);
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
            this.timePlay = -1;
        }
        inittialize() {
            this.createDivs();
            this.setEventListeners();
            this.setIconClassToCards();
        }
        setPlayTime(){
            if(this.state === CONST.GAME_STATE.GAME_OVER) return;
            //use arrowFunction here so that this here is MemoryGame object. Otherwise, it will be HTML document.getElementById object
            let m = 0;
            setInterval(() => {
                let timeString = "";
                if (this.timePlay === 60){
                    m++;
                    this.timePlay = 0;
                }
                if (m === 0 ){timeString = `Playtime: ${++this.timePlay} s`;} 
                else {timeString = `Playtime: ${m} ' ${++this.timePlay} s`;}           
                document.getElementById("play-time").innerText = timeString
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
            iconSpan.classList.add("oi", "text-primary");
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
            if (this.timePlay === -1){
                this.timePlay = 0;
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
                    document.getElementById("turn-count").innerText = ++this.moveCount;

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
                        this.state = CONST.GAME_STATE.NO_TURNED_CARD;
                    }
                    break;
                case CONST.GAME_STATE.TWO_TURNED_CARDS:
                    break
                default:
                    break;
            }
        }
    }

    let memoryGame = new MemoryGame(CONST.BOARD_SIZE, CONST.CARDS_PER_ROW);

    memoryGame.inittialize();
})()
