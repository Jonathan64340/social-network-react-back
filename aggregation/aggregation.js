module.exports = (collection, option) => {
    if (!collection || !option) return;
    return collection.aggregate(option, { allowDiskUse: false });
}