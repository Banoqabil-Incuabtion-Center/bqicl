// A simple middleware function
const blockInProduction = (req, res, next) => {
    if (process.env.NODE_ENV === 'production') {
        // 🛑 Return 404 so hackers think the page doesn't even exist
        return res.status(404).send('Not Found'); 
        // OR return a simple text: return res.status(403).send('Forbidden');
    }
    next();
};

export default blockInProduction;