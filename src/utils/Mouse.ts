class Mouse {
    x = 0;
    y = 0;
    isDown = false;
    private point: Point;

    constructor(styles) {
        document.addEventListener('mousedown', () => {
            this.isDown = true;
        });

        document.addEventListener('mouseup', () => {
            this.isDown = false;
        });

        document.addEventListener('mousemove', (e) => {
            this.x = e.clientX - styles.canvasRect.left;
            this.y = e.clientY - styles.canvasRect.top;
        });

        this.point = new Point(this.x, this.y);
    }

    getPoint() {
        this.point.x = this.x;
        this.point.y = this.y;

        return this.point;
    }
}
