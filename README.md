Scafflater
===

[![npm version](https://badge.fury.io/js/scafflater.svg)](https://badge.fury.io/js/scafflater)
[![Scafflater Cli](https://img.shields.io/badge/dynamic/json?color=green&label=scafflater-cli&query=%24.collected.metadata.version&url=https%3A%2F%2Fapi.npms.io%2Fv2%2Fpackage%2Fscafflater-cli)](https://npmjs.org/package/scafflater-cli)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=chicoribas_scafflater&metric=alert_status)](https://sonarcloud.io/dashboard?id=chicoribas_scafflater)
[![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=chicoribas_scafflater&metric=code_smells)](https://sonarcloud.io/dashboard?id=chicoribas_scafflater)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=chicoribas_scafflater&metric=coverage)](https://sonarcloud.io/dashboard?id=chicoribas_scafflater)
[![License](https://img.shields.io/npm/l/scafflater.svg)](https://github.com/chicoribas/scafflater/blob/master/package.json)

Scafflater is a solution to turn scaffold easier, through a small pieces of code templates, that can appended to the solution in a way the developer wants, building a new and customized solution for every single project.

Contents
===

 - [Why?](#-why)
 - [How does it work?](#-how-does-it-work)
 - [Using Scafflater](#-using-scafflater)
 - [Related](#-related)

### Why?
---
Templates is a big challenge either to create a create template and to maintain a secure and updated template.Furthermore, templates, talk in a simple way, are only sketch  of code only to start a project. Those sketches tend to be very simple and not extensible.

And extending that is another big challenge for developer teams, because they need to build some important code pieces that must be follow a pattern to ensure security and maintainability. And this kind of activity slows down the developer, forcing it do read documents and do a lot off copy and paste to have a code, that definitely does not bring value to solution, working fine.

Other problem of using static templates is the increasing number of this templates as your technology stack evolves. For example, today, to build an API you use Fastify and Postgres, and you have a template with this stack to speed new solution. But in moment in the future, you start to use MongoDb as a database too. So you will have to create a new template with Fastify and MongoDb to have the same approach of the first scenario. And now you have to templates to maintain. We can talk a lot how companies spend to many effort to maintain those templates secured and updated, but I think you got my idea.

The main goal of scafflater is to create a way to provide a template that can have the very basic code for the solution, but giving to developer the power to increase this basic code with the pieces that are useful.

### How does it work?
---
Scafflater works having a template as a base and this template is also a git repository hosted at some service, but it has a different structure. It has two main components: the initializer and the partials. 

The initializer is responsible to generate the basic code for this solution. It has very simple files that will be important independently on any further personalization.

Partials are the piece of cake od scafflater. They are small code parts and file structures that can be appended to the code when they are needed. 

Giving a practical example: in the scenario with Fastify, Postgres and MongoDb used priorly, you could have the initializer, creating the basic code only to provide an API, and Postgres and MongoDb as partials, and the developer can choose between they (or choose both, in a very specific scenario) to personalize the solution fastly.

### Using Scafflater
---

Scafflater can be used as a [package](https://www.npmjs.com/package/scafflater) in your solution our through our [scafflater-cli](https://www.npmjs.com/package/scafflater-cli)

### Related
---
Here are some related projects

[Awesome README](https://github.com/matiassingers/awesome-readme)
