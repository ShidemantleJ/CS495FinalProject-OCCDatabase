const applySingleFilter = (query, filter) => {
  const { column, op, value } = filter;

  switch (op) {
    case "eq":
      return query.eq(column, value);
    case "neq":
      return query.neq(column, value);
    case "gt":
      return query.gt(column, value);
    case "gte":
      return query.gte(column, value);
    case "lt":
      return query.lt(column, value);
    case "lte":
      return query.lte(column, value);
    case "like":
      return query.like(column, value);
    case "ilike":
      return query.ilike(column, value);
    case "in":
      return query.in(column, value);
    case "contains":
      return query.contains(column, value);
    case "is":
      return query.is(column, value);
    case "not":
      return query.not(column, value);
    default:
      return query;
  }
};

export const applyFilters = (query, filters = []) => {
  return filters.reduce((nextQuery, filter) => applySingleFilter(nextQuery, filter), query);
};

export const applyOrderAndRange = (query, { orderBy, limit, range } = {}) => {
  let nextQuery = query;

  if (orderBy?.column) {
    nextQuery = nextQuery.order(orderBy.column, {
      ascending: orderBy.ascending !== false,
      nullsFirst: orderBy.nullsFirst,
    });
  }

  if (Array.isArray(range) && range.length === 2) {
    nextQuery = nextQuery.range(range[0], range[1]);
  } else if (typeof limit === "number") {
    nextQuery = nextQuery.limit(limit);
  }

  return nextQuery;
};
