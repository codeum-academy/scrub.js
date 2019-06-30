class Styles {
    canvas;

    constructor(canvas, width, height) {
        this.canvas = canvas;

        this.setEnvironmentStyles();

        this.setCanvasSize(width, height);
        window.addEventListener('resize', () => {
            this.setCanvasSize(width, height);
        });
    }

    setEnvironmentStyles() {
        document.body.style.margin = '0';
        document.body.style.height = '100' + 'vh';
        document.body.style.padding = '0';
        document.body.style.overflow = 'hidden';
    }

    setCanvasSize(width, height) {
        this.canvas.width = width ? width : document.body.clientWidth;
        this.canvas.height = height ? height : document.body.clientHeight;
    }
}
