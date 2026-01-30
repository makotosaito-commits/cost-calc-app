import Dexie, { Table } from 'dexie';
import { Material, Menu, Recipe } from '../types';

export class CostCalcDB extends Dexie {
    materials!: Table<Material>;
    menus!: Table<Menu>;
    recipes!: Table<Recipe>;

    constructor() {
        super('CostCalcDB');
        this.version(1).stores({
            materials: 'id, name, category', // Primary key and indexed props
            menus: 'id, name',
            recipes: 'id, menu_id, material_id'
        });
    }
}

export const db = new CostCalcDB();
