export class Piece {
    static nextId = 0;
    id;
    constructor(id = null) {
        if (id === null) {
            id = Piece.nextId;
            Piece.nextId++;
        }

        this.id = id;
    }
}

export class Gem extends Piece {
    color;
    constructor(id = null) {
        super(id);
    }
}

export const Direction = {
    LEFT: 0,
    UP: 1,
    RIGHT: 2,
    DOWN: 3,
};

export class SlidingGem extends Piece {
    static DURATION = 250;
    color;
    arrivalTime;
    direction;
    constructor(id = null) {
        super(id);
    }
}
