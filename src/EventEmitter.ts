class EventEmitter {
  private eventTarget: EventTarget;
  private callbacksMap = new Map<string, {type: string, callback: EventListenerOrEventListenerObject}>();

  constructor() {
    this.eventTarget = new EventTarget();
  }

  once(name: string, type: string, callback: EventListenerOrEventListenerObject): boolean {
    if (this.callbacksMap.get(name)) {
      return false;
    }

    const wrapper: EventListener = (event) => {
      if (typeof callback === 'function') {
        callback(event);

      } else {
        callback.handleEvent(event);
      }

      this.eventTarget.removeEventListener(type, wrapper);
      this.remove(name);
    };

    this.eventTarget.addEventListener(type, wrapper);
    this.callbacksMap.set(name, {type, callback: wrapper});

    return true;
  }

  on(name: string, type: string, callback: EventListenerOrEventListenerObject): boolean {
    if (this.callbacksMap.get(name)) {
      return false;
    }

    this.eventTarget.addEventListener(type, callback);
    this.callbacksMap.set(name, {type, callback});

    return true;
  }

  emit(type: string, detail: any) {
    this.eventTarget.dispatchEvent(new CustomEvent(type, { detail }));
  }

  remove(name: string): boolean {
    const item = this.callbacksMap.get(name);

    if (!item) {
      return false;
    }

    this.eventTarget.removeEventListener(item.type, item.callback);
    this.callbacksMap.delete(name);

    return true;
  }

  removeByType(type: string) {
    this.callbacksMap.forEach((item, itemName) => {
      if (type === item.type) {
        this.eventTarget.removeEventListener(item.type, item.callback);
        this.callbacksMap.delete(itemName);
      }
    });
  }

  clearAll(): void {
    this.callbacksMap.forEach(item => {
      this.eventTarget.removeEventListener(item.type, item.callback);
    });

    this.callbacksMap.clear();
  }
}
