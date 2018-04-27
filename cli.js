#!/usr/bin/env node
'use strict'

const version = require('./package.json').version
const program = require('commander')
const fs = require('fs')
const macl = require('mosquitto-acl-parser')

function readAclFile(filePath) {
    return fs.readFileSync(filePath).toString();
}

function writeAclFile(filePath, fileContent) {
    return fs.writeFileSync(filePath, fileContent)
}

function printAclFile(acl) {
    console.log(macl.stringify(acl))
}

function checkFileExists(filePath) {
    try {
        fs.statSync(filePath)
    } catch (err) {
        console.error(err.message)
        process.exit(1)
    }   
}

function isUserExisting(acl, username) {
    return acl.users[username]
}

function addUser(acl, username) {
    acl.users[username] = []
}

function removeUser(acl, username) {
    delete acl.users[username]
}

function getAcls(path) {
    let acl = getAcls(options.aclFile)
    if (!acl.users) {
        acl.users = {}
    }
    return acl
}

program.version(version)

program
  .command('add-user <username>')
  .option("-a, --acl-file <file>", "mosquitto acl file path")
  .action(function (username, options) {
    checkFileExists(options.aclFile)
    let acl = getAcls(options.aclFile)
    if (isUserExisting(acl, username)) {
        console.error(`user "${username}" already existing. abort.`);
        process.exit(1)
    }
    
    addUser(acl, username)
    const aclFileContent = macl.stringify(acl)
    console.log(aclFileContent)
  })

program
  .command('rm-user <username>')
  .option("-a, --acl-file <file>", "mosquitto acl file path")
  .action(function (username, options) {
    let acl = getAcls(options.aclFile)
    if (!isUserExisting(acl, username)) {
        console.error(`user "${username}" not existing. nothing todo.`);
        process.exit(1)
    }
    removeUser(acl, username)
    console.log(macl.stringify(acl))
  })

program
  .command('add-topic <username> <topic>')
  .option("-a, --acl-file <file>", "mosquitto acl file path")
  .option("-r, --read", "user can read from topic")
  .option("-w, --write", "user can write to topic")
  .action(function (username, topic, options) {
    let acl = getAcls(options.aclFile)
    if (!isUserExisting(acl, username)) {
        acl.users[username] = []
        
        // console.error(`user "${username}" not existing. nothing todo.`);
        // process.exit(1)
    }

    let perm = ''

    if (options.read) {
        perm += 'read'
    }
    if (options.write) {
        perm += 'write'
    }

    acl.users[username].push({ perm, topic })
    console.log(macl.stringify(acl))
  })

program
  .command('rm-topic <username> <topic>')
  .option("-a, --acl-file <file>", "mosquitto acl file path")
  .option("-r, --read", "user can read from topic")
  .option("-w, --write", "user can write to topic")
  .action(function (username, topic, options) {
    checkFileExists(options.aclFile)
    let fileContent = readAclFile(options.aclFile)
    let acl = macl.parse(fileContent)
    if (!isUserExisting(acl, username)) {
        console.error(`user "${username}" not existing. nothing todo.`);
        process.exit(1)
    }

    let perm = ''

    if (options.read) {
        perm += 'read'
    }
    if (options.write) {
        perm += 'write'
    }

    acl.users[username] = acl.users[username].filter((dataSet) => {
        return !(dataSet.perm === perm && dataSet.topic === topic)
    })
    console.log(macl.stringify(acl))
  })

program
  .command('rm-topic-all <topic>')
  .option("-a, --acl-file <file>", "mosquitto acl file path")
  .option("-r, --read", "user can read from topic")
  .option("-w, --write", "user can write to topic")
  .action(function (topic, options) {
    checkFileExists(options.aclFile)
    let fileContent = readAclFile(options.aclFile)
    let acl = macl.parse(fileContent)

    let perm = ''

    if (options.read) {
        perm += 'read'
    }
    if (options.write) {
        perm += 'write'
    }
    
    Object.keys(acl.users).forEach((username) => {
        acl.users[username] = acl.users[username].filter((dataSet) => {
            return !(dataSet.perm === perm && dataSet.topic === topic)
        })    
    })

    console.log(macl.stringify(acl))
  })

program.parse(process.argv);
