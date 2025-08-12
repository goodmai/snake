export const ColorModifiers = {
    RED: (gs) => {
        gs['speedMultiplier'] *= 0.95; // быстрее
    },
    GREEN: (gs) => {
        gs['speedMultiplier'] *= 1.05; // медленнее
    },
    ORANGE: (_gs) => {
        // визуальный эффект мигания уже в Renderer/Food
    },
    BLUE: (_gs) => {
        // движение еды уже реализовано в Food.tickMove
    },
    YELLOW: (gs) => {
        gs.canShoot = true;
        gs.updateShootButton();
    },
    VIOLET: (gs) => {
        gs.canShoot = false;
        gs.updateShootButton();
    },
};
export function applyModifierForColor(gs, color) {
    const fn = ColorModifiers[color];
    if (fn)
        fn(gs);
}
