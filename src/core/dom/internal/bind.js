// TODO: uncomment when client-side navigation (SPA) feature is implemented.
// registerCleanup wires dom.js listeners into the scope system so they are
// automatically removed when a page scope is destroyed during navigation.
// import { registerCleanup } from '../store/scope.js';

export function _bind(store, pickerFn, onValue, devMeta) {
    let prev = Symbol();
    if (__DEV__ && typeof pickerFn !== 'function') {
        window?.__korDevtools?.reportError?.({
            type: 'MISSING_KEY_OR_FN',
            message: `keyOrFn should be a function instead received: ${typeof keyOrFn}\nStore name: ${JSON.stringify(store._devName)}\nbindingType: ${devMeta.type}\nselector: ${devMeta.elId}`,
        });
    }
    const run = (state) => {
        const next = pickerFn(state);
        if (Object.is(next, prev)) return;
        prev = next;
        onValue(next);
    };

    run(store.getState());

    // Tag so store.js __DEV__ subscribe() knows this is a dom.js binding,
    // not a user's manual store.subscribe() call.
    if (__DEV__) run.__korBinding = true;

    const unsub = store.subscribe(run);

    // UNCOMMENT IF WE HAVE CLIENT-SIDE NAVIGATION FEATURE
    //registerCleanup(unsub);

    if (__DEV__ && devMeta) {
        const { elId, keys, type = '?', src = null } = devMeta;
        store._trackSubscriber?.(elId, keys, type, () => pickerFn(store.getState()), src);
        // UNCOMMENT IF WE HAVE CLIENT-SIDE NAVIGATION FEATURE
        //registerCleanup(() => store._untrackSubscriber?.(elId));
    }
}
