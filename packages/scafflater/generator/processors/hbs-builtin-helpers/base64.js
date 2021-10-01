module.exports = (string) => {
  return Buffer.from(string).toString("base64");
};
