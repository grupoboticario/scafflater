class ScafflaterFileNotFoundError extends Error {
  constructor(filePath) {
    super(`Scafflater file not found: ${filePath}`);
    this.filePath = filePath;
    this.name = "ScafflaterFileNotFoundError";
  }
}

module.exports = ScafflaterFileNotFoundError;
