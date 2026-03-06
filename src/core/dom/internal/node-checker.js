export const nodeChecker = (target) => {
    const nodeTypesMaps = {
        1: 'Element',
        3: 'Text',
        8: 'Comment',
        9: 'Document',
        11: 'DocumentFragment',
    };

    let isNode = false;
    let type = null;

    if (target) {
        // Single node
        if (target.nodeType in nodeTypesMaps) {
            isNode = true;
            type = nodeTypesMaps[target.nodeType];

            // NodeList
        } else if (NodeList.prototype.isPrototypeOf(target)) {
            isNode = true;
            type = 'NodeList';

            // HTMLCollection
        } else if (HTMLCollection.prototype.isPrototypeOf(target)) {
            isNode = true;
            type = 'HTMLCollection';

            // Array of nodes (optional)
        }
    }

    return { isNode, type };
};
