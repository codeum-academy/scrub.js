class Sprite {
    name = 'No name';
    size = 100;
    rotateStyle = 'normal'; // 'normal', 'leftRight', 'none'
    hidden = false;

    private body: Polygon;
    private costumeIndex = null;
    private costume: Costume = null;
    private stage;
    private costumes = [];
    private costumeNames = [];
    private sounds = [];
    private deleted = false;
    private phrase;
    private phraseLiveTime = null;
    private _x = 0;
    private _y = 0;
    private _direction = 0;

    constructor(costumePaths = [], soundPaths = []) {
        if (!Registry.getInstance().has('stage')) {
            throw new Error('You need create stage before sprite.');
        }

        this.stage = Registry.getInstance().get('stage');
        this.stage.addSprite(this);

        this._x = this.stage.width / 2;
        this._y = this.stage.height / 2;

        for (const costumePath of costumePaths) {
            this.addCostume(costumePath);
        }

        for (const soundPath of soundPaths) {
            this.addSound(soundPath);
        }
    }

    addCostume(costumePath, name = null): void {
        const costume = new Costume();

        const image = new Image();
        image.src = costumePath;

        costume.image = image;
        this.costumes.push(costume);

        image.addEventListener('load', () => {
            costume.width = image.naturalWidth;
            costume.height = image.naturalHeight;

            costume.body = new Polygon(this.x, this.y, [
                [(costume.width / 2) * -1, (costume.height / 2) * -1],
                [costume.width / 2, (costume.height / 2) * -1],
                [costume.width / 2, costume.height / 2],
                [(costume.width / 2) * -1, costume.height / 2]
            ]);

            if (this.costume === null) {
                this.switchCostume(0);
            }
        }, false);

        if (!name) {
            const costumeIndex = this.costumes.length - 1;
            name = 'no name ' + costumeIndex;
        }

        this.costumeNames.push(name);
    }

    switchCostume(costumeIndex): void {
        this.costumeIndex = costumeIndex;
        const costume = this.costumes[costumeIndex];

        if (costume instanceof Costume) {
            this.costume = costume;

            if (this.body instanceof Polygon) {
                this.stage.collisionSystem.remove(this.body);
            }

            if (costume.body instanceof Polygon) {
                this.body = costume.body;
                this.body.scale_x = this.size / 100;
                this.body.scale_y = this.size / 100;

                this.stage.collisionSystem.insert(this.body);
            }

            // Fix bug with costume.body is undefined
            costume.image.addEventListener('load', () => {
                this.body = costume.body;
                this.body.scale_x = this.size / 100;
                this.body.scale_y = this.size / 100;

                this.stage.collisionSystem.insert(this.body);
            }, false);
        }
    }

    switchCostumeByName(costumeName): void {
        const costumeIndex = this.costumeNames.indexOf(costumeName);

        if (costumeIndex > -1) {
            this.switchCostume(costumeIndex);

        } else {
            throw new Error('Name ' + costumeName +  'not found.');
        }
    }

    nextCostume(): void {
        let nextCostume = this.costumeIndex + 1;

        if (nextCostume > this.costumes.length - 1) {
            nextCostume = 0;
        }

        this.switchCostume(nextCostume);
    }

    addSound(soundPath): void {
        const sound = new Audio();
        sound.src = soundPath;

        this.sounds.push(sound);
    }

    playSound(soundIndex): void {
        const sound = this.sounds[soundIndex];

        if (sound instanceof Audio) {
            sound.play();
        }
    }

    move(steps): void {
        this.x += (steps * Math.sin(this.direction * Math.PI / 180));
        this.y -= (steps * Math.cos(this.direction * Math.PI / 180));
    }

    bounceOnEdge(): void {
        if (this.touchTopEdge() || this.touchBottomEdge()) {
            this.direction = 180 - this.direction;
        }

        if (this.touchLeftEdge() || this.touchRightEdge()) {
            this.direction *= -1;
        }
    }

    touchSprite(sprite, result: CollisionResult = null): boolean {
        if (
            sprite.hidden ||
            this.hidden ||
            !(sprite.getBody() instanceof Body) ||
            !(this.body instanceof Body)
        ) {
            return false;
        }

        return this.body.collides(sprite.getBody(), result);
    }

    touchEdge(result: CollisionResult = null): boolean {
        if (!(this.body instanceof Body)) {
            return false;
        }

        if (this.body.collides(this.stage.getTopEdge(), result)) {
            return true;

        } else if (this.body.collides(this.stage.getRightEdge(), result)) {
            return true;

        } else if (this.body.collides(this.stage.getBottomEdge(), result)) {
            return true;

        } else if (this.body.collides(this.stage.getLeftEdge(), result)) {
            return true;
        }

        return false;
    }

    touchTopEdge(result: CollisionResult = null): boolean {
        if (!(this.body instanceof Body)) {
            return false;
        }

        return this.body.collides(this.stage.getTopEdge(), result);
    }

    touchLeftEdge(result: CollisionResult = null): boolean {
        if (!(this.body instanceof Body)) {
            return false;
        }

        return this.body.collides(this.stage.getLeftEdge(), result);
    }

    touchRightEdge(result: CollisionResult = null): boolean {
        if (!(this.body instanceof Body)) {
            return false;
        }

        return this.body.collides(this.stage.getRightEdge(), result);
    }

    touchBottomEdge(result: CollisionResult = null): boolean {
        if (!(this.body instanceof Body)) {
            return false;
        }

        return this.body.collides(this.stage.getBottomEdge(), result);
    }

    touchMouse(result: CollisionResult = null): boolean {
        if (!(this.body instanceof Body)) {
            return false;
        }

        return this.body.collides(this.stage.getMouse().getPoint(), result);
    }

    pointForward(sprite): void {
        this.direction = (Math.atan2(this.y - sprite.y , this.x - sprite.x) / Math.PI * 180) - 90
    }

    // TODO deprecated
    getDistanceTo(sprite: Sprite|Mouse): number {
        return Math.sqrt((Math.abs(this.x - sprite.x)) + (Math.abs(this.y - sprite.y)));
    }

    getDistanceToSprite(sprite: Sprite): number {
        return Math.sqrt((Math.abs(this.x - sprite.x)) + (Math.abs(this.y - sprite.y)));
    }

    getDistanceToMouse(mouse: Mouse): number {
        return Math.sqrt((Math.abs(this.x - mouse.x)) + (Math.abs(this.y - mouse.y)));
    }

    say(text, time = null): void {
        this.phrase = this.name + ': ' + text;

        this.phraseLiveTime = null;
        if (time) {
            const currentTime = (new Date()).getTime();
            this.phraseLiveTime = currentTime + time;
        }
    }

    getPhrase(): string|null {
        if (this.phrase) {
            if (this.phraseLiveTime === null) {
                return this.phrase;
            }

            const currentTime = (new Date()).getTime();
            if (this.phraseLiveTime > currentTime) {
                return this.phrase;

            } else {
                this.phrase = null;
                this.phraseLiveTime = null;
            }
        }

        return null;
    }

    // TODO need modify
    cloneSprite(): Sprite {
        const clone = new Sprite();

        clone.x = this.x;
        clone.y = this.y;
        clone.direction = this.direction;
        clone.size = this.size;
        clone.hidden = this.hidden;
        clone.costume = this.costume;
        clone.costumeIndex = this.costumeIndex;
        clone.costumes = this.costumes;
        clone.body = this.body;

        return clone;
    }

    forever(callback, timeout = null): void {
        const result = callback(this);

        if (result !== false && !this.deleted) {
            if (timeout) {
                setTimeout(() => {
                    requestAnimationFrame(() => this.forever(callback, timeout));
                }, timeout);

            } else {
                requestAnimationFrame(() => this.forever(callback));
            }
        }
    }

    // TODO need modify
    delete(): void {
        this.stage.deleteSprite(this);
        this.deleted = true;
    }

    getBody(): Polygon {
        return this.body;
    }

    set direction (direction: number) {
        if ((direction * 0) !== 0) { // d is +/-Infinity or NaN
            return;
        }

        direction = direction % 360;

        if (direction < 0) {
            direction += 360;
        }

        this._direction = (direction > 360) ? direction - 360 : direction;

        if (this.body instanceof Polygon) {
            this.body.angle = this._direction * 3.14 / 180; // to radian
        }
    }

    get direction(): number {
        return this._direction;
    }

    get width() {
        if (this.costume) {
            return this.costume.width * this.size / 100;
        }

        return null;
    }

    get height(): number {
        if (this.costume) {
            return this.costume.height * this.size / 100;
        }

        return null;
    }

    set x(value: number) {
        this._x = value;

        if (this.body instanceof Polygon) {
            this.body.x = value;
        }
    }

    get x(): number {
        return this._x;
    }

    set y(value: number) {
        this._y = value;

        if (this.body instanceof Polygon) {
            this.body.y = value;
        }
    }

    get y(): number {
        return this._y;
    }

    get realX(): number {
        return this.x - this.width / 2;
    }

    get realY(): number {
        return this.y - this.height / 2;
    }
}