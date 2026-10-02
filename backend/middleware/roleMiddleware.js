const { error } = require("../utils/response");

// authorize("farmer") or authorize("customer")
// Must run AFTER protect() since it relies on req.user.
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return error(res, 401, "Not authorized");
    }
    if (!allowedRoles.includes(req.user.role)) {
      return error(
        res,
        403,
        `Role '${req.user.role}' is not allowed to perform this action`
      );
    }
    next();
  };
}

module.exports = { authorize };
