const spawn = jest.fn();

module.exports = {
  spawn,
  execSync: jest.fn(),
  exec: jest.fn(),
};
