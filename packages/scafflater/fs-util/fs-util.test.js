/* eslint-disable no-undef */
const FileSystemUtils = require('./fs-util')
const path = require('path')

test('Should return the directory tree without files', () => {
  // ARRANJE
  const folderPath = path.join(__dirname, '.test-resources', 'simple-folder')

  // ACT
  const out = FileSystemUtils.getDirTree(folderPath, false)

  // ASSERT
  expect(out.children.length).toBe(1)
  expect(out.children[0].type).toBe('directory')
})

test('Should return the directory tree with files', () => {
  // ARRANJE
  const folderPath = path.join(__dirname, '.test-resources', 'simple-folder')

  // ACT
  const out = FileSystemUtils.getDirTree(folderPath)

  // ASSERT
  expect(out.children.length).toBe(2)
})

test('Should return null if directory does not exists', () => {
  // ARRANJE
  const folderPath = path.join(__dirname, '.test-resources-does-not-exists')

  // ACT
  const out = FileSystemUtils.getDirTree(folderPath)

  // ASSERT
  expect(out).toBe(null)
})

test('Should return list of scafflater config', async () => {
  // ARRANJE
  const folderPath = path.join(__dirname, '.test-resources', 'template-sample')

  // ACT
  const out = await FileSystemUtils.listScfConfigTreeInPath(folderPath)

  // ASSERT
  expect(out.length).toBe(2)
})

test('Should return null if directory does not exists', async () => {
  // ARRANJE
  const folderPath = path.join(__dirname, '.test-resources-does-not-exists')

  // ACT
  const out = await FileSystemUtils.listScfConfigTreeInPath(folderPath)

  // ASSERT
  expect(out).toBe(null)
})

