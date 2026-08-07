export const ItemType = {
    TERRAIN: 'TERRAIN',
    FIXED_OBJECT: 'FIXED_OBJECT',
    MOVABLE_ITEM: 'MOVABLE_ITEM',
    CREATURE: 'CREATURE'
};

export class GameItem {
    /**
     * @param {string} type - One of ItemType
     * @param {string|number} id - The ID of the item type (for sprite lookups)
     * @param {Object} callbacks - Optional callbacks
     * @param {Function} callbacks.on_move_into - (entity, from, to) => {}
     * @param {Function} callbacks.on_move_from - (entity, from, to) => {}
     * @param {Function} callbacks.on_use - (entity, item) => {}
     */
    constructor(type, id, callbacks = {}) {
        this.type = type;
        this.id = id;
        this.callbacks = callbacks;
    }
}
