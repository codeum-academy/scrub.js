class Mouse {
    x = 0;
    y = 0;
    isDown = false;
    private point: Point;

    constructor(game: Game) {
        document.addEventListener('mousedown', () => {
            this.isDown = true;
        });

        document.addEventListener('mouseup', () => {
            this.isDown = false;
        });

        document.addEventListener('mousemove', (e) => {
            this.x = game.correctMouseX(e.clientX);
            this.y = game.correctMouseY(e.clientY);
        });

        this.point = new Point(this.x, this.y);
    }

    getPoint() {
        this.point.x = this.x;
        this.point.y = this.y;

        return this.point;
    }
}
