class Registry {
    private static instance: Registry;
    private data = {};

    private constructor() {}

    public static getInstance(): Registry {
        if (!this.instance) {
            this.instance = new Registry();
        }

        return this.instance;
    }

    public set(name: string, value: any) {
        this.data[name] = value;
    }

    public has(name: string): boolean {
        return this.data[name] !== undefined;
    }

    public get(name: string): any {
        return this.data[name];
    }
}
