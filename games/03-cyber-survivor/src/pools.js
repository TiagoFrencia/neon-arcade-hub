import { CYBER_COLORS } from './constants';
let nextEnemyId = 1;
export class EnemyPool {
    pool = [];
    activeList = [];
    constructor(size = 500) {
        for (let i = 0; i < size; i++) {
            this.pool.push({
                active: false,
                id: 0,
                type: 'triangle',
                x: 0,
                y: 0,
                vx: 0,
                vy: 0,
                radius: 12,
                hp: 20,
                maxHp: 20,
                speed: 160,
                damage: 10,
                xpType: 'green',
                xpValue: 1,
                color: CYBER_COLORS.magenta,
                angle: 0,
                splitCount: 0,
                isBoss: false,
                hitFlashTimer: 0,
                shieldContactCooldown: 0
            });
        }
    }
    spawn(type, x, y, options) {
        let enemy = this.pool.find((e) => !e.active);
        if (!enemy) {
            // If pool exhausted, recycle oldest non-boss enemy
            enemy = this.activeList.find((e) => !e.isBoss);
            if (!enemy)
                return null;
        }
        const hpMult = options?.hpMultiplier ?? 1;
        const spdMult = options?.speedMultiplier ?? 1;
        enemy.active = true;
        enemy.id = nextEnemyId++;
        enemy.type = type;
        enemy.x = x;
        enemy.y = y;
        enemy.vx = 0;
        enemy.vy = 0;
        enemy.angle = 0;
        enemy.hitFlashTimer = 0;
        enemy.shieldContactCooldown = 0;
        enemy.splitCount = options?.splitCount ?? 0;
        switch (type) {
            case 'triangle': // Fast swarmers
                enemy.radius = 12;
                enemy.maxHp = Math.round(18 * hpMult);
                enemy.hp = enemy.maxHp;
                enemy.speed = 180 * spdMult;
                enemy.damage = 10;
                enemy.xpType = 'green';
                enemy.xpValue = 1;
                enemy.color = CYBER_COLORS.magenta;
                enemy.isBoss = false;
                break;
            case 'tank': // Slow bullet sponges
                enemy.radius = 20;
                enemy.maxHp = Math.round(95 * hpMult);
                enemy.hp = enemy.maxHp;
                enemy.speed = 80 * spdMult;
                enemy.damage = 20;
                enemy.xpType = 'blue';
                enemy.xpValue = 5;
                enemy.color = CYBER_COLORS.purple;
                enemy.isBoss = false;
                break;
            case 'splitter': // Splits on death
                enemy.radius = 17;
                enemy.maxHp = Math.round(50 * hpMult);
                enemy.hp = enemy.maxHp;
                enemy.speed = 120 * spdMult;
                enemy.damage = 14;
                enemy.xpType = 'green';
                enemy.xpValue = 3;
                enemy.color = CYBER_COLORS.yellow;
                enemy.isBoss = false;
                break;
            case 'mini_splitter': // Fast mini offspring
                enemy.radius = 9;
                enemy.maxHp = Math.round(20 * hpMult);
                enemy.hp = enemy.maxHp;
                enemy.speed = 195 * spdMult;
                enemy.damage = 8;
                enemy.xpType = 'green';
                enemy.xpValue = 1;
                enemy.color = CYBER_COLORS.yellow;
                enemy.isBoss = false;
                break;
            case 'boss': // Giant 2-minute titan
                enemy.radius = 48;
                enemy.maxHp = Math.round(1600 * hpMult);
                enemy.hp = enemy.maxHp;
                enemy.speed = 65 * spdMult;
                enemy.damage = 35;
                enemy.xpType = 'boss';
                enemy.xpValue = 40;
                enemy.color = '#ff0033';
                enemy.isBoss = true;
                break;
        }
        if (!this.activeList.includes(enemy)) {
            this.activeList.push(enemy);
        }
        return enemy;
    }
    release(enemy) {
        enemy.active = false;
        const index = this.activeList.indexOf(enemy);
        if (index !== -1) {
            this.activeList.splice(index, 1);
        }
    }
    getActives() {
        return this.activeList;
    }
    clear() {
        for (let i = 0; i < this.pool.length; i++) {
            this.pool[i].active = false;
        }
        this.activeList.length = 0;
    }
}
export class ProjectilePool {
    pool = [];
    activeList = [];
    constructor(size = 300) {
        for (let i = 0; i < size; i++) {
            this.pool.push({
                active: false,
                x: 0,
                y: 0,
                vx: 0,
                vy: 0,
                radius: 6,
                damage: 20,
                color: CYBER_COLORS.cyan,
                life: 0,
                maxLife: 2,
                pierce: 0,
                hitEnemies: new Set()
            });
        }
    }
    spawn(x, y, vx, vy, damage, radius = 6, color = CYBER_COLORS.cyan, maxLife = 2.2, pierce = 0) {
        let proj = this.pool.find((p) => !p.active);
        if (!proj) {
            proj = this.activeList.shift();
            if (!proj)
                return null;
        }
        proj.active = true;
        proj.x = x;
        proj.y = y;
        proj.vx = vx;
        proj.vy = vy;
        proj.damage = damage;
        proj.radius = radius;
        proj.color = color;
        proj.life = maxLife;
        proj.maxLife = maxLife;
        proj.pierce = pierce;
        proj.hitEnemies.clear();
        if (!this.activeList.includes(proj)) {
            this.activeList.push(proj);
        }
        return proj;
    }
    release(proj) {
        proj.active = false;
        proj.hitEnemies.clear();
        const index = this.activeList.indexOf(proj);
        if (index !== -1) {
            this.activeList.splice(index, 1);
        }
    }
    getActives() {
        return this.activeList;
    }
    clear() {
        for (let i = 0; i < this.pool.length; i++) {
            this.pool[i].active = false;
            this.pool[i].hitEnemies.clear();
        }
        this.activeList.length = 0;
    }
}
export class GemPool {
    pool = [];
    activeList = [];
    constructor(size = 400) {
        for (let i = 0; i < size; i++) {
            this.pool.push({
                active: false,
                x: 0,
                y: 0,
                vx: 0,
                vy: 0,
                value: 1,
                type: 'green',
                radius: 6,
                color: CYBER_COLORS.green,
                isMagnetized: false,
                pulseTimer: 0
            });
        }
    }
    spawn(x, y, type, value) {
        let gem = this.pool.find((g) => !g.active);
        if (!gem) {
            gem = this.activeList.shift();
            if (!gem)
                return null;
        }
        gem.active = true;
        gem.x = x + (Math.random() * 12 - 6);
        gem.y = y + (Math.random() * 12 - 6);
        gem.vx = (Math.random() - 0.5) * 40;
        gem.vy = (Math.random() - 0.5) * 40;
        gem.type = type;
        gem.value = value;
        gem.isMagnetized = false;
        gem.pulseTimer = Math.random() * Math.PI * 2;
        switch (type) {
            case 'green':
                gem.radius = 5.5;
                gem.color = CYBER_COLORS.green;
                break;
            case 'blue':
                gem.radius = 7.5;
                gem.color = CYBER_COLORS.cyan;
                break;
            case 'boss':
                gem.radius = 12;
                gem.color = '#e040fb';
                break;
        }
        if (!this.activeList.includes(gem)) {
            this.activeList.push(gem);
        }
        return gem;
    }
    release(gem) {
        gem.active = false;
        const index = this.activeList.indexOf(gem);
        if (index !== -1) {
            this.activeList.splice(index, 1);
        }
    }
    getActives() {
        return this.activeList;
    }
    clear() {
        for (let i = 0; i < this.pool.length; i++) {
            this.pool[i].active = false;
        }
        this.activeList.length = 0;
    }
}
