class Mouse {
    x = 0;
    y = 0;
    isDown = false;
    private point: Point;

    constructor() {
        document.addEventListener('mousedown', () => {
            this.isDown = true;
        });

        document.addEventListener('mouseup', () => {
            this.isDown = false;
        });

        document.addEventListener('mousemove', (e) => {
            this.x = e.clientX;
            this.y = e.clientY;
        });

        this.point = new Point(this.x, this.y);
    }

    getPoint() {
        this.point.x = this.x;
        this.point.y = this.y;

        return this.point;
    }
}
