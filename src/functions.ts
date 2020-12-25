/// <reference path="utils/Keyboard.ts"/>
/// <reference path="utils/Mouse.ts"/>
/// <reference path="collisions/Point.ts"/>

const keyboard = new Keyboard();
const mouse = new Mouse();

function keyPressed(char: string): boolean {
    return keyboard.keyPressed(char);
}

function keyDown(char: string, callback): void {
    keyboard.keyDown(char, callback);
}

function keyUp(char: string, callback): void {
    keyboard.keyUp(char, callback);
}

function mouseDown(): boolean {
    return mouse.isDown;
}

function getMousePoint(): Point {
    return mouse.getPoint();
}

function random(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
