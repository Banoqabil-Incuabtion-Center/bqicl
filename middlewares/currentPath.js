import { encodeId } from "../utils/idHasher.js";

const currentPath = (req, res, next) => {
  res.locals.currentPath = req.path;
  res.locals.params = req.params; // This grabs the dynamic ID like :id
  res.locals.encodeId = encodeId;
  next();
};

export default currentPath;
