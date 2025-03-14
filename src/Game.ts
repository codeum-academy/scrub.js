class Game {
    id: Symbol;
    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D;
    debugMode = 'none'; // none, hover, forever;
    debugBody = false;
    keyboard: Keyboard;
    mouse: Mouse;
    displayErrors = false;

    static GAME_READY_EVENT = 'scrubjs.game.ready';
    static STAGE_READY_EVENT = 'scrubjs.stage.ready';
    static STAGE_BACKGROUND_READY_EVENT = 'scrubjs.stage.background_ready';
    static SPRITE_READY_EVENT = 'scrubjs.sprite.ready';
    static SPRITE_COSTUME_READY_EVENT = 'scrubjs.sprite.costume_ready';
    static SPRITE_SOUND_READY_EVENT = 'scrubjs.sprite.sound_ready';

    private stages: Stage[] = [];
    private activeStage: Stage;
    private styles;
    private loadedStages = 0;
    private onReadyCallbacks = [];
    private onReadyPending = true;
    protected running = false;

    constructor(width: number = null, height: number = null, canvasId: string = null) {
        this.id = Symbol();
        this.keyboard = new Keyboard();

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
        this.mouse = new Mouse(this);
        this.context = this.canvas.getContext('2d');

        Registry.getInstance().set('game', this);

        this.addListeners();
    }

    addStage(stage: Stage) {
        this.stages.push(stage);
    }

    getLastStage(): Stage|null {
        if (!this.stages.length) {
            return null;
        }

        return this.stages[this.stages.length - 1];
    }

    getActiveStage(): Stage|null {
        if (this.activeStage) {
            return this.activeStage;
        }

        return null;
    }

    run(stage: Stage = null): void {
        if (!stage && this.stages.length) {
            stage = this.stages[0];
        }

        if (!stage) {
            this.throwError('You need create Stage instance before run game.');
        }

        if (this.activeStage && this.activeStage.running) {
            this.activeStage.stop();
        }

        this.activeStage = stage;
        this.activeStage.run();

        this.running = true;
    }

    isReady() {
        return this.loadedStages == this.stages.length;
    }

    onReady(callback) {
        this.onReadyCallbacks.push(callback);
    }

    stop(): void {
        if (this.activeStage && this.activeStage.running) {
            this.activeStage.stop();
        }

        this.running = false;
    }

    get width(): number {
        return this.canvas.width;
    }

    get height(): number {
        return this.canvas.height;
    }

    isInsideGame(x: number, y: number): boolean {
        return x >= 0 && x <= this.width && y >= 0 && y <= this.height;
    }

    correctMouseX(mouseX: number): number {
        return mouseX - this.styles.canvasRect.left;
    }

    correctMouseY(mouseY: number): number {
        return mouseY - this.styles.canvasRect.top;
    }

    keyPressed(char: string): boolean {
        return this.keyboard.keyPressed(char);
    }

    keyDown(char: string, callback): void {
        this.keyboard.keyDown(char, callback);
    }

    keyUp(char: string, callback): void {
        this.keyboard.keyUp(char, callback);
    }

    mouseDown(): boolean {
        return this.mouse.isDown;
    }

    getMousePoint(): Point {
        return this.mouse.getPoint();
    }

    getRandom(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    throwError(message) {
        if (this.displayErrors) {
            alert(message);
        }

        throw new Error(message);
    }

    private addListeners() {
        document.addEventListener(Game.STAGE_READY_EVENT, (event: CustomEvent) => {
            this.loadedStages++;
            this.tryDoOnReady();
        });
    }

    private tryDoOnReady() {
        if (this.isReady() && this.onReadyPending) {
            this.onReadyPending = false;

            if (this.onReadyCallbacks.length) {
                for (const callback of this.onReadyCallbacks) {
                    callback();
                }
                this.onReadyCallbacks = [];
            }

            let event = new CustomEvent(Game.GAME_READY_EVENT, {
                detail: {
                    game: this
                }
            });
            document.dispatchEvent(event);
        }
    }
}
