
// export const onlyAdmin = (req, res, next) => {
//     if (req.user && req.user.role === 'admin') {
//         return next();
//     }   
//     return res.status(403).send('Access denied. Admins only.');
// }

// export const adminOrOwner = (req, res, next) => {
//     if (req.user && (req.user.role === 'admin' || req.user.role === 'owner')) {
//         return next();
//     }
//     return res.status(403).send('Access denied. Admins or Owners only.');
// }

// export const onlyOwner = (req, res, next) => {
//     if (req.user && req.user.role === 'owner') {
//         return next();
//     }
//     return res.status(403).send('Access denied. Owners only.');
// }

