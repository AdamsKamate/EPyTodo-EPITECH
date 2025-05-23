const errorHandler = (err, req, res, next) => {
    if (err.name === 'ValidationError') {
        return res.status(400).json({ msg: 'Bad parameter' });
    }
    
    if (err.name === 'NotFoundError') {
        return res.status(404).json({ msg: 'Not found' });
    }

    console.error(err.stack);
    res.status(500).json({ msg: 'Internal server error' });
};

module.exports = errorHandler;