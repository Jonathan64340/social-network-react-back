module.exports = (collection, option, options = { allowDiskUse: false }) => {
    if (!collection || !option) return;
    return collection.aggregate(option, options);
}