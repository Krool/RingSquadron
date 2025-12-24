// ASCII Sprite Definitions
// Each sprite is an array of strings, one per line

export const SPRITES = {
    // Player ship - facing up
    PLAYER: [
        '   /\\   ',
        '  /  \\  ',
        ' /====\\ ',
        '|[====]|',
        '|  ||  |',
        ' \\____/ '
    ],

    // Ally ship - tiny version (1/8th visual size)
    ALLY: [
        '^'
    ],

    // Basic enemy - facing down
    ENEMY_BASIC: [
        ' \\____/ ',
        '  |  |  ',
        ' /====\\ ',
        '|======|',
        ' \\    / ',
        '  \\  /  ',
        '   \\/   '
    ],

    // Fast enemy - sleek design
    ENEMY_FAST: [
        '  \\/  ',
        ' /\\/\\ ',
        '|<-->|',
        ' \\  / ',
        '  \\/  '
    ],

    // Tank enemy - bulky
    ENEMY_TANK: [
        ' \\______/ ',
        '|========|',
        '|[[====]]|',
        '|========|',
        ' /      \\ ',
        '  \\    /  ',
        '   \\  /   ',
        '    \\/    '
    ],

    // Bomber enemy - carries explosives
    ENEMY_BOMBER: [
        '  \\__/  ',
        ' /[oo]\\ ',
        '|=(@@)=|',
        ' \\(())/ ',
        '  \\||/  ',
        '   \\/   '
    ],

    // Sniper enemy - long range
    ENEMY_SNIPER: [
        '   \\/   ',
        '  |--|  ',
        ' /|==|\\ ',
        '| |==| |',
        ' \\|--|/ ',
        '   ||   ',
        '   \\/   '
    ],

    // Swarm enemy - small, fast
    ENEMY_SWARM: [
        ' \\/ ',
        '<==>'
    ],

    // Shield enemy - has protective barrier
    ENEMY_SHIELD: [
        '/------\\',
        '|\\____/|',
        '| |==| |',
        '| |==| |',
        '|/    \\|',
        '\\------/'
    ],

    // Carrier enemy - spawns drones
    ENEMY_CARRIER: [
        ' \\________/ ',
        '|==========|',
        '| [  ==  ] |',
        '|==========|',
        '| [] [] [] |',
        ' \\________/ '
    ],

    // Drone enemy - spawned by carrier
    ENEMY_DRONE: [
        ' \\/ ',
        '[==]',
        ' /\\ '
    ],

    // Bus enemy - charges down lanes
    ENEMY_BUS: [
        ' |=======| ',
        '|[=======]|',
        '|[=======]|',
        '|[=======]|',
        ' |=======| ',
        '  \\=====/  '
    ],

    // Ring with placeholder for number (supports negative)
    RING: [
        ' .---. ',
        '( ### )',
        ' \'---\' '
    ],

    // Bullets
    BULLET_UP: ['|'],
    BULLET_DOWN: ['|'],

    // Explosion frames
    EXPLOSION: [
        [
            ' * ',
            '***',
            ' * '
        ],
        [
            ' \\|/ ',
            '--*--',
            ' /|\\ '
        ],
        [
            '  \\|/  ',
            ' --*-- ',
            '  /|\\  ',
            '   .   '
        ],
        [
            '   .   ',
            '  ...  ',
            ' ..... ',
            '  ...  ',
            '   .   '
        ]
    ],

    // Muzzle flash
    MUZZLE_FLASH: [
        ' * ',
        '***'
    ]
};

// Get sprite dimensions
export function getSpriteSize(sprite) {
    const height = sprite.length;
    const width = Math.max(...sprite.map(line => line.length));
    return { width, height };
}

// Get sprite with number inserted (for rings) - supports negative numbers
export function getRingSprite(number) {
    let numStr;
    if (number >= 0) {
        numStr = '+' + number.toString().padStart(2, ' ');
    } else {
        numStr = number.toString().padStart(3, ' ');
    }
    return SPRITES.RING.map(line => line.replace('###', numStr));
}
