class Stage {
    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D;
    collisionSystem: CollisionSystem;
    debugMode = 'none'; // none, hover, forever;
    debugBody = false;

    private backgroundColor;
    private background = null;
    private backgroundIndex = null;
    private backgrounds = [];
    private sprites = [];
    private styles;
    private drawing;
    private topEdge: Polygon;
    private rightEdge: Polygon;
    private bottomEdge: Polygon;
    private leftEdge: Polygon;
    private _padding: number;

    constructor(canvasId: string = null, width: number = null, height: number = null, background: string = null, padding = 0) {
        this.collisionSystem = new CollisionSystem();

        if (canvasId) {
            const element = document.getElementById(canvasId);

            if (element instanceof HTMLCanvasElement) {
                this.canvas = element;
            }

        } else {
            this.canvas = document.createElement('canvas');
            document.body.appendChild(this.canvas);
        }

        this.canvas.width  = width;
        this.canvas.height = height;
        this.styles = new Styles(this.canvas, width, height);
        this.context = this.canvas.getContext('2d');

        if (background) {
            this.addBackground(background);
        }

        this.padding = padding;
        Registry.getInstance().set('stage', this);
    }

    set padding(padding: number) {
        this._padding = padding;

        this.topEdge = this.collisionSystem.createPolygon(0, 0, [[padding, padding], [this.width - padding, padding]]);
        this.rightEdge = this.collisionSystem.createPolygon(0, 0, [[this.width - padding, padding], [this.width - padding, this.height - padding]]);
        this.bottomEdge = this.collisionSystem.createPolygon(0, 0, [[this.width - padding, this.height - padding], [padding, this.height - padding]]);
        this.leftEdge = this.collisionSystem.createPolygon(0, 0, [[padding, this.height - padding], [padding, padding]]);
    }

    get padding(): number {
        return this._padding;
    }

    get width(): number {
        return this.canvas.width;
    }

    get height(): number {
        return this.canvas.height;
    }

    addSprite(sprite: Sprite): void {
        this.sprites.push(sprite);
    }

    deleteSprite(sprite: Sprite): void {
        this.sprites.splice(this.sprites.indexOf(sprite), 1);
    }

    addBackground(backgroundPath: string): void {
        const background = new Image();
        background.src = backgroundPath;

        this.backgrounds.push(background);

        if (this.backgroundIndex === null) {
            this.switchBackground(0);
        }
    }

    switchBackground(backgroundIndex: number): void {
        this.backgroundIndex = backgroundIndex;
        const background = this.backgrounds[backgroundIndex];

        if (background) {
            this.background = background;
        }
    }

    drawImage(image, x: number, y: number, w: number, h: number, direction: number, rotateStyle: string): void {
        if (rotateStyle === 'normal' && direction !== 0) {
            this.context.save();
            this.context.translate(x+w/2, y+h/2);
            this.context.rotate(direction * Math.PI / 180);
            this.context.translate(-x-w/2, -y-h/2);
        }

        if (rotateStyle === 'leftRight' && direction > 180) {
            this.context.save();
            this.context.translate(x + w / 2, 0);
            this.context.scale(-1, 1);

            // mirror image
            this.context.drawImage(image, -w / 2, y, w, h);

        } else {
            // usual image
            this.context.drawImage(image, x, y, w, h);
        }

        if (rotateStyle === 'normal' && direction !== 0 || rotateStyle === 'leftRight' && direction > 180) {
            this.context.restore();
        }
    }

    pen(callback): void {
        this.drawing = callback;
    }

    // @deprecated
    keyPressed(char: string): boolean {
        return keyPressed(char);
    }

    // @deprecated
    mouseDown(): boolean {
        return mouseDown();
    }

    // @deprecated
    getRandom(min: number, max: number): number {
        return random(min, max);
    }

    render(): void {
        this.context.clearRect(0, 0, this.width, this.height);

        if (this.backgroundColor) {
            this.context.fillStyle = this.backgroundColor;
            this.context.fillRect(0, 0, this.width, this.height);
        }

        if (this.background) {
            this.context.drawImage(this.background, 0, 0, this.width, this.height);
        }

        if (this.drawing) {
            this.drawing(this.context);
        }

        this.collisionSystem.update();

        if (this.debugBody) {
            this.collisionSystem.draw(this.context);
            this.context.stroke();
        }

        for (const sprite of this.sprites) {
            if (sprite.hidden || !sprite.costume) {
                continue;
            }

            if (this.debugMode !== 'none') {
                const fn = () => {
                    const x = sprite.x - (this.context.measureText(sprite.name).width / 2);
                    let y = sprite.realY + sprite.height + 20;

                    this.context.font = '16px Arial';
                    this.context.fillStyle = 'black';
                    this.context.fillText(sprite.name, x, y);
                    y += 20;

                    this.context.font = '14px Arial';
                    this.context.fillText("x: " + sprite.x, x, y);
                    y += 20;
                    this.context.fillText("y: " + sprite.y, x, y);
                    y += 20;
                    this.context.fillText("direction: " + sprite.direction, x, y);
                    y += 20;
                    this.context.fillText("costume: " + sprite.costumeNames[sprite.costumeIndex], x, y);
                };

                if (this.debugMode === 'hover') {
                    if (sprite.touchMouse()) {
                        fn();
                    }
                }

                if (this.debugMode === 'forever') {
                    fn();
                }
            }

            let phrase = sprite.getPhrase();
            if (phrase) {
                this.context.font = '20px Arial';
                this.context.fillStyle = 'black';
                this.context.fillText(phrase, 40, this.canvas.height - 40);
            }

            this.drawImage(
                sprite.costume.image,
                sprite.x - sprite.width / 2,
                sprite.y - sprite.height / 2,
                sprite.width,
                sprite.height,
                sprite.direction,
                sprite.rotateStyle
            );
        }
    }

    timeout(callback, timeout: number): void {
        setTimeout(() => {
            requestAnimationFrame(() => callback(this));
        }, timeout);
    }

    interval(callback, timeout = null): void {
        const result = callback(this);
        if (result === false) {
            return;
        }

        if (result > 0) {
            timeout = result;
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

    run(): void {
        this.interval(() => {
            this.render();
        });
    }

    getTopEdge(): Polygon {
        return this.topEdge;
    }

    getRightEdge(): Polygon {
        return this.rightEdge;
    }

    getBottomEdge(): Polygon {
        return this.bottomEdge;
    }

    getLeftEdge(): Polygon {
        return this.leftEdge;
    }
}
