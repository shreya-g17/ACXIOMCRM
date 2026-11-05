/** Case-insensitive partial match across the given string fields. */
const textFilter = (search, fields) => {
  if (!search || !String(search).trim()) return null;
  const safe = String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(safe, 'i');
  return { $or: fields.map((field) => ({ [field]: regex })) };
};

module.exports = { textFilter };
