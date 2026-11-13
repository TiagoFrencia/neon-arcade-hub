import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

export const GAMES = [
  {
    id: '01-neon-suika',
    slug: 'neon-suika',
    title: 'Neon Suika - Cyberpunk Physics Merge Fruit Game',
    shortTitle: 'Neon Suika',
    tagline: 'Drop and merge glowing cyberpunk orbs into the legendary giant Neon Watermelon!',
    controls: `Mouse (Desktop): Move cursor left/right to position the dropper; Left-Click or Release to drop the orb.
Touch (Mobile / Tablet): Touch and drag across the screen to aim; release finger to drop.
Power-ups: Click / Tap the Bomb icon to vaporize low-tier clutter; Click / Tap the Rainbow Orb icon to spawn a wild orb that merges with any tier.`,
    description: `Neon Suika re-imagines the viral Japanese watermelon merge sensation with a high-octane cyberpunk aesthetic, fluid 2D rigid-body physics, and dynamic procedural audio synthesis!

Drop glowing synthwave orbs into the futuristic neon containment chamber. When two identical neon fruits touch, they fuse with an explosive flash of particle energy, ascending into a larger, more radiant tier. Balance risk and reward as the chamber fills up toward the laser danger line. Can you orchestrate massive cascading combos and synthesize the ultimate Neon Watermelon?

### How to Play
1. Aim and Drop: Guide the dropper left and right across the container and release your orb.
2. Merge Identical Tiers: Collide matching neon spheres to evolve them into higher-scoring tiers (Cherries -> Strawberries -> Grapes -> Oranges -> Melons -> Neon Watermelon).
3. Survive the Danger Line: Keep your pieces below the top laser barrier. If the warning klaxon sounds for more than 3 seconds, the grid enters lockdown!
4. Deploy Cyber Power-ups:
   - Tactical Bomb: Annihilates the 4 lowest-tier orbs crowding your container floor.
   - Rainbow Wild: Merges seamlessly with any piece it impacts, triggering immediate upgrades.

### Game Features
- Dynamic Neon Visuals: High-contrast cyber visuals with bloom lighting, particle fireworks, and subtle screen-shake haptics.
- 100% Procedural Web Audio: Zero external audio files; all laser hums, pop chimes, and bass synth explosions are synthesized in real-time.
- Universal Portability: Seamlessly scales to mobile (390x844 portrait) and desktop (800x600 / full HD) without scrollbars.
- Local High Score Memory: Automatic persistence of your all-time best score and games played.`,
    itchGenre: 'Puzzle',
    crazyCategory: 'Puzzle',
    crazySubcategory: 'Merge',
    tags: ['physics', 'merge', 'suika', 'casual', 'arcade', 'cyberpunk', 'neon', '2d', 'singleplayer', 'fruit'],
    zip: path.join(rootDir, 'releases', '01-neon-suika-ready.zip'),
    coverItch: path.join(rootDir, 'releases', '01-neon-suika-assets', 'cover-itch.png'),
    thumb16x9: path.join(rootDir, 'releases', '01-neon-suika-assets', 'thumbnail-16x9.png'),
    thumb1x1: path.join(rootDir, 'releases', '01-neon-suika-assets', 'thumbnail-1x1.png'),
    screenshots: [
      path.join(rootDir, 'releases', '01-neon-suika-assets', 'screenshot-1-gameplay.png'),
      path.join(rootDir, 'releases', '01-neon-suika-assets', 'screenshot-2-action.png'),
    ]
  },
  {
    id: '02-hydraulic-crusher',
    slug: 'hydraulic-crusher',
    title: 'Hydraulic Crusher - Cyber Voxel Destruction & Idle Tycoon',
    shortTitle: 'Hydraulic Crusher',
    tagline: 'Crush voxels with heavy hydraulic teeth, unlock drones, and build an idle empire!',
    controls: `Mouse (Desktop): Click directly on the crusher cylinder teeth or falling objects to trigger instant Hydraulic Slams. Click upgrade cards to spend earned revenue.
Touch (Mobile / Tablet): Tap rapidly on the crunch zone for burst destruction. Tap flying Golden Cyber Drones to collect rich bounty caches.
Overdrive Mode: Click / Tap the 2X Overdrive button to rev the crusher rollers to maximum RPM and double your income for 120 seconds.`,
    description: `Experience the ultimate relaxing ASMR voxel destruction simulator! Step into an automated neon recycling plant where heavy industrial hydraulic rollers pulverize thousands of colorful cybernetic objects into cash.

Watch voxels fragment and disintegrate under extreme mechanical pressure. Upgrade your crushing power, rotary RPM speed, carbide teeth count, and unlock progressively denser matter tiers—from everyday cyber bricks to reinforced mainframe servers, hovercars, and quantum monoliths!

### How to Play
1. Automated Destruction: Objects continuously drop down the chute into the dual-roller crusher teeth, generating continuous cash per fragment.
2. Interactive Hydraulic Slam: Tap or click actively inside the crusher basin to smash stuck voxels and earn immediate bonus payouts.
3. Strategic Upgrades:
   - Crusher Power: Increases raw damage output per revolution.
   - Roll Speed: Accelerates gear RPM to crush high volumes faster.
   - Carbide Teeth: Adds extra gripping blades to handle wider objects without jamming.
   - Matter Tier: Unlocks heavier, higher-yield cyber items for exponential revenue.
4. Golden Drone Interception: Tap flying surveillance drones passing through your factory to claim massive instant cash injections!
5. Offline Progress: Returns with earned bank deposits even when you are away from the keyboard.

### Game Features
- Crunchy ASMR Physics: Realistic procedural voxel crunching with sparks, molten metal particles, and dynamic camera vibration.
- Overdrive Hyper-Torque: Unleash dual-speed nitro mode with blistering particle trails and gold multiplier bonuses.
- Deep Idle Progression: Well-balanced exponential upgrade curves tuned for satisfying short sessions or hours of idle growth.
- Synthesized Industrial Sound: Pure Web Audio synthesized hydraulic whirs, metallic crunches, and coin cascades.`,
    itchGenre: 'Simulation',
    crazyCategory: 'Clicker',
    crazySubcategory: 'Idle',
    tags: ['idle', 'clicker', 'simulation', 'satisfying', 'destruction', 'voxel', 'upgrade', 'asmr', 'physics', 'tycoon'],
    zip: path.join(rootDir, 'releases', '02-hydraulic-crusher-ready.zip'),
    coverItch: path.join(rootDir, 'releases', '02-hydraulic-crusher-assets', 'cover-itch.png'),
    thumb16x9: path.join(rootDir, 'releases', '02-hydraulic-crusher-assets', 'thumbnail-16x9.png'),
    thumb1x1: path.join(rootDir, 'releases', '02-hydraulic-crusher-assets', 'thumbnail-1x1.png'),
    screenshots: [
      path.join(rootDir, 'releases', '02-hydraulic-crusher-assets', 'screenshot-1-gameplay.png'),
      path.join(rootDir, 'releases', '02-hydraulic-crusher-assets', 'screenshot-2-action.png'),
    ]
  },
  {
    id: '03-cyber-survivor',
    slug: 'cyber-survivor',
    title: 'Cyber Survivor - Action Roguelike Bullet Heaven',
    shortTitle: 'Cyber Survivor',
    tagline: 'Survive relentless cyberpunk swarms, evolve high-tech weapons, and slay cyber bosses!',
    controls: `Keyboard (Desktop): W, A, S, D or Arrow Keys to move and evade hostile drone swarms.
Mouse / Touch: Click/Touch and drag anywhere on screen to steer your hero with the Floating Virtual Joystick.
Auto-Aim System: Weapons target, aim, and discharge automatically 360° around your hero.
Upgrade Selection: Click or Tap your preferred weapon or stat augment card whenever you collect enough XP to level up.`,
    description: `Dive into an adrenaline-pumping neon survival arena! You are the last cyber-operative trapped inside an infected mainframe grid. Relentless waves of rogue hunter-drones, suicide spiders, and colossal neon bosses are closing in from all directions.

Defeat enemies to collect radiant XP data gems. Level up your tactical loadout with devastating futuristic weapons including homing Plasma Bolts, spinning Orbital Energy Shields, chain-reacting Lightning Arcs, Piercing Laser Beams, and defensive Nova Pulses. Can you build an unstoppable synergy and survive the 15-minute gauntlet?

### How to Play
1. Maneuver and Evade: Keep moving to avoid collision damage from dense swarms.
2. Collect XP Crystals: Gather data cores dropped by destroyed foes to fill your level meter.
3. Synergize Your Arsenal:
   - Plasma Bolt: Rapid automatic projectiles targeting nearest threats.
   - Orbital Shields: Energy barrier orbs that crush enemies entering melee range.
   - Chain Lightning: High-voltage bolts arcing between multiple targets simultaneously.
   - Piercing Laser: Heavy beam slicing through entire columns of enemies.
   - Nova Pulse: Radial shockwave clearing breathing room during heavy ambushes.
4. Boss Encounters: Every 3 minutes, an elite Cyber Titan enters the arena. Defeat the Titan to claim colossal XP showers!
5. Emergency Revive: Use the one-time system reboot to trigger a 100% HP revival and tactical screen nuke!

### Game Features
- High-Density 60 FPS Swarms: Handles over 500 active enemies, projectiles, and particle bursts with zero frame drops.
- Tactical Build Variety: Combine range, defensive barriers, movement speed, and item magnetism for tailored playstyles.
- Epic Synthwave Atmosphere: Dark cybernetic arena with glowing neon grids, pulse rings, and responsive screen shakes.`,
    itchGenre: 'Action',
    crazyCategory: 'Action',
    crazySubcategory: 'Roguelike',
    tags: ['roguelike', 'survival', 'arena-shooter', 'bullet-hell', 'cyberpunk', 'action', 'upgrade', 'weapons', 'sci-fi', 'top-down'],
    zip: path.join(rootDir, 'releases', '03-cyber-survivor-ready.zip'),
    coverItch: path.join(rootDir, 'releases', '03-cyber-survivor-assets', 'cover-itch.png'),
    thumb16x9: path.join(rootDir, 'releases', '03-cyber-survivor-assets', 'thumbnail-16x9.png'),
    thumb1x1: path.join(rootDir, 'releases', '03-cyber-survivor-assets', 'thumbnail-1x1.png'),
    screenshots: [
      path.join(rootDir, 'releases', '03-cyber-survivor-assets', 'screenshot-1-gameplay.png'),
      path.join(rootDir, 'releases', '03-cyber-survivor-assets', 'screenshot-2-action.png'),
    ]
  },
  {
    id: '04-hexa-sort',
    slug: 'hexa-sort',
    title: 'Hexa Sort - 3D Isometric Hex Puzzle & Color Stack Merge',
    shortTitle: 'Hexa Sort',
    tagline: 'Sort and stack isometric hex tiles in cascading color merge combos!',
    controls: `Mouse (Desktop): Click and drag a 3-stack of colored hexagonal tiles from your bottom hand tray onto any unlocked board tile.
Touch (Mobile / Tablet): Tap and drag tiles directly to drop them onto grid positions.
Booster Tools:
- Hammer Mode: Click the Hammer tool, then tap any tile stack to instantly pulverize it and free up space.
- Swap Hand: Discards current hand slots and generates fresh tactical stack configurations.
- VIP Slot Unlock: Unlock premium bonus grid positions to expand your tactical sorting capacity.`,
    description: `Immerse yourself in a hypnotic 3D isometric color-sorting challenge! Hexa Sort combines the strategic depth of card stacking with the satisfying chain reactions of match-and-merge puzzle mechanics.

Analyze the board, inspect the top-layer colors, and strategically place multi-colored hex stacks onto the grid. Whenever adjacent tiles share matching surface colors, tiles levitate, arc through the air, and assemble into unified single-color pillars. Reach a stack height of 10 matching tiles to trigger a luminous full-stack clearance combo!

### How to Play
1. Analyze Your Hand: Inspect the colors layered in your three available hand stacks.
2. Place on Grid: Drop stacks onto empty cells or on top of existing stacks to initiate color sorting.
3. Trigger Cascade Jumps: Matching adjacent top colors will automatically leap across neighboring tiles into the newest stack.
4. Clear Full Stacks (10 Tiles): When a single stack accumulates 10 tiles of identical color, the stack vaporizes into score bonuses and gold coins!
5. Clear Level Objectives: Reach target clearance goals across ascending difficulty levels with VIP tile locks.

### Game Features
- Addictive Spatial Logic: Deep strategic planning that rewards foresight, combo planning, and spatial visualization.
- Luminous Isometric Visuals: Crisp pseudo-3D hexagonal perspective with radiant neon palettes and levitating tile animations.
- Tactical Emergency Boosters: Hammer demolition, tile shuffle, and VIP unlock mechanics ensure you never get stuck.
- Adaptive Chime Synthesis: Merge frequencies scale musically with each successive combo tier.`,
    itchGenre: 'Puzzle',
    crazyCategory: 'Puzzle',
    crazySubcategory: 'Brain',
    tags: ['puzzle', 'sorting', 'hex', 'isometric', 'colors', 'relaxing', 'casual', 'brain', 'stacking', 'minimalist', 'logic'],
    zip: path.join(rootDir, 'releases', '04-hexa-sort-ready.zip'),
    coverItch: path.join(rootDir, 'releases', '04-hexa-sort-assets', 'cover-itch.png'),
    thumb16x9: path.join(rootDir, 'releases', '04-hexa-sort-assets', 'thumbnail-16x9.png'),
    thumb1x1: path.join(rootDir, 'releases', '04-hexa-sort-assets', 'thumbnail-1x1.png'),
    screenshots: [
      path.join(rootDir, 'releases', '04-hexa-sort-assets', 'screenshot-1-gameplay.png'),
      path.join(rootDir, 'releases', '04-hexa-sort-assets', 'screenshot-2-action.png'),
    ]
  },
  {
    id: '05-poly-defense',
    slug: 'poly-defense',
    title: 'Poly Defense - Geometric Merge & Tower Defense',
    shortTitle: 'Poly Defense',
    tagline: 'Merge geometric defense turrets, repel invading polygon waves, and protect the Core!',
    controls: `Mouse (Desktop):
- Click Spawn Turret to deploy a base defense module.
- Drag and drop two identical level turrets onto each other to synthesize a higher-tier weapon.
- Drag turrets to different grid sockets to optimize firing lanes.
Touch (Mobile / Tablet): Full touch-friendly drag-and-drop turret synthesis and placement.
Tactical Abilities:
- AirDrop Crate: Spawns an instant free high-tier reinforcement turret.
- Double Boost: Grants 2X game speed and 2X gold bounties for 3 full waves.
- Core Repair & Freeze: Instantly restores Core health and flash-freezes all encroaching enemy waves.`,
    description: `Poly Defense unites the addictive synergy of merge mechanics with the tactical tension of grid-based tower defense! Defend your central quantum Core against advancing geometric polygon invaders—from agile triangles and armored squares to colossal octagonal boss shapes.

Spawn turrets, synthesize matching levels to advance from rapid-fire kinetic peashooters to high-energy plasma cannons, beam lasers, and splash artillery. Analyze enemy approach vectors, adjust turret formations on the fly, and activate tactical combat boosts to survive ever-escalating waves!

### How to Play
1. Spawn Defense Units: Spend earned gold bounty to purchase defensive turrets into your 3x3 tactical grid.
2. Merge for Superior Firepower: Drag two matching Level 1 turrets together to forge a Level 2 Cannon, merge two Level 2s for a Level 3 Laser, and ascend all the way to Level 6 Quantum Annihilators!
3. Repel Wave Invasions: Enemies advance along the illuminated perimeter track toward your Core. Slay them before they breach the barrier.
4. Conquer Boss Waves: Every 5th wave brings a massive Boss Polygon with multiplied shield armor. Focus your highest-tier lasers to bring it down!
5. Activate Battle Support:
   - Tactical AirDrop: Emergency crate dropping high-level combat turrets directly into open grid slots.
   - Hyper-Drive 2X: Accelerates battle pace and doubles all gold rewards for rapid progression.
   - Cryo-Freeze & Repair: Restores Core HP to full and freezes all invading polygons in place.

### Game Features
- Hybrid Merge-TD Gameplay: Instant drag-and-drop turret evolution coupled with active tactical lane management.
- Diverse Geometric Enemy Types: Fast Scout Triangles, Shielded Brute Squares, Armored Hexagons, and Massive Boss Octagons.
- Particle-Rich Cyber Warfare: Vibrant laser beams, projectile trails, cryogenic freeze auras, and explosive screen shakes.
- Automatic High-Wave Tracking: Stores your highest wave reached and all-time record score locally.`,
    itchGenre: 'Strategy',
    crazyCategory: 'Tower Defense',
    crazySubcategory: 'Strategy',
    tags: ['tower-defense', 'merge', 'strategy', 'geometry', 'upgrade', 'defense', 'waves', 'action', 'neon', 'scifi'],
    zip: path.join(rootDir, 'releases', '05-poly-defense-ready.zip'),
    coverItch: path.join(rootDir, 'releases', '05-poly-defense-assets', 'cover-itch.png'),
    thumb16x9: path.join(rootDir, 'releases', '05-poly-defense-assets', 'thumbnail-16x9.png'),
    thumb1x1: path.join(rootDir, 'releases', '05-poly-defense-assets', 'thumbnail-1x1.png'),
    screenshots: [
      path.join(rootDir, 'releases', '05-poly-defense-assets', 'screenshot-1-gameplay.png'),
      path.join(rootDir, 'releases', '05-poly-defense-assets', 'screenshot-2-action.png'),
    ]
  }
];
