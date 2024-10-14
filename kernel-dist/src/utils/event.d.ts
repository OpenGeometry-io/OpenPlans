/**
 * Original source: Simple event handler by [Jason Kleban](https://gist.github.com/JasonKleban/50cee44960c225ac1993c922563aa540). Keep in mind that if you want to remove it later, you might want to declare the callback as an object. If you want to maintain the reference to `this`, you will need to declare the callback as an arrow function.
 * Adapted to TypeScript by ThatOpen Company
 */
export declare class Event<T> {
    /**
     * Add a callback to this event instance.
     * @param handler - the callback to be added to this event.
     */
    add(handler: T extends void ? {
        (): void;
    } : {
        (data: T): void;
    }): void;
    /**
     * Removes a callback from this event instance.
     * @param handler - the callback to be removed from this event.
     */
    remove(handler: T extends void ? {
        (): void;
    } : {
        (data: T): void;
    }): void;
    /** Triggers all the callbacks assigned to this event. */
    trigger: (data?: T) => void;
    /** Gets rid of all the suscribed events. */
    reset(): void;
    private handlers;
}
