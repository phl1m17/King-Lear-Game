const sizes = {
    width: 1200,
    height: 600,
}

const speedDown = 300

class GameScene extends Phaser.Scene {
    constructor() {
        super("scene-game")

        this.player
        this.cursors
        this.playerSpeed = 400

        this.mapGrid = [
            ["scene1", "main", "scene2"],
            [null, "finalScene", null]
        ]

        this.mapX = 1
        this.mapY = 0

        this.currentBackground
        this.npcList = []
        this.npcMap = {}
        this.npcPositions = {}
        this.isTalking = false
        this.hasInteractedWith = new Set()
        this.chair

        this.npcData = [
            { name: "edmund", coords: null, pos: null },
            { name: "gloucester", coords: null, pos: null },
            { name: "regan", coords: "2,0", pos: { x: sizes.width/2 + 120, y: sizes.height/2 } },
            { name: "chair", coords: "2,0", pos: { x: sizes.width/2, y: sizes.height/2 } },
        ]

        this.lock = true

        this.context = [
            ["In the second scene of the play, we are introduced to Edmund,", 
                "whose opening soliloquy reveals his bitterness, ambition,", 
                "and determination to overturn the social stigma of being a bastard"],
            null,
            ["blAH blAH BLAH CONTEXT 1 for ACT 3 SCENE 7", "blAH blAH BLAH CONTEXT 2 for ACT 3 SCENE 7"]
        ]

        this.hintText = null

        this.choice = {}

        this.ending = [['Some filler text about Edmund goes here for option 1.', 
                            'Some filler text about Edmund goes here for option 2.'],
                        ['Some filler text about Gloucester goes here for option 1.', 
                            'Some filler text about Gloucester goes here for option 2.']]

        this.speechLines = [
            ["Nature, you are my goddess,\nand I pledge my loyalty to you.",
            "The traditions of the kingdom held me back\nfrom being a son and heir.",
            "Merely because I was born out of wedlock?\nI was born this way—how truly terrible.",
            "Why do they all call me a bastard and a base?\nBecause I was born this way?",
            "Even though I am both\nphysically and mentally strong.",
            "Those born in the lusty stealth of nature\nare superior to those from boring, stuffy marriages.",
            "Edgar… you are legitimate?\nWhat a fine word—'legitimate'.",
            "But Edgar, I will take your land and your name.\nFather’s love is mine.",
            "And this thing 'legitimate'—what a hollow thing.",
            "I shall take and shatter it.",
            "Now, gods, stand up for the bastard."],
            ["Nature you are a cruel goddess",
            "I despise you for making me this way",
            "Forcing me to be born out of a wedlock,", 
            "And playing second fiddle to Edgar",
            "You benefit those with fortune and are indifferent to the rest",
            "You gift the might of a horse and the intellect of a genius to cretins who know nothing of noblesse oblige", 
            "The peasants on the street have done nothing,",
            "But cruel nobles can abandon all virtue and remain atop the mountains summit",
            "Absolutely detestable, why should I accept that?",
            "Edgar.. Father, I can sense loyalty in your blood and goodness in your essence",
            "I shall help you two if needed",
            "For I will shatter the cruel indifference of nature",
            "Now gods stand up-- for I will dance with the absurd"]
        ]

        this.edmundTitle
        this.edmundBody
        this.gloucesterTitle
        this.gloucesterBody
    }

    preload() {
        this.load.image("WSLeft", "public/assets/Player/WS0.png")
        this.load.image("WSRight", "public/assets/Player/WS1.png")

        this.npcData.forEach(npc => {
            this.load.image(npc.name, `public/assets/Sprites/NPC/${npc.name.toUpperCase()}.png`)
        })
        this.load.image("gloucesterSit", "public/assets/Sprites/NPC/GLOUCESTER2.png")
        this.load.image("gloucesterBlind", "public/assets/Sprites/NPC/GLOUCESTER1.png")

        this.load.image("main", "public/assets/Background/Main.png")
        this.load.image("scene1", "public/assets/Background/Scene1.png")
        this.load.image("scene2", "public/assets/Background/Scene2.png")
        this.load.image("finalScene", "public/assets/Background/finalScene.png")
    }

    create() {
        this.generateNpcMappings()
        this.loadBackground()

        this.player = this.physics.add.image(sizes.width / 2, sizes.height / 2, "WSLeft")
        this.player.setImmovable(true)
        this.player.body.allowGravity = false

        this.playerNameTag = this.add.text(this.player.x, this.player.y - this.player.displayHeight / 2 - 10, "Shakespeare", {
            fontSize: "18px",
            color: "#ffffff",
            fontStyle: "bold",
        }).setOrigin(0.5)
        this.playerNameTag.setDepth(3)

        this.cursors = this.input.keyboard.createCursorKeys()

        this.wasd = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        })

        
        this.setPlayerTexture()

        this.loadNPCs()
    }

    generateNpcMappings() {
        this.npcMap = {}
        this.npcPositions = {}

        this.npcData.forEach(({ name, coords, pos }) => {
            if (!this.npcMap[coords]) {
                this.npcMap[coords] = []
                this.npcPositions[coords] = []
            }
            this.npcMap[coords].push(name)
            this.npcPositions[coords].push(pos)
        })
    }

    loadBackground() {
        if (this.currentBackground) {
            this.currentBackground.destroy()
        }

        const key = this.mapGrid[this.mapY][this.mapX]
        if (key) {
            this.currentBackground = this.add.image(0, 0, key).setOrigin(0, 0)
            this.children.sendToBack(this.currentBackground)
        }

        if (this.chair) {
            this.chair.destroy()
            this.chair = null
        }
        
        if(this.mapX === 2 && this.mapY === 0) {
            this.chair = this.physics.add.image(sizes.width / 2, sizes.height / 2, "chair")
            this.chair.setImmovable(true)
            this.chair.body.allowGravity = false
        }

        if (this.edmundTitle){
            this.edmundTitle.destroy()
            this.edmundTitle = null
        }
        if (this.edmundBody){
            this.edmundBody.destroy()
            this.edmundBody = null
        }
        if (this.gloucesterTitle){
            this.gloucesterTitle.destroy()
            this.gloucesterTitle = null
        }
        if (this.gloucesterBody){
            this.gloucesterBody.destroy()
            this.gloucesterBody = null
        }

        if (this.mapX === 1 && this.mapY === 1) {
            this.edmundTitle = this.add.text(100, 100, 'Edmund', { fontSize: '32px', color: '#ffffff' })  
            this.edmundBody = this.add.text(100, 140, this.ending[0][this.choice[0] - 1], { fontSize: '20px', color: '#cccccc', wordWrap: { width: 300 } })  

            this.gloucesterTitle = this.add.text(500, 100, 'Gloucester', { fontSize: '32px', color: '#ffffff' })  
            this.gloucesterBody = this.add.text(500, 140, this.ending[1][this.choice[2] - 1], { fontSize: '20px', color: '#cccccc', wordWrap: { width: 300 } })  
        }
    }

    update() {
        if (!this.isTalking) {
            const left = this.cursors.left.isDown || this.wasd.left.isDown 
            const right = this.cursors.right.isDown || this.wasd.right.isDown 
            const up = this.cursors.up.isDown || this.wasd.up.isDown 
            const down = this.cursors.down.isDown || this.wasd.down.isDown 
            this.player.setVelocity(0)
            if (up) this.player.setVelocityY(-this.playerSpeed)
            if (down) this.player.setVelocityY(this.playerSpeed)
            if (left) {
                this.player.setVelocityX(-this.playerSpeed)
                if (this.mapX === 1 && this.mapY === 0 || this.mapX === 1 && this.mapY === 1) {
                    this.player.setTexture("WSLeft")
                }
            }
            if (right) {
                this.player.setVelocityX(this.playerSpeed)
                if (this.mapX === 1 && this.mapY === 0 || this.mapX === 1 && this.mapY === 1) {
                    this.player.setTexture("WSRight")
                }
            }
        } else {
            this.player.setVelocity(0)
        }

        this.checkScreenTransition()

        this.npcList.forEach(npc => {
            if (this.physics.overlap(this.player, npc) && !this.isTalking && !this.hasInteractedWith.has(npc.name)) {
                this.startDialogue(npc)
            }
        })

        if (this.isTalking && this.dialogueContainer) {
            this.children.bringToTop(this.dialogueContainer)
        }

        if (this.playerNameTag) {
            this.playerNameTag.x = this.player.x
            this.playerNameTag.y = this.player.y - this.player.displayHeight / 2 - 10
        }

        if (this.mapX === 1 && this.mapY === 0 && !this.lock) {
            this.showDownHint()
        } else {
            this.hideDownHint()
        }
    }

    checkScreenTransition() {
        const buffer = 1
        const body = this.player.body

        let moved = false

        if (body.left < 0) {
            if (this.mapX > 0 && this.mapGrid[this.mapY][this.mapX - 1]) {
                this.mapX--
                this.player.x = sizes.width - this.player.displayWidth / 2 - buffer
                moved = true
            } else {
                this.player.x = this.player.displayWidth / 2
            }
        } else if (body.right > sizes.width) {
            if (this.mapX < this.mapGrid[0].length - 1 && this.mapGrid[this.mapY][this.mapX + 1]) {
                this.mapX++
                this.player.x = this.player.displayWidth / 2 + buffer
                moved = true
            } else {
                this.player.x = sizes.width - 83 / 2
            }
        }

        if (body.top < 0) {
            if (this.mapY > 0 && this.mapGrid[this.mapY - 1][this.mapX]) {
                this.mapY--
                this.player.y = sizes.height - this.player.displayHeight / 2 - buffer
                moved = true
            } else {
                this.player.y = this.player.displayHeight / 2
            }
        } else if (body.bottom > sizes.height) {
            if (!this.lock) {
                if (this.mapY < this.mapGrid.length - 1 && this.mapGrid[this.mapY + 1][this.mapX]) {
                    this.mapY++
                    this.player.y = this.player.displayHeight / 2 + buffer
                    moved = true
                } else {
                    this.player.y = sizes.height - this.player.displayHeight / 2
                }
            } else {
                this.player.y = sizes.height - this.player.displayHeight / 2
            }
        }

        if (this.mapX === 1 && this.mapY === 0 && this.dialogueContainer) {
            this.dialogueContainer.destroy()
            this.dialogueContainer = null
            this.isTalking = false
        }


        if (moved) {
            this.loadBackground()
            this.clearNPCs()
            this.loadNPCs()
            this.setPlayerTexture()
            if (this.mapGrid[this.mapY][this.mapX] === "main") {
                this.hasInteractedWith.clear()
            }
        }
    }

    setPlayerTexture() {
        const key = this.mapGrid[this.mapY][this.mapX]
        if (key === "main") {
            this.player.setTexture("WSLeft")
            this.playerNameTag.setText("Shakespeare")
            this.player.setSize(this.player.width, this.player.height)
        } else if (key === "scene1") {
            this.player.setTexture("edmund")
            this.playerNameTag.setText("EDMUND")
            this.player.setSize(this.player.width, this.player.height)
            this.startContext(0)
        } else if (key === "scene2") {
            this.player.setTexture("gloucester")
            this.playerNameTag.setText("GLOUCESTER")
            this.player.setSize(this.player.width, this.player.height/2)
            this.player.setOffset(0,this.player.height/2)
            this.startContext(2)
        } else if (key === "finalScene") {
            this.playerNameTag.setText("")
        }
    }


    clearNPCs() {
        if (!this.npcList) return 
        this.npcList.forEach(npc => {
            if (npc) {
                if (npc.label) {
                    npc.label.destroy()
                }
                npc.destroy()
            }
        }) 

        this.npcList = [] 
    }

    loadNPCs() {
        const currentCoord = `${this.mapX},${this.mapY}`
        if (this.npcMap[currentCoord]) {
            const npcNames = this.npcMap[currentCoord]
            const positions = this.npcPositions[currentCoord]

            npcNames.forEach((name, i) => {
                const pos = positions[i]
                const npc = this.physics.add.image(pos.x, pos.y, name)
                npc.name = name
                npc.setImmovable(true)
                npc.body.allowGravity = false
                this.npcList.push(npc)

                this.player.setDepth(2)

                if (npc.name !== "chair") {
                    const label = this.add.text(npc.x, npc.y - npc.displayHeight / 2 - 10, name.toUpperCase(), {
                        fontSize: '16px',
                        color: '#ffffff',
                        fontStyle: 'bold'
                    }).setOrigin(0.5)
                    npc.label = label
                }
            })
        }
    }

    startDialogue(npc) {
        this.isTalking = true
        this.hasInteractedWith.add(npc.name)
        this.player.setVelocity(0)

        if (this.dialogueContainer) this.dialogueContainer.destroy()

        if (npc.name !== "chair") {
            this.dialogueContainer = this.add.container(sizes.width / 2, sizes.height / 2)

            const box = this.add.rectangle(0, 0, 400, 120, 0x000000, 0.7)
            const text = this.add.text(0, -30, `${npc.name.toUpperCase()}: Hello, ${this.playerNameTag.text}.`, {
                fontSize: "20px",
                color: "#ffffff",
                align: "center",
                wordWrap: { width: 380 }
            }).setOrigin(0.5)

            const btn = this.add.text(0, 25, "Continue", {
                fontSize: "18px",
                backgroundColor: "#ffffff",
                color: "#000000",
                padding: { x: 10, y: 5 }
            }).setOrigin(0.5).setInteractive()

            this.dialogueContainer.add([box, text, btn])
            this.children.bringToTop(this.dialogueContainer)

            btn.on("pointerdown", () => {
                this.dialogueContainer.destroy()
                this.dialogueContainer = null
                this.isTalking = false
            })
        }
        else {
            this.player.setPosition(sizes.width / 2 - 3, sizes.height / 2)
            this.player.setTexture("gloucesterSit")

            this.hasInteractedWith.add("regan")
            this.dialogueContainer = this.add.container(sizes.width / 2, sizes.height / 2)

            const box = this.add.rectangle(0, 0, 400, 120, 0x000000, 0.7)
            const text = this.add.text(0, -30, "Regan: Hello, Gloucester.", {
                fontSize: "20px",
                color: "#ffffff",
                align: "center",
                wordWrap: { width: 380 }
            }).setOrigin(0.5)

            const btn = this.add.text(0, 25, "Continue", {
                fontSize: "18px",
                backgroundColor: "#ffffff",
                color: "#000000",
                padding: { x: 10, y: 5 }
            }).setOrigin(0.5).setInteractive()

            this.dialogueContainer.add([box, text, btn])
            this.children.bringToTop(this.dialogueContainer)

            btn.on("pointerdown", () => {
                this.dialogueContainer.destroy()
                this.dialogueContainer = null
                this.isTalking = false
                this.startOptions()
            })
        }
    }

    startContext(scene) {
        if (!this.context[scene]) return

        if (this.dialogueContainer) this.dialogueContainer.destroy()

        this.currentContextIndex = 0
        this.dialogueContainer = this.add.container(sizes.width / 2, 100)

        const box = this.add.rectangle(0, 0, 550, 140, 0x000000, 0.7)
        const contextText = this.add.text(0, -25, this.context[scene][0], {
            fontSize: "20px",
            color: "#ffffff",
            align: "center",
            wordWrap: { width: 380 }
        }).setOrigin(0.5)

        const btn = this.add.text(0, 35, "Continue", {
            fontSize: "18px",
            backgroundColor: "#ffffff",
            color: "#000000",
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5).setInteractive()

        btn.on("pointerdown", () => {
            this.currentContextIndex++
            if (this.currentContextIndex < this.context[scene].length) {
                contextText.setText(this.context[scene][this.currentContextIndex])
            } else {
                this.dialogueContainer.destroy()
                this.dialogueContainer = null
                this.isTalking = false
                if(this.mapX === 0) this.startOptions()
            }
        })

        this.dialogueContainer.add([box, contextText, btn])
        this.children.bringToTop(this.dialogueContainer)
        this.dialogueContainer.setDepth(4)
    }

    startOptions() {
        if (this.dialogueContainer) this.dialogueContainer.destroy()

        this.dialogueContainer = this.add.container(sizes.width / 2, sizes.height * 4 / 5)
        this.dialogueContainer.setDepth(4)
        const box = this.add.rectangle(0, 0, 500, 100, 0x000000, 0.7)

        const prompt = this.add.text(0, -20, "Choose your response:", {
            fontSize: "22px",
            color: "#ffffff",
            align: "center",
            wordWrap: { width: 480 }
        }).setOrigin(0.5)
        if (this.mapX === 0) {
            const option1 = this.add.text(-110, 10, "Side With Nature", {
                fontSize: "18px",
                backgroundColor: "#ffffff",
                color: "#000000",
                padding: { x: 10, y: 5 }
            }).setOrigin(0.5).setInteractive()

            option1.on("pointerdown", () => {
                this.handleOption(1)
            })

            const option2 = this.add.text(110, 10, "Side With Society", {
                fontSize: "18px",
                backgroundColor: "#ffffff",
                color: "#000000",
                padding: { x: 10, y: 5 }
            }).setOrigin(0.5).setInteractive()

            option2.on("pointerdown", () => {
                this.handleOption(2)
                console.log(this.choice)
            })
            this.dialogueContainer.add([box, prompt, option1, option2])
            this.children.bringToTop(this.dialogueContainer)
        } else {
            const option1 = this.add.text(-100, 30, "Option 1", {
                fontSize: "18px",
                backgroundColor: "#ffffff",
                color: "#000000",
                padding: { x: 10, y: 5 }
            }).setOrigin(0.5).setInteractive()

            option1.on("pointerdown", () => {
                this.handleOption(1)
            })

            const option2 = this.add.text(100, 30, "Option 2", {
                fontSize: "18px",
                backgroundColor: "#ffffff",
                color: "#000000",
                padding: { x: 10, y: 5 }
            }).setOrigin(0.5).setInteractive()

            option2.on("pointerdown", () => {
                this.handleOption(2)
                console.log(this.choice)
            })
            this.dialogueContainer.add([box, prompt, option1, option2])
            this.children.bringToTop(this.dialogueContainer)
        }
    }
    
    startSpeech(optionNumber) {
        this.currentSpeechIndex = 0

        if (this.dialogueContainer) {
            this.dialogueContainer.destroy()
        }

        this.dialogueContainer = this.add.container(sizes.width / 2, sizes.height / 6)
        const speechLines = this.speechLines[optionNumber - 1]
        const box = this.add.rectangle(0, 0, 600, 130, 0x000000, 0.7)

        if (this.mapX === 0) {
            this.speechText = this.add.text(0, -20, `${this.playerNameTag.text}: ${speechLines[this.currentSpeechIndex]}`, {
                fontSize: "20px",
                color: "#ffffff",
                align: "center",
                wordWrap: { width: 500 }
            }).setOrigin(0.5)

            const btn = this.add.text(0, 40, "Continue", {
                fontSize: "18px",
                backgroundColor: "#ffffff",
                color: "#000000",
                padding: { x: 12, y: 6 }
            }).setOrigin(0.5).setInteractive()

            btn.on("pointerdown", () => {
                this.currentSpeechIndex++
                if (this.currentSpeechIndex < speechLines.length) {
                    this.speechText.setText(`${this.playerNameTag.text}: ${speechLines[this.currentSpeechIndex]}`)
                } else {
                    this.dialogueContainer.destroy()
                    this.dialogueContainer = null
                    this.isTalking = false
                }
            })
            this.dialogueContainer.add([box, this.speechText, btn])
            this.dialogueContainer.setDepth(4)
            this.children.bringToTop(this.dialogueContainer)
        } else {
            this.speechText = this.add.text(0, -20, `${this.playerNameTag.text}: ${speechLines[this.currentSpeechIndex]}`, {
                fontSize: "20px",
                color: "#ffffff",
                align: "center",
                wordWrap: { width: 500 }
            }).setOrigin(0.5)

            const btn = this.add.text(0, 40, "Continue", {
                fontSize: "18px",
                backgroundColor: "#ffffff",
                color: "#000000",
                padding: { x: 12, y: 6 }
            }).setOrigin(0.5).setInteractive()

            btn.on("pointerdown", () => {
                this.currentSpeechIndex++
                if (this.currentSpeechIndex < speechLines.length) {
                    this.speechText.setText(`${this.playerNameTag.text}: ${speechLines[this.currentSpeechIndex]}`)
                } else {
                    this.dialogueContainer.destroy()
                    this.dialogueContainer = null
                    this.isTalking = false
                }
            })
            this.dialogueContainer.add([box, this.speechText, btn])
            this.dialogueContainer.setDepth(4)
            this.children.bringToTop(this.dialogueContainer)
        }
    }

    handleOption(optionNumber) {
        this.choice[this.mapX] = optionNumber

        console.log(this.choice)

        if (this.dialogueContainer) {
            this.dialogueContainer.destroy()
            this.dialogueContainer = null
            if (this.mapX === 2) {
                if (optionNumber === 1) {
                    this.player.setTexture("gloucesterBlind")
                } else {
                    this.player.setTexture("gloucester")
                }
                
            } 
            this.startSpeech(optionNumber)
        }

        if (Object.keys(this.choice).filter(k => this.choice[k] != null).length === 2) {
            this.lock = false
        }
    }

    showDownHint() {
        if (this.hintText) return

        this.hintText = this.add.text(sizes.width / 2, sizes.height - 80, "↓ Head down to continue ↓", {
            fontSize: "24px",
            color: "#ffffff",
            backgroundColor: "rgba(0, 0, 0, 0.2)",
            padding: { x: 10, y: 5 },
            align: "center"
        }).setOrigin(0.5)
    }

    hideDownHint() {
        if (this.hintText) {
            this.hintText.destroy()
            this.hintText = null
        }
    }
}

const config = {
    type: Phaser.WEBGL,
    width: sizes.width,
    height: sizes.height,
    backgroundColor: '#4488aa',
    canvas: document.getElementById("gameCanvas"),
    pixelArt: true,
    physics: {
        default: "arcade",
        arcade: {
            gravity: { y: speedDown },
            debug: false
        }
    },
    scene: [GameScene]
}

const game = new Phaser.Game(config)