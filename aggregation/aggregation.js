module.exports = (collection, option, options = { allowDiskUse: true }) => {
    if (!collection || !option) return;
    return collection.aggregate(option, options);
}