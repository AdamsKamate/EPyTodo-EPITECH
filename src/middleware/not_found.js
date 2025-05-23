const not_found = (req, res) => {
    res.status(404).json({
        msg: "Not found"
    });
};

module.exports = not_found;