const { ok, created, noContent } = require('./response');

function createCrudController(service) {
  return {
    list: async (req, res, next) => {
      try {
        const data = await service.list(req);
        return ok(res, data);
      } catch (err) { return next(err); }
    },
    getById: async (req, res, next) => {
      try {
        const data = await service.getById(req.params.id, req);
        return ok(res, data);
      } catch (err) { return next(err); }
    },
    create: async (req, res, next) => {
      try {
        const data = await service.create(req.body, req);
        return created(res, data);
      } catch (err) { return next(err); }
    },
    update: async (req, res, next) => {
      try {
        const data = await service.update(req.params.id, req.body, req);
        return ok(res, data);
      } catch (err) { return next(err); }
    },
    remove: async (req, res, next) => {
      try {
        await service.remove(req.params.id, req);
        return noContent(res);
      } catch (err) { return next(err); }
    },
  };
}

module.exports = { createCrudController };
