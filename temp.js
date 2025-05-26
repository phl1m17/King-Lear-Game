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
        this.playerSpeed = 350

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

        this.npcData = [
            { name: "edmund", coords: null, pos: null },
            { name: "gloucester", coords: null, pos: null },
            { name: "regan", coords: "2,0", pos: { x: 400, y: 350 } },
        ]

        this.lock = true

        this.context = [
            ["blAH blAH BLAH CONTEXT 1 for ACT 1 SCENE 2", "blAH blAH BLAH CONTEXT 2 for ACT 1 SCENE 2"],
            null,
            ["blAH blAH BLAH CONTEXT 1 for ACT 3 SCENE 7", "blAH blAH BLAH CONTEXT 2 for ACT 3 SCENE 7"]
        ]

        this.hintText = null
    }

    preload() {
        this.load.image("WSLeft", "public/assets/Player/WS0.png")
        this.load.image("WSRight", "public/assets/Player/WS1.png")

        this.npcData.forEach(npc => {
            this.load.image(npc.name, `public/assets/Sprites/NPC/${npc.name.toUpperCase()}.png`)
        })

        this.load.image("main", "public/assets/Background/Main.png")
        this.load.image("scene1", "public/assets/Background/Scene1.png")
        this.load.image("scene2", "public/assets/Background/Scene2.png")
        this.load.image("chair","public/assets/Background/Chair.png")
        this.load.image("finalScene", "public/assets/Background/background0.png")
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
            padding: { x: 5, y: 2 }
        }).setOrigin(0.5)

        this.cursors = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        })
        
        this.setPlayerTexture()

        this.loadNPCs()

        if(this.mapX === 2 && this.mapY === 0) {
            this.chair = this.physics.add.image(sizes.width / 2, sizes.height / 2, "Chair")
            this.chair.setImmovable(true)
            this.chair.body.allowGravity = false
        }
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
    }

    update() {
        if (!this.isTalking) {
            const { up, down, left, right } = this.cursors
            this.player.setVelocity(0)

            if (up.isDown) this.player.setVelocityY(-this.playerSpeed)
            if (down.isDown) this.player.setVelocityY(this.playerSpeed)
            if (left.isDown) {
                this.player.setVelocityX(-this.playerSpeed)
                if (this.mapX === 1 && this.mapY === 0 || this.mapX === 1 && this.mapY === 1) {
                    this.player.setTexture("WSLeft")
                }
            }
            if (right.isDown) {
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

        if (this.mapX === 1 && this.mapY === 0 && this.lock === false) {
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
                this.player.x = sizes.width - this.player.displayWidth / 2
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
            this.player.setSize(this.player.width, this.player.height)
            this.startContext(2)
        } else if (key === "finalscene") {
            this.playerNameTag.setText("")
        }
    }


    clearNPCs() {
        this.npcList.forEach(npc => {
            npc.destroy()
            npc.label.destroy()
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

                const label = this.add.text(npc.x, npc.y - npc.displayHeight / 2 - 10, name.toUpperCase(), {
                    fontSize: '16px',
                    color: '#ffffff',
                    fontStyle: 'bold'
                }).setOrigin(0.5)
                npc.label = label
            })
        }
    }

    startDialogue(npc) {
        this.lock = false
        this.isTalking = true
        this.hasInteractedWith.add(npc.name)
        this.player.setVelocity(0)

        if (this.dialogueContainer) this.dialogueContainer.destroy()

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

    startContext(scene) {
        if (!this.context[scene]) return

        if (this.dialogueContainer) this.dialogueContainer.destroy()

        this.currentContextIndex = 0
        this.dialogueContainer = this.add.container(sizes.width / 2, 100)

        const box = this.add.rectangle(0, 0, 400, 120, 0x000000, 0.7)
        const contextText = this.add.text(0, -30, this.context[scene][0], {
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

        btn.on("pointerdown", () => {
            this.currentContextIndex++
            if (this.currentContextIndex < this.context[scene].length) {
                contextText.setText(this.context[scene][this.currentContextIndex])
            } else {
                this.dialogueContainer.destroy()
                this.dialogueContainer = null
                this.isTalking = false
                this.startOptions()
            }
        })

        this.dialogueContainer.add([box, contextText, btn])
        this.children.bringToTop(this.dialogueContainer)
    }

    startOptions() {
        if (this.dialogueContainer) this.dialogueContainer.destroy()

        this.dialogueContainer = this.add.container(sizes.width / 2, sizes.height * 4 / 5)

        const box = this.add.rectangle(0, 0, 500, 200, 0x000000, 0.7)

        const prompt = this.add.text(0, -60, "Choose your response:", {
            fontSize: "22px",
            color: "#ffffff",
            align: "center",
            wordWrap: { width: 480 }
        }).setOrigin(0.5)

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
        })

        this.dialogueContainer.add([box, prompt, option1, option2])
        this.children.bringToTop(this.dialogueContainer)
    }

    handleOption(optionNumber) {
        if (optionNumber === 1) {
            if(this.mapX === 0 && this.mapY === 0) {
                console.log("EDMUND Agrees with Nature")
            } else {
                console.log("GLOUCESTER Agrees with Nature")
            }
        } else if (optionNumber === 2) {
            if(this.mapX === 0 && this.mapY === 0) {
                console.log("EDMUND Agrees with Society")
            } else {
                console.log("GLOUCESTER Agrees with Society")
            }
        }

        if (this.dialogueContainer) {
            this.dialogueContainer.destroy()
            this.dialogueContainer = null
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