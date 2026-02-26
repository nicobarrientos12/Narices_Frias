function validate(required = []) {
  return (req, res, next) => {
    for (const key of required) {
      if (req.body?.[key] === undefined || req.body?.[key] === null) {
        return res.status(400).json({ message: `Falta el campo ${key}` });
      }
    }
    return next();
  };
}

module.exports = { validate };
