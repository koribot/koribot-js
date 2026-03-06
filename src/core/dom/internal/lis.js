// Longest increasing subsequence
export function _lis(arr) {
    const tails = [];
    const tailIdx = [];
    const parent = new Array(arr.length).fill(-1);

    for (let i = 0; i < arr.length; i++) {
        const val = arr[i];
        let lo = 0,
            hi = tails.length;
        while (lo < hi) {
            const mid = (lo + hi) >> 1;
            if (tails[mid] < val) lo = mid + 1;
            else hi = mid;
        }
        tails[lo] = val;
        tailIdx[lo] = i;
        if (lo > 0) parent[i] = tailIdx[lo - 1];
    }

    const result = new Set();
    let idx = tailIdx[tails.length - 1];
    while (idx !== undefined && idx !== -1) {
        result.add(idx);
        idx = parent[idx];
    }
    return result;
}
