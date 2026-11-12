export const VIRTUAL_WIDTH = 480;
export const VIRTUAL_HEIGHT = 800;
export const CYBER_COLORS = {
    bg: '#070814',
    grid: 'rgba(0, 240, 255, 0.08)',
    gridMajor: 'rgba(0, 240, 255, 0.18)',
    cyan: '#00f0ff',
    magenta: '#ff0055',
    purple: '#a855f7',
    yellow: '#ffbe0b',
    green: '#00ff88',
    white: '#ffffff',
    darkOverlay: 'rgba(7, 8, 20, 0.88)'
};
export const WEAPON_DEFINITIONS = {
    plasma_bolt: {
        name: 'Plasma Bolt',
        icon: '⚡',
        maxLevel: 4,
        levels: [
            { levelText: 'LVL 1', desc: 'Auto-fires direct plasma bolt at closest target.' },
            { levelText: 'LVL 2', desc: '+35% fire rate & +30% projectile speed.' },
            { levelText: 'LVL 3', desc: 'Fires 2 simultaneous plasma bolts.' },
            { levelText: 'LVL 4 (MAX)', desc: 'Fires 3 bolts with +50% damage and enemy piercing!' }
        ]
    },
    orbital_shields: {
        name: 'Orbital Shields',
        icon: '🛡️',
        maxLevel: 4,
        levels: [
            { levelText: 'LVL 1', desc: '1 energy sphere orbiting player, damaging on touch.' },
            { levelText: 'LVL 2', desc: '2 orbiting shields & +25% rotation velocity.' },
            { levelText: 'LVL 3', desc: '3 orbiting shields & +35% impact damage.' },
            { levelText: 'LVL 4 (MAX)', desc: '4 orbital shields with expanded defense radius!' }
        ]
    },
    chain_lightning: {
        name: 'Chain Lightning',
        icon: '⚡',
        maxLevel: 4,
        levels: [
            { levelText: 'LVL 1', desc: 'Discharges electric arc chaining across 2 enemies.' },
            { levelText: 'LVL 2', desc: 'Arcs across 3 enemies & -20% cooldown.' },
            { levelText: 'LVL 3', desc: 'Arcs across 4 enemies & +40% shock damage.' },
            { levelText: 'LVL 4 (MAX)', desc: 'Arcs across 5 enemies with chain shock wave!' }
        ]
    },
    laser_beam: {
        name: 'Laser Beam',
        icon: '🔴',
        maxLevel: 4,
        levels: [
            { levelText: 'LVL 1', desc: 'Fires high-intensity piercing laser across screen.' },
            { levelText: 'LVL 2', desc: 'Wider beam, +35% damage & -15% cooldown.' },
            { levelText: 'LVL 3', desc: 'Dual beam (fires front & back simultaneously)!' },
            { levelText: 'LVL 4 (MAX)', desc: 'Quad beam (cross-fire 4 directions) melts swarms!' }
        ]
    },
    nova_pulse: {
        name: 'Nova Pulse',
        icon: '💥',
        maxLevel: 4,
        levels: [
            { levelText: 'LVL 1', desc: 'Periodic expanding shockwave knockback & damage.' },
            { levelText: 'LVL 2', desc: '+25% shockwave radius & +30% damage.' },
            { levelText: 'LVL 3', desc: '+40% shockwave radius & -25% cooldown.' },
            { levelText: 'LVL 4 (MAX)', desc: 'Double consecutive nova blast with heavy stun!' }
        ]
    },
    magnet_speed: {
        name: 'Magnet & Speed',
        icon: '🧲',
        maxLevel: 4,
        levels: [
            { levelText: 'LVL 1', desc: '+20% Move Speed & +50% XP Magnet Range.' },
            { levelText: 'LVL 2', desc: '+35% Move Speed & +100% XP Magnet Range.' },
            { levelText: 'LVL 3', desc: '+50% Move Speed, +150% Range & +5 HP/5s Regen.' },
            { levelText: 'LVL 4 (MAX)', desc: '+65% Move Speed, Global Magnet & +10 HP/5s Regen.' }
        ]
    }
};
export const STAT_BOOSTS = [
    {
        id: 'boost_max_hp',
        weaponType: 'stat_boost',
        statType: 'max_hp',
        name: 'Hull Reinforcement',
        levelText: '+30% HP',
        description: 'Increases Maximum HP by +30% and heals 30 HP immediately.',
        icon: '❤️',
        currentLevel: 0,
        newLevel: 1
    },
    {
        id: 'boost_damage',
        weaponType: 'stat_boost',
        statType: 'damage_boost',
        name: 'Overcharge Core',
        levelText: '+25% DMG',
        description: 'Boosts all weapon damage output by +25%.',
        icon: '⚔️',
        currentLevel: 0,
        newLevel: 1
    },
    {
        id: 'boost_attack_speed',
        weaponType: 'stat_boost',
        statType: 'attack_speed',
        name: 'Overclocked Matrix',
        levelText: '+20% SPD',
        description: 'Reduces all weapon cooldowns by 20% for rapid-fire devastation.',
        icon: '⏱️',
        currentLevel: 0,
        newLevel: 1
    },
    {
        id: 'boost_heal_full',
        weaponType: 'stat_boost',
        statType: 'heal_full',
        name: 'Nanite Repair Wave',
        levelText: '100% HEAL',
        description: 'Instantly restores 100% of maximum hull integrity.',
        icon: '🧪',
        currentLevel: 0,
        newLevel: 1
    }
];
