let canvas = document.getElementById('canvas')
let restartButton = document.getElementById('restart')

let GRID_SIZE = 30
let BOMB_COUNT = Math.round(GRID_SIZE * 3)
let CELL_SIZE = 24

let revealedCount // number, count of how many tiles the player has revealed
let hasWon // boolean, flag if the player has won
let bombs // Array<String>, array of keys of all the bombs
let cells // Array<Array<{"revealed": false, value: 0}>>, matrix of all the cells
let buttons // Map<String, Button>, map of all the buttons that represent the cells
let renderQueue // List<String>, queue of buttons to be re-rendered
let loosingBombKey // String, key of the bomb clicked which loses the game


const initCells = () => {
    cells = new Array(GRID_SIZE)
    for (let i = 0; i < GRID_SIZE; i++) {
        cells[i] = new Array(GRID_SIZE)
        for (let j = 0; j < GRID_SIZE; j++) {
            cells[i][j] = {flagged: false, revealed: false, value: 0}
        }
    }
}

const toKey = (x, y) => x + "," + y

const fromKey = k => k.split(",").map(Number)

const placeBombs = () => {
    bombs = new Array(BOMB_COUNT)
    for (let i = 0; i < BOMB_COUNT; i++) {
        let x, y
        do {
            x = Math.floor(Math.random() * GRID_SIZE)
            y = Math.floor(Math.random() * GRID_SIZE)
        } while (bombs.filter(k => k === toKey(x, y)).length > 0)
        cells[y][x].value = -1
        bombs[i] = toKey(x, y)
    }
}

const calculateDangers = () => {
    for (const bomb of bombs) {
        const [bombX, bombY] = fromKey(bomb)
        const leftInBound = bombX - 1 >= 0
        const topInBound = bombY - 1 >= 0
        const rightInbound = bombX + 1 < GRID_SIZE
        const bottomInBound = bombY + 1 < GRID_SIZE
        if (leftInBound && topInBound && cells[bombY - 1][bombX - 1].value !== -1) cells[bombY - 1][bombX - 1].value++
        if (topInBound && cells[bombY - 1][bombX].value !== -1) cells[bombY - 1][bombX].value++
        if (rightInbound && topInBound && cells[bombY - 1][bombX + 1].value !== -1) cells[bombY - 1][bombX + 1].value++
        if (rightInbound && cells[bombY][bombX + 1].value !== -1) cells[bombY][bombX + 1].value++
        if (rightInbound && bottomInBound && cells[bombY + 1][bombX + 1].value !== -1) cells[bombY + 1][bombX + 1].value++
        if (bottomInBound && cells[bombY + 1][bombX].value !== -1) cells[bombY + 1][bombX].value++
        if (leftInBound && bottomInBound && cells[bombY + 1][bombX - 1].value !== -1) cells[bombY + 1][bombX - 1].value++
        if (leftInBound && cells[bombY][bombX - 1].value !== -1) cells[bombY][bombX - 1].value++
    }
}

const reRenderButtons = () => {
    while (renderQueue.length > 0) {
        const key = renderQueue.pop()
        const [buttonX, buttonY] = fromKey(key)
        const button = buttons.get(key)
        button.disabled = false
        if (cells[buttonY][buttonX].revealed) {
            button.disabled = true
            button.textContent = cells[buttonY][buttonX].value
            button.style.backgroundColor = ''
            if (cells[buttonY][buttonX].value === 0) {
                button.style.color = 'black'
                button.textContent = ''
            } else if (cells[buttonY][buttonX].value === 1) {
                button.style.color = 'blue'
            } else if (cells[buttonY][buttonX].value === 2) {
                button.style.color = 'green'
            } else {
                button.style.color = 'red'
            }
        } else if (cells[buttonY][buttonX].flagged) {
            button.style.color = 'black'
            button.textContent = '🚩'
        } else {
            button.textContent = ''
        }
    }

    if (hasWon || loosingBombKey !== null) {
        for (const bomb of bombs) {
            const button = buttons.get(bomb)
            const [buttonX, buttonY] = fromKey(bomb)

            button.disabled = true
            button.textContent = '💣'
            button.style.backgroundColor = 'orange'

            if (bomb === loosingBombKey) {
                button.style.backgroundColor = 'red'
            } else if (cells[buttonY][buttonX].flagged || hasWon) {
                button.style.backgroundColor = 'green'
            }
        }
    }

    if (loosingBombKey !== null) {
        canvas.style.pointerEvents = 'none'
        restartButton.style.display = 'block'
    }
}

const revealAllEmpty = (x, y) => {
    cells[y][x].revealed = true
    revealedCount++
    renderQueue.push(toKey(x, y))
    if (cells[y][x].value > 0) return

    if (y - 1 >= 0 && !cells[y - 1][x].revealed) revealAllEmpty(x, y - 1)
    if (x + 1 < GRID_SIZE && !cells[y][x + 1].revealed) revealAllEmpty(x + 1, y)
    if (y + 1 < GRID_SIZE && !cells[y + 1][x].revealed) revealAllEmpty(x, y + 1)
    if (x - 1 >= 0 && !cells[y][x - 1].revealed) revealAllEmpty(x - 1, y)
}

const revealCell = (x, y) => {
    if (cells[y][x].value === -1) {
        loosingBombKey = toKey(x, y)
    } else if (cells[y][x].value > 0) {
        cells[y][x].revealed = true
        revealedCount++
        renderQueue.push(toKey(x, y))
    } else if (cells[y][x].value === 0) {
        revealAllEmpty(x, y)
    }
    if (GRID_SIZE * GRID_SIZE - revealedCount === bombs.length) {
        hasWon = true
    }
}

const initRenderButtons = () => {
    canvas.style.width = GRID_SIZE * CELL_SIZE + 'px'
    canvas.style.height = GRID_SIZE * CELL_SIZE + 'px'
    for (let i = 0; i < GRID_SIZE; i++) {
        for (let j = 0; j < GRID_SIZE; j++) {
            let button = document.createElement('button')
            button.style.float = 'left'
            button.style.width = CELL_SIZE + 'px'
            button.style.height = CELL_SIZE + 'px'
            button.style.backgroundColor = 'grey'
            button.oncontextmenu = e => {
                e.preventDefault()
                cells[i][j].flagged = !cells[i][j].flagged
                renderQueue.push(toKey(j, i))
                reRenderButtons()
            }
            button.onclick = () => {
                if (cells[i][j].flagged) return
                revealCell(j, i)
                reRenderButtons()
            }
            canvas.appendChild(button)
            let key = toKey(j, i)
            buttons.set(key, button)
        }
    }
    restartButton.onclick = () => {
        canvas.textContent = ''
        canvas.style.pointerEvents = ''
        restartButton.style.display = ''
        startGame()
    }
}

const startGame = () => {
    cells = null
    bombs = null
    hasWon = false
    loosingBombKey = null
    revealedCount = 0
    buttons = new Map();
    renderQueue = []
    initCells()
    placeBombs()
    calculateDangers()
    initRenderButtons()
}


startGame()
