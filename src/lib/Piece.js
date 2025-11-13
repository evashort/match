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

export class ShrinkingGem extends Piece {
    static DURATION = 250;
    color;
    arrivalTime;
    constructor(id = null) {
        super(id);
    }
}

export class FallingGem extends Piece {
    static DURATIONS = [1000, 1000*.5, 1000*.5**2, 1000*.5**3, 1000*.5**4, 1000*.5**5, 1000*.5**6, 1000*.5**7, 1000*.5**8];
    static duration(distance) {
        let result = 0;
        for (let i = 0; i < distance; i++) {
            result += FallingGem.DURATIONS[i] * Math.min(distance - i, 1);
        }

        return result;
    }

    color;
    arrivalTime;
    constructor(id = null) {
        super(id);
    }

    height(time) {
        let delta = this.arrivalTime - time;
        let height = 0;
        while (delta > FallingGem.DURATIONS[height]) {
            delta -= FallingGem.DURATIONS[height];
            height++;
        }

        height += delta / FallingGem.DURATIONS[height];
        return height;
    }
}

export class Hole extends Piece {
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
