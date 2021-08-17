module.exports = (string) => {
  console.log(string);
  return Buffer.from(string).toString("base64");
};
