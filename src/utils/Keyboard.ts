class Keyboard {
    keys = {};

    constructor() {
        document.addEventListener('keydown', (event) => {
            const char = KeyboardMap.getChar(event.keyCode);

            this.keys[char] = true;
        });

        document.addEventListener('keyup', (event) => {
            const char = KeyboardMap.getChar(event.keyCode);

            delete this.keys[char]
        });
    }

    keyPressed(char) {
        return this.keys[char.toUpperCase()] !== undefined;
    }

    keyDown(char: string, callback) {
        document.addEventListener('keydown', (event) => {
            const pressedChar = KeyboardMap.getChar(event.keyCode);

            if (char.toUpperCase() == pressedChar) {
                callback(event);
            }
        });
    }

    keyUp(char: string, callback) {
        document.addEventListener('keyup', (event) => {
            const pressedChar = KeyboardMap.getChar(event.keyCode);

            if (char.toUpperCase() == pressedChar) {
                callback(event);
            }
        });
    }
}
