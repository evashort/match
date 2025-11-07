import { Gem, Direction, SlidingGem, ShrinkingGem, Hole } from '../lib/Piece.js';

export class Game extends Phaser.Scene {
    constructor() {
        super('Game');

        this.gridSize = 6; // 6x6 grid
        this.tileSize = 50; // Size of each grid cell
        this.cars = [];
        this.selectedVehicle = null;
        this.dragStart = null;
        this.move = null;
        this.level = 1;
        this.grid = null;
        this.idSprites = {};
        this.isDebug = false;
    }

    init() {
        const gameWidth = this.sys.game.config.width;
        const gameHeight = this.sys.game.config.height;
        const boardSize = this.gridSize * this.tileSize;

        this.boardOffsetX = Math.floor((gameWidth - boardSize) / 2);
        this.boardOffsetY = Math.floor((gameHeight - boardSize) / 2);
    }

    create() {
        this.cameras.main.setBackgroundColor(0x365984);
        this.createEnvironment();
        this.createLevel(this.level);

        this.input.on('pointerdown', this.onPointerDown, this);
        this.input.on('pointermove', this.onPointerMove, this);
        this.input.on('pointerup', this.onPointerUp, this);

        if (this.isDebug) {
            this.createVisualGrid();
        }
    }

    createParkingArea() {
        const boardSize = this.gridSize * this.tileSize;
        const padding = 30;

        const parkingArea = this.add.graphics();
        parkingArea.fillStyle(0x333333, 1);

        parkingArea.fillRoundedRect(
            this.boardOffsetX - padding,
            this.boardOffsetY - padding,
            boardSize + padding * 2,
            boardSize + padding * 2,
            8
        );

        parkingArea.lineStyle(4, 0x212020, 1);
        parkingArea.strokeRoundedRect(this.boardOffsetX - padding,
            this.boardOffsetY - padding,
            boardSize + padding * 2,
            boardSize + padding * 2,
            8
        );
    }

    initGrid() {
        this.grid = [];
        for (let y = 0; y < this.gridSize; y++) {
            const row = [];
            for (let x = 0; x < this.gridSize; x++) {
                const gem = new Gem();
                gem.color = Math.floor(Math.random() * 3)
                row.push(); // null means an empty cell
            }
            this.grid.push(row);
        }
    }

    createVisualGrid() {
        // Draw the grid lines for debugging
        const graphics = this.add.graphics();
        graphics.lineStyle(1, 0xffffff, 0.3);

        // Draw horizontal lines
        for (let y = 0; y <= this.gridSize; y++) {
            graphics.moveTo(this.boardOffsetX, this.boardOffsetY + y * this.tileSize);
            graphics.lineTo(this.boardOffsetX + this.gridSize * this.tileSize, this.boardOffsetY + y * this.tileSize);
        }

        // Draw vertical lines
        for (let x = 0; x <= this.gridSize; x++) {
            graphics.moveTo(this.boardOffsetX + x * this.tileSize, this.boardOffsetY);
            graphics.lineTo(this.boardOffsetX + x * this.tileSize, this.boardOffsetY + this.gridSize * this.tileSize);
        }

        graphics.strokePath();

        // Add grid coordinates for debugging
        if (this.isDebug) {
            for (let y = 0; y < this.gridSize; y++) {
                for (let x = 0; x < this.gridSize; x++) {
                    // Place text in center of the grid cell for better visibility
                    this.add.text(
                        this.boardOffsetX + (x + 0.5) * this.tileSize,
                        this.boardOffsetY + (y + 0.5) * this.tileSize,
                        `${x},${y}`,
                        { fontSize: '12px', color: '#ffffff', alpha: 0.5 }
                    ).setOrigin(0.5);

                    // Draw cell boundaries more clearly
                    const rect = this.add.rectangle(
                        this.boardOffsetX + (x + 0.5) * this.tileSize,
                        this.boardOffsetY + (y + 0.5) * this.tileSize,
                        this.tileSize,
                        this.tileSize
                    );
                    rect.setStrokeStyle(1, 0xffffff, 0.2);
                }
            }
        }
    }

    createEnvironment() {
        this.createParkingArea();

        const overpassContainer = this.add.container(0, 65);
        for (let i = 0; i < 10; i++) {
            const overpass = this.add.image(0, 0, 'overpass');
            overpass.setScale(4);
            overpass.x = i * overpass.displayWidth;

            overpassContainer.add([overpass]);
        }

        const container = this.add.container(
            635,
            this.boardOffsetY - 70
        );

        const grass_top = this.add.image(0, 0, 'grass_top');
        grass_top.setScale(4);

        const midOffset = 4;
        const grass_middle1 = this.add.image(0, grass_top.y + grass_top.displayHeight, 'grass_middle');
        grass_middle1.setScale(4);

        const grass_middle2 = this.add.image(0, grass_middle1.y + grass_middle1.displayHeight - midOffset, 'grass_middle');
        grass_middle2.setScale(4);

        const grass_middle3 = this.add.image(0, grass_middle2.y + grass_middle2.displayHeight - midOffset, 'grass_middle');
        grass_middle3.setScale(4);

        const grass_bottom = this.add.image(0, grass_middle3.y + grass_middle3.displayHeight - midOffset, 'grass_bottom');
        grass_bottom.setScale(4);

        const fire_hydrant = this.add.image(grass_middle3.x - 8, grass_middle3.y - grass_middle3.displayHeight, 'fire_hydrant');
        fire_hydrant.setScale(3);
        fire_hydrant.setInteractive();
        fire_hydrant.setRotation(Phaser.Math.DegToRad(-90));

        this.textures.generate('waterParticle', { data: ['....1....', '...111...', '..11111..', '...111...', '....1....'], width: 9, height: 5 });
        const waterFx = this.add.particles(fire_hydrant.x - 9, fire_hydrant.y + 2, 'waterParticle', {
            speed: { min: 100, max: 300 },
            angle: { min: -20, max: 20 },
            scale: { start: 0.5, end: 0.1 },
            alpha: { start: 1, end: 0 },
            lifespan: 1000,
            frequency: 10,
            quantity: 5,
            blendMode: 'ADD'
        });
        waterFx.stop();
        waterFx.setRotation(Phaser.Math.DegToRad(180));

        fire_hydrant.on('pointerdown', () => {
            this.tweens.add({
                targets: fire_hydrant,
                scale: { from: fire_hydrant.scale, to: fire_hydrant.scale * 1.1 },
                duration: 150,
                ease: "Sine.inOut",
                yoyo: true,
            });

            waterFx.start();

            this.time.delayedCall(2000, () => {
                waterFx.stop();
                this.tweens.add({
                    targets: waterFx,
                    alpha: 0,
                    duration: 500,
                    onComplete: () => {
                        waterFx.off();
                        waterFx.alpha = 1; // Reset for reuse
                    }
                });
            });
        });

        container.add([grass_top, grass_middle1, grass_middle2, grass_middle3, grass_bottom, fire_hydrant, waterFx]);
        container.setRotation(Phaser.Math.DegToRad(90));
    }

    createLevel(level) {
        return;
        // Clear existing cars
        this.cars.forEach(car => car.destroy());
        this.cars = [];

        this.initGrid();

        // Define level data (car positions, orientations, and sizes)
        let levelData;

        switch (level) {
            case 1:
                levelData = this.getLevelOne();
                break;
            // Add more levels here as needed
            default:
                levelData = this.getLevelOne(); // Default to level 1
                break;
        }

        levelData.forEach(carData => {
            this.createCar(carData);
        });
    }

    getLevelOne() {
        /* Define level 1 car configuration
        * Format: {x, y, size, direction, image}
        * x, y: grid coordinates (0-based)
        * size: number of cells the car occupies (2 or 3)
        * direction: 'horizontal' or 'vertical'
        * image: sprite key
        */
        return [
            { x: 0, y: 2, size: 2, direction: 'horizontal', image: 'red_car', isTarget: true },
            { x: 2, y: 0, size: 2, direction: 'vertical', image: 'blue_car' },
            { x: 2, y: 2, size: 2, direction: 'horizontal', image: 'striped_red_car' },
            { x: 3, y: 3, size: 2, direction: 'vertical', image: 'yellow_car' },
            { x: 4, y: 0, size: 2, direction: 'vertical', image: 'police_car' },
            { x: 4, y: 4, size: 2, direction: 'horizontal', image: 'red_car' }
        ];
    }

    createCar(carData) {
        let pixelX, pixelY;

        if (carData.direction === 'horizontal') {
            // For horizontal cars, center X is halfway through its occupied cells
            pixelX = this.boardOffsetX + (carData.x + carData.size / 2) * this.tileSize;
            // Y position is the center of the row
            pixelY = this.boardOffsetY + (carData.y + 0.5) * this.tileSize;
        } else { // vertical
            // For vertical cars, center Y is halfway through its occupied cells
            pixelY = this.boardOffsetY + (carData.y + carData.size / 2) * this.tileSize;
            // X position is the center of the column
            pixelX = this.boardOffsetX + (carData.x + 0.5) * this.tileSize;
        }

        const car = this.add.image(pixelX, pixelY, carData.image);
        car.setInteractive();
        car.setScale(3);  // Adjusted for better fit the grid

        // Set car rotation based on direction
        if (carData.direction === 'horizontal') {
            car.setRotation(Math.PI / 2); // 90 degrees (car faces right)
        } else {
            car.setRotation(0); // 0 degrees (car faces up)
        }

        car.gridX = carData.x;
        car.gridY = carData.y;
        car.size = carData.size;
        car.direction = carData.direction;
        car.isTarget = carData.isTarget || false;
        car.setOrigin(0.5, 0.5);

        this.cars.push(car);

        this.updateGridOccupancy(car);

        if (this.isDebug) {
            console.log(`Created car at grid (${car.gridX}, ${car.gridY}), size: ${car.size}, direction: ${car.direction}, pixel pos: (${pixelX}, ${pixelY})`);

            // Visual debug helper - show car center and occupied cells
            const centerMarker = this.add.circle(pixelX, pixelY, 3, 0xff0000);
            centerMarker.setDepth(100);

            // Highlight occupied cells
            if (car.direction === 'horizontal') {
                for (let x = car.gridX; x < car.gridX + car.size; x++) {
                    const cellHighlight = this.add.rectangle(
                        this.boardOffsetX + (x + 0.5) * this.tileSize,
                        this.boardOffsetY + (car.gridY + 0.5) * this.tileSize,
                        this.tileSize * 0.9,
                        this.tileSize * 0.9,
                        0xff0000,
                        0.1
                    );
                    cellHighlight.setDepth(10);
                }
            } else {
                for (let y = car.gridY; y < car.gridY + car.size; y++) {
                    const cellHighlight = this.add.rectangle(
                        this.boardOffsetX + (car.gridX + 0.5) * this.tileSize,
                        this.boardOffsetY + (y + 0.5) * this.tileSize,
                        this.tileSize * 0.9,
                        this.tileSize * 0.9,
                        0xff0000,
                        0.1
                    );
                    cellHighlight.setDepth(10);
                }
            }
        }
    }

    updateGridOccupancy(car, clear = false) {
        if (car.direction === 'horizontal') {
            for (let x = car.gridX; x < car.gridX + car.size; x++) {
                this.grid[car.gridY][x] = clear ? null : car;
            }
        } else { // vertical
            for (let y = car.gridY; y < car.gridY + car.size; y++) {
                this.grid[y][car.gridX] = clear ? null : car;
            }
        }
    }

    onPointerDown(pointer) {
        this.dragStart = [
            Math.floor((pointer.x - this.boardOffsetX) / this.tileSize),
            Math.floor((pointer.y - this.boardOffsetY) / this.tileSize),
        ];
        return;
        let clickedCar = null;

        if (!clickedCar) {
            clickedCar = this.findClickedCarInGrid(pointer);
        }

        if (this.isDebug) {
            console.log("Clicked car:", clickedCar ?
                `${clickedCar.texture.key} at (${clickedCar.gridX},${clickedCar.gridY})` :
                "null");
        }

        if (clickedCar) {
            this.selectedVehicle = clickedCar;
            this.dragStartX = pointer.x;
            this.dragStartY = pointer.y;

            this.tweens.add({
                targets: clickedCar,
                scale: { from: clickedCar.scale, to: clickedCar.scale * 1.05 },
                duration: 100,
                yoyo: true,
                ease: 'Sine.Out'
            });
        }
    }

    findClickedCarInGrid(pointer) {
        // Convert pointer position to grid coordinates
        const gridX = Math.floor((pointer.x - this.boardOffsetX) / this.tileSize);
        const gridY = Math.floor((pointer.y - this.boardOffsetY) / this.tileSize);

        // Check if coordinates are within grid
        if (gridX >= 0 && gridX < this.gridSize && gridY >= 0 && gridY < this.gridSize) {
            return this.grid[gridY][gridX];
        }

        return null;
    }

    onPointerMove(pointer) {
        if (this.dragStart != null) {
            const [dragStartX, dragStartY] = this.dragStart;
            const dragStopX = Math.floor((pointer.x - this.boardOffsetX) / this.tileSize);
            const dragStopY = Math.floor((pointer.y - this.boardOffsetY) / this.tileSize);
            if (dragStopX != dragStartX || dragStopY != dragStartY) {
                const dragStartCenterX = this.boardOffsetX + (dragStartX + 0.5) * this.tileSize;
                const dragStartCenterY = this.boardOffsetY + (dragStartY + 0.5) * this.tileSize;
                let direction = null;
                if (Math.abs(pointer.x - dragStartCenterX) >= Math.abs(pointer.y - dragStartCenterY)) {
                    if (pointer.x < dragStartCenterX) {
                        if (dragStartX >= 1 && dragStartX < this.gridSize && dragStartY >= 0 && dragStartY < this.gridSize) {
                            direction = Direction.LEFT;
                        }
                    } else {
                        if (dragStartX >= 0 && dragStartX < this.gridSize - 1 && dragStartY >= 0 && dragStartY < this.gridSize) {
                            direction = Direction.RIGHT;
                        }
                    }
                } else {
                    if (pointer.y < dragStartCenterY) {
                        if (dragStartX >= 0 && dragStartX < this.gridSize && dragStartY >= 1 && dragStartY < this.gridSize) {
                            direction = Direction.UP;
                        }
                    } else {
                        if (dragStartX >= 0 && dragStartX < this.gridSize && dragStartY >= 0 && dragStartY < this.gridSize - 1) {
                            direction = Direction.DOWN;
                        }
                    }
                }

                if (direction !== null) {
                    const otherX = dragStartX + (direction === Direction.RIGHT) - (direction === Direction.LEFT);
                    const otherY = dragStartY + (direction === Direction.DOWN) - (direction === Direction.UP);
                    if (this.grid[dragStartY][dragStartX] instanceof Gem && this.grid[otherY][otherX] instanceof Gem) {
                        this.move = {
                            x: dragStartX,
                            y: dragStartY,
                            direction: direction,
                        }
                    }
                }

                this.dragStart = null;
            }
        }
        return;
        if (!this.selectedVehicle) return;

        const dragX = pointer.x - this.dragStartX;
        const dragY = pointer.y - this.dragStartY;

        const dragThreshold = this.tileSize * 0.5; // Half a tile size threshold for movement

        // Only allow movement along the car's orientation
        if (this.selectedVehicle.direction === 'horizontal') {
            // Only process horizontal movement for horizontal cars
            if (Math.abs(dragX) >= dragThreshold) {
                const cellsMoved = Math.sign(dragX); // Move 1 cell at a time in the drag direction
                this.tryMoveSelectedCar(cellsMoved, 0);

                this.dragStartX = pointer.x;
                this.dragStartY = pointer.y;
            }
        } else { // vertical
            // Only process vertical movement for vertical cars
            if (Math.abs(dragY) >= dragThreshold) {
                const cellsMoved = Math.sign(dragY); // Move 1 cell at a time in the drag direction
                this.tryMoveSelectedCar(0, cellsMoved);

                // Reset drag start position
                this.dragStartX = pointer.x;
                this.dragStartY = pointer.y;
            }
        }
    }

    onPointerUp(pointer) {
        this.dragStart = null;
        return;
        if (!this.selectedVehicle) return;

        this.checkCarShouldExit(this.selectedVehicle);

        this.selectedVehicle = null;
    }

    tryMoveSelectedCar(deltaX, deltaY) {
        const car = this.selectedVehicle;

        const newGridX = car.gridX + deltaX;
        const newGridY = car.gridY + deltaY;

        car.lastMoveDirection = { x: deltaX, y: deltaY };

        if (this.isValidMove(car, newGridX, newGridY)) {
            this.updateGridOccupancy(car, true);

            car.gridX = newGridX;
            car.gridY = newGridY;

            let newPixelX, newPixelY;

            if (car.direction === 'horizontal') {
                newPixelX = this.boardOffsetX + (car.gridX + car.size / 2) * this.tileSize;
                newPixelY = this.boardOffsetY + (car.gridY + 0.5) * this.tileSize;
            } else {
                newPixelX = this.boardOffsetX + (car.gridX + 0.5) * this.tileSize;
                newPixelY = this.boardOffsetY + (car.gridY + car.size / 2) * this.tileSize;
            }

            this.tweens.add({
                targets: car,
                x: newPixelX,
                y: newPixelY,
                duration: 150,
                ease: 'Power2'
            });

            this.updateGridOccupancy(car);

            if (this.isDebug) {
                this.debugLogGridState();
            }
        }
    }

    isValidMove(car, newGridX, newGridY) {
        // Check if new position is within bounds
        if (newGridX < 0 || newGridY < 0) return false;

        if (car.direction === 'horizontal') {
            // Check if rightmost position is within bounds
            if (newGridX + car.size > this.gridSize) return false;

            // Check if cells are occupied
            for (let x = newGridX; x < newGridX + car.size; x++) {
                if (this.grid[newGridY][x] && this.grid[newGridY][x] !== car) {
                    return false;
                }
            }
        } else { // vertical
            // Check if bottom position is within bounds
            if (newGridY + car.size > this.gridSize) return false;

            // Check if cells are occupied
            for (let y = newGridY; y < newGridY + car.size; y++) {
                if (this.grid[y][newGridX] && this.grid[y][newGridX] !== car) {
                    return false;
                }
            }
        }

        return true;
    }

    checkCarShouldExit(car) {
        // Only handle exit if we have a last move direction
        if (!car.lastMoveDirection) return;

        const { x: deltaX, y: deltaY } = car.lastMoveDirection;

        // Check if car can exit based on its position and last move direction
        if (car.direction === 'horizontal') {
            // Check if moving right and at/near right edge
            if (deltaX > 0 && car.gridX + car.size === this.gridSize) {
                this.handleCarExit(car, { x: 1, y: 0 });
                return true;
            }
            // Check if moving left and at/near left edge
            else if (deltaX < 0 && car.gridX === 0) {
                this.handleCarExit(car, { x: -1, y: 0 });
                return true;
            }
        } else { // vertical
            // Check if moving down and at/near bottom edge
            if (deltaY > 0 && car.gridY + car.size === this.gridSize) {
                this.handleCarExit(car, { x: 0, y: 1 });
                return true;
            }
            // Check if moving up and at/near top edge
            else if (deltaY < 0 && car.gridY === 0) {
                this.handleCarExit(car, { x: 0, y: -1 });
                return true;
            }
        }

        // Special case for target car exiting through designated exit
        if (car.isTarget && this.isCarAtExit(car)) {
            this.handleCarExit(car, { x: 1, y: 0 }); // Target car always exits to the right
            return true;
        }

        return false;
    }

    isCarAtExit(car) {
        // Special exit condition for target car (usually middle-right exit)
        if (car.isTarget && car.direction === 'horizontal') {
            return car.gridX + car.size === this.gridSize && car.gridY === 2; // Exit at position (6,2)
        }
        return false;
    }

    handleCarExit(car, exitDirection = { x: 0, y: 0 }) {
        this.updateGridOccupancy(car, true);

        let exitX = car.x;
        let exitY = car.y;

        if (exitDirection.x !== 0) {
            exitX += exitDirection.x * this.tileSize * 3; // Move 3 tiles beyond edge
        }
        if (exitDirection.y !== 0) {
            exitY += exitDirection.y * this.tileSize * 3; // Move 3 tiles beyond edge
        }

        this.tweens.add({
            targets: car,
            x: exitX,
            y: exitY,
            alpha: 0,
            duration: 500,
            ease: 'Sine.Out',
            onComplete: () => {
                this.cars = this.cars.filter(c => c !== car);
                car.destroy();

                this.checkLevelComplete();
            }
        });
    }

    checkLevelComplete() {
        if (this.cars.length === 0) {
            this.showLevelCompleteMessage();
        }
    }

    showLevelCompleteMessage() {
        const overlay = this.add.rectangle(this.sys.game.config.width / 2, this.sys.game.config.height / 2, this.sys.game.config.width, this.sys.game.config.height, 0x000000, 0.5);
        overlay.setOrigin(0.5);

        overlay.setInteractive();
        overlay.on('pointerdown', () => {
            this.restartGame();
        });

        const message = this.add.text(512, 384, 'Level Complete!', {
            fontFamily: 'Arial',
            fontSize: 48,
            color: '#ffffff'
        }).setOrigin(0.5);

        this.tweens.add({
            targets: message,
            scale: { from: 0.5, to: 1 },
            alpha: { from: 0, to: 1 },
            duration: 500,
            ease: 'Back.Out'
        });

    }

    restartGame() {
        this.scene.restart();
    }

    debugLogGridState() {
        if (!this.isDebug) return;

        console.log("Current Grid State:");
        let gridText = "";

        for (let y = 0; y < this.gridSize; y++) {
            let rowText = "";
            for (let x = 0; x < this.gridSize; x++) {
                rowText += `[g]`;
            }
            gridText += rowText + "\n";
        }

        console.log(gridText);
    }

    update(time, delta) {
        const newGrid = this.updateGrid(this.grid, time, this.move);
        this.move = null;
        if (newGrid !== null) {
            const oldGrid = this.grid;
            this.grid = newGrid;
            const idChanges = {};
            for (let y = 0; y < this.gridSize; y++) {
                for (let x = 0; x < this.gridSize; x++) {
                    if (oldGrid !== null) {
                        const oldId = oldGrid[y][x].id;
                        if (idChanges.hasOwnProperty(oldId)) {
                            idChanges[oldId][0] = [x, y];
                        } else {
                            idChanges[oldId] = [[x, y], null];
                        }
                    }

                    const newId = newGrid[y][x].id;
                    if (idChanges.hasOwnProperty(newId)) {
                        idChanges[newId][1] = [x, y];
                    } else {
                        idChanges[newId] = [null, [x, y]];
                    }
                }
            }

            for (const [id, [oldPos, newPos]] of Object.entries(idChanges)) {
                if (oldPos === null) {
                    const [newX, newY] = newPos;
                    const newPiece = newGrid[newY][newX];
                    if (newPiece instanceof Gem || newPiece instanceof SlidingGem) {
                        this.idSprites[id] = this.add.ellipse(
                            this.boardOffsetX + (newX + 0.5) * this.tileSize,
                            this.boardOffsetY + (newY + 0.5) * this.tileSize,
                            this.tileSize,
                            this.tileSize,
                            // https://tsitsul.in/blog/coloropt/
                            [0x4053d3, 0xddb310, 0xb51d14, 0x00beff, 0xfb49b0, 0x00b25d, 0xcacaca][newPiece.color],
                        );
                    }
                } else if (newPos === null) {
                    this.idSprites[id].destroy();
                } else {
                    const [oldX, oldY] = oldPos;
                    const [newX, newY] = newPos;
                    if (oldGrid[oldY][oldX] instanceof SlidingGem && (newGrid[newY][newX] instanceof Gem || newGrid[newY][newX] instanceof ShrinkingGem)) {
                        this.idSprites[id].x = this.boardOffsetX + (newX + 0.5) * this.tileSize;
                        this.idSprites[id].y = this.boardOffsetY + (newY + 0.5) * this.tileSize;
                    }
                }
            }
        }

        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                if (this.grid[y][x] instanceof SlidingGem) {
                    const gem = this.grid[y][x];
                    const sprite = this.idSprites[gem.id];
                    const remainder = (gem.arrivalTime - time) / SlidingGem.DURATION;
                    if (gem.direction == Direction.UP || gem.direction == Direction.DOWN) {
                        sprite.y = this.boardOffsetY + (y + 0.5 + (gem.direction == Direction.UP ? 1 : -1) * remainder) * this.tileSize;
                    } else {
                        sprite.x = this.boardOffsetX + (x + 0.5 + (gem.direction == Direction.LEFT ? 1 : -1) * remainder) * this.tileSize;
                    }
                } else if (this.grid[y][x] instanceof ShrinkingGem) {
                    const gem = this.grid[y][x];
                    const sprite = this.idSprites[gem.id];
                    const remainder = (gem.arrivalTime - time) / ShrinkingGem.DURATION;
                    sprite.setScale(remainder);
                }
            }
        }
    }

    updateGrid(oldGrid, time, move) {
        let firstUpdateTime = this.getFirstUpdateTime(oldGrid);
        if (oldGrid !== null && move === null && (firstUpdateTime === null || firstUpdateTime > time)) {
            return null;
        }

        const newGrid = this.copyGrid(oldGrid);

        if (move !== null) {
            const gem = new SlidingGem(newGrid[move.y][move.x].id);
            gem.color = newGrid[move.y][move.x].color;
            gem.arrivalTime = time + SlidingGem.DURATION;
            gem.direction = move.direction;
            const otherX = move.x + (move.direction === Direction.RIGHT) - (move.direction === Direction.LEFT);
            const otherY = move.y + (move.direction === Direction.DOWN) - (move.direction === Direction.UP);
            const otherGem = new SlidingGem(newGrid[otherY][otherX].id);
            otherGem.color = newGrid[otherY][otherX].color;
            otherGem.arrivalTime = time + SlidingGem.DURATION;
            otherGem.direction = (move.direction === Direction.LEFT ? Direction.RIGHT : move.direction === Direction.UP ? Direction.DOWN : move.direction == Direction.RIGHT ? Direction.LEFT : Direction.UP);
            newGrid[move.y][move.x] = otherGem;
            newGrid[otherY][otherX] = gem;
        }

        while (firstUpdateTime !== null && firstUpdateTime <= time) {
            this.updateGridOnce(newGrid, firstUpdateTime);
            firstUpdateTime = this.getFirstUpdateTime(newGrid);
        }

        return newGrid;
    }

    getFirstUpdateTime(grid) {
        if (grid === null) {
            return null;
        }

        let firstUpdateTime = null;
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                if (grid[y][x] instanceof SlidingGem) {
                    if (firstUpdateTime === null || grid[y][x].arrivalTime < firstUpdateTime) {
                        firstUpdateTime = grid[y][x].arrivalTime;
                    }
                } else if (grid[y][x] instanceof ShrinkingGem) {
                    if (firstUpdateTime === null || grid[y][x].arrivalTime < firstUpdateTime) {
                        firstUpdateTime = grid[y][x].arrivalTime;
                    }
                }
            }
        }

        return firstUpdateTime;
    }

    copyGrid(oldGrid) {
        const newGrid = []
        for (let y = 0; y < this.gridSize; y++) {
            const row = [];
            for (let x = 0; x < this.gridSize; x++) {
                if (oldGrid === null) {
                    const gem = new Gem();
                    gem.color = Math.floor(Math.random() * 7)
                    row.push(gem);
                } else {
                    row.push(oldGrid[y][x]);
                }
            }

            newGrid.push(row);
        }

        return newGrid;
    }

    updateGridOnce(grid, time) {
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                if (grid[y][x] instanceof SlidingGem && grid[y][x].arrivalTime <= time) {
                    const gem = new Gem(grid[y][x].id);
                    gem.color = grid[y][x].color;
                    grid[y][x] = gem;
                } else if (grid[y][x] instanceof ShrinkingGem && grid[y][x].arrivalTime <= time) {
                    grid[y][x] = new Hole();
                }
            }
        }

        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                const shape = this.getShape(grid, x, y);
                if (shape == 'xxx') {
                    for (let shapeX = x; shapeX < x + 3; shapeX++) {
                        const gem = new ShrinkingGem(grid[y][shapeX].id);
                        gem.color = grid[y][shapeX].color;
                        gem.arrivalTime = time + ShrinkingGem.DURATION;
                        grid[y][shapeX] = gem;
                    }
                } else if (shape == 'x\nx\nx') {
                    for (let shapeY = y; shapeY < y + 3; shapeY++) {
                        const gem = new ShrinkingGem(grid[shapeY][x].id);
                        gem.color = grid[shapeY][x].color;
                        gem.arrivalTime = time + ShrinkingGem.DURATION;
                        grid[shapeY][x] = gem;
                    }
                }
            }
        }
    }

    getShape(grid, x, y) {
        if (!(grid[y][x] instanceof Gem)) {
            return null;
        }

        const color = grid[y][x].color;
        if (x < this.gridSize - 2 && grid[y][x + 1] instanceof Gem && grid[y][x + 1].color === color && grid[y][x + 2] instanceof Gem && grid[y][x + 2].color === color) {
            return 'xxx';
        }

        if (y < this.gridSize - 2 && grid[y + 1][x] instanceof Gem && grid[y + 1][x].color === color && grid[y + 2][x] instanceof Gem && grid[y + 2][x].color === color) {
            return 'x\nx\nx';
        }

        return null;
    }
}
