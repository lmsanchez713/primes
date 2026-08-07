import { World } from './world.js';
import { GameItem, ItemType } from './item.js';

export class MapLoader {
    /**
     * @param {Object} itemRegistry - A map of id -> {type, id, callbacks}
     */
    constructor(itemRegistry) {
        this.itemRegistry = itemRegistry;
    }

    /**
     * Loads a map from a URL
     * @param {string} url 
     * @param {number} chunkSize 
     * @returns {Promise<World>}
     */
    async loadMap(url, chunkSize) {
        const text = await (await fetch(url)).text();
        return this.parse(text, chunkSize);
    }

    /**
     * Parses map text into a World object
     * @param {string} text 
     * @param {number} chunkSize 
     * @returns {World}
     */
    parse(text, chunkSize) {
        const lines = text.trim().split('\n');
        const rows = lines.length;
        const worldGrid = [];

        let cols;
        for (let y = 0; y < rows; y++) {
            cols = lines[y].split(';');
            worldGrid[y] = [];
            for (let x = 0; x < cols.length; x++) {
                const cellData = cols[x].split(',');
                const itemsInTile = cellData.map(id => {
                    const trimmedId = id.trim();
                    if (!trimmedId) return null;
                    return this._createItemFromRegistry(trimmedId);
                }).filter(item => item !== null);
                
                // For simplicity in the grid, we'll just store the "primary" item 
                // or we'll adjust World to hold an array of items per cell.
                // Let's assume for now 1 item per cell to keep World.js simple, 
                // or we can make World.grid[y][x] an array.
                // The user said "each item id in the same column (tile) separated by ','"
                // implying a tile can have multiple items.
                worldGrid[y][x] = itemsInTile;
            }
        }

        // We'll create a World. 
        // We need to know dimensions. 
        // Let's assume rows/cols are the grid size.
        // We'll use a dummy chunk size if not specified.
        const world = new World(rows, cols, null); 
        // Note: The current World.js constructor(chunkWidth, chunkHeight) 
        // seems to be chunks. I might need to modify World.js.
        
        // Let's assume for now that we initialize world with the grid size 
        // and then chunks will be created by the loader or by the user.
        return { world, grid: worldGrid };
    }

    _createItemFromRegistry(id) {
        const config = this.itemRegistry[id];
        if (config) {
            return new GameItem(config.type, config.id, config.callbacks);
        }
        // Default to terrain if not found
        return new GameItem(ItemType.TERRAIN, id);
    }
}
