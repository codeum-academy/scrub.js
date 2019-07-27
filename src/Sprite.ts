class Sprite {
    name = 'No name';
    size = 100;
    rotateStyle = 'normal'; // 'normal', 'leftRight', 'none'
    singleBody = true;

    private body: Polygon;
    private costumeIndex = null;
    private costume: Costume = null;
    private stage;
    private costumes = [];
    private costumeNames = [];
    private sounds = [];
    private deleted = false;
    private stopped = false;
    private phrase;
    private phraseLiveTime = null;
    public position; // remake to getter and setter
    private _x = 0;
    private _y = 0;
    private _direction = 0;
    private _hidden = false;

    constructor(costumePaths = [], soundPaths = []) {
        if (!Registry.getInstance().has('stage')) {
            throw new Error('You need create stage before sprite.');
        }

        this.stage = Registry.getInstance().get('stage');
        this.position = this.stage.addSprite(this);

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

            if (this.singleBody) {
                if (!(this.body instanceof Polygon)) {
                    this.createBody(costume);
                }

                costume.image.addEventListener('load', () => {
                    this.createBody(costume);
                }, false);

            } else {
                if (this.body instanceof Polygon) {
                    this.removeBody();
                }

                if (costume.body instanceof Polygon) {
                    this.createBody(costume);
                }

                // Fix bug when costume.body is undefined
                costume.image.addEventListener('load', () => {
                    this.createBody(costume);
                }, false);
            }
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

    changePosition(newPosition: number): void {
        this.stage.changeSpritePosition(this, newPosition);
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

    touchSprite(sprite: Sprite, result: CollisionResult = null): boolean {
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

    touchSprites(sprites: Sprite[], result: CollisionResult = null): boolean {
        for (const sprite of sprites) {
            if (this.touchSprite(sprite, result)) {
                return true;
            }
        }

        return false;
    }

    touchPotentialSprites(sprites: Sprite[], result: CollisionResult = null): boolean {
        if (!(this.body instanceof Polygon)) {
            return false;
        }

        const potentials = this.body.potentials();
        if (!potentials.length) {
            return false;
        }

        const potentialSprites = [];
        for (const sprite of sprites) {
            if (potentials.indexOf(sprite.getBody()) > -1) {
                potentialSprites.push(sprite);
            }
        }

        for (const potentialSprite of potentialSprites) {
            if (this.touchSprite(potentialSprite, result)) {
                return true;
            }
        }

        return false;
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

        return this.body.collides(getMousePoint(), result);
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

    createClone(): Sprite {
        const clone = new Sprite();

        clone.x = this.x;
        clone.y = this.y;
        clone.direction = this.direction;
        clone.size = this.size;
        clone.hidden = this.hidden;

        for (const costume of this.costumes) {
            clone.addCostume(costume.image.src);
        }
        clone.switchCostume(this.costumeIndex);

        clone.deleted = this.deleted;
        clone.stopped = this.stopped;

        return clone;
    }

    // @deprecated
    cloneSprite(): Sprite {
        return this.createClone();
    }

    timeout(callback, timeout: number): void {
        setTimeout(() => {
            if (this.deleted || this.stopped) {
                return;
            }

            requestAnimationFrame(() => callback(this));
        }, timeout);
    }

    interval(callback, timeout = null): void {
        if (this.deleted || this.stopped) {
            return;
        }

        const result = callback(this);
        if (result === false) {
            return;
        }

        if (timeout) {
            setTimeout(() => {
                requestAnimationFrame(() => this.interval(callback, timeout));
            }, timeout);

        } else {
            requestAnimationFrame(() => this.interval(callback));
        }
    }

    // @deprecated
    forever(callback, timeout = null): void {
        this.interval(callback, timeout);
    }

    delete(): void {
        if (this.deleted) {
            return;
        }

        this.stage.deleteSprite(this);

        let props = Object.keys(this);
        for (let i = 0; i < props.length; i++) {
            delete this[props[i]];
        }

        this.deleted = true;
    }

    stop(): void {
        this.stopped = true;
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
            if (this.rotateStyle == 'leftRight') {
                this.body.angle = 0; // to radian

            } else {
                this.body.angle = this._direction * 3.14 / 180; // to radian
            }

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

    set hidden(value: boolean) {
        this._hidden = value;

        // TODO need test
        // if (value) {
        //     this.removeBody();
        //
        // } else {
        //     if (this.costume instanceof Costume) {
        //         this.createBody(this.costume);
        //     }
        // }
    }

    get hidden() {
        return this._hidden;
    }

    private removeBody() {
        if (this.body instanceof Polygon) {
            this.stage.collisionSystem.remove(this.body);
            this.body = null;
        }
    }

    private createBody(costume: Costume) {
        this.body = costume.body;
        this.body.scale_x = this.size / 100;
        this.body.scale_y = this.size / 100;

        this.stage.collisionSystem.insert(this.body);
    }
}
