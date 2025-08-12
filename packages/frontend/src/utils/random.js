export function pickRandomDistinct(arr, prev) {
    if (!arr.length)
        throw new Error('empty array');
    let choice = arr[Math.floor(Math.random() * arr.length)];
    if (arr.length === 1)
        return choice;
    let guard = 0;
    while (choice === prev && guard < 10) {
        choice = arr[Math.floor(Math.random() * arr.length)];
        guard++;
    }
    return choice;
}
